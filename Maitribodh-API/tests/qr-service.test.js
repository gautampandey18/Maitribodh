import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { loadQrConfig } from '../src/config/qr.js';
import { createQrService } from '../src/modules/qr/qr.service.js';

const hmacSecret = 'qr-test-secret-that-is-long-enough-for-tests';

test('QR payload signs person code and version and asks encoder for PNG', async () => {
  let encodedPayload;
  let encoderOptions;
  const service = createQrService({
    repository: {
      async getActivePersonQr() {
        return { person_code: 'MB-000012', qr_version: 3 };
      },
    },
    hmacSecret,
    async toBuffer(payload, options) {
      encodedPayload = payload;
      encoderOptions = options;
      return Buffer.from('png-data');
    },
  });

  const result = await service.generatePersonQr(12);
  const prefix = 'AMS1.MB-000012.3';
  const signature = createHmac('sha256', hmacSecret).update(prefix).digest('base64url');

  assert.equal(encodedPayload, `${prefix}.${signature}`);
  assert.equal(encoderOptions.type, 'png');
  assert.equal(encoderOptions.margin, 4);
  assert.equal(result.image.toString(), 'png-data');
  assert.equal(result.version, 3);
});

test('QR is unavailable for inactive persons and does not encode data', async () => {
  let encoded = false;
  const service = createQrService({
    repository: { async getActivePersonQr() { return null; } },
    hmacSecret,
    async toBuffer() {
      encoded = true;
      return Buffer.alloc(0);
    },
  });

  await assert.rejects(
    service.generatePersonQr(12),
    (error) => error.statusCode === 404 && error.code === 'QR_NOT_AVAILABLE',
  );
  assert.equal(encoded, false);
});

test('installed QR encoder returns a PNG buffer', async () => {
  const service = createQrService({
    repository: {
      async getActivePersonQr() {
        return { person_code: 'MB-000012', qr_version: 1 };
      },
    },
    hmacSecret,
  });

  const result = await service.generatePersonQr(12);

  assert.equal(result.image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('QR config requires a separate strong signing secret', () => {
  assert.deepEqual(loadQrConfig({ QR_HMAC_SECRET: hmacSecret }), { hmacSecret });
  assert.throws(() => loadQrConfig({}), /QR_HMAC_SECRET/);
});

test('public lookup returns every match with minimized identity and no mobile', async () => {
  let lookupInput;
  const encodedPayloads = [];
  const service = createQrService({
    repository: { async getActivePersonQr() { return null; } },
    publicRepository: {
      async lookup(input) {
        lookupInput = input;
        return {
          limited: false,
          matches: [
            { person_code: 'MB-000001', first_name: 'Maitri', last_name: 'One', category: 'Visitor', qr_version: 1 },
            { person_code: 'MB-000002', first_name: 'Maitri', last_name: 'Two', category: 'Participant', qr_version: 2 },
          ],
        };
      },
    },
    hmacSecret,
    async toBuffer(payload) {
      encodedPayloads.push(payload);
      return Buffer.from(`png-${payload}`);
    },
  });

  const result = await service.generatePublicLookup({ mobile: '9876543210', clientIp: '203.0.113.9' });

  assert.equal(lookupInput.maskedMobile, '******3210');
  assert.equal(lookupInput.clientIpKey.length, 32);
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items[0], {
    displayName: 'Maitri O.',
    category: 'Visitor',
    qrPng: Buffer.from(`png-${encodedPayloads[0]}`).toString('base64'),
  });
  assert.equal('mobile' in result.items[0], false);
  assert.equal('personCode' in result.items[0], false);
});

test('public lookup does not generate QR images after a rate-limit result', async () => {
  let encoded = false;
  const service = createQrService({
    repository: { async getActivePersonQr() { return null; } },
    publicRepository: { async lookup() { return { limited: true, window: 'DAY', retryAfterSeconds: 86400 }; } },
    hmacSecret,
    async toBuffer() { encoded = true; return Buffer.alloc(0); },
  });

  const result = await service.generatePublicLookup({ mobile: '9876543210', clientIp: '203.0.113.9' });

  assert.equal(result.limited, true);
  assert.equal(encoded, false);
});
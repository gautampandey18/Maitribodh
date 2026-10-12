import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicQrRepository } from '../src/modules/qr/public-qr.repository.js';

test('public lookup serializes by IP, returns active matches, and audits only masked mobile', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('minute_count')) return { rows: [{ minute_count: 0, day_count: 0 }] };
      if (sql.includes('SELECT p.person_code')) {
        return { rows: [{ person_code: 'MB-000001', first_name: 'Maitri', last_name: 'One', category: 'Visitor', qr_version: 1 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createPublicQrRepository({ async connect() { return client; } });

  const result = await repository.lookup({
    mobile: '9876543210',
    clientIpKey: '0123456789abcdef0123456789abcdef',
    maskedMobile: '******3210',
  });

  assert.equal(result.limited, false);
  assert.equal(result.matches.length, 1);
  assert.match(calls[1].sql, /pg_advisory_xact_lock/);
  assert.match(calls[2].sql, /interval '1 minute'/);
  assert.match(calls[2].sql, /interval '24 hours'/);
  assert.match(calls[3].sql, /b\.lifted_at IS NULL/);
  assert.match(calls[4].sql, /PUBLIC_QR_LOOKUP/);
  assert.equal(calls[4].values[0], JSON.stringify({ mobile_masked: '******3210', matches: 1 }));
  assert.equal(calls[4].values[1], '0123456789abcdef0123456789abcdef');
  assert.equal(calls.at(-1).sql, 'COMMIT');
});

test('public lookup records and rejects requests above the minute limit', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('minute_count')) return { rows: [{ minute_count: 10, day_count: 10 }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createPublicQrRepository({ async connect() { return client; } });

  const result = await repository.lookup({ mobile: '9876543210', clientIpKey: 'hash', maskedMobile: '******3210' });

  assert.deepEqual(result, { limited: true, window: 'MINUTE', retryAfterSeconds: 60 });
  assert.match(calls[3].sql, /PUBLIC_QR_RATE_LIMITED/);
  assert.equal(calls.some(({ sql }) => sql.includes('SELECT p.person_code')), false);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});

test('public lookup applies the daily limit after the minute threshold', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('minute_count')) return { rows: [{ minute_count: 2, day_count: 50 }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createPublicQrRepository({ async connect() { return client; } });

  const result = await repository.lookup({ mobile: '9876543210', clientIpKey: 'hash', maskedMobile: '******3210' });

  assert.deepEqual(result, { limited: true, window: 'DAY', retryAfterSeconds: 86400 });
});
import { createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';
import { ApiError } from '../../errors/ApiError.js';

export function createQrService({ repository, publicRepository = repository, hmacSecret, toBuffer = QRCode.toBuffer }) {
  return {
    async generatePersonQr(personId) {
      const person = await repository.getActivePersonQr(personId);
      if (!person) {
        throw new ApiError(404, 'QR_NOT_AVAILABLE', 'QR is not available for this person');
      }
      return generateQrForRecord(person, hmacSecret, toBuffer);
    },

    async generatePublicLookup({ mobile, clientIp }) {
      const maskedMobile = maskMobile(mobile);
      const clientIpKey = createHmac('sha256', hmacSecret)
        .update(`PUBLIC_QR_IP:${clientIp}`)
        .digest('hex')
        .slice(0, 32);
      const result = await publicRepository.lookup({ mobile, clientIpKey, maskedMobile });
      if (result.limited) return result;

      const items = await Promise.all(result.matches.map(async (person) => {
        const lastInitial = person.last_name?.trim().charAt(0);
        const displayName = lastInitial ? `${person.first_name} ${lastInitial}.` : person.first_name;
        const qr = await generateQrForRecord(person, hmacSecret, toBuffer);
        return {
          displayName,
          category: person.category,
          qrPng: qr.image.toString('base64'),
        };
      }));
      return { limited: false, items };
    },

    verifyQrPayload(payload) {
      if (typeof payload !== 'string') return null;
      const parts = payload.split('.');
      if (parts.length !== 4 || parts[0] !== 'AMS1') return null;
      const [, personCode, versionText, signature] = parts;
      if (!/^MB-\d{6}$/.test(personCode) || !/^\d+$/.test(versionText)) return null;
      const version = Number(versionText);
      if (!Number.isSafeInteger(version) || version < 1) return null;

      const expected = createHmac('sha256', hmacSecret)
        .update(`AMS1.${personCode}.${version}`)
        .digest();
      let provided;
      try {
        provided = Buffer.from(signature, 'base64url');
      } catch {
        return null;
      }
      if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
      return { personCode, version };
    },
  };
}

async function generateQrForRecord(person, hmacSecret, toBuffer) {
  const signedPayload = `AMS1.${person.person_code}.${person.qr_version}`;
  const signature = createHmac('sha256', hmacSecret)
    .update(signedPayload)
    .digest('base64url');
  const payload = `${signedPayload}.${signature}`;
  const image = await toBuffer(payload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });
  return { image, personCode: person.person_code, version: person.qr_version };
}

function maskMobile(mobile) {
  return `${'*'.repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-4)}`;
}
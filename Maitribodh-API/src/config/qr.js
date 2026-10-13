export function loadQrConfig(environment = process.env) {
  const hmacSecret = environment.QR_HMAC_SECRET;
  if (typeof hmacSecret !== 'string' || Buffer.byteLength(hmacSecret, 'utf8') < 32) {
    throw new Error('QR_HMAC_SECRET must contain at least 32 bytes');
  }
  return { hmacSecret };
}
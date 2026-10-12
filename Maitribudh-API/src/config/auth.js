function readPositiveInteger(environment, name) {
  const value = Number(environment[name]);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export function loadAuthConfig(environment = process.env) {
  const jwtSecret = environment.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }

  return {
    jwtSecret,
    loginRateLimitWindowMs: readPositiveInteger(environment, 'LOGIN_RATE_LIMIT_WINDOW_MS'),
    loginRateLimitMax: readPositiveInteger(environment, 'LOGIN_RATE_LIMIT_MAX'),
  };
}
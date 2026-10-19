import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const phoneCountries = getCountries()
  .map((country) => ({
    country,
    name: countryNames.of(country) ?? country,
    callingCode: `+${getCountryCallingCode(country)}`,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

export function toE164Phone(number, country) {
  const parsed = parsePhoneNumberFromString(number, country);
  return parsed?.isValid() ? parsed.number : '';
}

export function splitPhoneNumber(value) {
  const parsed = parsePhoneNumberFromString(value);
  if (parsed?.isValid()) return { country: parsed.country ?? 'IN', number: parsed.nationalNumber };
  return { country: 'IN', number: value?.replace(/^\+91/, '') ?? '' };
}

export function formatPhoneNumber(value) {
  const parsed = parsePhoneNumberFromString(value);
  return parsed?.isValid() ? parsed.formatInternational() : value ?? '';
}

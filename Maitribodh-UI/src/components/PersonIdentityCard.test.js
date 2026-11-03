import { expect, it } from 'vitest';
import { identityCardFilename } from './PersonIdentityCard.jsx';

it('names the ID card download after the person and their ID', () => {
  expect(identityCardFilename('Asha Patel', 'MB-000017')).toBe('Asha-Patel-MB-000017.png');
  expect(identityCardFilename('  Ravi   K/S: Rao ', 'MB-000018')).toBe('Ravi-K-S-Rao-MB-000018.png');
  expect(identityCardFilename(undefined, 'MB-000019')).toBe('MB-000019.png');
  expect(identityCardFilename('', '')).toBe('Maitribodh-ID-Card.png');
});

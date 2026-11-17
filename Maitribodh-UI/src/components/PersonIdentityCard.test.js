import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import PersonIdentityCard, { identityCardFilename, QrPreview } from './PersonIdentityCard.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('names the ID card download after the person and their ID', () => {
  expect(identityCardFilename('Asha Patel', 'MB-000017')).toBe('Asha-Patel-MB-000017.png');
  expect(identityCardFilename('  Ravi   K/S: Rao ', 'MB-000018')).toBe('Ravi-K-S-Rao-MB-000018.png');
  expect(identityCardFilename(undefined, 'MB-000019')).toBe('MB-000019.png');
  expect(identityCardFilename('', '')).toBe('Maitribodh-ID-Card.png');
});

it('explains that a QR is unavailable for the registration after a 404 response', async () => {
  vi.spyOn(api, 'get').mockRejectedValue({ response: { status: 404 } });

  render(createElement(QrPreview, { personId: 8, personCode: 'MB-000008' }));

  expect(await screen.findByText('QR code is not available for this registration.')).toBeInTheDocument();
  expect(screen.queryByText('Scan at gate')).not.toBeInTheDocument();
});

it('shows all active categories in a single row and keeps status as a badge', () => {
  render(createElement(PersonIdentityCard, {
    personId: 8,
    personCode: 'MB-000008',
    name: 'Asha Patel',
    categories: ['Staff', 'Volunteer', 'Devotee'],
    status: 'ACTIVE',
    mobile: '+91 98765 43210',
  }));

  expect(screen.getByText('Staff')).toBeInTheDocument();
  expect(screen.getByText('Volunteer')).toBeInTheDocument();
  expect(screen.getByText('Devotee')).toBeInTheDocument();
  expect(screen.getByLabelText('Active categories')).toBeInTheDocument();
  expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  expect(screen.getByText('Mobile')).toBeInTheDocument();
  const profileInfo = screen.getByText('Asha Patel').parentElement;
  expect(profileInfo.children[2]).toHaveAttribute('aria-label', 'Status badge');
  expect(profileInfo.children[3]).toHaveTextContent('Mobile');
  expect(profileInfo.children[4]).toHaveAttribute('aria-label', 'Active categories');
});

it('explains when a rejected registration has no usable identity card', async () => {
  vi.spyOn(api, 'get').mockRejectedValue({ response: { status: 404 } });

  render(createElement(PersonIdentityCard, {
    personId: 8,
    personCode: 'MB-000008',
    name: 'Asha Patel',
    category: 'Staff',
    status: 'REJECTED',
  }));

  expect(await screen.findByText('QR code is not available for this registration.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ID card unavailable' })).toBeDisabled();
});

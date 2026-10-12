import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import PublicQrPage from './PublicQrPage.jsx';

afterEach(() => {
  vi.restoreAllMocks();
});

it('shows every matching registration and its individual QR download', async () => {
  vi.spyOn(api, 'post').mockResolvedValue({
    data: {
      items: [
        { displayName: 'Asha P.', category: 'Visitor', qrPng: 'cXIx' },
        { displayName: 'Asha S.', category: 'Staff', qrPng: 'cXIy' },
      ],
    },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><PublicQrPage /></MemoryRouter>);
  await user.type(screen.getByRole('textbox', { name: 'Mobile number' }), '9876543210');
  await user.click(screen.getByRole('button', { name: 'Find QR' }));

  expect(await screen.findByText('Asha P.')).toBeInTheDocument();
  expect(screen.getByText('Asha S.')).toBeInTheDocument();
  expect(screen.getByAltText('QR code for Asha P.')).toHaveAttribute('src', 'data:image/png;base64,cXIx');
  expect(screen.getByRole('link', { name: 'Download QR code 2' })).toHaveAttribute('download', 'maitribodh-qr-2.png');
  expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
});

it('uses a generic empty response and reports retry time for rate limits', async () => {
  const post = vi.spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { items: [] } })
    .mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': '60' } } });
  const user = userEvent.setup();

  render(<MemoryRouter><PublicQrPage /></MemoryRouter>);
  const mobileField = screen.getByRole('textbox', { name: 'Mobile number' });
  await user.type(mobileField, '9876543210');
  await user.click(screen.getByRole('button', { name: 'Find QR' }));
  expect(await screen.findByText('No active registration was found.')).toBeInTheDocument();
  expect(screen.queryByText('9876543210')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Find QR' }));
  expect(await screen.findByText('Too many requests. Try again in 60 seconds.')).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(2);
});

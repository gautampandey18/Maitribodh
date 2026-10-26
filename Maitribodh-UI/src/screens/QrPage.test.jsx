import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import QrPage from './QrPage.jsx';

afterEach(() => {
  vi.restoreAllMocks();
});

it('keeps the identity table hidden until search and shows a no-match message', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 2 } });
  const user = userEvent.setup();

  render(<MemoryRouter><QrPage /></MemoryRouter>);

  expect(screen.queryByRole('table', { name: 'QR identity' })).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();

  await user.type(screen.getByRole('textbox', { name: 'Search person ID, name or mobile' }), 'MB-999999');
  await user.click(screen.getByRole('button', { name: 'Search' }));

  expect(await screen.findByRole('status')).toHaveTextContent('No user found.');
  expect(screen.queryByRole('table', { name: 'QR identity' })).not.toBeInTheDocument();
  expect(screen.queryByText(/rows per page/i)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons', {
    params: { q: 'MB-999999', status: 'ACTIVE', page: 1, pageSize: 2 },
  });
});

it('shows one identity when the search uniquely matches an active user', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/persons'
      ? { data: { items: [{ person_id: 5, person_code: 'MB-000005', name: 'Asha Patel', category: 'Staff', mobile: '9876543210', status: 'ACTIVE', created_at: '2026-07-13T00:00:00.000Z', expires_on: null, qr_version: 1 }], total: 1 } }
      : { data: new Blob(['qr'], { type: 'image/png' }) },
  ));
  const user = userEvent.setup();

  render(<MemoryRouter><QrPage /></MemoryRouter>);

  await user.type(screen.getByRole('textbox', { name: 'Search person ID, name or mobile' }), 'MB-000005');
  await user.click(screen.getByRole('button', { name: 'Search' }));

  expect(await screen.findByRole('table', { name: 'QR identity' })).toBeInTheDocument();
  expect(screen.getAllByText('Asha Patel')).toHaveLength(2);
  expect(screen.getByText('Person ID: MB-000005')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'QR preview' })).toBeInTheDocument();
  expect(screen.getByText('Generated')).toBeInTheDocument();
  expect(screen.getByText('13 Jul 2026')).toBeInTheDocument();
  expect(screen.getByText('Registered mobile number')).toBeInTheDocument();
  expect(screen.getByText('Never')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'QR preview' })).getByText('Current')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Download preview' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
  expect(screen.queryByText(/rows per page/i)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons', {
    params: { q: 'MB-000005', status: 'ACTIVE', page: 1, pageSize: 2 },
  });
});
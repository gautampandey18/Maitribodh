import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import ReportsPage from './ReportsPage.jsx';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('automatically loads every report section without applying filters', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((_path, { params }) => Promise.resolve({
    data: { items: [], total: 0, page: params.page, pageSize: params.pageSize },
  }));
  const user = userEvent.setup();
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

  await waitFor(() => expect(get).toHaveBeenNthCalledWith(1, '/reports/visit-history', {
    params: { page: 1, pageSize: 5 },
  }));
  const sections = [
    ['Person Registrations', '/reports/registrations'],
    ['Occupancy', '/reports/occupancy'],
    ['Staff', '/reports/staff'],
    ['Approvals', '/reports/approvals'],
    ['Blacklist', '/reports/blacklist'],
  ];
  for (const [label, path] of sections) {
    await user.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith(path, { params: { page: 1, pageSize: 5 } }));
  }
  expect(get).toHaveBeenCalledTimes(6);
}, 30_000);

it('runs the registration report with the selected status and renders returned rows', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      items: [{ person_code: 'MB-000007', name: 'Asha Patel', category: 'Staff', mobile: '******3210', status: 'ACTIVE', created_at: '2026-10-09T08:00:00Z' }],
      total: 1,
      page: 1,
      pageSize: 5,
    },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Person Registrations' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(screen.getByRole('option', { name: 'ACTIVE' }));
  await user.click(screen.getByRole('button', { name: 'Run report' }));

  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getByText('******3210')).toBeInTheDocument();
  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/reports/registrations', { params: { status: 'ACTIVE', page: 1, pageSize: 5 } }));
}, 30_000);

it('uses the selected date range for Visit History and exports CSV', async () => {
  const csvBlob = new Blob(['name,mobile\r\nAsha,******3210'], { type: 'text/csv' });
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { items: [{ person_code: 'MB-000007', name: 'Asha Patel', mobile: '******3210', category: 'Staff' }], total: 1, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({ data: { items: [{ person_code: 'MB-000007', name: 'Asha Patel', mobile: '******3210', category: 'Staff' }], total: 1, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({ data: csvBlob });
  const createObjectURL = vi.fn(() => 'blob:report');
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  const fromDate = screen.getByLabelText('From');
  const toDate = screen.getByLabelText('To');
  fireEvent.change(fromDate, { target: { value: '2026-10-01' } });
  fireEvent.change(toDate, { target: { value: '2026-10-09' } });
  await user.click(screen.getByRole('button', { name: 'Run report' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Export CSV' }));

  await waitFor(() => expect(get).toHaveBeenNthCalledWith(2, '/reports/visit-history', {
    params: { fromDate: '2026-10-01', toDate: '2026-10-09', page: 1, pageSize: 5 },
  }));
  expect(get).toHaveBeenNthCalledWith(3, '/reports/visit-history/export', {
    params: { fromDate: '2026-10-01', toDate: '2026-10-09' },
    responseType: 'blob',
  });

  expect(createObjectURL).toHaveBeenCalledWith(csvBlob);
}, 30_000);

it('requests the next report page using the selected page size', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((_path, { params }) => Promise.resolve({
    data: {
      items: [{ person_code: `MB-${String(params.page).padStart(6, '0')}`, name: `Page ${params.page}` }],
      total: 31,
      page: params.page,
      pageSize: params.pageSize,
    },
  }));
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Person Registrations' }));
  expect(await screen.findByText('Page 1')).toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Go to next page' }));

  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/reports/registrations', {
    params: { page: 2, pageSize: 5 },
  }));
  expect(await screen.findByText('Page 2')).toBeInTheDocument();
});

it('keeps the newest page when pagination requests overlap', async () => {
  const pending = new Map();
  const get = vi.spyOn(api, 'get').mockImplementation((_path, { params }) => new Promise((resolve) => {
    pending.set(params.page, () => resolve({ data: {
      items: [{ person_code: `MB-${params.page}`, name: `Page ${params.page}` }],
      total: 80,
      page: params.page,
      pageSize: params.pageSize,
    } }));
  }));
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  pending.get(1)();
  expect(await screen.findByText('Page 1')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
  expect(get.mock.calls.slice(1).map(([, config]) => config.params.page)).toEqual([2, 3]);

  pending.get(3)();
  expect(await screen.findByText('Page 3')).toBeInTheDocument();
  pending.get(2)();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.getByText('Page 3')).toBeInTheDocument();
  expect(screen.queryByText('Page 2')).not.toBeInTheDocument();
});

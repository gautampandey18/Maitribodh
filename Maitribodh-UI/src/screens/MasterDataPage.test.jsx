import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../api.js';
import MasterDataPage from './MasterDataPage.jsx';

afterEach(() => vi.restoreAllMocks());

it('searches master values within the selected lookup type', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path.startsWith('/persons/registration/options')
      ? { categories: [], lookups: [], locations: [] }
      : { items: [{ lookup_id: 1, name: 'Operations', status: 'ACTIVE' }], total: 1, page: 1, pageSize: 5 },
  }));
  const user = userEvent.setup();
  render(<MemoryRouter><MasterDataPage /></MemoryRouter>);

  await user.click(screen.getByRole('tab', { name: 'Departments' }));
  expect(await screen.findByText('Operations')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Search departments' }), 'Finance');
  await user.click(screen.getByRole('button', { name: 'Search' }));

  await waitFor(() => expect(get.mock.calls.some(([path]) => path.includes('query=Finance'))).toBe(true));
  expect(get.mock.calls.at(-1)[0]).toContain('/lookups/DEPARTMENT?');
}, 30_000);

it('opens category management from the Master Data Categories tab', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path === '/categories'
      ? { items: [{ category_id: 1, name: 'Visitor', form_type: 'VISITOR', approval_required: false, status: 'ACTIVE' }], total: 1 }
      : path === '/lookups/PERMISSION_LEVEL'
        ? { items: [] }
        : { items: [], total: 0, page: 1, pageSize: 5 },
  }));
  render(<MemoryRouter><MasterDataPage /></MemoryRouter>);

  expect(await screen.findByRole('table', { name: 'Registration categories' })).toBeInTheDocument();
  expect(await screen.findByText('Visitor')).toBeInTheDocument();
});

it('deletes an unreferenced master lookup value after confirmation', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path.startsWith('/persons/registration/options')
      ? { categories: [], lookups: [], locations: [] }
      : { items: [{ lookup_id: 8, name: 'Operations', status: 'ACTIVE' }], total: 1, page: 1, pageSize: 5 },
  }));
  const remove = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204 });
  const user = userEvent.setup();
  render(<MemoryRouter><MasterDataPage /></MemoryRouter>);

  await user.click(screen.getByRole('tab', { name: 'Departments' }));
  await screen.findByText('Operations');
  await user.click(screen.getByRole('button', { name: 'Delete Operations' }));
  expect(screen.getByText(/permanently delete this departments value/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  await waitFor(() => expect(remove).toHaveBeenCalledWith('/lookups/DEPARTMENT/8'));
  expect(get).toHaveBeenCalled();
});
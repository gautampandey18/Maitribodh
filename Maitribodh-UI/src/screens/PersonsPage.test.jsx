import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, store } from '../store.js';
import PersonsPage from './PersonsPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('loads all registrations, filters by category, and requests the next page', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { categories: [{ category_id: 2, name: 'Staff' }] } })
    .mockResolvedValueOnce({
      data: {
        items: [
          { person_id: 9, person_code: 'MB-000009', name: 'Initial Active', category: 'Visitor', mobile: '******1111', status: 'ACTIVE', created_at: '2026-10-10T09:30:00Z' },
          { person_id: 10, person_code: 'MB-000010', name: 'Initial Inactive', category: 'Staff', mobile: '******2222', status: 'DEACTIVATED', created_at: '2026-10-09T09:30:00Z' },
        ],
        total: 26,
        page: 1,
        pageSize: 5,
      },
    })
    .mockResolvedValueOnce({
      data: {
        items: [
          { person_id: 1, person_code: 'MB-000001', name: 'Asha Patel', category: 'Staff', mobile: '******3210', status: 'ACTIVE', created_at: '2026-10-09T09:30:00Z' },
          { person_id: 2, person_code: 'MB-000002', name: 'Asha Sharma', category: 'Staff', mobile: '******3210', status: 'PENDING', created_at: '2026-10-08T09:30:00Z' },
        ],
        total: 26,
        page: 1,
        pageSize: 5,
      },
    })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 3, person_code: 'MB-000003', name: 'Asha Singh', category: 'Staff', mobile: '******3210', status: 'ACTIVE', created_at: '2026-10-07T09:30:00Z' }],
        total: 26,
        page: 2,
        pageSize: 5,
      },
    });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <PersonsPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Initial Active')).toBeInTheDocument();
  expect(screen.getByText('Initial Inactive')).toBeInTheDocument();
  expect(screen.getByText('Inactive')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  expect(get).toHaveBeenNthCalledWith(2, '/persons', { params: { page: 1, pageSize: 5 } });

  await user.click(screen.getByRole('combobox', { name: 'Category' }));
  await user.click(screen.getByRole('option', { name: 'Staff' }));
  await user.type(screen.getByRole('textbox', { name: 'Search registrations' }), '9876543210');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getAllByText('******3210')).toHaveLength(2);
  expect(get).toHaveBeenNthCalledWith(3, '/persons', { params: { q: '9876543210', categoryId: 2, page: 1, pageSize: 5 } });

  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  expect(await screen.findByText('Asha Singh')).toBeInTheDocument();
  expect(get).toHaveBeenNthCalledWith(4, '/persons', { params: { q: '9876543210', categoryId: 2, page: 2, pageSize: 5 } });
}, 30_000);

it('deletes a person from the Actions column after confirmation', async () => {
  vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { categories: [] } })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 12, name: 'Mina Shah', category: 'Visitor', mobile: '******4321', status: 'ACTIVE', created_at: '2026-10-10T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    });
  const remove = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204 });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <PersonsPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Mina Shah')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Actions for Mina Shah' }));
  expect(screen.getByRole('menuitem', { name: 'Update' })).toBeInTheDocument();
  expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('permanently removes the person');
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  expect(remove).toHaveBeenCalledWith('/persons/12');
  expect(await screen.findByText('Mina Shah deleted')).toBeInTheDocument();
  expect(screen.getByText('No registrations found.')).toBeInTheDocument();
}, 30_000);

it('keeps the selected status and applies it only after Search is clicked', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { categories: [] } })
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 8, person_code: 'MB-000008', name: 'Ravi Shah', category: 'Staff', mobile: '******9876', status: 'DEACTIVATED', created_at: '2026-10-09T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    })
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <PersonsPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(screen.getByRole('option', { name: 'Inactive' }));

  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Inactive');
  expect(get).toHaveBeenCalledTimes(2);

  await user.click(screen.getByRole('button', { name: 'Search' }));
  expect(await screen.findByText('Ravi Shah')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Inactive');
  expect(get).toHaveBeenLastCalledWith('/persons', {
    params: { status: 'DEACTIVATED', page: 1, pageSize: 5 },
  });
}, 30_000);

import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, store } from '../store.js';
import PersonsPage from './PersonsPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('preserves duplicate mobile matches and requests the next page', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({
      data: {
        items: [
          { person_id: 1, person_code: 'MB-000001', name: 'Asha Patel', category: 'Visitor', mobile: '******3210', status: 'ACTIVE', created_at: '2026-10-09T09:30:00Z' },
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

  await user.type(screen.getByRole('textbox', { name: 'Search registrations' }), '9876543210');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getAllByText('******3210')).toHaveLength(2);
  expect(get).toHaveBeenNthCalledWith(1, '/persons', { params: { q: '9876543210', page: 1, pageSize: 5 } });

  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('Asha Singh')).toBeInTheDocument();
  expect(get).toHaveBeenNthCalledWith(2, '/persons', { params: { q: '9876543210', page: 2, pageSize: 5 } });
}, 30_000);

it('confirms resubmission and refreshes the rejected record search', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 8, person_code: 'MB-000008', name: 'Ravi Shah', category: 'Staff', mobile: '******9876', status: 'REJECTED', created_at: '2026-10-09T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    })
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'PENDING' } });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <PersonsPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.type(screen.getByRole('textbox', { name: 'Search registrations' }), 'Ravi');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  await user.click(await screen.findByRole('button', { name: 'Resubmit' }));
  await user.click(screen.getByRole('button', { name: 'Confirm resubmission' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/resubmissions'));
  expect(await screen.findByText('No matching registrations.')).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(2);
}, 30_000);

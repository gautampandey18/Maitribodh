import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import DashboardPage from './DashboardPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('loads live summary metrics and the inside list', async () => {
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 1, role: 'ADMIN' } }));
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(path === '/dashboard'
    ? { data: {
      active_persons: 3,
      registrations_today: 1,
      checkins_today: 2,
      checkouts_today: 1,
      pending_approvals: 1,
      blacklist_attempts_today: 0,
      open_visits: 1,
      checkin_trend: [{ day: '2026-10-09', checkins: 2 }],
      category_mix: [{ category: 'Visitor', active_persons: 3 }],
      recent_activity: [{ occurred_at: '2026-10-09T08:30:00Z', actor: 'guard', module: 'GATE', activity: 'CHECK_IN' }],
      security_alerts: { total_today: 0, latest_at: null },
    } }
    : path === '/dashboard/inside'
      ? { data: { items: [{ visit_id: 8, person_code: 'MB-000008', name: 'Asha Patel', category: 'Visitor', gate: 'Main Gate', location: 'Assembly Hall', checkin_at: '2026-10-09T08:30:00Z', accompanying_count: 0, checked_in_by: 'Gotam Pandey', checkin_device: 'Test device' }], total: 1, page: 1, pageSize: 5, byLocation: [{ name: 'Assembly Hall', count: 1 }], byCategory: [{ name: 'Visitor', count: 1 }] } }
      : { data: { items: [{ person_id: 9, name: 'Ravi Pending', category: 'Staff' }] } }));
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'CLOSED_BY_ADMIN' } });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Active Members')).toBeInTheDocument();
  expect(screen.getByText('1 inside')).toBeInTheDocument();
  expect(screen.getByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getByText('Main Gate')).toBeInTheDocument();
  expect(screen.getAllByText('Assembly Hall')).toHaveLength(2);
  expect(screen.getByText('Daily Check-In Trend')).toBeInTheDocument();
  expect(screen.getByText('Category Mix')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Daily check-in trend for the last seven days' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Active person category mix' })).toBeInTheDocument();
  expect(screen.getByText('Occupancy by Location')).toBeInTheDocument();
  expect(screen.getByText('Occupancy by Category')).toBeInTheDocument();
  expect(screen.getByText('CHECK IN')).toBeInTheDocument();
  expect(screen.getByText('Ravi Pending')).toBeInTheDocument();
  expect(screen.getByText('No blacklist attempts today')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Review / Close' }));
  expect(screen.getByText(/Confirm only after checking the person is no longer on site/)).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Admin reconciliation note' }), 'Confirmed off site');
  await user.click(screen.getByRole('button', { name: 'Confirm close' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/visits/8/reconciliation', { note: 'Confirmed off site' }));
  await waitFor(() => expect(get).toHaveBeenCalledWith('/dashboard/inside', { params: { page: 1, pageSize: 5 } }));
  expect(get).toHaveBeenCalledWith('/dashboard');
  expect(get).toHaveBeenCalledWith('/approvals');
}, 30_000);

it('centers the empty Occupancy state when there are no open check-ins', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/dashboard'
      ? { data: {
        active_persons: 0,
        registrations_today: 0,
        checkins_today: 0,
        checkouts_today: 0,
        pending_approvals: 0,
        blacklist_attempts_today: 0,
        open_visits: 0,
        checkin_trend: [],
        category_mix: [],
        recent_activity: [],
        security_alerts: { total_today: 0, latest_at: null },
      } }
      : { data: { items: [], total: 0, page: 1, pageSize: 5, byLocation: [], byCategory: [] } },
  ));

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  const emptyState = await screen.findByRole('cell', { name: 'No open check-ins.' });
  expect(emptyState).toHaveClass('empty-table', 'occupancy-empty-state');
}, 30_000);

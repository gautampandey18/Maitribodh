import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    ? {
      data: {
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
      }
    }
    : path === '/dashboard/inside'
      ? { data: { items: [{ visit_id: 8, person_code: 'MB-000008', name: 'Asha Patel', category: 'Visitor', gate: 'Main Gate', location: 'Assembly Hall', checkin_at: '2026-10-09T08:30:00Z', accompanying_count: 0, checked_in_by: 'Gotam Pandey', checkin_device: 'Test device' }], total: 1, page: 1, pageSize: 5, byLocation: [{ name: 'Assembly Hall', count: 1 }], byCategory: [{ name: 'Visitor', count: 1 }] } }
      : path === '/dashboard/recent-activity'
        ? { data: { items: [{ occurred_at: '2026-10-09T08:30:00Z', actor: 'guard', module: 'GATE', activity: 'CHECK_IN' }], total: 1, page: 1, pageSize: 5 } }
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

  expect(await screen.findByText('Total Users')).toBeInTheDocument();
  expect(screen.getByText('Active Members')).toBeInTheDocument();
  expect(screen.getByText(/Last sync:.*Live monitoring/)).toBeInTheDocument();
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
  expect(screen.getByRole('heading', { name: 'Occupancy Breakdown' })).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'People currently inside' }).closest('.dashboard-inside'))
    .not.toContainElement(screen.getByText('Occupancy by Location'));
  expect(screen.getByText('CHECK IN')).toBeInTheDocument();
  expect(screen.getByText('Ravi Pending')).toBeInTheDocument();
  expect(screen.getByText('No blacklist attempts today')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Review / Checkout' }));
  expect(screen.getByText(/Confirm only after checking the person is no longer on site/)).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Admin reconciliation note' }), 'Confirmed off site');
  await user.click(screen.getByRole('button', { name: 'Confirm close' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/visits/8/reconciliation', { note: 'Confirmed off site' }));
  await waitFor(() => expect(get).toHaveBeenCalledWith('/dashboard/inside', { params: { page: 1, pageSize: 5 } }));
  expect(get).toHaveBeenCalledWith('/dashboard');
  expect(get).toHaveBeenCalledWith('/approvals');
}, 30_000);

it('hides the occupancy table and pagination when there are no open check-ins', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/dashboard'
      ? {
        data: {
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
        }
      }
      : path === '/dashboard/recent-activity'
        ? { data: { items: [], total: 0, page: 1, pageSize: 5 } }
        : { data: { items: [], total: 0, page: 1, pageSize: 5, byLocation: [], byCategory: [] } },
  ));

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('0 inside')).toBeInTheDocument();
  const occupancySection = screen.getByText('Current Occupancy').closest('.dashboard-inside');
  expect(within(occupancySection).queryByRole('table')).not.toBeInTheDocument();
  expect(within(occupancySection).queryByText(/rows per page/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Occupancy Breakdown' })).not.toBeInTheDocument();
  expect(screen.queryByText('Occupancy by Location')).not.toBeInTheDocument();
  expect(screen.queryByText('Occupancy by Category')).not.toBeInTheDocument();
}, 30_000);

it('hides individual occupancy breakdown when data is <= 0 or empty', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/dashboard'
      ? {
        data: {
          active_persons: 1,
          registrations_today: 0,
          checkins_today: 1,
          checkouts_today: 0,
          pending_approvals: 0,
          blacklist_attempts_today: 0,
          open_visits: 1,
          checkin_trend: [],
          category_mix: [],
          recent_activity: [],
          security_alerts: { total_today: 0, latest_at: null },
        }
      }
      : path === '/dashboard/recent-activity'
        ? { data: { items: [], total: 0, page: 1, pageSize: 5 } }
        : {
          data: {
            items: [{
              visit_id: 10,
              person_code: 'MB-000010',
              name: 'Single Location Person',
              category: 'Staff',
              gate: 'Main Gate',
              location: 'Dining Hall',
              checkin_at: '2026-10-09T08:30:00Z',
              accompanying_count: 0,
              checked_in_by: 'Guard',
            }],
            total: 1,
            page: 1,
            pageSize: 5,
            byLocation: [{ name: 'Dining Hall', count: 1 }],
            byCategory: [{ name: 'Staff', count: 0 }],
          },
        },
  ));

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Occupancy Breakdown')).toBeInTheDocument();
  expect(screen.getByText('Occupancy by Location')).toBeInTheDocument();
  expect(screen.queryByText('Occupancy by Category')).not.toBeInTheDocument();
}, 30_000);

it('allows security guards to view the dashboard without management actions', async () => {
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 2, role: 'SECURITY_GUARD' } }));
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/dashboard'
      ? {
        data: {
          active_persons: 1,
          registrations_today: 0,
          checkins_today: 0,
          checkouts_today: 0,
          pending_approvals: 0,
          blacklist_attempts_today: 0,
          open_visits: 1,
          checkin_trend: [],
          category_mix: [],
          recent_activity: [],
          security_alerts: { total_today: 0, latest_at: null },
        }
      }
      : path === '/dashboard/recent-activity'
        ? { data: { items: [], total: 0, page: 1, pageSize: 5 } }
        : { data: { items: [{ visit_id: 8, person_code: 'MB-000008', name: 'Asha Patel', category: 'Visitor', gate: 'Main Gate', location: 'Assembly Hall', checkin_at: '2026-10-09T08:30:00Z', accompanying_count: 0, checked_in_by: 'Gotam Pandey', checkin_device: 'Test device' }], total: 1, page: 1, pageSize: 5, byLocation: [], byCategory: [] } },
  ));
  const post = vi.spyOn(api, 'post');

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Total Users')).toBeInTheDocument();
  expect(screen.getByText('Active Members')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'People currently inside' })).toBeInTheDocument();
  expect(screen.getByText('Admin review')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Manage locations' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Review / Checkout' })).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/dashboard');
  expect(get).toHaveBeenCalledWith('/dashboard/inside', { params: { page: 1, pageSize: 5 } });
  expect(get).toHaveBeenCalledWith('/dashboard/recent-activity', { params: { page: 1, pageSize: 5 } });
  expect(get).not.toHaveBeenCalledWith('/approvals');
  expect(post).not.toHaveBeenCalled();
}, 30_000);

it('loads the requested Recent Activity page', async () => {
  const activity = (actor) => ({ occurred_at: '2026-10-09T08:30:00Z', actor, module: 'GATE', activity: 'CHECK_IN' });
  const get = vi.spyOn(api, 'get').mockImplementation((path, options) => Promise.resolve(
    path === '/dashboard'
      ? { data: { active_persons: 1, checkin_trend: [], category_mix: [], recent_activity: [], security_alerts: { total_today: 0 } } }
      : path === '/dashboard/recent-activity'
        ? options.params.page === 1
          ? { data: { items: [activity('First page')], total: 6, page: 1, pageSize: 5 } }
          : { data: { items: [activity('Second page')], total: 6, page: 2, pageSize: 5 } }
        : { data: { items: [], total: 0, page: 1, pageSize: 5, byLocation: [], byCategory: [] } },
  ));
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('First page')).toBeInTheDocument();
  const nextPageButtons = screen.getAllByTitle('Go to next page');
  await user.click(nextPageButtons[nextPageButtons.length - 1]);

  expect(await screen.findByText('Second page')).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/dashboard/recent-activity', { params: { page: 2, pageSize: 5 } });
}, 30_000);

it('displays combined total inside and accompanying count when additional people are present', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve(
    path === '/dashboard'
      ? { data: { active_persons: 2, checkin_trend: [], category_mix: [], recent_activity: [], security_alerts: { total_today: 0 } } }
      : path === '/dashboard/inside'
        ? {
          data: {
            items: [
              {
                visit_id: 1,
                person_code: 'MB-000001',
                name: 'Parent Visitor',
                category: 'Visitor',
                gate: 'Main Gate',
                location: 'Assembly Hall',
                checkin_at: '2026-10-09T08:30:00Z',
                accompanying_count: 2,
                checked_in_by: 'Guard',
                checkin_device: 'Tab',
              },
            ],
            total: 1,
            accompanyingTotal: 2,
            page: 1,
            pageSize: 5,
            byLocation: [{ name: 'Assembly Hall', count: 3 }],
            byCategory: [{ name: 'Visitor', count: 3 }],
          },
        }
        : { data: { items: [], total: 0, page: 1, pageSize: 5 } },
  ));

  render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Total 3 inside')).toBeInTheDocument();
  expect(screen.getByText('(1 checked in + 2 accompanying)')).toBeInTheDocument();
}, 30_000);

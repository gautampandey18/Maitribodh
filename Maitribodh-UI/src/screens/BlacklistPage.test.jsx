import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, store } from '../store.js';
import BlacklistPage from './BlacklistPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('searches for a person and creates an audited blacklist entry', async () => {
  let entryCreated = false;
  vi.spyOn(api, 'get').mockImplementation((path) => {
    if (path === '/lookups/BLACKLIST_REASON') {
      return Promise.resolve({ data: { items: [{ lookup_id: 11, name: 'Repeated policy violation' }] } });
    }
    if (path === '/persons') {
      return Promise.resolve({
        data: {
          items: [{ person_id: 7, person_code: 'MB-000007', name: 'Asha Patel', category: 'Staff', mobile: '9876543210' }],
          total: 1,
          page: 1,
        },
      });
    }
    return Promise.resolve({
      data: {
        items: entryCreated ? [{
          blacklist_id: 4,
          person_id: 7,
          person_code: 'MB-000007',
          name: 'Asha Patel',
          category: 'Staff',
          reason: 'Repeated policy violation',
          remarks: 'Repeated policy violation',
          start_date: '2026-10-09',
          end_date: null,
          status: 'ACTIVE',
        }] : [],
      },
    });
  });
  const post = vi.spyOn(api, 'post').mockImplementation(async (path) => {
    if (path === '/blacklist') entryCreated = true;
    return { data: { blacklist_id: 4 } };
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <BlacklistPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(await screen.findByRole('button', { name: 'Add to blacklist' }));
  await user.type(screen.getByRole('textbox', { name: 'Find person' }), 'Asha');
  await user.click(screen.getByRole('button', { name: 'Search registrations' }));
  await user.click(await screen.findByRole('option', { name: /Asha Patel/ }));
  await user.click(screen.getByRole('combobox', { name: 'Reason' }));
  await user.click(screen.getByRole('option', { name: 'Repeated policy violation' }));
  await user.type(screen.getByRole('textbox', { name: 'Remarks' }), 'Repeated policy violation');
  await user.click(screen.getByRole('button', { name: 'Add entry' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/blacklist', {
    personId: 7,
    reasonId: 11,
    remarks: 'Repeated policy violation',
  }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
}, 30_000);

it('allows an expired unlifted entry to be closed with a reason', async () => {
  let lifted = false;
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: {
      items: path === '/blacklist'
        ? [{
          blacklist_id: 8,
          person_id: 7,
          person_code: 'MB-000007',
          name: 'Asha Patel',
          category: 'Staff',
          reason: 'Repeated policy violation',
          remarks: 'Repeated policy violation',
          start_date: '2026-10-09',
          end_date: null,
          status: lifted ? 'LIFTED' : 'EXPIRED',
        }]
        : [],
    },
  }));
  const post = vi.spyOn(api, 'post').mockImplementation(async (path) => {
    if (path.endsWith('/lifts')) lifted = true;
    return { data: { blacklist_id: 8 } };
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <BlacklistPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Lift' }));
  await user.type(screen.getByRole('textbox', { name: 'Reason for lifting' }), 'Reviewed by Security');
  await user.click(screen.getByRole('button', { name: 'Confirm lift' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/blacklist/8/lifts', { liftNote: 'Reviewed by Security' }));
  expect(await screen.findByText('LIFTED')).toBeInTheDocument();
}, 30_000);

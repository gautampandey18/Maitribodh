import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import UsersPage from './UsersPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('creates an account, issues its initial credential, and reveals it once', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [] } });
  const post = vi.spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { user_id: 25, username: 'asha.patel' } })
    .mockResolvedValueOnce({
      data: {
        temporaryPassword: 'one-time-secret',
        expiresAt: '2026-10-10T09:30:00Z',
      },
    });
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 4, role: 'ADMIN' } }));
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(await screen.findByRole('button', { name: 'Add user' }));
  await user.click(screen.getByRole('combobox', { name: 'Role' }));
  expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'SUPER ADMIN' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'ADMIN' }));
  await user.type(screen.getByRole('textbox', { name: /First name/ }), 'Asha');
  await user.type(screen.getByRole('textbox', { name: /Last name/ }), 'Patel');
  await user.type(screen.getByRole('textbox', { name: /Mobile/ }), '9876543210');
  await user.type(screen.getByRole('textbox', { name: /Username/ }), 'asha.patel');
  await user.click(screen.getByRole('button', { name: 'Create and issue credential' }));

  expect(await screen.findByText('one-time-secret')).toBeInTheDocument();
  expect(screen.getByText(/Deliver out of band/)).toBeInTheDocument();
  await waitFor(() => expect(post).toHaveBeenNthCalledWith(1, '/users', {
    firstName: 'Asha',
    lastName: 'Patel',
    mobile: '9876543210',
    email: '',
    username: 'asha.patel',
    role: 'ADMIN',
    isSecurityHead: false,
    canBulkUpload: false,
  }));
  expect(post).toHaveBeenNthCalledWith(2, '/users/25/password-reset');

  await user.click(screen.getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(screen.queryByText('one-time-secret')).not.toBeInTheDocument());
}, 30_000);

it('keeps the account and explains how to retry when credential issuance fails', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [] } });
  vi.spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { user_id: 26, username: 'ravi.shah' } })
    .mockRejectedValueOnce(new Error('temporary failure'));
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(await screen.findByRole('button', { name: 'Add user' }));
  await user.type(screen.getByRole('textbox', { name: /First name/ }), 'Ravi');
  await user.type(screen.getByRole('textbox', { name: /Last name/ }), 'Shah');
  await user.type(screen.getByRole('textbox', { name: /Mobile/ }), '9876543211');
  await user.type(screen.getByRole('textbox', { name: /Username/ }), 'ravi.shah');
  await user.click(screen.getByRole('button', { name: 'Create and issue credential' }));

  expect(await screen.findByText(/User was created, but temporary password issuance failed/)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Add user' })).not.toBeInTheDocument());
}, 30_000);

it('filters users by identity, role, and status', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 4, role: 'ADMIN' } }));
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);

  await user.type(await screen.findByRole('textbox', { name: 'Search name, username, email or mobile' }), 'alex');
  await user.click(screen.getByRole('combobox', { name: 'Role' }));
  await user.click(screen.getByRole('option', { name: 'APPROVER' }));
  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(screen.getByRole('option', { name: 'INACTIVE' }));
  await user.click(screen.getByRole('button', { name: 'Apply' }));

  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/users', {
    params: { query: 'alex', role: 'APPROVER', status: 'INACTIVE', page: 1, pageSize: 5 },
  }));
}, 30_000);

import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import UsersPage from './UsersPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it.each(['Add user', 'Update user'])('keeps both name inputs in one row in the %s dialog', async (dialogTitle) => {
  const record = {
    user_id: 25, first_name: 'Asha', last_name: 'Patel', mobile: '9876543210',
    username: 'asha.patel', role: 'APPROVER', status: 'ACTIVE',
    is_security_head: false, can_bulk_upload: false,
  };
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [record], total: 1 } });
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);

  if (dialogTitle === 'Add user') {
    await user.click(await screen.findByRole('button', { name: 'Add user' }));
  } else {
    await user.click(await screen.findByRole('button', { name: 'Actions for asha.patel' }));
    await user.click(screen.getByRole('menuitem', { name: 'Update' }));
  }
  const dialog = within(screen.getByRole('dialog', { name: dialogTitle }));
  const firstField = dialog.getByRole('textbox', { name: /First name/ }).closest('.MuiFormControl-root');
  const lastField = dialog.getByRole('textbox', { name: /Last name/ }).closest('.MuiFormControl-root');
  expect(firstField.parentElement).toBe(lastField.parentElement);
  expect(firstField.parentElement).toHaveStyle({
    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  });
}, 30_000);

it('adds Security Guard to an existing Approver while retaining both role selections', async () => {
  const record = {
    user_id: 25, first_name: 'Asha', last_name: 'Patel', mobile: '9876543210',
    username: 'asha.patel', role: 'APPROVER', roles: ['APPROVER'],
    is_security_head: false, can_bulk_upload: false, status: 'ACTIVE',
  };
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [record], total: 1 } });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({
    data: { ...record, roles: ['APPROVER', 'SECURITY_GUARD'] },
  });
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 4, role: 'ADMIN' } }));
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);

  await user.click(await screen.findByRole('button', { name: 'Actions for asha.patel' }));
  await user.click(screen.getByRole('menuitem', { name: 'Update' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Update user' }));
  await user.click(dialog.getByRole('combobox', { name: 'Roles' }));
  expect(screen.getByRole('option', { name: 'APPROVER' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('option', { name: 'SECURITY GUARD' }));
  expect(screen.getByRole('option', { name: 'APPROVER' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('option', { name: 'SECURITY GUARD' })).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('{Escape}');
  await user.click(dialog.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/users/25', expect.objectContaining({
    roles: ['APPROVER', 'SECURITY_GUARD'],
  })));
}, 30_000);

it('shows all assigned roles in the user list', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [{
    user_id: 25, first_name: 'Asha', last_name: 'Patel', username: 'asha.patel',
    mobile: '9876543210', role: 'APPROVER', roles: ['APPROVER', 'SECURITY_GUARD'], status: 'ACTIVE',
  }], total: 1 } });
  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);
  expect(await screen.findByRole('cell', { name: 'APPROVER, SECURITY GUARD' })).toBeInTheDocument();
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
  await user.click(screen.getByRole('combobox', { name: 'Roles' }));
  expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'SUPER ADMIN' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'ADMIN' }));
  await user.click(screen.getByRole('option', { name: 'REG OFFICER' }));
  await user.keyboard('{Escape}');
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
    roles: ['ADMIN'],
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

it('keeps password and bulk-upload actions as row icons and user management actions in the menu', async () => {
  const userRecord = {
    user_id: 32,
    first_name: 'Asha',
    last_name: 'Patel',
    username: 'asha.patel',
    mobile: '9876543210',
    role: 'REG_OFFICER',
    status: 'ACTIVE',
    can_bulk_upload: false,
  };
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [userRecord], total: 1, page: 1, pageSize: 5 } });
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { temporaryPassword: 'temp-password', expiresAt: '2026-10-10T09:30:00Z' },
  });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({
    data: { ...userRecord, can_bulk_upload: true },
  });
  const user = userEvent.setup();

  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);

  await screen.findByText('asha.patel · 9876543210');
  await user.click(screen.getByRole('button', { name: 'Issue temporary password for asha.patel' }));
  expect(screen.getByText(/Issue a new temporary password for asha\.patel/)).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Issue temporary password?' })).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: 'Issue temporary password for asha.patel' }));
  await user.click(screen.getByRole('button', { name: 'Issue temporary password', exact: true }));
  expect(await screen.findByText('temp-password')).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith('/users/32/password-reset');
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Temporary password' })).not.toBeInTheDocument());

  await user.click(screen.getByRole('button', { name: 'Enable bulk upload for asha.patel' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/users/32', { canBulkUpload: true }));
  expect(screen.getByRole('button', { name: 'Disable bulk upload for asha.patel' })).toHaveClass('MuiIconButton-colorSuccess');

  await user.click(screen.getByRole('button', { name: 'Actions for asha.patel' }));
  expect(screen.getByRole('menuitem', { name: 'Update' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Deactivate' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Issue temporary password' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Enable bulk upload' })).not.toBeInTheDocument();
}, 30_000);

it('offers activation for inactive users and updates the row after confirmation', async () => {
  const userRecord = {
    user_id: 33,
    first_name: 'Ravi',
    last_name: 'Shah',
    username: 'ravi.shah',
    mobile: '9876543211',
    role: 'REG_OFFICER',
    status: 'INACTIVE',
    can_bulk_upload: false,
  };
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [userRecord], total: 1, page: 1, pageSize: 5 } });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { ...userRecord, status: 'ACTIVE' } });
  const user = userEvent.setup();

  render(<Provider store={store}><MemoryRouter><UsersPage /></MemoryRouter></Provider>);

  await screen.findByText('ravi.shah · 9876543211');
  await user.click(screen.getByRole('button', { name: 'Actions for ravi.shah' }));
  await user.click(screen.getByRole('menuitem', { name: 'Activate' }));
  expect(screen.getByRole('dialog', { name: 'Activate user' })).toHaveTextContent('They will be able to log in again.');
  expect(patch).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Activate', exact: true }));

  await waitFor(() => expect(patch).toHaveBeenCalledWith('/users/33', { activate: true }));
  expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Actions for ravi.shah' }));
  expect(screen.getByRole('menuitem', { name: 'Deactivate' })).toBeInTheDocument();
}, 30_000);

it('validates fields at runtime on blur and enter, and displays formatted debug errors', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [] } });
  const errorWithDebug = new Error('Request failed with status code 500');
  errorWithDebug.response = {
    status: 500,
    data: {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      debug: { code: '22001', message: 'value too long for type character varying(10)' },
    },
  };
  vi.spyOn(api, 'post').mockRejectedValueOnce(errorWithDebug);

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
  const firstNameInput = screen.getByRole('textbox', { name: /First name/ });
  const mobileInput = screen.getByRole('textbox', { name: /Mobile/ });

  // 1. Enter key validation on empty field
  await user.type(firstNameInput, '{enter}');
  expect(screen.getByText('Enter a first name')).toBeInTheDocument();

  // 2. Typing clears error
  await user.type(firstNameInput, 'Priya');
  expect(screen.queryByText('Enter a first name')).not.toBeInTheDocument();

  // 3. Blur validation on invalid phone
  await user.type(mobileInput, '123');
  fireEvent.blur(mobileInput);
  expect(screen.getByText('Enter a valid mobile number for the selected country')).toBeInTheDocument();

  // Fix mobile
  await user.clear(mobileInput);
  await user.type(mobileInput, '9876543210');
  fireEvent.blur(mobileInput);
  expect(screen.queryByText('Enter a valid mobile number for the selected country')).not.toBeInTheDocument();

  // Fill remainder
  await user.type(screen.getByRole('textbox', { name: /Last name/ }), 'Mehta');
  await user.type(screen.getByRole('textbox', { name: /Username/ }), 'priya.mehta');

  // Submit and verify formatted debug error message
  await user.click(screen.getByRole('button', { name: 'Create and issue credential' }));
  expect(await screen.findByText('An unexpected error occurred (22001 | value too long for type character varying(10))')).toBeInTheDocument();
}, 30_000);

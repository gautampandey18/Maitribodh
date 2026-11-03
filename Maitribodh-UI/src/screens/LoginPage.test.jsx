import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { store } from '../store.js';
import LoginPage from './LoginPage.jsx';

afterEach(() => {
  store.dispatch({ type: 'auth/sessionEnded' });
  vi.restoreAllMocks();
});

it('submits credentials and persists the session for refresh', async () => {
  vi.spyOn(api, 'post').mockResolvedValue({
    data: {
      accessToken: 'test-token',
      user: { id: 4, role: 'ADMIN' },
      mustChangePassword: false,
    },
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.type(screen.getByLabelText('Username'), 'admin');
  await user.type(screen.getByLabelText('Password'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => expect(store.getState().auth.accessToken).toBe('test-token'));
  expect(JSON.parse(sessionStorage.getItem('mams.session')).accessToken).toBe('test-token');
  expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'secret123' });
}, 30_000);

it('shows an account deactivated message from the login API', async () => {
  vi.spyOn(api, 'post').mockRejectedValue({
    response: {
      status: 403,
      data: {
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account is deactivated. Contact the administrator to restore access.',
        },
      },
    },
  });
  const user = userEvent.setup();

  render(<Provider store={store}><MemoryRouter><LoginPage /></MemoryRouter></Provider>);
  await user.type(screen.getByLabelText('Username'), 'inactive.user');
  await user.type(screen.getByLabelText('Password'), 'valid-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Your account is deactivated. Contact the administrator to restore access.')).toBeInTheDocument();
  expect(store.getState().auth.accessToken).toBeNull();
}, 30_000);

it('toggles password visibility and provides administrator password assistance', async () => {
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter><LoginPage /></MemoryRouter></Provider>);
  const password = screen.getByLabelText('Password');
  expect(password).toHaveAttribute('type', 'password');
  await user.click(screen.getByRole('button', { name: 'Show password' }));
  expect(password).toHaveAttribute('type', 'text');
  await user.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(password).toHaveAttribute('type', 'password');
  await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
  expect(screen.getByRole('dialog', { name: 'Password assistance' })).toHaveTextContent('Contact your administrator to reset your password.');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
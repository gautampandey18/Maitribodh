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

it('submits credentials and keeps the returned token in memory state', async () => {
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
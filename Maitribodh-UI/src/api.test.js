import { afterEach, expect, it, vi } from 'vitest';
import { api } from './api.js';
import {
  SESSION_IDLE_MS, SESSION_STORAGE_KEY, sessionEnded, sessionStarted, store,
} from './store.js';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.useRealTimers();
});

it('attaches the persisted session token to requests', async () => {
  store.dispatch(sessionStarted({ accessToken: 'active-token', user: { id: 1, role: 'ADMIN' } }));
  const adapter = vi.fn(async (config) => ({ data: {}, status: 200, headers: {}, config }));
  await api.get('/dashboard', { adapter });
  expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer active-token');
});

it('ends idle sessions before sending another protected request', async () => {
  vi.useFakeTimers();
  store.dispatch(sessionStarted({ accessToken: 'idle-token', user: { id: 1, role: 'ADMIN' } }));
  vi.setSystemTime(Date.now() + SESSION_IDLE_MS);
  const adapter = vi.fn();
  await expect(api.get('/dashboard', { adapter })).rejects.toThrow('Session ended');
  expect(adapter).not.toHaveBeenCalled();
  expect(store.getState().auth.logoutReason).toBe('inactive');
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
});

it('clears persisted credentials when the server rejects the current session', async () => {
  store.dispatch(sessionStarted({ accessToken: 'revoked-token', user: { id: 1, role: 'ADMIN' } }));
  const adapter = async (config) => {
    throw { response: { status: 401 }, config };
  };
  await expect(api.get('/dashboard', { adapter })).rejects.toMatchObject({ response: { status: 401 } });
  expect(store.getState().auth.accessToken).toBeNull();
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
});

it('does not let a late 401 response log out a newly signed-in session', async () => {
  store.dispatch(sessionStarted({ accessToken: 'old-token', user: { id: 1, role: 'ADMIN' } }));
  let rejectOldRequest;
  const pending = api.get('/dashboard', {
    adapter: (config) => new Promise((_resolve, reject) => {
      rejectOldRequest = () => reject({ response: { status: 401 }, config });
    }),
  });
  await vi.waitFor(() => expect(rejectOldRequest).toBeTypeOf('function'));
  store.dispatch(sessionStarted({ accessToken: 'new-token', user: { id: 1, role: 'ADMIN' } }));
  rejectOldRequest();
  await expect(pending).rejects.toMatchObject({ response: { status: 401 } });
  expect(store.getState().auth.accessToken).toBe('new-token');
});

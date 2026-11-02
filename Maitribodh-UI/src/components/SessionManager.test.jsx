import { Provider } from 'react-redux';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import {
  createAppStore, passwordChanged, SESSION_IDLE_MS, SESSION_MAX_AGE_MS,
  SESSION_STORAGE_KEY, sessionEnded, sessionStarted,
} from '../store.js';
import SessionManager from './SessionManager.jsx';

const login = {
  accessToken: 'session-token',
  expiresIn: 7200,
  user: { id: 4, role: 'ADMIN' },
  mustChangePassword: true,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-02T10:00:00Z'));
  window.sessionStorage.clear();
  vi.spyOn(api, 'post').mockResolvedValue({ status: 204 });
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function startSession() {
  const store = createAppStore();
  store.dispatch(sessionStarted(login));
  render(<Provider store={store}><SessionManager /></Provider>);
  return store;
}

it('restores login and password-change state after refresh without resetting deadlines', () => {
  const store = startSession();
  const original = store.getState().auth;
  act(() => vi.advanceTimersByTime(20 * 60 * 1000));

  const restored = createAppStore();
  expect(restored.getState().auth).toEqual(original);
  expect(restored.getState().auth.mustChangePassword).toBe(true);
});

it('logs out at exactly 30 minutes idle and revokes the captured token', () => {
  const store = startSession();
  act(() => vi.advanceTimersByTime(SESSION_IDLE_MS - 1));
  expect(store.getState().auth.accessToken).toBe('session-token');
  act(() => vi.advanceTimersByTime(1));
  expect(store.getState().auth.accessToken).toBeNull();
  expect(store.getState().auth.logoutReason).toBe('inactive');
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    '/auth/logout', {}, { headers: { Authorization: 'Bearer session-token' } },
  );
});

it.each(['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'])(
  '%s extends inactivity but not the absolute session deadline',
  (event) => {
    const store = startSession();
    const expiresAt = store.getState().auth.expiresAt;
    act(() => vi.advanceTimersByTime(20 * 60 * 1000));
    fireEvent(window, new Event(event));
    act(() => vi.advanceTimersByTime(20 * 60 * 1000));
    expect(store.getState().auth.accessToken).toBe('session-token');
    expect(store.getState().auth.expiresAt).toBe(expiresAt);
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    expect(store.getState().auth.logoutReason).toBe('inactive');
  },
);

it('ends an actively used session at exactly two hours', () => {
  const store = startSession();
  for (let i = 0; i < 5; i += 1) {
    act(() => vi.advanceTimersByTime(20 * 60 * 1000));
    fireEvent.keyDown(window, { key: 'a' });
  }
  act(() => vi.advanceTimersByTime(20 * 60 * 1000 - 1));
  expect(store.getState().auth.accessToken).toBe('session-token');
  act(() => vi.advanceTimersByTime(1));
  expect(store.getState().auth.logoutReason).toBe('expired');
  expect(api.post).not.toHaveBeenCalled();
});

it('refresh after the idle deadline does not restore an expired session', () => {
  const store = createAppStore();
  store.dispatch(sessionStarted(login));
  vi.setSystemTime(Date.now() + SESSION_IDLE_MS);
  const restored = createAppStore();
  expect(restored.getState().auth.accessToken).toBeNull();
  expect(restored.getState().auth.logoutReason).toBe('inactive');
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
});

it('refresh after the absolute deadline does not restore an expired session', () => {
  const store = createAppStore();
  store.dispatch(sessionStarted(login));
  vi.setSystemTime(Date.now() + SESSION_MAX_AGE_MS);
  expect(createAppStore().getState().auth.logoutReason).toBe('expired');
});

it.each(['focus', 'pageshow', 'visibilitychange', 'keydown'])(
  'checks elapsed wall time on %s after the browser was suspended',
  (event) => {
    const store = startSession();
    vi.setSystemTime(Date.now() + SESSION_IDLE_MS);
    fireEvent(event === 'visibilitychange' ? document : window, new Event(event));
    expect(store.getState().auth.logoutReason).toBe('inactive');
  },
);

it('does not count background requests as user activity', () => {
  const store = startSession();
  act(() => vi.advanceTimersByTime(20 * 60 * 1000));
  fireEvent(window, new Event('load'));
  act(() => vi.advanceTimersByTime(10 * 60 * 1000));
  expect(store.getState().auth.logoutReason).toBe('inactive');
});

it.each([sessionEnded, passwordChanged])('clears persistence on $type', (endSession) => {
  const store = startSession();
  act(() => store.dispatch(endSession()));
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  expect(createAppStore().getState().auth.accessToken).toBeNull();
});

it('discards malformed saved sessions and logs the failure', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  sessionStorage.setItem(SESSION_STORAGE_KEY, '{bad-json');
  expect(createAppStore().getState().auth.accessToken).toBeNull();
  expect(warn).toHaveBeenCalled();
  expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
});

it('cleans up timers on unmount', () => {
  const store = startSession();
  cleanup();
  act(() => vi.advanceTimersByTime(SESSION_IDLE_MS));
  expect(store.getState().auth.accessToken).toBe('session-token');
  expect(api.post).not.toHaveBeenCalled();
});

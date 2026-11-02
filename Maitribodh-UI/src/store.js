import { configureStore, createSlice } from '@reduxjs/toolkit';

export const SESSION_STORAGE_KEY = 'mams.session';
export const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
const emptySession = {
  accessToken: null, user: null, mustChangePassword: false,
  expiresAt: null, lastActivityAt: null, logoutReason: null,
};

/**
 * Checks absolute and inactivity deadlines without extending either on refresh.
 * @param {object} session Current authentication state.
 * @param {number} now Current timestamp in milliseconds.
 * @returns {string|null} Logout reason, or null while the session is valid.
 */
export function getSessionEndReason(session, now = Date.now()) {
  if (!session.accessToken) return null;
  if (now >= session.expiresAt) return 'expired';
  if (now >= session.lastActivityAt + SESSION_IDLE_MS) return 'inactive';
  return null;
}

function restoreSession(storage) {
  try {
    const saved = storage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return emptySession;
    const session = JSON.parse(saved);
    if (typeof session?.accessToken !== 'string' || !session.accessToken
      || !session.user || typeof session.user.role !== 'string'
      || !Number.isFinite(session.expiresAt) || !Number.isFinite(session.lastActivityAt)
      || session.expiresAt > Date.now() + SESSION_MAX_AGE_MS
      || session.lastActivityAt > Date.now()) {
      throw new Error('Invalid saved session');
    }
    const reason = getSessionEndReason(session);
    if (reason) {
      storage.removeItem(SESSION_STORAGE_KEY);
      return { ...emptySession, logoutReason: reason };
    }
    return { ...emptySession, ...session };
  } catch (error) {
    console.warn('Could not restore the saved session. Please sign in again.', error);
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
    } catch (cleanupError) {
      console.warn('Could not remove the invalid saved session.', cleanupError);
    }
    return emptySession;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: emptySession,
  reducers: {
    sessionStarted: {
      prepare(session) {
        const now = Date.now();
        const lifetime = Number.isFinite(session.expiresIn) && session.expiresIn > 0
          ? Math.min(session.expiresIn * 1000, SESSION_MAX_AGE_MS)
          : SESSION_MAX_AGE_MS;
        return { payload: {
          accessToken: session.accessToken,
          user: session.user,
          mustChangePassword: session.mustChangePassword === true,
          expiresAt: now + lifetime,
          lastActivityAt: now,
        } };
      },
      reducer(_state, action) {
        return { ...emptySession, ...action.payload };
      },
    },
    sessionActivity(state, action) {
      if (state.accessToken && !getSessionEndReason(state, action.payload)) {
        state.lastActivityAt = action.payload;
      }
    },
    passwordChanged() {
      return emptySession;
    },
    sessionEnded(_state, action) {
      return { ...emptySession, logoutReason: action.payload ?? null };
    },
  },
});

export const { sessionStarted, sessionActivity, passwordChanged, sessionEnded } = authSlice.actions;

/**
 * Restores and persists a tab's session, including its original timeout deadlines.
 * @param {Storage} storage Browser session storage.
 * @returns {object} Application Redux store.
 */
export function createAppStore(storage = window.sessionStorage) {
  const appStore = configureStore({
    reducer: { auth: authSlice.reducer },
    preloadedState: { auth: restoreSession(storage) },
  });
  let previous = appStore.getState().auth;
  appStore.subscribe(() => {
    const auth = appStore.getState().auth;
    if (auth === previous) return;
    previous = auth;
    try {
      if (auth.accessToken) {
        storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth));
      } else {
        storage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Could not save the session. Refreshing may require signing in again.', error);
    }
  });
  return appStore;
}

export const store = createAppStore();
import { useEffect } from 'react';
import { useSelector, useStore } from 'react-redux';
import { api } from '../api.js';
import { getSessionEndReason, SESSION_IDLE_MS, sessionActivity, sessionEnded } from '../store.js';

/**
 * Enforces session deadlines on interaction, timer expiry, and return from a suspended tab.
 * Background requests do not count as user activity.
 * @returns {null} No visible content.
 */
export default function SessionManager() {
  const store = useStore();
  const token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!token) return undefined;
    let timer;
    let ended = false;
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];

    function checkSession(activity = false) {
      if (ended) return;
      window.clearTimeout(timer);
      const auth = store.getState().auth;
      if (auth.accessToken !== token) return;
      const now = Date.now();
      const reason = getSessionEndReason(auth, now);
      if (reason) {
        ended = true;
        store.dispatch(sessionEnded(reason));
        if (reason === 'inactive') {
          // Keep the captured token: local credentials are cleared before this request runs.
          api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
            .catch((error) => console.warn('Automatic logout could not revoke the server session.', error));
        }
        return;
      }
      if (activity) store.dispatch(sessionActivity(now));
      const current = store.getState().auth;
      timer = window.setTimeout(
        () => checkSession(),
        current.lastActivityAt + SESSION_IDLE_MS - now,
      );
    }

    function onActivity() {
      if (document.visibilityState === 'visible') checkSession(true);
    }

    function onResume() {
      checkSession();
    }

    activityEvents.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    window.addEventListener('pageshow', onResume);
    checkSession();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
    };
  }, [store, token]);

  return null;
}

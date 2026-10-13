import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { accessToken: null, user: null, mustChangePassword: false },
  reducers: {
    sessionStarted(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.mustChangePassword = action.payload.mustChangePassword === true;
    },
    passwordChanged(state) {
      state.accessToken = null;
      state.user = null;
      state.mustChangePassword = false;
    },
    sessionEnded(state) {
      state.accessToken = null;
      state.user = null;
      state.mustChangePassword = false;
    },
  },
});

export const { sessionStarted, passwordChanged, sessionEnded } = authSlice.actions;

export const store = configureStore({
  reducer: { auth: authSlice.reducer },
});
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { sessionEnded, sessionStarted, store } from './store.js';
import App from './App.jsx';

vi.mock('@mui/material', async (importOriginal) => ({
  ...await importOriginal(), useMediaQuery: () => true,
}));
vi.mock('./screens/ApprovalsPage.jsx', () => ({ default: () => <h1>Approval workspace</h1> }));
vi.mock('./screens/GatePage.jsx', () => ({ default: () => <h1>Security workspace</h1> }));
vi.mock('./screens/DashboardPage.jsx', () => ({ default: () => <h1>Dashboard workspace</h1> }));
vi.mock('./screens/ActivityPage.jsx', () => ({
  default: () => <h1>Activity workspace</h1>,
  NotificationsBell: () => null,
}));

afterEach(() => {
  store.dispatch(sessionEnded());
});

it('shows and opens both Approval Center and Security Gate for a multi-role account', async () => {
  store.dispatch(sessionStarted({
    accessToken: 'multi-role-token',
    user: { id: 7, role: 'APPROVER', roles: ['APPROVER', 'SECURITY_GUARD'] },
  }));
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter initialEntries={['/approvals']}><App /></MemoryRouter></Provider>);

  expect(await screen.findByRole('heading', { name: 'Approval workspace' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Approval Center' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Security Gate' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'User Management' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Master Data' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Security Gate' }));
  expect(await screen.findByRole('heading', { name: 'Security workspace' })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Approval Center' }));
  expect(await screen.findByRole('heading', { name: 'Approval workspace' })).toBeInTheDocument();
});

it('blocks direct navigation to an unassigned role screen', async () => {
  store.dispatch(sessionStarted({
    accessToken: 'multi-role-token',
    user: { id: 7, role: 'APPROVER', roles: ['APPROVER', 'SECURITY_GUARD'] },
  }));
  render(<Provider store={store}><MemoryRouter initialEntries={['/users']}><App /></MemoryRouter></Provider>);
  expect(await screen.findByRole('heading', { name: 'Dashboard workspace' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'User Management' })).not.toBeInTheDocument();
});

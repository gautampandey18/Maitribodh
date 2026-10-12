import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import ApprovalsPage from './ApprovalsPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('loads pending registrations and submits an approval after confirmation', async () => {
  vi.spyOn(api, 'get')
    .mockResolvedValueOnce({
      data: {
      items: [{
        person_id: 12,
        person_code: 'MB-000012',
        name: 'Asha Patel',
        category: 'Visitor',
        has_photo: true,
        submitted_at: '2026-10-09T09:30:00Z',
      }],
        total: 1,
      },
    })
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'ACTIVE' } });
  store.dispatch(sessionStarted({ accessToken: 'test-token', user: { id: 4, role: 'ADMIN' } }));

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Approve Asha Patel' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/approvals/12/decisions', { decision: 'APPROVE' }));
  expect(await screen.findByText('No registrations are waiting for approval.')).toBeInTheDocument();
}, 30_000);

it('requires a ten-character rejection reason before submission', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      items: [{
        person_id: 19,
        person_code: 'MB-000019',
        name: 'Ravi Shah',
        category: 'Staff',
        has_photo: false,
        submitted_at: '2026-10-09T09:30:00Z',
      }],
    },
  });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'REJECTED' } });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>
    </Provider>,
  );

  await userEvent.click(await screen.findByRole('button', { name: 'Reject Ravi Shah' }));
  const confirm = screen.getByRole('button', { name: 'Confirm rejection' });
  expect(confirm).toBeDisabled();
  const reasonField = screen.getByRole('textbox', { name: /Reason for rejection/ });
  await userEvent.type(reasonField, 'Too short');
  expect(confirm).toBeDisabled();
  await userEvent.type(reasonField, ' reason');
  expect(confirm).toBeEnabled();
  await userEvent.click(confirm);

  await waitFor(() => expect(post).toHaveBeenCalledWith('/approvals/19/decisions', {
    decision: 'REJECT',
    reason: 'Too short reason',
  }));
}, 30_000);
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
  expect(await screen.findByText('No registrations are waiting for approval.')).toHaveClass('approval-empty-state');
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

it('rejects an approved registration with a reason', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 27, person_code: 'MB-000027', name: 'Mira Shah', category: 'Staff', has_photo: true, submitted_at: '2026-10-09T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    })
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'REJECTED' } });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(await screen.findByRole('tab', { name: 'Approved' }));
  expect(await screen.findByText('Mira Shah')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reject' }));
  await user.type(screen.getByRole('textbox', { name: /Reason for rejection/ }), 'Approval was made in error');
  await user.click(screen.getByRole('button', { name: 'Confirm rejection' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/approvals/27/decisions', {
    decision: 'REJECT',
    reason: 'Approval was made in error',
  }));
  expect(get).toHaveBeenLastCalledWith('/approvals', { params: { status: 'ACTIVE', page: 1, pageSize: 5 } });
}, 30_000);

it('resubmits a rejected registration and shows it in Pending Registration', async () => {
  const get = vi.spyOn(api, 'get')
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 31, person_code: 'MB-000031', name: 'Nita Rao', category: 'Visitor', has_photo: true, submitted_at: '2026-10-09T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    })
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 5 } })
    .mockResolvedValueOnce({
      data: {
        items: [{ person_id: 31, person_code: 'MB-000031', name: 'Nita Rao', category: 'Visitor', has_photo: true, submitted_at: '2026-10-12T09:30:00Z' }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'PENDING' } });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>
    </Provider>,
  );

  await user.click(await screen.findByRole('tab', { name: 'Rejected' }));
  expect(await screen.findByText('Nita Rao')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Resubmit' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/31/resubmissions'));
  expect(await screen.findByText('Registration resubmitted for approval')).toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Pending Registration' }));
  expect(await screen.findByText('Nita Rao')).toBeInTheDocument();
  expect(get).toHaveBeenLastCalledWith('/approvals', { params: { status: 'PENDING', page: 1, pageSize: 5 } });
}, 30_000);

it('filters pending, approved, and rejected registrations by name and category', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: { items: [], total: 0, page: 1, pageSize: 5 },
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>
    </Provider>,
  );

  await screen.findByRole('textbox', { name: 'Name' });
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Asha');
  await user.type(screen.getByRole('textbox', { name: 'Category' }), 'Staff');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/approvals', {
    params: { status: 'PENDING', page: 1, pageSize: 5, name: 'Asha', category: 'Staff' },
  }));

  await user.click(screen.getByRole('tab', { name: 'Approved' }));
  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/approvals', {
    params: { status: 'ACTIVE', page: 1, pageSize: 5, name: 'Asha', category: 'Staff' },
  }));

  await user.click(screen.getByRole('tab', { name: 'Rejected' }));
  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/approvals', {
    params: { status: 'REJECTED', page: 1, pageSize: 5, name: 'Asha', category: 'Staff' },
  }));
}, 30_000);
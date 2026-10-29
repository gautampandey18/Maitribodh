import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import ActivityPage, { NotificationsBell } from './ActivityPage.jsx';

afterEach(() => vi.restoreAllMocks());

it('opens notifications from the top and toggles closed from the bell', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: {
    unreadCount: 1,
    items: [{ notification_id: 4, title: 'Visitor registered', body: 'A new visitor is waiting for review.', created_at: '2026-10-26T10:00:00.000Z', is_read: false }],
  } });
  const user = userEvent.setup();
  render(<NotificationsBell />);

  const bell = screen.getByRole('button', { name: 'Open notifications' });
  await user.click(bell);
  const panel = await screen.findByRole('dialog', { name: 'Notification' });
  expect(panel).toHaveAttribute('aria-modal', 'true');
  expect(document.body).toHaveClass('notifications-panel-open');
  expect(await screen.findByText('Visitor registered')).toBeInTheDocument();
  expect(screen.getByLabelText('Unread')).toBeInTheDocument();
  expect(document.querySelector('.notification-panel')).toHaveStyle({ width: 'min(420px, calc(100vw - 24px))' });
  expect(screen.getByRole('button', { name: 'View all notifications' })).toBeInTheDocument();
  expect(document.querySelector('.notification-drawer')).toHaveClass('MuiDrawer-anchorTop');

  const toggleBell = document.querySelector('[aria-controls="notification-panel"]');
  expect(toggleBell).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(toggleBell);
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Notification' })).not.toBeInTheDocument());
  expect(toggleBell).toHaveAttribute('aria-expanded', 'false');
  expect(document.body).not.toHaveClass('notifications-panel-open');
});

it('summarizes audit values in the table and preserves full values in the detail drawer', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      items: [{
        audit_id: 1,
        occurred_at: '2026-10-10T10:00:00.000Z',
        actor: 'approver',
        activity: 'APPROVED',
        module: 'APPROVAL',
        entity: 'Person MB-000010',
        person_mobile: '9876543210',
        old_value: { status: 'PENDING' },
        new_value: { status: 'ACTIVE', reason: null, qr_version: 1, approved_by: 7 },
      }],
      total: 1,
      users: [],
      actions: [],
    },
  });

  render(<ActivityPage />);

  const summaryText = (expected) => (_, element) => element?.tagName === 'DIV'
    && element.children.length === 1
    && element.firstElementChild.tagName === 'STRONG'
    && element.textContent.trim() === expected;
  expect(await screen.findByText(summaryText('Status: PENDING'))).toBeInTheDocument();
  expect(screen.getByText(summaryText('Status: ACTIVE'))).toBeInTheDocument();
  expect(screen.getByText(summaryText('Reason: —'))).toBeInTheDocument();
  expect(screen.getByText('9876543210')).toBeInTheDocument();
  expect(screen.getByText('+1 more fields')).toBeInTheDocument();
  expect(screen.queryByText('{"status":"PENDING"}')).not.toBeInTheDocument();
  const panel = screen.getByRole('region', { name: 'Audit records' });
  expect(panel).toHaveClass('table-panel', 'audit-panel');
  expect(panel).toContainElement(screen.getByRole('group', { name: 'Audit filters' }));
  expect(within(panel).getByRole('table', { name: 'Audit log' })).toHaveClass('audit-table');
  expect(screen.getByText('APPROVED')).toHaveClass('audit-action-badge');
  expect(screen.getByText('APPROVAL')).toHaveClass('audit-module-badge');

  await userEvent.click(screen.getByText(summaryText('Status: PENDING')));
  expect(screen.getByText('Audit Detail')).toBeInTheDocument();
  expect(screen.getByText((_, element) => element?.tagName === 'PRE' && element.textContent.includes('"status": "PENDING"'))).toBeInTheDocument();
});

it('sends free-text search changes to the audit API', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => {
    const params = new URL(path, 'http://localhost').searchParams;
    const query = params.get('query') ?? '';
    return Promise.resolve({ data: {
      items: query ? [{ audit_id: 2, occurred_at: '2026-10-10T10:00:00.000Z', actor: 'security.user', activity: 'CHECK_IN', module: 'GATE', entity: 'Person MB-000012', person_mobile: '9876543210', old_value: null, new_value: null }] : [],
      total: query ? 1 : 0,
      users: [],
      actions: [],
      page: Number(params.get('page')),
      pageSize: Number(params.get('pageSize')),
    } });
  });
  const user = userEvent.setup();
  render(<ActivityPage />);

  await waitFor(() => expect(get).toHaveBeenCalledWith('/audit?page=1&pageSize=5&query=', expect.objectContaining({ signal: expect.any(AbortSignal) })));
  await user.type(screen.getByRole('textbox', { name: 'Search entry or mobile number' }), '9876543210');

  expect(await screen.findByText('CHECK_IN')).toBeInTheDocument();
  expect(screen.getByText('9876543210')).toBeInTheDocument();
  await waitFor(() => expect(get).toHaveBeenLastCalledWith('/audit?page=1&pageSize=5&query=9876543210', expect.objectContaining({ signal: expect.any(AbortSignal) })));
  await user.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByRole('textbox', { name: 'Search entry or mobile number' })).toHaveValue('');
  expect(await screen.findByText('No audit records match the selected filters.')).toBeInTheDocument();
});

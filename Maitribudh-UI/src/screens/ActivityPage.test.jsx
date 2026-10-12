import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import ActivityPage from './ActivityPage.jsx';

afterEach(() => vi.restoreAllMocks());

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
});

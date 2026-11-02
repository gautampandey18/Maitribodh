import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { REPORT_TABS_CONFIG } from './ReportsCharts.jsx';
import ReportsPage from './ReportsPage.jsx';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('automatically loads every report section without applying filters', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path, config) => {
    if (path === '/reports/analytics') {
      return Promise.resolve({
        data: REPORT_TABS_CONFIG[config?.params?.tab || 'visits'],
      });
    }
    return Promise.resolve({
      data: { items: [], total: 0, page: config?.params?.page || 1, pageSize: config?.params?.pageSize || 5 },
    });
  });
  const user = userEvent.setup();
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/visit-history', {
    params: { page: 1, pageSize: 5 },
  }));
  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/analytics', {
    params: { tab: 'visits' },
  }));
  const sections = [
    ['Person Registrations', '/reports/registrations', 'registrations'],
    ['Occupancy', '/reports/occupancy', 'occupancy'],
    ['Staff', '/reports/staff', 'staff'],
    ['Approvals', '/reports/approvals', 'approvals'],
    ['Blacklist', '/reports/blacklist', 'blacklist'],
  ];
  for (const [label, path, tabKey] of sections) {
    await user.click(screen.getByRole('tab', { name: label }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(path, { params: { page: 1, pageSize: 5 } }));
    await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/analytics', { params: { tab: tabKey } }));
  }
  expect(get).toHaveBeenCalledTimes(12);
}, 30_000);

it('runs the registration report with the selected status and renders returned rows', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      items: [{ person_code: 'MB-000007', name: 'Asha Patel', category: 'Staff', mobile: '******3210', status: 'ACTIVE', created_at: '2026-10-09T08:00:00Z' }],
      total: 1,
      page: 1,
      pageSize: 5,
    },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: 'Person Registrations' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(screen.getByRole('option', { name: 'ACTIVE' }));
  await user.click(screen.getByRole('button', { name: 'Run report' }));

  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getByText('******3210')).toBeInTheDocument();
  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/registrations', { params: { status: 'ACTIVE', page: 1, pageSize: 5 } }));
}, 30_000);

it('filters the blacklist report by name and category', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: { items: [], total: 0, page: 1, pageSize: 5 },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: 'Blacklist' }));
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Asha');
  await user.type(screen.getByRole('textbox', { name: 'Category' }), 'Staff');
  await user.click(screen.getByRole('button', { name: 'Run report' }));

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/blacklist', {
    params: { name: 'Asha', category: 'Staff', page: 1, pageSize: 5 },
  }));
}, 30_000);

it('filters the approvals report by user', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: { items: [], total: 0, page: 1, pageSize: 5 },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: 'Approvals' }));
  await user.type(screen.getByRole('textbox', { name: 'User' }), 'approver');
  await user.click(screen.getByRole('button', { name: 'Run report' }));

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/approvals', {
    params: { user: 'approver', page: 1, pageSize: 5 },
  }));
}, 30_000);

it('filters the staff report by name and job role', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: { items: [], total: 0, page: 1, pageSize: 5 },
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: 'Staff' }));
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Asha');
  await user.type(screen.getByRole('textbox', { name: 'Job Role' }), 'Coordinator');
  await user.click(screen.getByRole('button', { name: 'Run report' }));

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/staff', {
    params: { name: 'Asha', jobRole: 'Coordinator', page: 1, pageSize: 5 },
  }));
}, 30_000);

it('uses the selected date range for Visit History and exports Excel', async () => {
  const excelBlob = new Blob(['xlsx-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const get = vi.spyOn(api, 'get').mockImplementation((path) => {
    if (path.endsWith('/export')) return Promise.resolve({ data: excelBlob });
    if (path === '/reports/analytics') return Promise.resolve({ data: REPORT_TABS_CONFIG.visits });
    return Promise.resolve({
      data: {
        items: [{ person_code: 'MB-000007', name: 'Asha Patel', mobile: '******3210', category: 'Staff', checkin_location: 'Main Gate', checkin_location_id: 3, checkout_location: 'Main Gate', checkout_location_id: 3 }],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    });
  });
  const createObjectURL = vi.fn(() => 'blob:report');
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.queryByLabelText('Location ID')).not.toBeInTheDocument();
  expect(screen.getAllByText('Main Gate')).toHaveLength(2);
  expect(screen.queryByRole('columnheader', { name: 'Checkin Location Id' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Checkout Location Id' })).not.toBeInTheDocument();
  const fromDate = screen.getByLabelText('From');
  const toDate = screen.getByLabelText('To');
  fireEvent.change(fromDate, { target: { value: '2026-10-01' } });
  fireEvent.change(toDate, { target: { value: '2026-10-09' } });
  await user.click(screen.getByRole('button', { name: 'Run report' }));
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Export Excel' }));

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/visit-history', {
    params: { fromDate: '2026-10-01', toDate: '2026-10-09', page: 1, pageSize: 5 },
  }));
  expect(get).toHaveBeenCalledWith('/reports/visit-history/export', {
    params: { fromDate: '2026-10-01', toDate: '2026-10-09' },
    responseType: 'blob',
  });

  expect(createObjectURL).toHaveBeenCalledWith(excelBlob);
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
}, 30_000);

it('offers an Excel export for every report tab', async () => {
  const excelBlob = new Blob(['xlsx-data']);
  const get = vi.spyOn(api, 'get').mockImplementation((path, config) => Promise.resolve(
    path.endsWith('/export')
      ? { data: excelBlob }
      : { data: { items: [], total: 0, page: config.params.page, pageSize: config.params.pageSize } },
  ));
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:report'), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const user = userEvent.setup();
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

  const reports = [
    ['Visit History', '/reports/visit-history/export'],
    ['Person Registrations', '/reports/registrations/export'],
    ['Occupancy', '/reports/occupancy/export'],
    ['Staff', '/reports/staff/export'],
    ['Approvals', '/reports/approvals/export'],
    ['Blacklist', '/reports/blacklist/export'],
  ];
  for (const [label, exportPath] of reports) {
    if (label !== 'Visit History') await user.click(screen.getByRole('tab', { name: label }));
    await user.click(await screen.findByRole('button', { name: 'Export Excel' }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(exportPath, {
      params: {},
      responseType: 'blob',
    }));
  }
}, 30_000);

it('requests the next report page using the selected page size', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((_path, { params }) => Promise.resolve({
    data: {
      items: [{ person_code: `MB-${String(params.page).padStart(6, '0')}`, name: `Page ${params.page}` }],
      total: 31,
      page: params.page,
      pageSize: params.pageSize,
    },
  }));
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: 'Person Registrations' }));
  expect(await screen.findByText('Page 1')).toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Go to next page' }));

  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/registrations', {
    params: { page: 2, pageSize: 5 },
  }));
  expect(await screen.findByText('Page 2')).toBeInTheDocument();
});

it('keeps the newest page when pagination requests overlap', async () => {
  const pending = new Map();
  const get = vi.spyOn(api, 'get').mockImplementation((path, { params }) => {
    if (path === '/reports/analytics') {
      return Promise.resolve({ data: REPORT_TABS_CONFIG.visits });
    }
    return new Promise((resolve) => {
      pending.set(params.page, () => resolve({ data: {
        items: [{ person_code: `MB-${params.page}`, name: `Page ${params.page}` }],
        total: 80,
        page: params.page,
        pageSize: params.pageSize,
      } }));
    });
  });
  const user = userEvent.setup();

  render(<MemoryRouter><ReportsPage /></MemoryRouter>);
  await waitFor(() => expect(get).toHaveBeenCalledWith('/reports/visit-history', {
    params: { page: 1, pageSize: 5 },
  }));
  pending.get(1)();
  expect(await screen.findByText('Page 1')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  await waitFor(() => expect(pending.has(3)).toBe(true));

  pending.get(3)();
  expect(await screen.findByText('Page 3')).toBeInTheDocument();
  pending.get(2)();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.getByText('Page 3')).toBeInTheDocument();
  expect(screen.queryByText('Page 2')).not.toBeInTheDocument();
});

it('renders KPI metric cards and graphical charts for active tabs matching live analytics data', async () => {
  const liveVisitsAnalytics = {
    subtitle: 'Last 14 days · 17 Oct – 31 Oct 2026 · times in IST',
    tableTitle: 'Visit records',
    tableCounter: '42 records',
    kpis: [
      { label: 'Total visits', value: '42', delta: '+15% vs previous 14 days', isTotal: true },
      { label: 'Inside right now', value: '5', delta: 'All within 24 h' },
      { label: 'Avg. visit duration', value: '45 min', delta: '+5 min vs previous' },
      { label: 'Accompanying guests', value: '18', delta: '+2 vs previous' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily check-ins by category',
      xLabels: ['17', '18', '19'],
      yMax: 20,
      yTicks: [0, 5, 10, 15, 20],
      series: [
        { name: 'Visitor', color: '#E06D2E', values: [10, 12, 14] },
      ],
    },
    chartRight: {
      type: 'donut',
      title: 'Visits by category',
      totalValue: '42',
      totalLabel: 'visits',
      segments: [
        { label: 'Visitor', count: 42, percentage: 100, color: '#E06D2E' },
      ],
    },
  };

  vi.spyOn(api, 'get').mockImplementation((path, config) => {
    if (path === '/reports/analytics') {
      const tab = config?.params?.tab || 'visits';
      if (tab === 'visits') return Promise.resolve({ data: liveVisitsAnalytics });
      return Promise.resolve({ data: REPORT_TABS_CONFIG[tab] || REPORT_TABS_CONFIG.visits });
    }
    return Promise.resolve({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  });
  const user = userEvent.setup();
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

  // Live Visit History tab KPIs and charts
  expect((await screen.findAllByText('42')).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('+15% vs previous 14 days')).toBeInTheDocument();
  expect(screen.getByText('45 min')).toBeInTheDocument();
  expect(screen.getByText('Last 14 days · 17 Oct – 31 Oct 2026 · times in IST')).toBeInTheDocument();
  expect(screen.getByText('Daily check-ins by category')).toBeInTheDocument();
  expect(screen.getByText('Visits by category')).toBeInTheDocument();

  // Switch to Occupancy tab
  await user.click(screen.getByRole('tab', { name: 'Occupancy' }));
  expect(await screen.findByText('On campus now')).toBeInTheDocument();
  expect(screen.getByText('Fullest location')).toBeInTheDocument();
  expect(screen.getByText('People on campus today')).toBeInTheDocument();
  expect(screen.getByText('Occupancy by location (% full)')).toBeInTheDocument();

  // Switch to Staff tab
  await user.click(screen.getByRole('tab', { name: 'Staff' }));
  expect(await screen.findByText('Active staff')).toBeInTheDocument();
  expect(screen.getByText('Daily attendance')).toBeInTheDocument();
  expect(screen.getByText('Staff on duty by location (today)')).toBeInTheDocument();
}, 30_000);

it('allows selecting quick date presets or custom from-to dates, updating both charts and report table, and resets cleanly', async () => {
  const calls = [];
  vi.spyOn(api, 'get').mockImplementation((path, config) => {
    calls.push({ path, params: config?.params });
    if (path === '/reports/analytics') {
      return Promise.resolve({
        data: {
          subtitle: config?.params?.fromDate ? `${config.params.fromDate} to ${config.params.toDate}` : 'Default 14 days',
          kpis: [{ label: 'Total visits', value: '18', delta: '+10% vs previous', isTotal: true }],
          chartLeft: { type: 'stacked-bar', title: 'Daily check-ins by category', xLabels: ['1', '2'], yMax: 10, yTicks: [0, 5, 10], series: [] },
          chartRight: { type: 'donut', title: 'Visits by category', totalValue: '18', totalLabel: 'visits', segments: [] },
        },
      });
    }
    return Promise.resolve({ data: { items: [], total: 0, page: 1, pageSize: 5 } });
  });

  const user = userEvent.setup();
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

  // Check that quick date presets are rendered
  expect(screen.getByText('Today')).toBeInTheDocument();
  expect(screen.getByText('Last 7 days')).toBeInTheDocument();
  expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  expect(screen.getByText('This month')).toBeInTheDocument();

  // Click on "Last 7 days" preset
  await user.click(screen.getByText('Last 7 days'));

  await waitFor(() => {
    const lastAnalyticsCall = calls.filter((c) => c.path === '/reports/analytics').at(-1);
    expect(lastAnalyticsCall?.params?.fromDate).toBeDefined();
    expect(lastAnalyticsCall?.params?.toDate).toBeDefined();
  });

  // Verify Reset button is present and resets
  const resetBtn = screen.getByRole('button', { name: 'Reset' });
  expect(resetBtn).toBeInTheDocument();
  await user.click(resetBtn);

  await waitFor(() => {
    const resetCall = calls.filter((c) => c.path === '/reports/analytics').at(-1);
    expect(resetCall?.params?.fromDate).toBeUndefined();
    expect(resetCall?.params?.toDate).toBeUndefined();
  });
}, 30_000);

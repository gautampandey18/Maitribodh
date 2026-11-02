import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { api } from '../api.js';
import { requestMessage } from '../utils/resources.js';
import { REPORT_TABS_CONFIG, ReportChartsSection } from './ReportsCharts.jsx';

function getIstToday() {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  return formatter.format(new Date());
}

function getDateNDaysAgo(days) {
  const today = getIstToday();
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const today = getIstToday();
  const [y, m] = today.split('-');
  return `${y}-${m}-01`;
}

const datePresets = [
  { label: 'Today', getRange: () => { const t = getIstToday(); return { from: t, to: t }; } },
  { label: 'Last 7 days', getRange: () => ({ from: getDateNDaysAgo(7), to: getIstToday() }) },
  { label: 'Last 14 days', getRange: () => ({ from: getDateNDaysAgo(14), to: getIstToday() }) },
  { label: 'Last 30 days', getRange: () => ({ from: getDateNDaysAgo(30), to: getIstToday() }) },
  { label: 'This month', getRange: () => ({ from: getFirstDayOfMonth(), to: getIstToday() }) },
];

const reports = [
  { key: 'visits', title: 'Visit History', path: '/reports/visit-history', category: true, location: true },
  {
    key: 'registrations',
    title: 'Person Registrations',
    path: '/reports/registrations',
    category: true,
    status: true,
    dateHint: 'Dates filter by registration date.',
  },
  {
    key: 'occupancy',
    title: 'Occupancy',
    path: '/reports/occupancy',
    dateHint: 'Charts show the To date; the table lists check-ins in the range.',
  },
  {
    key: 'staff',
    title: 'Staff',
    path: '/reports/staff',
    textFilters: [{ name: 'name', label: 'Name' }, { name: 'jobRole', label: 'Job Role' }],
    dateHint: 'Dates apply to the charts; the table lists all staff.',
  },
  { key: 'approvals', title: 'Approvals', path: '/reports/approvals', textFilters: [{ name: 'user', label: 'User' }] },
  {
    key: 'blacklist',
    title: 'Blacklist',
    path: '/reports/blacklist',
    textFilters: [{ name: 'name', label: 'Name' }, { name: 'category', label: 'Category' }],
    dateHint: 'Dates apply to the charts; the table lists all blacklist entries.',
  },
];

const statusOptions = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];

const emptyFilters = {
  fromDate: '',
  toDate: '',
  search: '',
  categoryId: '',
  locationId: '',
  status: '',
  name: '',
  category: '',
  user: '',
  jobRole: '',
};

/**
 * Builds the query params shared by a report's table, analytics, and export so all three show the same data.
 * @param {object} report Report definition from `reports`.
 * @param {object} filters Current filter values.
 * @returns {object} Non-empty query params supported by the report.
 */
function buildReportParams(report, filters) {
  const params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    search: filters.search.trim(),
    ...(report.category && filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
    ...(report.location && filters.locationId ? { locationId: Number(filters.locationId) } : {}),
    ...(report.status ? { status: filters.status } : {}),
    ...Object.fromEntries((report.textFilters || []).map(({ name }) => [name, filters[name].trim()])),
  };
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined));
}

function optionLabel(option) {
  return option.status === 'ACTIVE' ? option.name : `${option.name} (inactive)`;
}

export default function ReportsPage() {
  const [selectedKey, setSelectedKey] = useState('visits');
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState({ categories: [], locations: [] });
  const [optionsError, setOptionsError] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [columns, setColumns] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({});
  const [analyticsError, setAnalyticsError] = useState('');
  const [error, setError] = useState('');
  const reportRequestId = useRef(0);
  const analyticsRequestId = useRef(0);
  // Filters behind the rows and charts on screen; pagination and export reuse them.
  const appliedFilters = useRef(emptyFilters);
  const report = reports.find((item) => item.key === selectedKey) || reports[0];
  const currentAnalytics = analyticsData[selectedKey];
  const tabConfig = currentAnalytics || REPORT_TABS_CONFIG[selectedKey] || REPORT_TABS_CONFIG.visits;
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function isPresetActive(preset) {
    if (!preset) return false;
    if (!filters.fromDate && !filters.toDate) {
      return preset.label === 'Last 14 days';
    }
    if (typeof preset.getRange !== 'function') return false;
    const { from, to } = preset.getRange();
    return filters.fromDate === from && filters.toDate === to;
  }

  function runWithFilters(nextFilters) {
    appliedFilters.current = nextFilters;
    setError('');
    return Promise.all([
      loadReport(0, rowsPerPage, nextFilters),
      loadAnalytics(nextFilters),
    ]);
  }

  function applyPreset(preset) {
    const { from, to } = preset.getRange();
    const nextFilters = { ...filters, fromDate: from, toDate: to };
    setFilters(nextFilters);
    runWithFilters(nextFilters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    runWithFilters(emptyFilters);
  }

  function selectReport(nextReport) {
    if (!nextReport) return;
    reportRequestId.current += 1;
    analyticsRequestId.current += 1;
    setLoading(false);
    setAnalyticsLoading(false);
    setSelectedKey(nextReport.key);
    setItems([]);
    setTotal(0);
    setPage(0);
    setColumns([]);
    setHasRun(false);
    setError('');
    setAnalyticsError('');
    // Dates and the person search carry across tabs; tab-specific filters do not.
    setFilters((current) => ({
      ...emptyFilters,
      fromDate: current.fromDate,
      toDate: current.toDate,
      search: current.search,
    }));
  }

  async function loadReport(nextPage = 0, nextRowsPerPage = rowsPerPage, nextFilters = appliedFilters.current) {
    const requestId = ++reportRequestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get(report.path, {
        params: { ...buildReportParams(report, nextFilters), page: nextPage + 1, pageSize: nextRowsPerPage },
      });
      if (requestId !== reportRequestId.current) return;
      const responseItems = Array.isArray(response.data?.items) ? response.data.items : [];
      setItems(responseItems);
      setColumns(responseItems.length
        ? Object.keys(responseItems[0]).filter((column) => !(
          selectedKey === 'visits' && /(?:^|_)location_id$/i.test(column)
        ))
        : []);
      setTotal(response.data?.total ?? responseItems.length);
      setPage((response.data?.page ?? 1) - 1);
      setRowsPerPage(response.data?.pageSize ?? nextRowsPerPage);
      setHasRun(true);
    } catch (requestError) {
      if (requestId !== reportRequestId.current) return;
      setError(requestMessage(requestError, 'Report could not be loaded.'));
    } finally {
      if (requestId === reportRequestId.current) setLoading(false);
    }
  }

  async function loadAnalytics(nextFilters = appliedFilters.current) {
    const key = selectedKey;
    const reqId = ++analyticsRequestId.current;
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const response = await api.get('/reports/analytics', {
        params: { tab: key, ...buildReportParams(report, nextFilters) },
      });
      if (reqId !== analyticsRequestId.current) return;
      setAnalyticsData((prev) => ({ ...prev, [key]: response?.data?.kpis ? response.data : undefined }));
    } catch (requestError) {
      if (reqId !== analyticsRequestId.current) return;
      // Drop charts from earlier filters so they are never shown against the new table.
      setAnalyticsData((prev) => ({ ...prev, [key]: undefined }));
      setAnalyticsError(requestMessage(requestError, 'Charts could not be loaded.'));
    } finally {
      if (reqId === analyticsRequestId.current) {
        setAnalyticsLoading(false);
      }
    }
  }

  async function runReport(event) {
    if (event?.preventDefault) event.preventDefault();
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      setError('Choose a valid date range (From Date must not be after To Date).');
      return;
    }
    await runWithFilters(filters);
  }

  async function exportReport() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`${report.path}/export`, {
        params: buildReportParams(report, appliedFilters.current),
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.key}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestMessage(requestError, `${report.title} export failed.`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadFilterOptions() {
      try {
        const response = await api.get('/reports/options');
        if (!active) return;
        setFilterOptions({
          categories: Array.isArray(response?.data?.categories) ? response.data.categories : [],
          locations: Array.isArray(response?.data?.locations) ? response.data.locations : [],
        });
      } catch {
        if (active) setOptionsError(true);
      }
    }
    loadFilterOptions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    runWithFilters(filters);
  }, [selectedKey]);

  return (
    <Box className="reports-page">
      <Box className="reports-header-row">
        <Box>
          <Typography component="h1" variant="h1">Reports &amp; Analytics</Typography>
          <Typography className="reports-header-subtitle">
            {tabConfig.subtitle}
          </Typography>
        </Box>
        <Button
          className="reports-export-btn"
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={exportReport}
          disabled={loading}
        >
          Export Excel
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {analyticsError && <Alert severity="warning" sx={{ mb: 2 }}>{analyticsError}</Alert>}

      <Box className="reports-layout">
        <Tabs
          className="reports-tabs"
          value={selectedKey}
          onChange={(_event, value) => selectReport(reports.find((item) => item.key === value))}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Report types"
        >
          {reports.map((item) => <Tab key={item.key} value={item.key} label={item.title} />)}
        </Tabs>

        {/* Dedicated Date Range & Filter Toolbar */}
        <Paper className="table-panel report-panel" elevation={0} sx={{ mb: 1.5 }}>
          <Box component="form" className="report-filters" onSubmit={runReport} sx={{ borderBottom: 0, px: 2, py: 1.25 }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: '#E06D2E' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
                  Quick date range:
                </Typography>
                {datePresets.map((preset) => {
                  const isActive = isPresetActive(preset);
                  return (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      size="small"
                      clickable
                      color={isActive ? 'primary' : 'default'}
                      variant={isActive ? 'filled' : 'outlined'}
                      onClick={() => applyPreset(preset)}
                      sx={{ fontSize: '12px', fontWeight: isActive ? 600 : 400, height: 24 }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontWeight: 500 }}>
                {filters.fromDate || filters.toDate
                  ? `${filters.fromDate || 'Start'} to ${filters.toDate || 'today'}`
                  : 'No dates: table shows all records, charts show the last 14 days'}
                {report.dateHint ? ` · ${report.dateHint}` : ''}
              </Typography>
            </Box>
            <TextField
              label="Search person"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Name, person code or mobile"
              inputProps={{ maxLength: 100 }}
              size="small"
              sx={{ minWidth: 240 }}
            />
            <TextField
              label="From"
              type="date"
              value={filters.fromDate}
              onChange={(event) => updateFilter('fromDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'From' }}
              size="small"
            />
            <TextField
              label="To"
              type="date"
              value={filters.toDate}
              onChange={(event) => updateFilter('toDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'To' }}
              size="small"
            />
            {report.category && (
              <TextField
                label="Category"
                value={filters.categoryId}
                onChange={(event) => updateFilter('categoryId', event.target.value)}
                select
                size="small"
                sx={{ minWidth: 180 }}
                helperText={optionsError ? 'Categories could not be loaded' : undefined}
              >
                <MenuItem value="">All categories</MenuItem>
                {filterOptions.categories.map((option) => (
                  <MenuItem key={option.category_id} value={String(option.category_id)}>{optionLabel(option)}</MenuItem>
                ))}
              </TextField>
            )}
            {report.location && (
              <TextField
                label="Location"
                value={filters.locationId}
                onChange={(event) => updateFilter('locationId', event.target.value)}
                select
                size="small"
                sx={{ minWidth: 180 }}
                helperText={optionsError ? 'Locations could not be loaded' : undefined}
              >
                <MenuItem value="">All locations</MenuItem>
                {filterOptions.locations.map((option) => (
                  <MenuItem key={option.location_id} value={String(option.location_id)}>{optionLabel(option)}</MenuItem>
                ))}
              </TextField>
            )}
            {report.status && (
              <TextField
                label="Status"
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                select
                size="small"
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All statuses</MenuItem>
                {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            )}
            {(report.textFilters || []).map(({ name, label }) => (
              <TextField
                key={name}
                label={label}
                value={filters[name]}
                onChange={(event) => updateFilter(name, event.target.value)}
                inputProps={{ maxLength: 100 }}
                size="small"
              />
            ))}
            <Box className="report-filter-actions">
              <Button type="submit" variant="contained" color="secondary" disabled={loading}>
                {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                Run report
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={resetFilters}
                  disabled={loading}
                  startIcon={<RestartAltOutlinedIcon />}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Tier 1 & Tier 2: KPIs and Visual Graphical Charts */}
        <ReportChartsSection
          selectedKey={selectedKey}
          liveConfig={currentAnalytics}
          loading={analyticsLoading}
        />

        {/* Tier 3: Records Data Table */}
        <Paper className="table-panel report-panel" elevation={0}>
          <Box className="table-panel-heading">
            <Typography variant="h3">{tabConfig.tableTitle || report.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {hasRun ? `${total} records` : (tabConfig.tableCounter || 'Records')}
            </Typography>
          </Box>
          {loading ? (
            <Box className="loading-state"><CircularProgress size={28} /></Box>
          ) : hasRun && items.length ? (
            <TableContainer>
              <Table size="medium" aria-label={`${report.title} results`}>
                <TableHead className="report-table-head">
                  <TableRow>{columns.map((column) => <TableCell key={column}>{columnLabel(column)}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.person_code ?? item.day ?? 'row'}-${index}`} hover>
                      {columns.map((column) => (
                        <TableCell key={column}>
                          {renderCellContent(column, item[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : hasRun ? (
            <Box className="report-empty"><Typography color="text.secondary">No records for the selected filters.</Typography></Box>
          ) : <Box className="report-empty"><Typography color="text.secondary">No records for the selected filters.</Typography></Box>}
          {hasRun && <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            onPageChange={(_event, nextPage) => loadReport(nextPage, rowsPerPage)}
            onRowsPerPageChange={(event) => loadReport(0, Number(event.target.value))}
          />}
        </Paper>
      </Box>
    </Box>
  );
}

function columnLabel(value) {
  const map = {
    person_code: 'Code',
    first_name: 'First Name',
    last_name: 'Last Name',
    name: 'Person',
    mobile: 'Mobile',
    category: 'Category',
    checkin_at: 'Check-In',
    checkout_at: 'Check-Out',
    checkin_location: 'Checkin Location',
    checkout_location: 'Checkout Location',
    duration: 'Duration',
    accompanying_count: 'Guests',
    status: 'Status',
    route: 'Route',
    job_role: 'Job Role',
    action: 'Action',
    reason: 'Reason',
    by_user: 'Approver',
    acted_at: 'Requested',
  };
  return map[value] || value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderCellContent(column, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (column === 'status') {
    const slug = String(value).toLowerCase().replace(/[^a-z0-9]/g, '-');
    return <span className={`report-status-pill status-${slug}`}>{formatCell(value)}</span>;
  }
  return formatCell(value);
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}

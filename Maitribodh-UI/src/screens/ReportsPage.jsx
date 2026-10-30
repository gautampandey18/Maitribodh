import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { api } from '../api.js';
import { REPORT_TABS_CONFIG, ReportChartsSection } from './ReportsCharts.jsx';

const reports = [
  { key: 'visits', title: 'Visit History', path: '/reports/visit-history', dateRange: true, category: true },
  { key: 'registrations', title: 'Person Registrations', path: '/reports/registrations', status: true },
  { key: 'occupancy', title: 'Occupancy', path: '/reports/occupancy', dateRange: true },
  { key: 'staff', title: 'Staff', path: '/reports/staff' },
  { key: 'approvals', title: 'Approvals', path: '/reports/approvals', dateRange: true },
  { key: 'blacklist', title: 'Blacklist', path: '/reports/blacklist' },
];

const statusOptions = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];

export default function ReportsPage() {
  const [selectedKey, setSelectedKey] = useState('visits');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [blacklistName, setBlacklistName] = useState('');
  const [blacklistCategory, setBlacklistCategory] = useState('');
  const [approvalUser, setApprovalUser] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffJobRole, setStaffJobRole] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [columns, setColumns] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reportRequestId = useRef(0);
  const report = reports.find((item) => item.key === selectedKey) || reports[0];
  const tabConfig = REPORT_TABS_CONFIG[selectedKey] || REPORT_TABS_CONFIG.visits;

  function selectReport(nextReport) {
    if (!nextReport) return;
    reportRequestId.current += 1;
    setLoading(false);
    setSelectedKey(nextReport.key);
    setItems([]);
    setTotal(0);
    setPage(0);
    setColumns([]);
    setHasRun(false);
    setError('');
  }

  function getParams() {
    return {
      ...(report.dateRange && fromDate ? { fromDate } : {}),
      ...(report.dateRange && toDate ? { toDate } : {}),
      ...(report.category && categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(report.status && status ? { status } : {}),
      ...(report.key === 'blacklist' && blacklistName.trim() ? { name: blacklistName.trim() } : {}),
      ...(report.key === 'blacklist' && blacklistCategory.trim() ? { category: blacklistCategory.trim() } : {}),
      ...(report.key === 'approvals' && approvalUser.trim() ? { user: approvalUser.trim() } : {}),
      ...(report.key === 'staff' && staffName.trim() ? { name: staffName.trim() } : {}),
      ...(report.key === 'staff' && staffJobRole.trim() ? { jobRole: staffJobRole.trim() } : {}),
    };
  }

  async function loadReport(nextPage = 0, nextRowsPerPage = rowsPerPage) {
    const requestId = ++reportRequestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get(report.path, {
        params: { ...getParams(), page: nextPage + 1, pageSize: nextRowsPerPage },
      });
      if (requestId !== reportRequestId.current) return;
      setItems(response.data.items);
      setColumns(response.data.items.length
        ? Object.keys(response.data.items[0]).filter((column) => !(
          selectedKey === 'visits' && /(?:^|_)location_id$/i.test(column)
        ))
        : []);
      setTotal(response.data.total ?? response.data.items.length);
      setPage(response.data.page - 1);
      setRowsPerPage(response.data.pageSize ?? nextRowsPerPage);
      setHasRun(true);
    } catch (requestError) {
      if (requestId !== reportRequestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Report could not be loaded.');
    } finally {
      if (requestId === reportRequestId.current) setLoading(false);
    }
  }

  async function runReport(event) {
    event.preventDefault();
    if (report.dateRange && fromDate && toDate && fromDate > toDate) {
      setError('Choose a valid date range.');
      return;
    }
    await loadReport(0, rowsPerPage);
  }

  async function exportReport() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`${report.path}/export`, {
        params: getParams(),
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.key}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? `${report.title} export failed.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(0, rowsPerPage);
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

        {/* Tier 1 & Tier 2: KPIs and Visual Graphical Charts */}
        <ReportChartsSection selectedKey={selectedKey} />

        {/* Tier 3: Records Data Table & Filters */}
        <Paper className="table-panel report-panel" elevation={0}>
          <Box className="table-panel-heading">
            <Typography variant="h3">{tabConfig.tableTitle || report.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {hasRun ? `${total} records` : (tabConfig.tableCounter || 'Filters')}
            </Typography>
          </Box>
          <Box component="form" className="report-filters" onSubmit={runReport}>
            {report.dateRange && (
              <>
                <TextField label="From" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'From' }} />
                <TextField label="To" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'To' }} />
              </>
            )}
            {report.status && (
              <TextField label="Status" value={status} onChange={(event) => setStatus(event.target.value)} select sx={{ minWidth: 180 }}>
                <MenuItem value="">All statuses</MenuItem>
                {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            )}
            {report.category && (
              <TextField label="Category ID" type="number" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} inputProps={{ min: 1, step: 1 }} />
            )}
            {report.key === 'blacklist' && (
              <>
                <TextField label="Name" value={blacklistName} onChange={(event) => setBlacklistName(event.target.value)} inputProps={{ maxLength: 100 }} />
                <TextField label="Category" value={blacklistCategory} onChange={(event) => setBlacklistCategory(event.target.value)} inputProps={{ maxLength: 100 }} />
              </>
            )}
            {report.key === 'approvals' && (
              <TextField
                label="User"
                value={approvalUser}
                onChange={(event) => setApprovalUser(event.target.value)}
                inputProps={{ maxLength: 100 }}
              />
            )}
            {report.key === 'staff' && (
              <>
                <TextField
                  label="Name"
                  value={staffName}
                  onChange={(event) => setStaffName(event.target.value)}
                  inputProps={{ maxLength: 100 }}
                />
                <TextField
                  label="Job Role"
                  value={staffJobRole}
                  onChange={(event) => setStaffJobRole(event.target.value)}
                  inputProps={{ maxLength: 100 }}
                />
              </>
            )}
            <Box className="report-filter-actions">
              <Button type="submit" variant="contained" color="secondary" disabled={loading}>
                {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                Run report
              </Button>
            </Box>
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

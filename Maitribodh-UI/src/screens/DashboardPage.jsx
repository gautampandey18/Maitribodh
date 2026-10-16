import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
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
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../api.js';

const metrics = [
  ['active_persons', 'Active Members'],
  ['registrations_today', 'Registrations Today'],
  ['checkins_today', 'Check-Ins Today'],
  ['checkouts_today', 'Check-Outs Today'],
  ['pending_approvals', 'Pending Approvals'],
  ['blacklist_attempts_today', 'Blacklist Alerts'],
];
const mixColors = ['#f7d327', '#d0a823', '#504c41'];

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const [summary, setSummary] = useState(null);
  const [inside, setInside] = useState([]);
  const [insideTotal, setInsideTotal] = useState(0);
  const [insidePage, setInsidePage] = useState(0);
  const [insideRowsPerPage, setInsideRowsPerPage] = useState(5);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentActivityTotal, setRecentActivityTotal] = useState(0);
  const [recentActivityPage, setRecentActivityPage] = useState(0);
  const [recentActivityRowsPerPage, setRecentActivityRowsPerPage] = useState(5);
  const [occupancyByLocation, setOccupancyByLocation] = useState([]);
  const [occupancyByCategory, setOccupancyByCategory] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reconciliationTarget, setReconciliationTarget] = useState(null);
  const [reconciliationNote, setReconciliationNote] = useState('');
  const [reconciliationError, setReconciliationError] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const insideRequestId = useRef(0);
  const recentActivityRequestId = useRef(0);
  const canReviewApprovals = ['SUPER_ADMIN', 'ADMIN', 'APPROVER'].includes(user?.role);

  async function loadInside(nextPage = insidePage, nextRowsPerPage = insideRowsPerPage) {
    const currentRequestId = ++insideRequestId.current;
    setInsidePage(nextPage);
    setInsideRowsPerPage(nextRowsPerPage);
    const response = await api.get('/dashboard/inside', {
      params: { page: nextPage + 1, pageSize: nextRowsPerPage },
    });
    if (currentRequestId !== insideRequestId.current) return;
    setInside(response.data.items);
    setInsideTotal(response.data.total ?? response.data.items.length);
    setInsidePage(response.data.page - 1);
    setInsideRowsPerPage(response.data.pageSize ?? nextRowsPerPage);
    setOccupancyByLocation(response.data.byLocation ?? []);
    setOccupancyByCategory(response.data.byCategory ?? []);
  }

  async function loadRecentActivity(nextPage = recentActivityPage, nextRowsPerPage = recentActivityRowsPerPage) {
    const currentRequestId = ++recentActivityRequestId.current;
    setRecentActivityPage(nextPage);
    setRecentActivityRowsPerPage(nextRowsPerPage);
    const response = await api.get('/dashboard/recent-activity', {
      params: { page: nextPage + 1, pageSize: nextRowsPerPage },
    });
    if (currentRequestId !== recentActivityRequestId.current) return;
    setRecentActivity(response.data.items);
    setRecentActivityTotal(response.data.total ?? response.data.items.length);
    setRecentActivityPage(response.data.page - 1);
    setRecentActivityRowsPerPage(response.data.pageSize ?? nextRowsPerPage);
  }

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/dashboard'), loadInside(0, 5), loadRecentActivity(0, 5)])
      .then(([summaryResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.data);
        setLastSyncedAt(Date.now());
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error?.message ?? 'Dashboard data could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    if (canReviewApprovals) {
      api.get('/approvals')
        .then((response) => { if (active) setPendingApprovals(response.data.items.slice(0, 3)); })
        .catch(() => {});
    }
    return () => {
      active = false;
      insideRequestId.current += 1;
      recentActivityRequestId.current += 1;
    };
  }, [canReviewApprovals]);

  async function reconcileVisit() {
    if (!reconciliationTarget || !reconciliationNote.trim()) return;
    setReconciling(true);
    setReconciliationError('');
    try {
      await api.post(`/visits/${reconciliationTarget.visit_id}/reconciliation`, { note: reconciliationNote.trim() });
      const [summaryResponse] = await Promise.all([api.get('/dashboard'), loadInside(), loadRecentActivity(0, recentActivityRowsPerPage)]);
      setSummary(summaryResponse.data);
      setLastSyncedAt(Date.now());
      setReconciliationTarget(null);
      setReconciliationNote('');
    } catch (requestError) {
      setReconciliationError(requestError.response?.data?.error?.message ?? 'The open visit could not be reconciled.');
    } finally { setReconciling(false); }
  }

  return (
    <Box className="dashboard-page">
      <Box className="page-heading">
        <Box>
          <Typography component="h1" variant="h1">Dashboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Last sync: {lastSyncedAt ? `${Math.max(0, Math.floor((Date.now() - lastSyncedAt) / 1000))}s ago` : '—'} · Live monitoring</Typography>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box className="loading-state"><CircularProgress size={28} /></Box>
      ) : (
        <>
          <Box className="dashboard-metrics" aria-label="Daily operations summary">
            {metrics.map(([key, label]) => (
              <Paper className="dashboard-metric" elevation={0} key={key}>
                <Typography className="dashboard-metric-label">{label}</Typography>
                <Typography component="p" className="dashboard-metric-value">{summary?.[key] ?? 0}</Typography>
                <Typography className={`dashboard-metric-note dashboard-note-${key}`}>
                  {key === 'pending_approvals' ? 'Needs review' : key === 'blacklist_attempts_today' ? 'Action required' : key === 'checkouts_today' ? 'On pace' : key === 'checkins_today' ? 'This shift' : ''}
                </Typography>
              </Paper>
            ))}
          </Box>
          <Paper className="table-panel dashboard-inside" elevation={0}>
            <Box className="table-panel-heading">
              <Box>
                  <Typography variant="h3">Current Occupancy <Box component="span" className="occupancy-count">{insideTotal} inside</Box></Typography>
                  <Typography variant="body2" color="text.secondary">Open check-ins require manual review before reconciliation.</Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="medium" aria-label="People currently inside">
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Gate</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Checked in</TableCell>
                    <TableCell>Additional people</TableCell>
                    <TableCell>Checked by</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inside.map((visit) => (
                    <TableRow key={visit.visit_id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{visit.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{visit.person_code}</Typography>
                      </TableCell>
                      <TableCell>{visit.category}</TableCell>
                      <TableCell>{visit.gate}</TableCell>
                      <TableCell>{visit.location}</TableCell>
                      <TableCell>{formatDate(visit.checkin_at)}</TableCell>
                      <TableCell>{visit.accompanying_count}</TableCell>
                      <TableCell>{visit.checked_in_by}</TableCell>
                      <TableCell>{visit.checkin_device ?? '—'}</TableCell>
                      <TableCell>{user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? <Button className="dashboard-admin-review" size="small" onClick={() => { setReconciliationError(''); setReconciliationTarget(visit); }}>Review / Close</Button> : <Typography variant="caption">Admin review</Typography>}</TableCell>
                    </TableRow>
                  ))}
                  {!inside.length && <TableRow><TableCell colSpan={9} className="empty-table occupancy-empty-state">No open check-ins.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={insideTotal}
              page={insidePage}
              rowsPerPage={insideRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              onPageChange={(_event, nextPage) => loadInside(nextPage, insideRowsPerPage).catch(() => setError('Occupancy data could not be loaded.'))}
              onRowsPerPageChange={(event) => loadInside(0, Number(event.target.value)).catch(() => setError('Occupancy data could not be loaded.'))}
            />
            <Box className="dashboard-occupancy-breakdown">
              <Box><Typography className="dashboard-breakdown-title">Occupancy by Location</Typography>{occupancyByLocation.map(({ name, count }) => <Box className="dashboard-breakdown-row" key={name}><span>{name}</span><b>{count}</b></Box>)}{!occupancyByLocation.length && <Typography variant="caption">No open check-ins.</Typography>}</Box>
              <Box><Typography className="dashboard-breakdown-title">Occupancy by Category</Typography>{occupancyByCategory.map(({ name, count }) => <Box className="dashboard-breakdown-row" key={name}><span>{name}</span><b>{count}</b></Box>)}{!occupancyByCategory.length && <Typography variant="caption">No open check-ins.</Typography>}</Box>
            </Box>
          </Paper>
          <Box className="dashboard-insights">
            <Paper className="table-panel dashboard-chart-panel" elevation={0}>
              <Box className="table-panel-heading">
                <Box>
                  <Typography variant="h3">Daily Check-In Trend</Typography>
                  <Typography variant="body2" color="text.secondary">Last 7 days</Typography>
                </Box>
              </Box>
              <Box className="dashboard-trend" role="img" aria-label="Daily check-in trend for the last seven days">
                {summary?.checkin_trend?.length ? <TrendChart trend={summary.checkin_trend} /> : <Typography color="text.secondary">No check-in activity yet.</Typography>}
              </Box>
            </Paper>
            <Paper className="table-panel dashboard-chart-panel" elevation={0}>
              <Box className="table-panel-heading">
                <Box>
                  <Typography variant="h3">Category Mix</Typography>
                  <Typography variant="body2" color="text.secondary">This week</Typography>
                </Box>
              </Box>
              {summary?.category_mix?.length ? <CategoryDonut mix={summary.category_mix} total={summary.active_persons ?? 0} /> : <Box className="dashboard-category-mix"><Typography color="text.secondary">No active registrations.</Typography></Box>}
            </Paper>
          </Box>
          <Box className="dashboard-lower">
            <Paper className="table-panel" elevation={0}>
              <Box className="table-panel-heading">
                <Box>
                  <Typography variant="h3">Recent Activity</Typography>
                  <Typography variant="body2" color="text.secondary">Latest recorded operations</Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small" aria-label="Recent activity">
                  <TableHead><TableRow><TableCell>Person</TableCell><TableCell>Category</TableCell><TableCell>Location</TableCell><TableCell>Time</TableCell><TableCell>Event</TableCell></TableRow></TableHead>
                  <TableBody>
                    {recentActivity.map((event, index) => (
                      <TableRow key={`${event.occurred_at}-${index}`}>
                        <TableCell>{event.person_name ?? event.actor}</TableCell>
                        <TableCell>{event.category ?? '—'}</TableCell>
                        <TableCell>{event.location ?? '—'}</TableCell>
                        <TableCell>{formatTime(event.occurred_at)}</TableCell>
                        <TableCell>{event.activity?.replaceAll('_', ' ')}</TableCell>
                      </TableRow>
                    ))}
                    {!recentActivity.length && <TableRow><TableCell colSpan={5} className="empty-table">No recorded activity.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={recentActivityTotal}
                page={recentActivityPage}
                rowsPerPage={recentActivityRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                onPageChange={(_event, nextPage) => loadRecentActivity(nextPage).catch(() => setError('Recent activity could not be loaded.'))}
                onRowsPerPageChange={(event) => loadRecentActivity(0, Number(event.target.value)).catch(() => setError('Recent activity could not be loaded.'))}
              />
            </Paper>
            <Box className="dashboard-side-widgets">
              {canReviewApprovals && (
                <Paper className="table-panel dashboard-widget" elevation={0}>
                  <Box className="table-panel-heading">
                    <Typography variant="h3">Pending Approval Queue</Typography>
                    <Button component={Link} to="/approvals" size="small">View all</Button>
                  </Box>
                  {pendingApprovals.length ? pendingApprovals.map((item) => (
                    <Box className="dashboard-queue-row" key={item.person_id}>
                      <Box>
                        <Typography fontWeight={600}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.category}</Typography>
                      </Box>
                      <Typography className="dashboard-pending-label">Pending</Typography>
                    </Box>
                  )) : <Box className="dashboard-widget-empty"><Typography color="text.secondary">No pending approvals.</Typography></Box>}
                </Paper>
              )}
              <Paper className="table-panel dashboard-widget" elevation={0}>
                <Box className="table-panel-heading">
                  <Typography variant="h3">Security Alerts</Typography>
                  <Typography className="dashboard-alert-count">{summary?.security_alerts?.total_today ?? 0}</Typography>
                </Box>
                <Box className="dashboard-alert-body">
                  <Box className="dashboard-alert-dot" />
                  <Typography>
                    {summary?.security_alerts?.total_today
                      ? `Blacklisted check-in attempt${summary.security_alerts.total_today === 1 ? '' : 's'} today`
                      : 'No blacklist attempts today'}
                  </Typography>
                  {summary?.security_alerts?.latest_at && <Typography variant="caption" color="text.secondary">Latest {formatDate(summary.security_alerts.latest_at)}</Typography>}
                </Box>
              </Paper>
            </Box>
          </Box>
        </>
      )}
      <Dialog open={Boolean(reconciliationTarget)} onClose={() => !reconciling && setReconciliationTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Manually close open visit</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Manually close the open visit for {reconciliationTarget?.name}? Confirm only after checking the person is no longer on site.</Typography>
          {reconciliationError && <Alert severity="error" sx={{ mb: 2 }}>{reconciliationError}</Alert>}
          <TextField label="Admin reconciliation note" required fullWidth multiline minRows={3} value={reconciliationNote} onChange={(event) => setReconciliationNote(event.target.value)} inputProps={{ maxLength: 500 }} />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setReconciliationTarget(null)} disabled={reconciling}>Cancel</Button>
          <Button onClick={reconcileVisit} variant="contained" color="secondary" disabled={reconciling || !reconciliationNote.trim()}>{reconciling ? <CircularProgress size={18} /> : 'Confirm close'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function TrendChart({ trend }) {
  const maximum = Math.max(1, ...trend.map((item) => Number(item.checkins) || 0));
  const points = trend.map((item, index) => ({
    x: trend.length < 2 ? 200 : index * (400 / (trend.length - 1)),
    y: 108 - ((Number(item.checkins) || 0) / maximum) * 78,
    item,
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ');
  return <Box className="dashboard-trend-chart"><svg viewBox="0 0 400 132" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="120" x2="400" y2="120" className="trend-axis" /><polygon points={`0,120 ${line} 400,120`} className="trend-area" /><polyline points={line} className="trend-line" />{points.map(({ x, y, item }) => <circle key={String(item.day)} cx={x} cy={y} r="3.5" className="trend-point"><title>{`${item.checkins} check-ins`}</title></circle>)}</svg><Box className="dashboard-trend-labels">{points.map(({ item }) => <Box key={String(item.day)}><Typography variant="caption">{shortDay(item.day)}</Typography><Typography className="dashboard-trend-count">{item.checkins}</Typography></Box>)}</Box></Box>;
}

function CategoryDonut({ mix, total }) {
  const groups = [
    { name: 'Staff', count: sumCategories(mix, ['staff']) },
    { name: 'Visitor / Participant', count: sumCategories(mix, ['visitor', 'participant']) },
    { name: 'Vendor / Contractor / Parivar', count: mix.filter((item) => !['staff', 'visitor', 'participant'].some((name) => item.category.toLowerCase().includes(name))).reduce((value, item) => value + Number(item.active_persons || 0), 0) },
  ];
  const sum = groups.reduce((value, group) => value + group.count, 0);
  let offset = 0;
  return <Box className="dashboard-category-mix"><Box className="dashboard-donut" role="img" aria-label="Active person category mix"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="46" pathLength="100" className="donut-track" />{groups.map((group, index) => { const percent = sum ? group.count / sum * 100 : 0; const currentOffset = offset; offset += percent; return percent ? <circle key={group.name} cx="60" cy="60" r="46" pathLength="100" className="donut-segment" style={{ stroke: mixColors[index], strokeDasharray: `${percent} ${100 - percent}`, strokeDashoffset: -currentOffset }}><title>{`${group.name}: ${Math.round(percent)}%`}</title></circle> : null; })}</svg><Box className="donut-total"><b>{total}</b><span>Active</span></Box></Box><Box className="donut-legend">{groups.map((group, index) => <Box className="donut-legend-row" key={group.name}><span className="donut-swatch" style={{ background: mixColors[index] }} /><span>{group.name}</span><b>{sum ? Math.round(group.count / sum * 100) : 0}%</b></Box>)}</Box></Box>;
}

function sumCategories(mix, keys) {
  return mix.filter((item) => keys.some((key) => item.category.toLowerCase().includes(key))).reduce((total, item) => total + Number(item.active_persons || 0), 0);
}

function shortDay(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}
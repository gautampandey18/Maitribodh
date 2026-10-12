import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const pageSize = 5;
const statuses = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];

export default function PersonsPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [status, setStatus] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resubmitTarget, setResubmitTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  async function searchRecords(nextQuery, nextStatus, nextPage) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/persons', {
        params: {
          q: nextQuery,
          ...(nextStatus ? { status: nextStatus } : {}),
          page: nextPage,
          pageSize,
        },
      });
      if (currentRequestId !== requestId.current) return;
      setItems(response.data.items);
      setTotal(response.data.total);
      setPage(response.data.page);
      setActiveQuery(nextQuery);
      setActiveStatus(nextStatus);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Registrations could not be searched.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setError('Enter a name, mobile number, or person code.');
      return;
    }
    searchRecords(normalizedQuery, status, 1);
  }

  function changePage(nextPage) {
    searchRecords(activeQuery, activeStatus, nextPage);
  }

  async function resubmit() {
    if (!resubmitTarget) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/persons/${resubmitTarget.person_id}/resubmissions`);
      setResubmitTarget(null);
      setNotice('Registration resubmitted for approval');
      await searchRecords(activeQuery, activeStatus, page);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Registration could not be resubmitted.');
    } finally {
      setSaving(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box className="persons-page">
      <Box className="page-heading">
        <Box>
          <Typography className="eyebrow">REGISTRATION</Typography>
          <Typography component="h1" variant="h1">Person Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Search records by name, mobile number, or person code.</Typography>
        </Box>
        <Button component={Link} to="/register" variant="contained">Register Person</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box component="form" className="person-search-form" onSubmit={submitSearch}>
          <TextField
            label="Search registrations"
            placeholder="Name, mobile, or person code"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputProps={{ maxLength: 100 }}
            fullWidth
          />
          <TextField label="Status" value={status} onChange={(event) => setStatus(event.target.value)} select sx={{ minWidth: 170 }}>
            <MenuItems />
          </TextField>
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />} disabled={loading || !query.trim()}>
            Search
          </Button>
        </Box>
        <Box className="table-panel-heading">
          <Typography variant="h3">Registration records</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Searching' : activeQuery ? `${total} matches` : 'No search yet'}
          </Typography>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Registration search results">
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.person_id} hover>
                    <TableCell>
                      <Button component={Link} to={`/persons/${item.person_id}`} sx={{ p: 0, justifyContent: 'flex-start' }}>{item.name}</Button>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.mobile ?? '—'}</TableCell>
                    <TableCell><Chip size="small" label={item.status} color={statusColor(item.status)} /></TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell align="right">
                      {item.status === 'REJECTED' && (
                        <Button size="small" onClick={() => setResubmitTarget(item)}>Resubmit</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {activeQuery && !items.length && !loading && (
                  <TableRow><TableCell colSpan={6} className="empty-table">No matching registrations.</TableCell></TableRow>
                )}
                {!activeQuery && !loading && (
                  <TableRow><TableCell colSpan={6} className="empty-table">Search by name, mobile number, or person code.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box className="pagination-bar">
          <Typography variant="body2" color="text.secondary">Page {page} of {pageCount}</Typography>
          <Box>
            <Button onClick={() => changePage(page - 1)} disabled={loading || !activeQuery || page <= 1}>Previous</Button>
            <Button onClick={() => changePage(page + 1)} disabled={loading || !activeQuery || page >= pageCount}>Next</Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={Boolean(resubmitTarget)} onClose={() => !saving && setResubmitTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Resubmit registration</DialogTitle>
        <DialogContent>
          <Typography>
            Return {resubmitTarget?.person_code} to the approval queue?
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setResubmitTarget(null)} disabled={saving}>Cancel</Button>
          <Button onClick={resubmit} variant="contained" color="secondary" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Confirm resubmission'}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarMessage notice={notice} setNotice={setNotice} />
    </Box>
  );
}

function MenuItems() {
  return (
    <>
      <MenuItem value="">All statuses</MenuItem>
      {statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
    </>
  );
}

function SnackbarMessage({ notice, setNotice }) {
  return <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />;
}

function statusColor(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'REJECTED' || status === 'DEACTIVATED') return 'error';
  return 'warning';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

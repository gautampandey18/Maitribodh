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
  IconButton,
  Paper,
  Snackbar,
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
  Tooltip,
  Typography,
} from '@mui/material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { api } from '../api.js';

export default function ApprovalsPage() {
  const [tab, setTab] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  async function loadQueue(nextTab = tab, nextPage = page, nextRowsPerPage = rowsPerPage) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/approvals', { params: { status: nextTab, page: nextPage + 1, pageSize: nextRowsPerPage } });
      if (currentRequestId !== requestId.current) return;
      setItems(response.data.items);
      setTotal(response.data.total ?? response.data.items.length);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Approval queue could not be loaded.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  function changeTab(_event, nextTab) {
    setTab(nextTab);
    loadQueue(nextTab, 0, rowsPerPage);
  }

  function openDecision(item, decision) {
    setSelected({ ...item, decision });
    setReason('');
  }

  async function submitDecision() {
    if (!selected || (selected.decision === 'REJECT' && reason.trim().length < 10)) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/approvals/${selected.person_id}/decisions`, {
        decision: selected.decision,
        ...(selected.decision === 'REJECT' ? { reason: reason.trim() } : {}),
      });
      const nextTotal = Math.max(0, total - 1);
      const nextPage = page > 0 && page * rowsPerPage >= nextTotal ? page - 1 : page;
      setNotice(`Registration ${selected.decision === 'APPROVE' ? 'approved' : 'rejected'}`);
      setSelected(null);
      await loadQueue(tab, nextPage, rowsPerPage);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Decision could not be saved. Refresh the queue and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function resubmitRegistration(item) {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/persons/${item.person_id}/resubmissions`);
      const nextTotal = Math.max(0, total - 1);
      const nextPage = page > 0 && page * rowsPerPage >= nextTotal ? page - 1 : page;
      setNotice(data.status === 'ACTIVE'
        ? 'Registration resubmitted and activated'
        : 'Registration resubmitted for approval');
      await loadQueue('REJECTED', nextPage, rowsPerPage);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Registration could not be resubmitted.');
    } finally {
      setSaving(false);
    }
  }

  const rejectionValid = reason.trim().length >= 10;

  return (
    <Box className="approvals-page">
      <Box className="page-heading">
        <Box>
          <Typography className="eyebrow">REGISTRATION</Typography>
          <Typography component="h1" variant="h1">Approval Center</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Review pending registrations and record a decision.</Typography>
        </Box>
        <Tooltip title={`Refresh ${tabLabel(tab).toLowerCase()}`}>
          <span>
            <IconButton aria-label="Refresh queue" onClick={() => loadQueue()} disabled={loading}>
              <RefreshOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Tabs value={tab} onChange={changeTab} aria-label="Approval registration status">
          <Tab value="PENDING" label="Pending Registration" />
          <Tab value="ACTIVE" label="Approved" />
          <Tab value="REJECTED" label="Rejected" />
        </Tabs>
        <Box className="table-panel-heading">
          <Typography variant="h3">{tabLabel(tab)}</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${total} ${tabLabel(tab).toLowerCase()}`}</Typography>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="medium" aria-label={`${tabLabel(tab)} registrations`}>
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Photo</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.person_id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.person_code}</Typography>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{formatDate(item.submitted_at)}</TableCell>
                    <TableCell>{item.has_photo ? 'Available' : 'Missing'}</TableCell>
                    <TableCell align="right" className="approval-actions">
                      {tab === 'PENDING' && (
                        <>
                          <Tooltip title={`Approve ${item.name}`}>
                            <IconButton aria-label={`Approve ${item.name}`} color="success" onClick={() => openDecision(item, 'APPROVE')}>
                              <CheckOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={`Reject ${item.name}`}>
                            <IconButton aria-label={`Reject ${item.name}`} color="error" onClick={() => openDecision(item, 'REJECT')}>
                              <CloseOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {tab === 'ACTIVE' && (
                        <Button size="small" color="error" onClick={() => openDecision(item, 'REJECT')}>
                          Reject
                        </Button>
                      )}
                      {tab === 'REJECTED' && (
                        <Button size="small" onClick={() => resubmitRegistration(item)} disabled={saving}>
                          {saving ? <CircularProgress size={18} /> : 'Resubmit'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow><TableCell colSpan={5} className="empty-table approval-empty-state">{emptyMessage(tab)}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => loadQueue(tab, nextPage)}
          onRowsPerPageChange={(event) => loadQueue(tab, 0, Number(event.target.value))}
        />
      </Paper>

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>{selected?.decision === 'APPROVE' ? 'Approve registration' : 'Reject registration'}</DialogTitle>
        <DialogContent>
          <Typography>
            {selected?.name} <Typography component="span" color="text.secondary">({selected?.person_code})</Typography>
          </Typography>
          {selected?.decision === 'REJECT' && (
            <TextField
              autoFocus
              label="Reason for rejection"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 500 }}
              error={Boolean(reason) && !rejectionValid}
              helperText={rejectionValid ? `${reason.trim().length}/500 characters` : 'Enter at least 10 characters.'}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setSelected(null)} disabled={saving}>Cancel</Button>
          <Button
            onClick={submitDecision}
            variant="contained"
            color={selected?.decision === 'APPROVE' ? 'success' : 'error'}
            disabled={saving || (selected?.decision === 'REJECT' && !rejectionValid)}
          >
            {saving ? <CircularProgress size={18} /> : `Confirm ${selected?.decision === 'APPROVE' ? 'approval' : 'rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function tabLabel(tab) {
  if (tab === 'ACTIVE') return 'Approved';
  if (tab === 'REJECTED') return 'Rejected';
  return 'Pending registrations';
}

function emptyMessage(tab) {
  if (tab === 'ACTIVE') return 'No approved registrations.';
  if (tab === 'REJECTED') return 'No rejected registrations.';
  return 'No registrations are waiting for approval.';
}

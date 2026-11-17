import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Avatar,
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
import { requestMessage } from '../utils/resources.js';
import { hasRole } from '../constants/roles.js';

const NON_APPROVAL_NAMES = new Set(['visitor', 'vendor', 'contractor', 'participant']);
const NON_APPROVAL_TYPES = new Set(['VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT']);

function isApprovalRequiredPerson(item) {
  if (!item || item.approval_required === false) return false;
  const catName = item.category?.trim().toLowerCase() || '';
  if (Array.from(NON_APPROVAL_NAMES).some((name) => catName === name || catName.includes(name))) return false;
  const formType = item.form_type?.trim().toUpperCase() || '';
  if (NON_APPROVAL_TYPES.has(formType)) return false;
  return true;
}

export default function ApprovalsPage() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = hasRole(user, 'ADMIN', 'SUPER_ADMIN');
  const [tab, setTab] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({ name: '', category: '' });
  const [selected, setSelected] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  async function loadQueue(nextTab = tab, nextPage = page, nextRowsPerPage = rowsPerPage, nextFilters = activeFilters) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/approvals', { params: {
        status: nextTab,
        page: nextPage + 1,
        pageSize: nextRowsPerPage,
        ...(nextFilters.name ? { name: nextFilters.name } : {}),
        ...(nextFilters.category ? { category: nextFilters.category } : {}),
      } });
      if (currentRequestId !== requestId.current) return;
      const rawItems = response.data.items || [];
      const approvalEntries = rawItems.filter(isApprovalRequiredPerson);
      setItems(approvalEntries);
      setTotal(approvalEntries.length !== rawItems.length ? approvalEntries.length : (response.data.total ?? approvalEntries.length));
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestMessage(requestError, 'Approval queue could not be loaded.'));
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

  function searchRegistrations(event) {
    event.preventDefault();
    const nextFilters = { name: nameFilter.trim(), category: categoryFilter.trim() };
    setActiveFilters(nextFilters);
    loadQueue(tab, 0, rowsPerPage, nextFilters);
  }

  function clearFilters() {
    setNameFilter('');
    setCategoryFilter('');
    setActiveFilters({ name: '', category: '' });
    loadQueue(tab, 0, rowsPerPage, { name: '', category: '' });
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
      setError(requestMessage(requestError, 'Decision could not be saved. Refresh the queue and try again.'));
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
      setError(requestMessage(requestError, 'Registration could not be resubmitted.'));
    } finally {
      setSaving(false);
    }
  }

  const rejectionValid = reason.trim().length >= 10;

  return (
    <Box className="approvals-page">
      <Box className="page-heading">
        <Box>
          <Typography component="h1" variant="h1">Approval Center</Typography>
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
        <Tabs className="section-nav-tabs" value={tab} onChange={changeTab} variant="scrollable" scrollButtons="auto" aria-label="Approval registration status">
          <Tab value="PENDING" label="Pending Registration" />
          <Tab value="ACTIVE" label="Approved" />
          <Tab value="REJECTED" label="Rejected" />
        </Tabs>
        <Box className="table-panel-heading">
          <Typography variant="h3">{tabLabel(tab)}</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${total} ${tabLabel(tab).toLowerCase()}`}</Typography>
        </Box>
        <Box component="form" className="filter-toolbar" onSubmit={searchRegistrations} sx={{ p: 1.25 }}>
          <TextField
            label="Name"
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <Button type="submit" variant="contained" disabled={loading}>Search</Button>
          <Button type="button" onClick={clearFilters} disabled={loading || (!nameFilter && !categoryFilter && !activeFilters.name && !activeFilters.category)}>Clear</Button>
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', minHeight: 36 }}>
                        <Button
                          onClick={() => setPreviewItem(item)}
                          aria-label={`View details for ${item.name}`}
                          color="primary"
                          variant="text"
                          sx={{ p: 0, minHeight: 0, lineHeight: 1.25, justifyContent: 'flex-start', fontWeight: 600 }}
                        >
                          {item.name}
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1, pt: '2px' }}>{item.person_code}</Typography>
                      </Box>
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
                        <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
                          {isAdmin && (
                            <Tooltip title={`Re-approve ${item.name}`}>
                              <span>
                                <IconButton
                                  aria-label={`Re-approve ${item.name}`}
                                  color="success"
                                  onClick={() => openDecision(item, 'APPROVE')}
                                  disabled={saving}
                                  size="small"
                                >
                                  <CheckOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Button size="small" onClick={() => resubmitRegistration(item)} disabled={saving}>
                            {saving ? <CircularProgress size={18} /> : 'Resubmit'}
                          </Button>
                        </Box>
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

      {previewItem && <ApprovalPersonDialog item={previewItem} onClose={() => setPreviewItem(null)} />}

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

function ApprovalPersonDialog({ item, onClose }) {
  const [person, setPerson] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    setPerson(null);
    setPhotoUrl('');
    setLoading(true);
    setError('');
    setPhotoError('');

    api.get(`/persons/${item.person_id}`)
      .then(async ({ data }) => {
        if (!active) return;
        setPerson(data);
        if (!data.photo_key) return;
        try {
          const photo = await api.get(`/persons/${item.person_id}/files/${encodeURIComponent(data.photo_key)}`, { responseType: 'blob' });
          if (active) {
            objectUrl = URL.createObjectURL(photo.data);
            setPhotoUrl(objectUrl);
          }
        } catch {
          if (active) setPhotoError('Profile photo could not be loaded.');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestMessage(requestError, 'Person details could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.person_id]);

  const fullName = person ? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() : item.name;
  const initials = fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const fields = person ? [
    ['Person ID', person.identity_qr_code || person.person_code || item.person_code],
    ['Category', person.registration_category || person.category || item.category],
    ['Status', person.status],
    ['Mobile number', person.mobile],
    ['Email', person.email],
    ['Gender', person.gender],
    ['Date of birth', person.date_of_birth ? String(person.date_of_birth).slice(0, 10) : ''],
    ['Resident status', person.resident_status],
    ['Address', person.address],
    ['Emergency contact', [person.emergency_contact_name, person.emergency_contact_mobile].filter(Boolean).join(' · ')],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '') : [];

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Person details</DialogTitle>
      <DialogContent dividers>
        {loading && <Box role="status" sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {photoError && <Alert severity="warning" sx={{ mb: 2 }}>{photoError}</Alert>}
        {person && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px minmax(0, 1fr)' }, gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {photoUrl ? (
                <Box component="img" src={photoUrl} alt={`${fullName} profile photo`} sx={{ width: 150, height: 170, objectFit: 'cover', borderRadius: 2 }} />
              ) : (
                <Avatar aria-label={`${fullName} profile photo`} sx={{ width: 120, height: 120, fontSize: '2rem' }}>{initials}</Avatar>
              )}
              {!person.photo_key && <Typography variant="caption" color="text.secondary">No profile photo available.</Typography>}
            </Box>
            <Box>
              <Typography variant="h2" sx={{ mb: 2 }}>{fullName || item.name}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                {fields.map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
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

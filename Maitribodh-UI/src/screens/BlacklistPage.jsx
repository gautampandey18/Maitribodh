import { useEffect, useRef, useState } from 'react';
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
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
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
import AddIcon from '@mui/icons-material/Add';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { api } from '../api.js';

export default function BlacklistPage() {
  const [entries, setEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({ name: '', category: '' });
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [liftTarget, setLiftTarget] = useState(null);
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [reasonId, setReasonId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liftNote, setLiftNote] = useState('');
  const [formError, setFormError] = useState('');
  const requestId = useRef(0);

  async function loadData(nextPage = page, nextRowsPerPage = rowsPerPage, nextFilters = activeFilters) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const [entryResponse, reasonResponse] = await Promise.all([
        api.get('/blacklist', { params: {
          page: nextPage + 1,
          pageSize: nextRowsPerPage,
          ...(nextFilters.name ? { name: nextFilters.name } : {}),
          ...(nextFilters.category ? { category: nextFilters.category } : {}),
        } }),
        api.get('/lookups/BLACKLIST_REASON'),
      ]);
      if (currentRequestId !== requestId.current) return;
      setEntries(entryResponse.data.items);
      setTotalEntries(entryResponse.data.total ?? entryResponse.data.items.length);
      setReasons(reasonResponse.data.items);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Blacklist data could not be loaded.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function searchEntries(event) {
    event.preventDefault();
    const nextFilters = { name: nameFilter.trim(), category: categoryFilter.trim() };
    setActiveFilters(nextFilters);
    loadData(0, rowsPerPage, nextFilters);
  }

  function clearFilters() {
    setNameFilter('');
    setCategoryFilter('');
    const nextFilters = { name: '', category: '' };
    setActiveFilters(nextFilters);
    loadData(0, rowsPerPage, nextFilters);
  }

  function openAdd() {
    setPersonQuery('');
    setPersonResults([]);
    setSelectedPerson(null);
    setReasonId('');
    setRemarks('');
    setStartDate('');
    setEndDate('');
    setFormError('');
    setAddOpen(true);
  }

  async function searchPerson(event) {
    event.preventDefault();
    if (!personQuery.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const response = await api.get('/persons', { params: { q: personQuery.trim(), page: 1 } });
      setPersonResults(response.data.items);
      if (!response.data.items.length) setFormError('No registration matched that search.');
    } catch (requestError) {
      setFormError(requestError.response?.data?.error?.message ?? 'Person search is unavailable.');
    } finally {
      setSaving(false);
    }
  }

  async function addEntry(event) {
    event.preventDefault();
    if (!selectedPerson || !reasonId || !remarks.trim()) {
      setFormError('Select a person and reason, and enter remarks.');
      return;
    }
    const effectiveStartDate = startDate || new Date().toISOString().slice(0, 10);
    if (endDate && endDate < effectiveStartDate) {
      setFormError('End date cannot be before start date.');
      return;
    }

    setSaving(true);
    setFormError('');
    setError('');
    try {
      await api.post('/blacklist', {
        personId: selectedPerson.person_id,
        reasonId: Number(reasonId),
        remarks: remarks.trim(),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      setAddOpen(false);
      setNotice('Blacklist entry added');
      await loadData(0);
    } catch (requestError) {
      setFormError(requestError.response?.data?.error?.message ?? 'Blacklist entry could not be added.');
    } finally {
      setSaving(false);
    }
  }

  async function liftEntry(event) {
    event.preventDefault();
    if (!liftTarget || !liftNote.trim()) {
      setFormError('Enter a reason for lifting this entry.');
      return;
    }
    setSaving(true);
    setFormError('');
    setError('');
    try {
      await api.post(`/blacklist/${liftTarget.blacklist_id}/lifts`, { liftNote: liftNote.trim() });
      setLiftTarget(null);
      setLiftNote('');
      setNotice('Blacklist entry lifted');
      await loadData();
    } catch (requestError) {
      setFormError(requestError.response?.data?.error?.message ?? 'Blacklist entry could not be lifted.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className="blacklist-page">
      <Box className="page-heading">
        <Box>
          <Typography className="eyebrow">ACCESS CONTROL</Typography>
          <Typography component="h1" variant="h1">Blacklist Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Manage active restrictions and their audit history.</Typography>
        </Box>
        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={openAdd}>
          Add to blacklist
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box className="table-panel-heading">
          <Typography variant="h3">Blacklist entries</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${totalEntries} entries`}</Typography>
        </Box>
        <Box component="form" className="filter-toolbar" onSubmit={searchEntries} sx={{ p: 1.25 }}>
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
            <Table size="medium" aria-label="Blacklist entries">
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.blacklist_id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{entry.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{entry.person_code}</Typography>
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.reason}</TableCell>
                    <TableCell>{formatDate(entry.start_date)} – {entry.end_date ? formatDate(entry.end_date) : 'Indefinite'}</TableCell>
                    <TableCell><Chip size="small" label={entry.status} color={statusColor(entry.status)} /></TableCell>
                    <TableCell>{entry.remarks}</TableCell>
                    <TableCell align="right">
                      {entry.status !== 'LIFTED' && (
                        <Button size="small" color="error" onClick={() => { setLiftTarget(entry); setLiftNote(''); setFormError(''); }}>
                          Lift
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!entries.length && (
                  <TableRow><TableCell colSpan={7} className="empty-table">No blacklist entries.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalEntries}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => loadData(nextPage)}
          onRowsPerPageChange={(event) => loadData(0, Number(event.target.value))}
        />
      </Paper>

      <Dialog open={addOpen} onClose={() => !saving && setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add blacklist entry</DialogTitle>
        <Box component="form" onSubmit={addEntry} noValidate>
          <DialogContent className="blacklist-form">
            {formError && <Alert severity="error">{formError}</Alert>}
            {selectedPerson ? (
              <Box className="selected-blacklist-person">
                <Box>
                  <Typography fontWeight={700}>{selectedPerson.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedPerson.person_code} · {selectedPerson.category} · {selectedPerson.mobile}</Typography>
                </Box>
                <Button onClick={() => setSelectedPerson(null)}>Change</Button>
              </Box>
            ) : (
              <Box className="blacklist-person-search">
                <TextField label="Find person" value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} fullWidth placeholder="Name, mobile, or person code" />
                <Tooltip title="Search registrations">
                  <span>
                    <IconButton aria-label="Search registrations" type="button" disabled={saving || !personQuery.trim()} onClick={searchPerson}>
                      <PersonSearchOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )}
            {!selectedPerson && personResults.length > 0 && (
              <Box className="blacklist-person-results" role="listbox" aria-label="Matching people">
                {personResults.map((person) => (
                  <Button key={person.person_id} role="option" aria-selected="false" onClick={() => setSelectedPerson(person)}>
                    <span>{person.name}</span><span>{person.person_code} · {person.category}</span>
                  </Button>
                ))}
              </Box>
            )}
            <TextField label="Reason" value={reasonId} onChange={(event) => setReasonId(event.target.value)} select required fullWidth>
              <MenuItem value="">Select reason</MenuItem>
              {reasons.map((reason) => <MenuItem key={reason.lookup_id} value={String(reason.lookup_id)}>{reason.name}</MenuItem>)}
            </TextField>
            <TextField label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} required fullWidth multiline minRows={3} inputProps={{ maxLength: 500 }} />
            <Box className="blacklist-date-fields">
              <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Box>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" color="error" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Add entry'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(liftTarget)} onClose={() => !saving && setLiftTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Lift blacklist entry</DialogTitle>
        <Box component="form" onSubmit={liftEntry}>
          <DialogContent className="blacklist-form">
            {formError && <Alert severity="error">{formError}</Alert>}
            <Typography>Lift the restriction for {liftTarget?.name}?</Typography>
            <TextField label="Reason for lifting" value={liftNote} onChange={(event) => setLiftNote(event.target.value)} required fullWidth multiline minRows={3} inputProps={{ maxLength: 500 }} />
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setLiftTarget(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" color="error" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Confirm lift'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}

function statusColor(status) {
  if (status === 'ACTIVE') return 'error';
  if (status === 'LIFTED') return 'success';
  if (status === 'EXPIRED') return 'default';
  return 'warning';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

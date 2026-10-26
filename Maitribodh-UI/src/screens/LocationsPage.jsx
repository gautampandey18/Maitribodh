import { useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { api } from '../api.js';

const emptyLocation = { name: '', locationType: 'GATE', isRestricted: false, departmentId: '' };
const locationTypes = ['GATE', 'AREA'];

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({ query: '', locationType: '' });
  const [departments, setDepartments] = useState([]);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  async function loadData(nextPage = page, nextRowsPerPage = rowsPerPage, filters = activeFilters) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setActiveFilters(filters);
    setLoading(true);
    setError('');
    try {
      const [locationResponse, departmentResponse] = await Promise.all([
        api.get('/locations', { params: {
          ...(filters.query ? { query: filters.query } : {}),
          ...(filters.locationType ? { locationType: filters.locationType } : {}),
          page: nextPage + 1,
          pageSize: nextRowsPerPage,
        } }),
        api.get('/lookups/DEPARTMENT'),
      ]);
      if (currentRequestId !== requestId.current) return;
      setLocations(locationResponse.data.items);
      setTotalLocations(locationResponse.data.total ?? locationResponse.data.items.length);
      setDepartments(departmentResponse.data.items);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Location data could not be loaded.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function applyFilters(event) {
    event.preventDefault();
    loadData(0, rowsPerPage, { query: query.trim(), locationType: locationTypeFilter });
  }

  function clearFilters() {
    setQuery(''); setLocationTypeFilter('');
    loadData(0, rowsPerPage, { query: '', locationType: '' });
  }

  function openCreate() {
    setEditing(null);
    setLocationForm(emptyLocation);
    setFormError('');
    setDialogOpen(true);
  }

  async function openEdit(location) {
    setSaving(true);
    setError('');
    try {
      const response = await api.get(`/locations/${location.location_id}`);
      setEditing(response.data);
      setLocationForm({
        name: response.data.name,
        locationType: response.data.location_type,
        isRestricted: response.data.is_restricted,
        departmentId: response.data.department_id?.toString() ?? '',
      });
      setFormError('');
      setDialogOpen(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Location details could not be loaded.');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(event) {
    const { name, value, checked, type } = event.target;
    setLocationForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'locationType' && value === 'GATE' ? { isRestricted: false } : {}),
    }));
  }

  async function saveLocation(event) {
    event.preventDefault();
    if (!locationForm.name.trim()) {
      setFormError('Enter a location name.');
      return;
    }

    setSaving(true);
    setFormError('');
    setError('');
    const payload = {
      name: locationForm.name.trim(),
      locationType: locationForm.locationType,
      isRestricted: locationForm.locationType === 'AREA' && locationForm.isRestricted,
      departmentId: locationForm.departmentId ? Number(locationForm.departmentId) : null,
    };
    try {
      if (editing) {
        await api.patch(`/locations/${editing.location_id}`, payload);
        setNotice('Location updated');
      } else {
        await api.post('/locations', payload);
        setNotice('Location created');
      }
      setDialogOpen(false);
      await loadData();
    } catch (requestError) {
      const message = requestError.response?.data?.error?.message ?? 'Location could not be saved.';
      setFormError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className="locations-page">
      <Box className="page-heading">
        <Box>
          <Typography component="h1" variant="h1">Locations</Typography>
        </Box>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate}>
          Add location
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box className="table-panel-heading">
          <Typography variant="h3">Active gates and areas</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${totalLocations} locations`}</Typography>
        </Box>
        <Box component="form" className="filter-toolbar" onSubmit={applyFilters}>
          <TextField label="Search locations" value={query} onChange={(event) => setQuery(event.target.value)} inputProps={{ maxLength: 100 }} />
          <TextField label="Type" select value={locationTypeFilter} onChange={(event) => setLocationTypeFilter(event.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">Gates and areas</MenuItem>{locationTypes.map((item) => <MenuItem key={item} value={item}>{item === 'GATE' ? 'Gates' : 'Areas'}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />} disabled={loading}>Apply</Button>
          <Button type="button" onClick={clearFilters} disabled={loading || (!activeFilters.query && !activeFilters.locationType && !query && !locationTypeFilter)}>Clear</Button>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="medium" aria-label="Active locations">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Location</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Restricted area</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.location_id} hover>
                    <TableCell align="center"><Typography fontWeight={600}>{location.name}</Typography></TableCell>
                    <TableCell align="center">{location.location_type}</TableCell>
                    <TableCell align="center">{location.is_restricted ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Edit ${location.name}`}>
                        <span>
                          <IconButton aria-label={`Edit ${location.name}`} disabled={saving} onClick={() => openEdit(location)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!locations.length && (
                  <TableRow><TableCell colSpan={4} className="empty-table">No active locations configured.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalLocations}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => loadData(nextPage)}
          onRowsPerPageChange={(event) => loadData(0, Number(event.target.value))}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit location' : 'Add location'}</DialogTitle>
        <Box component="form" onSubmit={saveLocation} noValidate>
          <DialogContent className="category-form-grid">
            {formError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{formError}</Alert>}
            <TextField name="name" label="Location name" value={locationForm.name} onChange={updateForm} required fullWidth inputProps={{ maxLength: 100 }} />
            <TextField name="locationType" label="Location type" value={locationForm.locationType} onChange={updateForm} select fullWidth disabled={Boolean(editing)}>
              <MenuItem value="GATE">Gate</MenuItem>
              <MenuItem value="AREA">Area</MenuItem>
            </TextField>
            <TextField name="departmentId" label="Department" value={locationForm.departmentId} onChange={updateForm} select fullWidth>
              <MenuItem value="">None</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.lookup_id} value={String(department.lookup_id)}>{department.name}</MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Checkbox name="isRestricted" checked={locationForm.isRestricted} onChange={updateForm} disabled={locationForm.locationType === 'GATE'} />}
              label="Restricted area"
            />
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : editing ? 'Save changes' : 'Create location'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}

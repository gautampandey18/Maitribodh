import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { api } from '../api.js';
import CategoriesPage from './CategoriesPage.jsx';
import LocationsPage from './LocationsPage.jsx';
import { requestMessage, useResource } from '../utils/resources.js';

const types = [
  { key: 'DEPARTMENT', label: 'Departments' }, { key: 'JOB_ROLE', label: 'Job Roles' },
  { key: 'SUBCATEGORY', label: 'Subcategories' }, { key: 'ID_PROOF_TYPE', label: 'ID Proof Types' },
  { key: 'BLACKLIST_REASON', label: 'Blacklist Reasons' },
  { key: 'PROGRAM_BATCH', label: 'Programs & Batches' },
];
export default function MasterDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('CATEGORIES');
  const activeTab = searchParams.get('tab');
  const type = activeTab === 'categories' ? 'CATEGORIES' : activeTab === 'locations' ? 'LOCATIONS' : lookupType;
  function selectType(nextType) {
    if (nextType === 'CATEGORIES') setSearchParams({ tab: 'categories' });
    else if (nextType === 'LOCATIONS') setSearchParams({ tab: 'locations' });
    else {
      setLookupType(nextType);
      setSearchParams({});
    }
  }
  return <Box className="master-data-page">
    <Box className="page-heading"><Typography component="h1" variant="h1">Master Data</Typography></Box>
    <Tabs className="section-nav-tabs" aria-label="Master data sections" value={type} onChange={(_event, value) => selectType(value)} variant="scrollable" scrollButtons="auto">
      <Tab value="CATEGORIES" label="Categories" />
      <Tab value="LOCATIONS" label="Areas & Gates" />
      {types.map((item) => <Tab key={item.key} value={item.key} label={item.label} />)}
    </Tabs>
    {type === 'CATEGORIES' ? <CategoriesPage /> : type === 'LOCATIONS' ? <LocationsPage /> : <LookupValuesPage type={type} />}
  </Box>;
}

function LookupValuesPage({ type }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [edit, setEdit] = useState(null);
  const [target, setTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const listParams = new URLSearchParams({ includeInactive: 'true', page: String(page + 1), pageSize: String(rowsPerPage), ...(activeQuery ? { query: activeQuery } : {}) });
  const { data, error: loadError, reload } = useResource(`/lookups/${type}?${listParams}`);
  const { data: options } = useResource('/persons/registration/options');
  function open(item) {
    setEdit({ id: item?.lookup_id, name: item?.name ?? '', parentId: item?.parent_id ?? '', categoryId: item?.category_id ?? '', startDate: item?.extra?.start_date ?? '', endDate: item?.extra?.end_date ?? '' });
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    if (type === 'PROGRAM_BATCH' && edit.endDate < edit.startDate) { setError('End Date cannot be before Start Date.'); setBusy(false); return; }
    try {
      const extra = type === 'PROGRAM_BATCH' ? { start_date: edit.startDate, end_date: edit.endDate } : {};
      if (edit.id) await api.patch(`/lookups/${type}/${edit.id}`, { name: edit.name, extra });
      else await api.post(`/lookups/${type}`, { name: edit.name, parentId: edit.parentId ? Number(edit.parentId) : null, categoryId: edit.categoryId ? Number(edit.categoryId) : null, extra });
      setEdit(null); reload();
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  async function changeStatus() {
    setBusy(true); setError('');
    try { await api.patch(`/lookups/${type}/${target.lookup_id}`, { status: target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); setTarget(null); reload(); }
    catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  async function deleteValue() {
    if (!deleteTarget) return;
    setBusy(true); setError('');
    try {
      await api.delete(`/lookups/${type}/${deleteTarget.lookup_id}`);
      setDeleteTarget(null);
      if (page > 0 && data?.items?.length === 1) setPage(page - 1);
      else reload();
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  function searchValues(event) {
    event.preventDefault();
    setPage(0);
    setActiveQuery(query.trim());
  }
  function clearSearch() { setQuery(''); setActiveQuery(''); setPage(0); }
  const hasParentCategory = ['JOB_ROLE', 'SUBCATEGORY'].includes(type);
  return <Box className="master-data-page"><Box component="form" className="filter-toolbar master-data-filter-toolbar" onSubmit={searchValues} sx={{ mt: 2 }}><TextField label={`Search ${types.find((item) => item.key === type)?.label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} inputProps={{ maxLength: 100 }} /><Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />}>Search</Button><Button type="button" onClick={clearSearch} disabled={!query && !activeQuery}>Clear</Button><Button className="master-data-add-action" type="button" startIcon={<AddOutlinedIcon />} variant="contained" onClick={() => open(null)}>Add {types.find((item) => item.key === type)?.label}</Button></Box>{(error || loadError) && <Alert severity="error">{error || loadError}</Alert>}
    <TableContainer sx={{ mt: 3 }}><Table aria-label="Master data values"><TableHead><TableRow><TableCell align="center">Name</TableCell>{hasParentCategory && <TableCell align="center">Parent / Category</TableCell>}<TableCell align="center">Status</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead><TableBody>{data?.items?.map((item) => <TableRow key={item.lookup_id}><TableCell align="center">{item.name}</TableCell>{hasParentCategory && <TableCell align="center">{options?.lookups?.find((lookup) => lookup.lookup_id === item.parent_id)?.name ?? options?.categories?.find((category) => category.category_id === item.category_id)?.name ?? '-'}</TableCell>}<TableCell align="center">{item.status}</TableCell><TableCell align="center">
      <Tooltip title="Edit">
        <IconButton aria-label={`Edit ${item.name}`} color="warning" onClick={() => open(item)}><EditOutlinedIcon /></IconButton>
      </Tooltip>
      <Tooltip title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
        <IconButton aria-label={`${item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${item.name}`} onClick={() => setTarget(item)}>
          {item.status === 'ACTIVE' ? <BlockOutlinedIcon /> : <ToggleOnOutlinedIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton aria-label={`Delete ${item.name}`} color="error" onClick={() => setDeleteTarget(item)}><DeleteOutlineOutlinedIcon /></IconButton>
      </Tooltip>
    </TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <TablePagination component="div" count={data?.total ?? data?.items?.length ?? 0} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25, 50, 100]} onPageChange={(_event, nextPage) => setPage(nextPage)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} />
    <Dialog open={Boolean(edit)} onClose={() => !busy && setEdit(null)} fullWidth maxWidth="sm"><Box component="form" onSubmit={save}><DialogTitle>{edit?.id ? 'Edit' : 'Add'} Master Value</DialogTitle><DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Name" required value={edit?.name ?? ''} onChange={(event) => setEdit({ ...edit, name: event.target.value })} inputProps={{ maxLength: 100 }} />{type === 'JOB_ROLE' && !edit?.id && <TextField label="Department" select required value={edit?.parentId ?? ''} onChange={(event) => setEdit({ ...edit, parentId: event.target.value })}>{options?.lookups?.filter((item) => item.lookup_type === 'DEPARTMENT').map((item) => <MenuItem key={item.lookup_id} value={item.lookup_id}>{item.name}</MenuItem>)}</TextField>}{type === 'SUBCATEGORY' && !edit?.id && <TextField label="Category" select required value={edit?.categoryId ?? ''} onChange={(event) => setEdit({ ...edit, categoryId: event.target.value })}>{options?.categories?.map((item) => <MenuItem key={item.category_id} value={item.category_id}>{item.name}</MenuItem>)}</TextField>}{type === 'PROGRAM_BATCH' && <><TextField label="Start Date" type="date" required InputLabelProps={{ shrink: true }} value={edit?.startDate ?? ''} onChange={(event) => setEdit({ ...edit, startDate: event.target.value })} /><TextField label="End Date" type="date" required InputLabelProps={{ shrink: true }} value={edit?.endDate ?? ''} onChange={(event) => setEdit({ ...edit, endDate: event.target.value })} /></>}</Box></DialogContent><DialogActions><Button onClick={() => setEdit(null)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>Save</Button></DialogActions></Box></Dialog>
    <Dialog open={Boolean(target)} onClose={() => !busy && setTarget(null)}><DialogTitle>{target?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} {target?.name}?</DialogTitle><DialogActions><Button onClick={() => setTarget(null)} disabled={busy}>Cancel</Button><Button onClick={changeStatus} disabled={busy}>Confirm</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deleteTarget)} onClose={() => !busy && setDeleteTarget(null)}>
      <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
      <DialogContent>
        <Typography>This will permanently delete this {types.find((item) => item.key === type)?.label.toLowerCase()} value. If it is referenced by other records, deletion will be blocked.</Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
        <Button color="error" onClick={deleteValue} disabled={busy}>{busy ? <CircularProgress size={18} /> : 'Delete'}</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
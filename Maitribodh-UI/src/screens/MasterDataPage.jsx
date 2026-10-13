import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { api } from '../api.js';
import { requestMessage, useResource } from '../utils/resources.js';

const types = [
  { key: 'DEPARTMENT', label: 'Departments' }, { key: 'JOB_ROLE', label: 'Job Roles' },
  { key: 'SUBCATEGORY', label: 'Subcategories' }, { key: 'ID_PROOF_TYPE', label: 'ID Proof Types' },
  { key: 'BLACKLIST_REASON', label: 'Blacklist Reasons' }, { key: 'PERMISSION_LEVEL', label: 'Permission Levels' },
  { key: 'PROGRAM_BATCH', label: 'Programs & Batches' },
];
export default function MasterDataPage() {
  const [type, setType] = useState('DEPARTMENT');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [edit, setEdit] = useState(null);
  const [target, setTarget] = useState(null);
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
  function searchValues(event) {
    event.preventDefault();
    setPage(0);
    setActiveQuery(query.trim());
  }
  function clearSearch() { setQuery(''); setActiveQuery(''); setPage(0); }
  return <Box className="master-data-page"><Box className="page-heading"><Typography component="h1" variant="h1">Master Data</Typography><Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={() => open(null)}>Add {types.find((item) => item.key === type)?.label}</Button></Box>{(error || loadError) && <Alert severity="error">{error || loadError}</Alert>}
    <Tabs value={type} onChange={(_event, value) => { setType(value); setPage(0); setError(''); }} variant="scrollable" scrollButtons="auto">{types.map((item) => <Tab key={item.key} value={item.key} label={item.label} />)}</Tabs>
    <Box component="form" className="filter-toolbar" onSubmit={searchValues} sx={{ mt: 2 }}><TextField label={`Search ${types.find((item) => item.key === type)?.label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} inputProps={{ maxLength: 100 }} /><Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />}>Search</Button><Button type="button" onClick={clearSearch} disabled={!query && !activeQuery}>Clear</Button></Box>
    <TableContainer sx={{ mt: 3 }}><Table aria-label="Master data values"><TableHead><TableRow><TableCell align="center">Name</TableCell><TableCell align="center">Parent / Category</TableCell><TableCell align="center">Status</TableCell><TableCell align="center">Actions</TableCell></TableRow></TableHead><TableBody>{data?.items?.map((item) => <TableRow key={item.lookup_id}><TableCell align="center">{item.name}</TableCell><TableCell align="center">{options?.lookups?.find((lookup) => lookup.lookup_id === item.parent_id)?.name ?? options?.categories?.find((category) => category.category_id === item.category_id)?.name ?? '-'}</TableCell><TableCell align="center">{item.status}</TableCell><TableCell align="center"><Button startIcon={<EditOutlinedIcon />} onClick={() => open(item)}>Edit</Button><Button onClick={() => setTarget(item)}>{item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <TablePagination component="div" count={data?.total ?? data?.items?.length ?? 0} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25, 50, 100]} onPageChange={(_event, nextPage) => setPage(nextPage)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} />
    <Dialog open={Boolean(edit)} onClose={() => !busy && setEdit(null)} fullWidth maxWidth="sm"><Box component="form" onSubmit={save}><DialogTitle>{edit?.id ? 'Edit' : 'Add'} Master Value</DialogTitle><DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Name" required value={edit?.name ?? ''} onChange={(event) => setEdit({ ...edit, name: event.target.value })} inputProps={{ maxLength: 100 }} />{type === 'JOB_ROLE' && !edit?.id && <TextField label="Department" select required value={edit?.parentId ?? ''} onChange={(event) => setEdit({ ...edit, parentId: event.target.value })}>{options?.lookups?.filter((item) => item.lookup_type === 'DEPARTMENT').map((item) => <MenuItem key={item.lookup_id} value={item.lookup_id}>{item.name}</MenuItem>)}</TextField>}{type === 'SUBCATEGORY' && !edit?.id && <TextField label="Category" select required value={edit?.categoryId ?? ''} onChange={(event) => setEdit({ ...edit, categoryId: event.target.value })}>{options?.categories?.map((item) => <MenuItem key={item.category_id} value={item.category_id}>{item.name}</MenuItem>)}</TextField>}{type === 'PROGRAM_BATCH' && <><TextField label="Start Date" type="date" required InputLabelProps={{ shrink: true }} value={edit?.startDate ?? ''} onChange={(event) => setEdit({ ...edit, startDate: event.target.value })} /><TextField label="End Date" type="date" required InputLabelProps={{ shrink: true }} value={edit?.endDate ?? ''} onChange={(event) => setEdit({ ...edit, endDate: event.target.value })} /></>}</Box></DialogContent><DialogActions><Button onClick={() => setEdit(null)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>Save</Button></DialogActions></Box></Dialog>
    <Dialog open={Boolean(target)} onClose={() => !busy && setTarget(null)}><DialogTitle>{target?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} {target?.name}?</DialogTitle><DialogActions><Button onClick={() => setTarget(null)} disabled={busy}>Cancel</Button><Button onClick={changeStatus} disabled={busy}>Confirm</Button></DialogActions></Dialog>
  </Box>;
}
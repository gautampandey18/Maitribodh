import { useRef, useState } from 'react';
import { Alert, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../api.js';
import { QrPreview } from './PersonDetailPage.jsx';
import { requestMessage } from '../utils/resources.js';

export default function QrPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  async function search(event, nextPage = 0, nextRowsPerPage = rowsPerPage) {
    event?.preventDefault();
    const currentRequestId = ++requestId.current;
    setPage(nextPage); setRowsPerPage(nextRowsPerPage); setBusy(true); setError('');
    try {
      const { data } = await api.get('/persons', { params: { q: query, status: 'ACTIVE', page: nextPage + 1, pageSize: nextRowsPerPage } });
      if (currentRequestId !== requestId.current) return;
      setItems(data.items); setTotal(data.total); setSelected(null);
    } catch (failure) {
      if (currentRequestId === requestId.current) setError(requestMessage(failure));
    } finally {
      if (currentRequestId === requestId.current) setBusy(false);
    }
  }
  return <Box><Box className="page-heading"><Typography component="h1" variant="h1">QR / Identity Management</Typography></Box>{error && <Alert severity="error">{error}</Alert>}<Box component="form" className="filter-toolbar" onSubmit={(event) => search(event, 0)}><TextField label="Search person ID, name or mobile" value={query} onChange={(event) => setQuery(event.target.value)} required /><Button type="submit" variant="contained" disabled={busy}>Search</Button></Box><Box className="identity-layout"><Box><TableContainer><Table aria-label="QR identities"><TableHead><TableRow>{['Name', 'Category', 'Mobile', 'QR Status'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{items.map((item) => <TableRow key={item.person_id} hover selected={selected?.person_id === item.person_id} onClick={() => setSelected(item)}><TableCell><Button onClick={() => setSelected(item)}>{item.name}</Button></TableCell><TableCell>{item.category}</TableCell><TableCell>{item.mobile}</TableCell><TableCell>Current</TableCell></TableRow>)}</TableBody></Table></TableContainer><TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25, 50, 100]} onPageChange={(_event, nextPage) => search(null, nextPage)} onRowsPerPageChange={(event) => search(null, 0, Number(event.target.value))} /></Box>{selected && <Box key={selected.person_id}><Typography variant="h3">{selected.name}</Typography><Typography>{selected.person_code}</Typography><QrPreview personId={selected.person_id} personCode={selected.person_code} /></Box>}</Box></Box>;
}
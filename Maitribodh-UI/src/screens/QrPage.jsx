import { useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../api.js';
import { QrPreview } from './PersonDetailPage.jsx';
import { requestMessage } from '../utils/resources.js';

export default function QrPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  async function search(event) {
    event?.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    const currentRequestId = ++requestId.current;
    setHasSearched(true);
    setItems([]);
    setSelected(null);
    setEmptyMessage('');
    setBusy(true);
    setError('');
    try {
      const { data } = await api.get('/persons', { params: { q: normalizedQuery, status: 'ACTIVE', page: 1, pageSize: 2 } });
      if (currentRequestId !== requestId.current) return;
      const matchCount = data.total ?? data.items.length;
      if (matchCount === 1) {
        setItems(data.items.slice(0, 1));
        setSelected(data.items[0]);
      } else {
        setEmptyMessage(matchCount === 0
          ? 'No user found.'
          : 'Multiple users found. Refine your search to identify one user.');
      }
    } catch (failure) {
      if (currentRequestId === requestId.current) {
        setEmptyMessage('');
        setError(requestMessage(failure));
      }
    } finally {
      if (currentRequestId === requestId.current) setBusy(false);
    }
  }
  return (
    <Box>
      <Box className="page-heading"><Typography component="h1" variant="h1">QR / Identity Management</Typography></Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="form" className="filter-toolbar" onSubmit={search}>
        <TextField label="Search person ID, name or mobile" value={query} onChange={(event) => setQuery(event.target.value)} required />
        <Button type="submit" variant="contained" disabled={busy}>Search</Button>
      </Box>
      {busy && <Box className="loading-state"><CircularProgress size={28} /></Box>}
      {!busy && emptyMessage && <Box className="empty-state-message" role="status">{emptyMessage}</Box>}
      {!busy && hasSearched && items.length > 0 && selected && (
        <Box className="identity-layout">
          <TableContainer>
            <Table className="qr-identity-table" aria-label="QR identity">
              <TableHead><TableRow>{['Name', 'Category', 'Mobile', 'QR Status'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.person_id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.mobile}</TableCell>
                    <TableCell>Current</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box key={selected.person_id}>
            <Typography variant="h3">{selected.name}</Typography>
            <Typography>{selected.person_code}</Typography>
            <QrPreview personId={selected.person_id} personCode={selected.person_code} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
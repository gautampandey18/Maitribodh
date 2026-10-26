import { useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { api } from '../api.js';
import { QrPreview } from './PersonDetailPage.jsx';
import { downloadBlob, requestMessage } from '../utils/resources.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function QrPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qrBlob, setQrBlob] = useState(null);
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
    setQrBlob(null);
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
  function printPreview() {
    if (!qrBlob) return;
    const url = URL.createObjectURL(qrBlob);
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) { URL.revokeObjectURL(url); return; }
    const image = previewWindow.document.createElement('img');
    image.src = url;
    image.alt = `QR code for ${selected.person_code}`;
    image.style.width = '240px';
    image.style.height = '240px';
    image.onload = () => previewWindow.print();
    previewWindow.document.body.append(image);
  }
  const isCurrent = selected?.status === 'ACTIVE' && (selected?.qr_version ?? 0) > 0;
  return (
    <Box>
      <Box className="page-heading"><Typography component="h1" variant="h1">QR / Identity Management</Typography></Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="form" className="filter-toolbar qr-search-toolbar" onSubmit={search}>
        <TextField label="Search person ID, name or mobile" value={query} onChange={(event) => setQuery(event.target.value)} required />
        <Button type="submit" variant="contained" disabled={busy}>Search</Button>
      </Box>
      {busy && <Box className="loading-state"><CircularProgress size={28} /></Box>}
      {!busy && emptyMessage && <Box className="empty-state-message" role="status">{emptyMessage}</Box>}
      {!busy && hasSearched && items.length > 0 && selected && (
        <Box className="identity-layout">
          <TableContainer className="qr-identity-table-container">
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
          <Box key={selected.person_id} component="section" className="qr-preview-card" aria-label="QR preview">
            <Box className="qr-preview-content-layout">
              <Box className="qr-code-frame">
                <QrPreview personId={selected.person_id} personCode={selected.person_code} onQrBlob={setQrBlob} />
              </Box>
              <Box className="qr-preview-info">
                <Typography className="qr-preview-name">{selected.name}</Typography>
                <Typography className="qr-preview-person-id">Person ID: {selected.person_code}</Typography>
                <Box className="qr-preview-details">
                  <Box className="qr-preview-detail"><Typography>Generated</Typography><Typography>{formatDate(selected.created_at)}</Typography></Box>
                  <Box className="qr-preview-detail"><Typography>Encodes</Typography><Typography>Registered mobile number</Typography></Box>
                  <Box className="qr-preview-detail"><Typography>Expiry</Typography><Typography>{selected.expires_on ? formatDate(selected.expires_on) : 'Never'}</Typography></Box>
                  <Box className="qr-preview-detail qr-preview-status-row"><Typography>Status</Typography><Box className={`qr-preview-status${isCurrent ? ' current' : ''}`}>{isCurrent ? 'Current' : selected.status}</Box></Box>
                </Box>
                <Box className="qr-preview-actions">
                  <Button variant="contained" startIcon={<DownloadOutlinedIcon />} disabled={!qrBlob} onClick={() => downloadBlob(qrBlob, `Maitribodh-QR-${selected.person_code}.png`)}>Download preview</Button>
                  <Button variant="outlined" startIcon={<PrintOutlinedIcon />} disabled={!qrBlob} onClick={printPreview}>Print</Button>
                </Box>
                <Typography className="qr-preview-caption">Scannable QR · encodes the registered mobile number.</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
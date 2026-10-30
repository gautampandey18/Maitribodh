import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { api } from '../api.js';
import PersonIdentityCard from '../components/PersonIdentityCard.jsx';
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
  const [photoSrc, setPhotoSrc] = useState('');
  const [qrBlob, setQrBlob] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const selectionId = useRef(0);

  useEffect(() => {
    let active = true;
    let url = '';
    setPhotoSrc('');
    const photoKey = selected?.photo_key || selected?.photoKey;
    const personId = selected?.person_id || selected?.personId;
    if (personId && photoKey) {
      api.get(`/persons/${personId}/files/${encodeURIComponent(photoKey)}`, { responseType: 'blob' })
        .then(({ data }) => {
          if (active && data instanceof Blob) {
            url = URL.createObjectURL(data);
            setPhotoSrc(url);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    };
  }, [selected?.person_id, selected?.personId, selected?.photo_key, selected?.photoKey]);

  async function selectPerson(item) {
    if (!item) return;
    const currentSelectionId = ++selectionId.current;
    setSelected(item);
    setQrBlob(null);
    if (item.person_id) {
      try {
        const detailRes = await api.get(`/persons/${item.person_id}`);
        if (currentSelectionId !== selectionId.current) return;
        if (detailRes?.data && typeof detailRes.data === 'object' && !(detailRes.data instanceof Blob)) {
          setSelected((prev) => (prev && prev.person_id === item.person_id ? { ...prev, ...detailRes.data } : prev));
        }
      } catch {
        // retain item summary
      }
    }
  }

  async function search(event) {
    event?.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    const currentRequestId = ++requestId.current;
    setHasSearched(true);
    setItems([]);
    setSelected(null);
    setPhotoSrc('');
    setQrBlob(null);
    setEmptyMessage('');
    setBusy(true);
    setError('');
    try {
      const { data } = await api.get('/persons', { params: { q: normalizedQuery, status: 'ACTIVE', page: 1, pageSize: 50 } });
      if (currentRequestId !== requestId.current) return;
      const matchCount = data.total ?? data.items?.length ?? 0;
      if (matchCount > 0 && data.items?.length) {
        setItems(data.items);
        selectPerson(data.items[0]);
      } else {
        setEmptyMessage('No user found.');
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
    if (!qrBlob || !selected) return;
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
                {items.map((item) => {
                  const isSelected = selected?.person_id === item.person_id;
                  return (
                    <TableRow
                      key={item.person_id}
                      hover
                      selected={isSelected}
                      onClick={() => {
                        if (selected?.person_id !== item.person_id) selectPerson(item);
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Button
                          variant="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (selected?.person_id !== item.person_id) selectPerson(item);
                          }}
                          sx={{
                            textTransform: 'none',
                            p: 0,
                            minWidth: 0,
                            textAlign: 'left',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'primary.main' : 'inherit',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {item.name}
                        </Button>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.mobile}</TableCell>
                      <TableCell>{item.status === 'ACTIVE' && (item.qr_version ?? 0) > 0 ? 'Current' : item.status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box key={selected.person_id} component="section" className="qr-identity-card-section" aria-label="QR preview">
            <PersonIdentityCard
              personId={selected.person_id}
              personCode={selected.person_code}
              name={selected.name}
              category={selected.category}
              status={selected.status}
              photoSrc={photoSrc}
              mobile={selected.mobile}
              qrVersion={selected.qr_version}
              onQrBlob={setQrBlob}
              fields={[
                ['Generated', formatDate(selected.created_at)],
                ['Encodes', 'Registered mobile number'],
                ['Expiry', selected.expires_on ? formatDate(selected.expires_on) : 'Never'],
                ['QR status', isCurrent ? 'Current' : selected.status],
              ]}
              footer={<>
                <Button size="small" variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={!qrBlob} onClick={() => downloadBlob(qrBlob, `Maitribodh-QR-${selected.person_code}.png`)}>Download QR</Button>
                <Button size="small" variant="outlined" startIcon={<PrintOutlinedIcon />} disabled={!qrBlob} onClick={printPreview}>Print</Button>
              </>}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

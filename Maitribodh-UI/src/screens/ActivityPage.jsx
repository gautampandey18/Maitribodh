import { useState } from 'react';
import { Alert, Badge, Box, Button, Drawer, IconButton, List, ListItem, ListItemText, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { api } from '../api.js';
import { csvBlob, downloadBlob, requestMessage, useResource } from '../utils/resources.js';

function formatAuditKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAuditScalar(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? `${value.length} items` : 'None';
  if (typeof value === 'object') return `${Object.keys(value).length} fields`;
  return String(value);
}

function AuditValueSummary({ value }) {
  const entries = value && typeof value === 'object' && !Array.isArray(value)
    ? Object.entries(value)
    : [['Value', value]];
  const visibleEntries = entries.slice(0, 3);

  return <Box sx={{ minWidth: 140, maxWidth: 260 }}>
    {visibleEntries.length ? visibleEntries.map(([key, itemValue]) => <Typography key={key} variant="caption" component="div" sx={{ overflowWrap: 'anywhere' }}>
      <strong>{formatAuditKey(key)}:</strong> {formatAuditScalar(itemValue)}
    </Typography>) : <Typography variant="caption">—</Typography>}
    {entries.length > visibleEntries.length && <Typography variant="caption" color="text.secondary">+{entries.length - visibleEntries.length} more fields</Typography>}
  </Box>;
}

export function NotificationsBell() {
  const { data, error, reload } = useResource('/notifications');
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  async function readAll() {
    setBusy(true); setFailure('');
    try { await api.post('/notifications/read'); reload(); }
    catch (requestError) { setFailure(requestMessage(requestError)); }
    finally { setBusy(false); }
  }
  return <>
    <Tooltip title="Notifications"><IconButton aria-label="Open notifications" onClick={() => { setOpen(true); reload(); }}><Badge badgeContent={data?.unreadCount ?? 0} color="error"><NotificationsOutlinedIcon /></Badge></IconButton></Tooltip>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)}><Box sx={{ width: 'min(420px, 100vw)', p: 3 }}><IconButton aria-label="Close notifications" onClick={() => setOpen(false)} sx={{ float: 'right' }}><CloseOutlinedIcon /></IconButton><Typography variant="h2">Notifications</Typography>{(failure || error) && <Alert severity="error">{failure || error}</Alert>}<Button onClick={readAll} disabled={busy || !data?.unreadCount}>Mark all as read</Button><List>{data?.items?.map((item) => <ListItem key={item.notification_id} divider><ListItemText primary={`${item.title}${item.is_read ? '' : ' · New'}`} secondary={<>{item.body}<br />{new Date(item.created_at).toLocaleString()}</>} /></ListItem>)}</List>{data?.items?.length === 0 && <Typography>No notifications.</Typography>}</Box></Drawer>
  </>;
}

export default function ActivityPage() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState(null);
  const params = new URLSearchParams({ page, pageSize, query, ...(userId ? { userId } : {}), ...(action ? { action } : {}) });
  const { data, error } = useResource(`/audit?${params}`);
  return <Box className="audit-page">
    <Box className="page-heading"><Typography variant="h1" component="h1">Audit &amp; Compliance</Typography><Button startIcon={<DownloadOutlinedIcon />} disabled={!data?.items?.length} onClick={() => downloadBlob(csvBlob(data.items), 'maitribodh-audit-page.csv')}>Export Page CSV</Button></Box>
    {error && <Alert severity="error">{error}</Alert>}
    <Box className="filter-toolbar"><TextField label="Search entry or mobile number" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><TextField label="User" select value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }}><MenuItem value="">All users</MenuItem>{data?.users?.map((item) => <MenuItem key={item.user_id} value={item.user_id}>{item.username}</MenuItem>)}</TextField><TextField label="Action" select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><MenuItem value="">All actions</MenuItem>{data?.actions?.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Box>
    <TableContainer><Table aria-label="Audit log"><TableHead><TableRow>{['Timestamp', 'User', 'Action', 'Module', 'Entity', 'Mobile', 'Old Value', 'New Value'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{data?.items?.map((item) => <TableRow hover key={item.audit_id} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }} sx={{ cursor: 'pointer' }}><TableCell>{new Date(item.occurred_at).toLocaleString()}</TableCell><TableCell>{item.actor ?? 'System'}</TableCell><TableCell>{item.activity}</TableCell><TableCell>{item.module}</TableCell><TableCell>{item.entity}</TableCell><TableCell>{item.person_mobile ?? '—'}</TableCell><TableCell><AuditValueSummary value={item.old_value} /></TableCell><TableCell><AuditValueSummary value={item.new_value} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <TablePagination component="div" count={data?.total ?? 0} page={page - 1} rowsPerPage={pageSize} rowsPerPageOptions={[5, 10, 25, 50, 100]} onPageChange={(_event, nextPage) => setPage(nextPage + 1)} onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} />
    <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}><Box sx={{ width: 'min(480px, 100vw)', p: 3 }}><IconButton aria-label="Close audit detail" onClick={() => setSelected(null)} sx={{ float: 'right' }}><CloseOutlinedIcon /></IconButton><Typography variant="h2">Audit Detail</Typography><Typography>{selected?.activity} · {selected?.entity}</Typography>{['old_value', 'new_value'].map((key) => <Box key={key} sx={{ mt: 3 }}><Typography variant="h3">{key === 'old_value' ? 'Before' : 'After'}</Typography><Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(selected?.[key], null, 2)}</Box></Box>)}<Typography>Actor: {selected?.actor ?? 'System'}</Typography></Box></Drawer>
  </Box>;
}
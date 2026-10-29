import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Box, Button, Drawer, IconButton, List, ListItem, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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
  const [showAll, setShowAll] = useState(false);
  const [panelRight, setPanelRight] = useState(12);
  const triggerRef = useRef(null);
  useEffect(() => {
    document.body.classList.toggle('notifications-panel-open', open);
    return () => document.body.classList.remove('notifications-panel-open');
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    function alignPanel() {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const panelWidth = Math.min(420, window.innerWidth - 24);
      const panelRightEdge = Math.max(panelWidth + 12, Math.min(window.innerWidth - 12, bounds.left + bounds.width / 2 + 76));
      setPanelRight(Math.max(12, window.innerWidth - panelRightEdge));
    }
    alignPanel();
    window.addEventListener('resize', alignPanel);
    return () => window.removeEventListener('resize', alignPanel);
  }, [open]);
  async function readAll() {
    setBusy(true); setFailure('');
    try { await api.post('/notifications/read'); reload(); }
    catch (requestError) { setFailure(requestMessage(requestError)); }
    finally { setBusy(false); }
  }
  function togglePanel() {
    if (open) setOpen(false);
    else { setShowAll(false); setOpen(true); reload(); }
  }
  const notifications = showAll ? data?.items ?? [] : (data?.items ?? []).slice(0, 7);
  return <>
    <Tooltip title={open ? 'Close notifications' : 'Notifications'}>
      <IconButton ref={triggerRef} className="notifications-trigger" aria-label={open ? 'Close notifications' : 'Open notifications'} aria-expanded={open} aria-controls="notification-panel" onClick={togglePanel}>
        <Badge badgeContent={data?.unreadCount ?? 0} color="error"><NotificationsOutlinedIcon /></Badge>
      </IconButton>
    </Tooltip>
    <Drawer
      anchor="top"
      className="notification-drawer"
      open={open}
      onClose={() => setOpen(false)}
      transitionDuration={{ enter: 280, exit: 220 }}
      ModalProps={{ keepMounted: true }}
      slotProps={{ paper: { 'aria-labelledby': 'notification-panel-title' } }}
    >
      <Box id="notification-panel" className="notification-panel" style={{ '--notification-panel-right': `${panelRight}px` }}>
        <Box className="notification-panel-header">
          <Box>
            <Typography id="notification-panel-title" variant="h2">Notification</Typography>
            <Typography className="notification-unread-count">{data?.unreadCount ?? 0} unread</Typography>
          </Box>
          <Box className="notification-panel-actions">
            <Button size="small" onClick={readAll} disabled={busy || !data?.unreadCount}>Mark all as read</Button>
            <IconButton aria-label="Dismiss notifications" onClick={() => setOpen(false)}><CloseOutlinedIcon /></IconButton>
          </Box>
        </Box>
        {(failure || error) && <Alert severity="error" sx={{ mb: 2 }}>{failure || error}</Alert>}
        <List className="notification-list" disablePadding>
          {notifications.map((item) => (
            <ListItem className={`notification-item${item.is_read ? '' : ' unread'}`} key={item.notification_id} divider>
              <Box className="notification-item-copy">
                <Typography className="notification-item-title">{item.title}</Typography>
                <Typography className="notification-item-body">{item.body}</Typography>
                <Typography className="notification-item-time">{new Date(item.created_at).toLocaleString()}</Typography>
              </Box>
              {!item.is_read && <Box className="notification-unread-dot" aria-label="Unread" />}
            </ListItem>
          ))}
        </List>
        {data?.items?.length === 0 && <Typography className="notification-empty">No notifications.</Typography>}
        {(data?.items?.length ?? 0) > 0 && <Box className="notification-panel-footer">
          <Button onClick={() => setShowAll((current) => !current)}>{showAll ? 'Show recent notifications' : 'View all notifications'} <span aria-hidden="true">»</span></Button>
        </Box>}
      </Box>
    </Drawer>
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
    <Paper component="section" className="table-panel audit-panel" aria-labelledby="audit-records-title" elevation={0}>
      <Box className="table-panel-heading">
        <Typography id="audit-records-title" component="h2" variant="h3">Audit records</Typography>
        <Typography variant="body2" color="text.secondary">{data ? `${data.total ?? 0} records` : 'Loading records…'}</Typography>
      </Box>
      <Box className="filter-toolbar audit-filters" role="group" aria-label="Audit filters">
        <TextField label="Search entry or mobile number" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <TextField label="User" select value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }}><MenuItem value="">All users</MenuItem>{data?.users?.map((item) => <MenuItem key={item.user_id} value={item.user_id}>{item.username}</MenuItem>)}</TextField>
        <TextField label="Action" select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><MenuItem value="">All actions</MenuItem>{data?.actions?.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
        <Button variant="outlined" disabled={!query && !userId && !action} onClick={() => { setQuery(''); setUserId(''); setAction(''); setPage(1); }}>Clear filters</Button>
      </Box>
      <TableContainer className="audit-table-container">
        <Table className="audit-table" aria-label="Audit log">
          <TableHead><TableRow>{['Timestamp', 'User', 'Action', 'Module', 'Entity', 'Mobile', 'Old Value', 'New Value'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {data?.items?.map((item) => (
              <TableRow hover key={item.audit_id} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item); } }} aria-label={`View audit detail: ${item.activity}, ${item.entity}`}>
                <TableCell className="audit-timestamp">{new Date(item.occurred_at).toLocaleString()}</TableCell>
                <TableCell>{item.actor ?? 'System'}</TableCell>
                <TableCell><Box component="span" className="audit-action-badge">{item.activity}</Box></TableCell>
                <TableCell><Box component="span" className="audit-module-badge">{item.module}</Box></TableCell>
                <TableCell>{item.entity}</TableCell>
                <TableCell className="audit-mobile">{item.person_mobile ?? '—'}</TableCell>
                <TableCell className="audit-before"><AuditValueSummary value={item.old_value} /></TableCell>
                <TableCell className="audit-after"><AuditValueSummary value={item.new_value} /></TableCell>
              </TableRow>
            ))}
            {!data?.items?.length && <TableRow><TableCell colSpan={8} className="empty-table">{error ? 'Audit records could not be loaded.' : data ? 'No audit records match the selected filters.' : 'Loading audit records…'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={data?.total ?? 0} page={page - 1} rowsPerPage={pageSize} rowsPerPageOptions={[5, 10, 25, 50, 100]} onPageChange={(_event, nextPage) => setPage(nextPage + 1)} onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} />
    </Paper>
    <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}><Box sx={{ width: 'min(480px, 100vw)', p: 3 }}><IconButton aria-label="Close audit detail" onClick={() => setSelected(null)} sx={{ float: 'right' }}><CloseOutlinedIcon /></IconButton><Typography variant="h2">Audit Detail</Typography><Typography>{selected?.activity} · {selected?.entity}</Typography>{['old_value', 'new_value'].map((key) => <Box key={key} sx={{ mt: 3 }}><Typography variant="h3">{key === 'old_value' ? 'Before' : 'After'}</Typography><Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(selected?.[key], null, 2)}</Box></Box>)}<Typography>Actor: {selected?.actor ?? 'System'}</Typography></Box></Drawer>
  </Box>;
}
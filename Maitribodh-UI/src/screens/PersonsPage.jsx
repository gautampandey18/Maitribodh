import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const statuses = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];

export default function PersonsPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function searchRecords(nextQuery, nextStatus, nextCategoryId, nextPage, nextRowsPerPage) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/persons', {
        params: {
          ...(nextQuery ? { q: nextQuery } : {}),
          ...(nextCategoryId ? { categoryId: Number(nextCategoryId) } : {}),
          ...(nextStatus ? { status: nextStatus } : {}),
          page: nextPage + 1,
          pageSize: nextRowsPerPage,
        },
      });
      if (currentRequestId !== requestId.current) return;
      setItems(response.data.items);
      setTotal(response.data.total);
      setPage(response.data.page - 1);
      setRowsPerPage(response.data.pageSize ?? nextRowsPerPage);
      setActiveQuery(nextQuery);
      setActiveStatus(nextStatus);
      setActiveCategoryId(nextCategoryId);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Registrations could not be searched.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    api.get('/persons/registration/options')
      .then(({ data }) => {
        if (mounted) setCategories(data.categories ?? []);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.error?.message ?? 'Categories could not be loaded.');
      });
    searchRecords('', '', '', 0, 5);
    return () => {
      mounted = false;
      requestId.current += 1;
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    searchRecords(normalizedQuery, status, categoryId, 0, rowsPerPage);
  }

  function changePage(nextPage) {
    searchRecords(activeQuery, activeStatus, activeCategoryId, nextPage, rowsPerPage);
  }

  function changeRowsPerPage(event) {
    searchRecords(activeQuery, activeStatus, activeCategoryId, 0, Number(event.target.value));
  }

  return (
    <Box className="persons-page">
      <Box className="page-heading">
        <Box>
          <Typography className="eyebrow">REGISTRATION</Typography>
          <Typography component="h1" variant="h1">Person Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Browse and filter person registrations.</Typography>
        </Box>
        <Button component={Link} to="/register" variant="contained">Register Person</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box component="form" className="person-search-form" onSubmit={submitSearch}>
          <TextField
            label="Search registrations"
            placeholder="Name, mobile, or person code"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputProps={{ maxLength: 100 }}
            fullWidth
          />
          <TextField label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} select sx={{ minWidth: 180 }}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((category) => <MenuItem key={category.category_id} value={category.category_id}>{category.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            select
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {statuses.map((item) => <MenuItem key={item} value={item}>{statusLabel(item)}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />} disabled={loading}>
            Search
          </Button>
        </Box>
        <Box className="table-panel-heading">
          <Typography variant="h3">Registration records</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading registrations' : `${total} registrations`}
          </Typography>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Registration search results">
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.person_id} hover>
                    <TableCell>
                      <Button component={Link} to={`/persons/${item.person_id}`} color="secondary" sx={{ p: 0, justifyContent: 'flex-start' }}>{item.name}</Button>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.mobile ?? '—'}</TableCell>
                    <TableCell><Chip size="small" label={statusLabel(item.status)} color={statusColor(item.status)} /></TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                  </TableRow>
                ))}
                {!items.length && !loading && (
                  <TableRow><TableCell colSpan={5} className="empty-table">No registrations found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => changePage(nextPage)}
          onRowsPerPageChange={changeRowsPerPage}
        />
      </Paper>

    </Box>
  );
}

function statusColor(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'REJECTED' || status === 'DEACTIVATED') return 'error';
  return 'warning';
}

function statusLabel(status) {
  return status === 'DEACTIVATED' ? 'Inactive' : status;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import CategorySchemaEditor from './CategorySchemaEditor.jsx';

const formTypes = ['STAFF', 'PARIVAR', 'VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT', 'GENERIC'];
const categoryStatuses = ['ACTIVE', 'INACTIVE'];
const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(50),
  formType: z.enum(formTypes),
  approvalRequired: z.boolean(),
  overstayCutoff: z.string(),
  permissionLevelId: z.string(),
  isBroad: z.boolean(),
  broadCategoryId: z.string(),
});

const emptyValues = {
  name: '',
  formType: 'GENERIC',
  approvalRequired: false,
  overstayCutoff: '',
  permissionLevelId: '',
  isBroad: false,
  broadCategoryId: '',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({ query: '', formType: '', status: '' });
  const [permissionLevels, setPermissionLevels] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const requestId = useRef(0);
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyValues,
  });

  async function loadData(nextPage = page, nextRowsPerPage = rowsPerPage, filters = activeFilters) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setActiveFilters(filters);
    setLoading(true);
    setError('');
    try {
      const [categoryResponse, permissionResponse] = await Promise.all([
        api.get('/categories', { params: {
          ...(filters.query ? { query: filters.query } : {}),
          ...(filters.formType ? { formType: filters.formType } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          page: nextPage + 1,
          pageSize: nextRowsPerPage,
        } }),
        api.get('/lookups/PERMISSION_LEVEL'),
      ]);
      if (currentRequestId !== requestId.current) return;
      setCategories(categoryResponse.data.items);
      setTotalCategories(categoryResponse.data.total ?? categoryResponse.data.items.length);
      setPermissionLevels(permissionResponse.data.items);
    } catch {
      if (currentRequestId !== requestId.current) return;
      setError('Category data could not be loaded. Check the API connection and try again.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function applyFilters(event) {
    event.preventDefault();
    loadData(0, rowsPerPage, { query: query.trim(), formType: formTypeFilter, status: statusFilter });
  }

  function clearFilters() {
    setQuery(''); setFormTypeFilter(''); setStatusFilter('');
    loadData(0, rowsPerPage, { query: '', formType: '', status: '' });
  }

  function openCreate() {
    setEditing(null);
    reset(emptyValues);
    setDialogOpen(true);
  }

  async function changeStatus() {
    setSaving(true);
    try {
      await api.patch(`/categories/${statusTarget.category_id}`, { status: statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      setStatusTarget(null);
      await loadData();
    } catch (failure) { setError(failure.response?.data?.error?.message ?? 'Category status could not be changed.'); }
    finally { setSaving(false); }
  }

  function openEdit(category) {
    setEditing(category);
    reset({
      name: category.name,
      formType: category.form_type,
      approvalRequired: category.approval_required,
      overstayCutoff: category.overstay_cutoff?.slice(0, 5) ?? '',
      permissionLevelId: category.permission_level_id?.toString() ?? '',
      isBroad: category.is_broad,
      broadCategoryId: category.broad_category_id?.toString() ?? '',
    });
    setDialogOpen(true);
  }

  async function saveCategory(values) {
    setSaving(true);
    setError('');
    const payload = {
      ...values,
      overstayCutoff: values.overstayCutoff || null,
      permissionLevelId: values.permissionLevelId ? Number(values.permissionLevelId) : null,
      broadCategoryId: values.broadCategoryId ? Number(values.broadCategoryId) : null,
    };
    try {
      if (editing) {
        await api.patch(`/categories/${editing.category_id}`, payload);
        setNotice('Category updated');
      } else {
        await api.post('/categories', payload);
        setNotice('Category created');
      }
      setDialogOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Category could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className="categories-page">
      <Box className="page-heading">
        <Box>
          <Typography className="eyebrow">MASTER DATA</Typography>
          <Typography component="h1" variant="h1">Categories</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Configure registration and access categories.</Typography>
        </Box>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate}>
          Add category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box className="table-panel-heading">
          <Typography variant="h3">Registration categories</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${totalCategories} categories`}</Typography>
        </Box>
        <Box component="form" className="filter-toolbar" onSubmit={applyFilters}>
          <TextField label="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} inputProps={{ maxLength: 100 }} />
          <TextField label="Form type" select value={formTypeFilter} onChange={(event) => setFormTypeFilter(event.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="">All form types</MenuItem>{formTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <TextField label="Status" select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 145 }}>
            <MenuItem value="">All statuses</MenuItem>{categoryStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />} disabled={loading}>Apply</Button>
          <Button type="button" onClick={clearFilters} disabled={loading || (!activeFilters.query && !activeFilters.formType && !activeFilters.status && !query && !formTypeFilter && !statusFilter)}>Clear</Button>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="medium" aria-label="Registration categories">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Category</TableCell>
                  <TableCell align="center">Form</TableCell>
                  <TableCell align="center">Permission</TableCell>
                  <TableCell align="center">Approval</TableCell>
                  <TableCell align="center">Overstay cutoff</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.category_id} hover>
                    <TableCell align="center">
                      <Typography fontWeight={600}>{category.name}</Typography>
                      {category.is_broad && <Typography variant="caption" color="text.secondary">Broad category</Typography>}
                    </TableCell>
                    <TableCell align="center">{category.form_type}</TableCell>
                    <TableCell align="center">{category.permission_level ?? '—'}</TableCell>
                    <TableCell align="center">{category.approval_required === null ? 'Decision pending' : category.approval_required ? 'Required' : 'Not required'}</TableCell>
                    <TableCell align="center">{category.overstay_cutoff?.slice(0, 5) ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit category">
                        <IconButton aria-label={`Edit ${category.name}`} onClick={() => openEdit(category)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <CategorySchemaEditor category={category} onSaved={loadData} />
                      <Button onClick={() => setStatusTarget(category)}>{category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!categories.length && (
                  <TableRow><TableCell colSpan={6} className="empty-table">No categories configured.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalCategories}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => loadData(nextPage)}
          onRowsPerPageChange={(event) => loadData(0, Number(event.target.value))}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit category' : 'Add category'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(saveCategory)} noValidate>
          <DialogContent className="category-form-grid">
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Category name" required fullWidth error={Boolean(errors.name)} helperText={errors.name?.message} />
            )} />
            <Controller name="formType" control={control} render={({ field }) => (
              <TextField {...field} select label="Form type" fullWidth>
                {formTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="permissionLevelId" control={control} render={({ field }) => (
              <TextField {...field} select label="Permission level" fullWidth>
                <MenuItem value="">None</MenuItem>
                {permissionLevels.map((level) => <MenuItem key={level.lookup_id} value={String(level.lookup_id)}>{level.name}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="overstayCutoff" control={control} render={({ field }) => (
              <TextField {...field} type="time" label="Overstay cutoff" fullWidth InputLabelProps={{ shrink: true }} />
            )} />
            <Controller name="approvalRequired" control={control} render={({ field }) => (
              <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Requires approval" />
            )} />
            <Controller name="isBroad" control={control} render={({ field }) => (
              <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Broad category" />
            )} />
            <Controller name="broadCategoryId" control={control} render={({ field }) => (
              <TextField {...field} select label="Base category mapping" fullWidth>
                <MenuItem value="">Unmapped</MenuItem>
                {categories.filter((item) => item.category_id !== editing?.category_id).map((item) => (
                  <MenuItem key={item.category_id} value={String(item.category_id)}>{item.name}</MenuItem>
                ))}
              </TextField>
            )} />
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : editing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={Boolean(statusTarget)} onClose={() => !saving && setStatusTarget(null)}><DialogTitle>{statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} {statusTarget?.name}?</DialogTitle><DialogActions><Button onClick={() => setStatusTarget(null)} disabled={saving}>Cancel</Button><Button onClick={changeStatus} disabled={saving}>Confirm</Button></DialogActions></Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}
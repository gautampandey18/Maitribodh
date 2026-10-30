import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
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
  Menu,
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
import { z } from 'zod';
import { api } from '../api.js';
import InternationalPhoneField from '../components/InternationalPhoneField.jsx';
import { splitPhoneNumber, toE164Phone } from '../utils/phone.js';

const roles = ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'REG_OFFICER', 'SECURITY_GUARD', 'VIEWER'];
const userStatuses = ['ACTIVE', 'INACTIVE'];
const userSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(100),
  lastName: z.string().trim().min(1, 'Enter a last name').max(100),
  mobile: z.string().trim().min(1, 'Enter a mobile number'),
  email: z.union([z.string().trim().email('Enter a valid email').max(150), z.literal('')]),
  username: z.string().trim().min(1, 'Enter a username').max(50),
  role: z.enum(roles),
  isSecurityHead: z.boolean(),
  canBulkUpload: z.boolean(),
});

const emptyUser = {
  firstName: '',
  lastName: '',
  mobile: '',
  mobileCountry: 'IN',
  email: '',
  username: '',
  role: 'REG_OFFICER',
  isSecurityHead: false,
  canBulkUpload: false,
};

export default function UsersPage() {
  const role = useSelector((state) => state.auth.user?.role);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState({ query: '', role: '', status: '' });
  const [userForm, setUserForm] = useState(emptyUser);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState(null);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [credential, setCredential] = useState(null);
  const requestId = useRef(0);

  async function loadUsers(nextPage = page, nextRowsPerPage = rowsPerPage, filters = activeFilters) {
    const currentRequestId = ++requestId.current;
    setPage(nextPage);
    setRowsPerPage(nextRowsPerPage);
    setActiveFilters(filters);
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users', { params: {
        ...(filters.query ? { query: filters.query } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        page: nextPage + 1,
        pageSize: nextRowsPerPage,
      } });
      if (currentRequestId !== requestId.current) return;
      setUsers(response.data.items);
      setTotalUsers(response.data.total ?? response.data.items.length);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      setError(requestError.response?.data?.error?.message ?? 'Users could not be loaded.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function applyFilters(event) {
    event.preventDefault();
    loadUsers(0, rowsPerPage, { query: query.trim(), role: roleFilter, status: statusFilter });
  }

  function clearFilters() {
    setQuery(''); setRoleFilter(''); setStatusFilter('');
    loadUsers(0, rowsPerPage, { query: '', role: '', status: '' });
  }

  function updateForm(event) {
    const { name, value, checked, type } = event.target;
    setUserForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function createUser(event) {
    event.preventDefault();
    const parsed = userSchema.safeParse(userForm);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }

    const e164 = toE164Phone(userForm.mobile, userForm.mobileCountry || 'IN');
    if (!e164) {
      setFormError('Enter a valid mobile number for the selected country');
      return;
    }
    const payloadMobile = userForm.mobileCountry === 'IN' && /^\d{10}$/.test(userForm.mobile)
      ? userForm.mobile
      : e164;

    setSaving(true);
    setFormError('');
    setError('');
    let createdUser;
    try {
      const response = await api.post('/users', { ...parsed.data, mobile: payloadMobile });
      createdUser = response.data;
      const passwordResponse = await api.post(`/users/${response.data.user_id}/password-reset`);
      setCreateOpen(false);
      setUserForm(emptyUser);
      await loadUsers();
      setCredential({
        username: response.data.username,
        temporaryPassword: passwordResponse.data.temporaryPassword,
        expiresAt: passwordResponse.data.expiresAt,
      });
    } catch (requestError) {
      if (createdUser) {
        setCreateOpen(false);
        setUserForm(emptyUser);
        await loadUsers();
        setError('User was created, but temporary password issuance failed. Issue it from the user list.');
      } else {
        const message = requestError.response?.data?.error?.message ?? 'User could not be created.';
        await loadUsers();
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(user) {
    setError('');
    setSaving(true);
    try {
      const response = await api.post(`/users/${user.user_id}/password-reset`);
      setCredential({
        username: user.username,
        temporaryPassword: response.data.temporaryPassword,
        expiresAt: response.data.expiresAt,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Temporary password could not be issued.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleBulkPermission(user) {
    setError('');
    try {
      const response = await api.patch(`/users/${user.user_id}`, { canBulkUpload: !user.can_bulk_upload });
      setUsers((current) => current.map((item) => item.user_id === user.user_id ? response.data : item));
      setNotice(response.data.can_bulk_upload ? 'Bulk upload enabled' : 'Bulk upload disabled');
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Permission could not be updated.');
    }
  }

  function openUserActions(event, user) {
    setActionAnchor(event.currentTarget);
    setActionUser(user);
  }

  function closeUserActions() {
    setActionAnchor(null);
    setActionUser(null);
  }

  function openEditUser(user) {
    setEditTarget(user);
    const phone = splitPhoneNumber(user.mobile);
    setUserForm({
      firstName: user.first_name,
      lastName: user.last_name,
      mobile: phone.number,
      mobileCountry: phone.country || 'IN',
      email: user.email ?? '',
      username: user.username,
      role: user.role,
      isSecurityHead: user.is_security_head,
      canBulkUpload: user.can_bulk_upload,
    });
    setFormError('');
    setCreateOpen(true);
    closeUserActions();
  }

  async function saveUser(event) {
    event.preventDefault();
    const parsed = userSchema.safeParse(userForm);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    const e164 = toE164Phone(userForm.mobile, userForm.mobileCountry || 'IN');
    if (!e164) {
      setFormError('Enter a valid mobile number for the selected country');
      return;
    }
    const payloadMobile = userForm.mobileCountry === 'IN' && /^\d{10}$/.test(userForm.mobile)
      ? userForm.mobile
      : e164;
    setSaving(true);
    setFormError('');
    setError('');
    try {
      await api.patch(`/users/${editTarget.user_id}`, { ...parsed.data, mobile: payloadMobile });
      setCreateOpen(false);
      setEditTarget(null);
      setUserForm(emptyUser);
      await loadUsers();
      setNotice(`${parsed.data.username} updated`);
    } catch (requestError) {
      setFormError(requestError.response?.data?.error?.message ?? 'User could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!actionUser) return;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/users/${actionUser.user_id}`);
      setUsers((current) => current.filter((item) => item.user_id !== actionUser.user_id));
      setTotalUsers((current) => Math.max(0, current - 1));
      setNotice(`${actionUser.username} deleted`);
      closeUserActions();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'User could not be deleted.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivateUser() {
    if (!deactivateTarget) return;
    setSaving(true);
    setError('');
    try {
      const response = await api.patch(`/users/${deactivateTarget.user_id}`, { deactivate: true });
      setUsers((current) => current.map((item) => item.user_id === deactivateTarget.user_id ? response.data : item));
      setNotice(`${deactivateTarget.username} deactivated`);
      setDeactivateTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'User could not be deactivated.');
    } finally {
      setSaving(false);
    }
  }

  async function activateUser() {
    if (!activateTarget) return;
    setSaving(true);
    setError('');
    try {
      const response = await api.patch(`/users/${activateTarget.user_id}`, { activate: true });
      setUsers((current) => current.map((item) => item.user_id === activateTarget.user_id ? response.data : item));
      setNotice(`${activateTarget.username} activated`);
      setActivateTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'User could not be activated.');
    } finally {
      setSaving(false);
    }
  }

  async function copyCredential() {
    try {
      await navigator.clipboard.writeText(credential.temporaryPassword);
      setNotice('Temporary password copied');
    } catch {
      setError('Clipboard access is unavailable. Select and copy the temporary password manually.');
    }
  }

  const availableRoles = role === 'SUPER_ADMIN' ? roles : roles.filter((item) => item !== 'SUPER_ADMIN');

  return (
    <Box className="users-page">
      <Box className="page-heading">
        <Box>
          <Typography component="h1" variant="h1">Users</Typography>
        </Box>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => { setFormError(''); setEditTarget(null); setUserForm(emptyUser); setCreateOpen(true); }}>
          Add user
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper className="table-panel" elevation={0}>
        <Box className="table-panel-heading">
          <Typography variant="h3">Application accounts</Typography>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading' : `${totalUsers} users`}</Typography>
        </Box>
        <Box component="form" className="filter-toolbar" onSubmit={applyFilters}>
          <TextField label="Search name, username, email or mobile" value={query} onChange={(event) => setQuery(event.target.value)} inputProps={{ maxLength: 100 }} />
          <TextField label="Role" select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="">All roles</MenuItem>{roles.map((item) => <MenuItem key={item} value={item}>{item.replaceAll('_', ' ')}</MenuItem>)}
          </TextField>
          <TextField label="Status" select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 145 }}>
            <MenuItem value="">All statuses</MenuItem>{userStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchOutlinedIcon />} disabled={loading}>Apply</Button>
          <Button type="button" onClick={clearFilters} disabled={loading || (!activeFilters.query && !activeFilters.role && !activeFilters.status && !query && !roleFilter && !statusFilter)}>Clear</Button>
        </Box>
        {loading ? (
          <Box className="loading-state"><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer>
            <Table size="medium" aria-label="Application users">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Bulk upload</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{user.first_name} {user.last_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.username} · {user.mobile}</Typography>
                    </TableCell>
                    <TableCell>{user.role.replaceAll('_', ' ')}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>{user.can_bulk_upload ? 'Enabled' : 'Disabled'}</TableCell>
                    <TableCell align="right" className="user-actions">
                      <Tooltip title="Issue temporary password">
                        <span>
                          <IconButton
                            aria-label={`Issue temporary password for ${user.username}`}
                            onClick={() => setPasswordResetTarget(user)}
                            disabled={user.status !== 'ACTIVE' || saving}
                          >
                            <KeyOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={user.can_bulk_upload ? 'Disable bulk upload' : 'Enable bulk upload'}>
                        <span>
                          <IconButton
                            aria-label={`${user.can_bulk_upload ? 'Disable' : 'Enable'} bulk upload for ${user.username}`}
                            color={user.can_bulk_upload ? 'success' : 'default'}
                            onClick={() => toggleBulkPermission(user)}
                            disabled={user.status !== 'ACTIVE'}
                          >
                            <ToggleOnOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Actions">
                        <IconButton aria-label={`Actions for ${user.username}`} onClick={(event) => openUserActions(event, user)}>
                          <MoreVertOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow><TableCell colSpan={5} className="empty-table">No users found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_event, nextPage) => loadUsers(nextPage)}
          onRowsPerPageChange={(event) => loadUsers(0, Number(event.target.value))}
        />
      </Paper>

      <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={closeUserActions}>
        <MenuItem onClick={() => openEditUser(actionUser)} disabled={!actionUser}><EditOutlinedIcon fontSize="small" />Update</MenuItem>
        {actionUser?.status === 'ACTIVE'
          ? <MenuItem onClick={() => { setDeactivateTarget(actionUser); closeUserActions(); }}><BlockOutlinedIcon fontSize="small" />Deactivate</MenuItem>
          : <MenuItem onClick={() => { setActivateTarget(actionUser); closeUserActions(); }} disabled={!actionUser}><ToggleOnOutlinedIcon fontSize="small" />Activate</MenuItem>}
        <MenuItem onClick={deleteUser} disabled={!actionUser}><DeleteOutlineOutlinedIcon fontSize="small" />Delete</MenuItem>
      </Menu>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editTarget ? 'Update user' : 'Add user'}</DialogTitle>
        <Box component="form" onSubmit={editTarget ? saveUser : createUser} noValidate>
          <DialogContent className="category-form-grid">
            {formError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{formError}</Alert>}
            <TextField name="firstName" label="First name" value={userForm.firstName} onChange={updateForm} required fullWidth />
            <TextField name="lastName" label="Last name" value={userForm.lastName} onChange={updateForm} required fullWidth />
            <InternationalPhoneField
              label="Mobile"
              country={userForm.mobileCountry || 'IN'}
              number={userForm.mobile}
              onCountryChange={(country) => setUserForm((previous) => ({ ...previous, mobileCountry: country }))}
              onNumberChange={(value) => setUserForm((previous) => ({ ...previous, mobile: value }))}
              required
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField name="email" label="Email" value={userForm.email} onChange={updateForm} fullWidth />
            <TextField name="username" label="Username" value={userForm.username} onChange={updateForm} required fullWidth />
            <TextField name="role" label="Role" value={userForm.role} onChange={updateForm} select fullWidth>
              {availableRoles.map((item) => <MenuItem key={item} value={item}>{item.replaceAll('_', ' ')}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Checkbox name="isSecurityHead" checked={userForm.isSecurityHead} onChange={updateForm} />} label="Security head" />
            <FormControlLabel control={<Checkbox name="canBulkUpload" checked={userForm.canBulkUpload} onChange={updateForm} />} label="Can upload bulk registrations" />
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : editTarget ? 'Save changes' : 'Create and issue credential'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deactivateTarget)} onClose={() => !saving && setDeactivateTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Deactivate user</DialogTitle>
        <DialogContent>
          <Typography>Deactivate {deactivateTarget?.username}? Their active sessions will be revoked.</Typography>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setDeactivateTarget(null)} disabled={saving}>Cancel</Button>
          <Button onClick={deactivateUser} variant="contained" color="error" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(activateTarget)} onClose={() => !saving && setActivateTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Activate user</DialogTitle>
        <DialogContent>
          <Typography>Activate {activateTarget?.username}? They will be able to log in again.</Typography>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setActivateTarget(null)} disabled={saving}>Cancel</Button>
          <Button onClick={activateUser} variant="contained" color="secondary" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(passwordResetTarget)} onClose={() => !saving && setPasswordResetTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Issue temporary password?</DialogTitle>
        <DialogContent>
          <Typography>Issue a new temporary password for {passwordResetTarget?.username}? Any existing temporary password will no longer work.</Typography>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setPasswordResetTarget(null)} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => {
              const target = passwordResetTarget;
              setPasswordResetTarget(null);
              resetPassword(target);
            }}
            variant="contained"
            color="secondary"
            disabled={saving}
          >
            Issue temporary password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(credential)} onClose={() => setCredential(null)} fullWidth maxWidth="sm">
        <DialogTitle>Temporary password</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Deliver out of band. This credential is shown once and expires {credential ? formatDate(credential.expiresAt) : ''}.
          </Typography>
          <Typography variant="body2">Username: {credential?.username}</Typography>
          <Box className="temporary-credential">
            <Typography component="code" aria-label="Temporary password" sx={{ wordBreak: 'break-all' }}>
              {credential?.temporaryPassword}
            </Typography>
            <Tooltip title="Copy temporary password">
              <IconButton aria-label="Copy temporary password" onClick={copyCredential}>
                <ContentCopyOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setCredential(null)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

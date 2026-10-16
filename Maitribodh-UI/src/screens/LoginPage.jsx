import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import { api } from '../api.js';
import { sessionStarted } from '../store.js';
import { canAccessPath, landingPath } from '../constants/navigation.js';

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export default function LoginPage() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  if (auth.accessToken) {
    return <Navigate to={auth.mustChangePassword ? '/password' : landingPath(auth.user?.role)} replace />;
  }

  async function onSubmit(values) {
    setServerError('');
    try {
      const { data } = await api.post('/auth/login', values);
      dispatch(sessionStarted(data));
      const destination = canAccessPath(data.user?.role, location.state?.from ?? '') ? location.state.from : landingPath(data.user?.role);
      navigate(data.mustChangePassword ? '/password' : destination, { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.error?.code;
      setServerError(code === 'ACCOUNT_DEACTIVATED'
        ? 'Your account is deactivated. Contact the administrator to restore access.'
        : status === 429
          ? 'Too many attempts. Wait before trying again.'
          : status === 401
            ? 'The username or password is incorrect.'
            : 'Sign-in is temporarily unavailable. Try again.');
    }
  }

  return (
    <Box className="login-page">
      <Box component="section" className="login-brand-panel">
        <Box className="login-brand-lockup">
          <Box className="login-brand-dot" />
          <Typography>MAITRIBODH ASHRAM · AMS</Typography>
        </Box>
        <Box className="login-brand-copy">
          <Typography className="eyebrow">ACCESS OPERATIONS</Typography>
          <Typography component="h1" className="login-brand-heading">One record per person. Every gate, every time.</Typography>
          <Typography className="login-brand-description">
            Register once as Staff, Visitor, Vendor, Contractor, Participant, or Parivar Member. Every future visit is just a scan away.
          </Typography>
        </Box>
        <Box className="login-security">
          <LockOutlinedIcon fontSize="small" />
          <Typography>Secured connection · Security Guard sessions remain valid for at least 12 hours · Access is logged for compliance.</Typography>
        </Box>
      </Box>
      <Box component="main" className="login-form-wrap">
        <Box className="login-form-column">
          <Typography className="eyebrow">SECURE PORTAL</Typography>
          <Typography component="h2" className="login-title">Sign in to your account</Typography>
          <Typography className="login-subtitle">Enter your credentials to continue.</Typography>
          {serverError && <Alert severity="error" className="login-alert">{serverError}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Username"
                  autoComplete="username"
                  autoFocus
                  fullWidth
                  error={Boolean(errors.username)}
                  helperText={errors.username?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment> }}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  fullWidth
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment> }}
                />
              )}
            />
            <Button type="submit" variant="contained" color="secondary" size="large" disabled={isSubmitting} endIcon={isSubmitting ? <CircularProgress size={18} /> : <ArrowForwardIcon />}>
              {isSubmitting ? 'Signing in' : 'Sign in'}
            </Button>
          </Box>
          <Button component={Link} to="/public-qr" variant="text" color="inherit" startIcon={<QrCode2OutlinedIcon />} fullWidth sx={{ mt: 1.5 }}>
            Retrieve your QR code
          </Button>
          <Typography className="login-footer">Accounts are provisioned by an administrator.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
    return <Navigate to={auth.mustChangePassword ? '/password' : landingPath(auth.user)} replace />;
  }

  async function onSubmit(values) {
    setServerError('');
    try {
      const { data } = await api.post('/auth/login', values);
      dispatch(sessionStarted(data));
      const destination = canAccessPath(data.user, location.state?.from ?? '') ? location.state.from : landingPath(data.user);
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
          <Box component="img" className="login-brand-logo" src="/maitriboddlogo.png" alt="Maitribodh logo" />
          <Box>
            <Typography className="login-brand-name">Maitribodh</Typography>
            <Typography className="login-brand-tagline">ASHRAM OPERATIONS</Typography>
          </Box>
        </Box>
        <Box className="login-brand-copy">
          <Typography className="login-brand-eyebrow">PURPOSEFUL SERVICE, THOUGHTFULLY MANAGED</Typography>
          <Typography component="h1" className="login-brand-heading">Welcome to Maitribodh Ashram</Typography>
          <Typography className="login-brand-description">
            A secure and unified platform to manage ashram operations, visitors, and facility access.
          </Typography>
          <Typography className="login-brand-motto">
            <span aria-hidden="true">✦</span>
            Seva through clarity and care
            <span aria-hidden="true">✦</span>
          </Typography>
        </Box>
      </Box>
      <Box component="main" className="login-form-wrap">
        <Box className="login-form-column">
          <Typography className="eyebrow">SECURE PORTAL</Typography>
          <Typography component="h2" className="login-title">Sign in to your account</Typography>
          <Typography className="login-subtitle">Enter your credentials to continue.</Typography>
          {auth.logoutReason && <Alert severity="info" className="login-alert">
            {auth.logoutReason === 'inactive'
              ? 'You were signed out after 30 minutes of inactivity. Please sign in again.'
              : 'Your session has expired. Please sign in again.'}
          </Alert>}
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
          {/* Temporarily hidden; restore when the public ID card flow is ready.
          <Button component={Link} to="/public-qr" variant="text" color="inherit" startIcon={<QrCode2OutlinedIcon />} fullWidth sx={{ mt: 1.5 }}>
            Retrieve your QR code
          </Button>
          */}
          <Typography className="login-footer">Accounts are provisioned by an administrator.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
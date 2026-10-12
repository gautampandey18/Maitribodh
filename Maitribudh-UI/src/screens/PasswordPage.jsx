import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { api } from '../api.js';
import { passwordChanged } from '../store.js';

const schema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(10, 'Use at least 10 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

export default function PasswordPage() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!auth.accessToken) return <Navigate to="/login" replace />;

  async function onSubmit({ currentPassword, newPassword }) {
    setServerError('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      dispatch(passwordChanged());
      navigate('/login', { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.error?.message ?? 'Password could not be changed. Try again.');
    }
  }

  return (
    <Box className="password-page">
      <Paper component="section" elevation={0} className="password-panel">
        <Typography className="eyebrow">ACCOUNT SECURITY</Typography>
        <Typography component="h1" variant="h2">{auth.mustChangePassword ? 'Create your password' : 'Change password'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {auth.mustChangePassword ? 'Set a new password to finish signing in.' : 'Choose a new password for your account.'}
        </Typography>
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="password-form" noValidate>
          <PasswordField name="currentPassword" label="Current or temporary password" control={control} error={errors.currentPassword?.message} />
          <PasswordField name="newPassword" label="New password" control={control} error={errors.newPassword?.message} />
          <PasswordField name="confirmPassword" label="Confirm new password" control={control} error={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" color="secondary" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : 'Save password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

function PasswordField({ name, label, control, error }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          type="password"
          autoComplete="new-password"
          fullWidth
          error={Boolean(error)}
          helperText={error}
        />
      )}
    />
  );
}
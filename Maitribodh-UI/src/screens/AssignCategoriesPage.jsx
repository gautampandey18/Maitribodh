import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel,
  InputLabel, ListItemText, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { api } from '../api.js';
import { formatPhoneNumber } from '../utils/phone.js';
import { requestMessage } from '../utils/resources.js';

const emptyRegistration = { categoryDetails: {}, locationIds: [], accompanyingCount: 0, consent: false };

export default function AssignCategoriesPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [options, setOptions] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/persons/${personId}/category-assignments`),
      api.get('/persons/registration/options'),
    ]).then(([assignmentResponse, optionsResponse]) => {
      if (!active) return;
      setProfile(assignmentResponse.data);
      setOptions(optionsResponse.data);
    }).catch((failure) => {
      if (active) setError(requestMessage(failure));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [personId]);

  const assignedCategories = profile?.categories ?? [];
  const assignedIds = useMemo(() => new Set(assignedCategories
    .filter((item) => ['ACTIVE', 'PENDING', 'DEACTIVATED'].includes(item.status))
    .map((item) => Number(item.category_id))), [assignedCategories]);
  const selectableCategories = (options?.categories ?? [])
    .filter((category) => !assignedIds.has(Number(category.category_id)));
  const selectedCategories = selectableCategories
    .filter((category) => selectedIds.includes(Number(category.category_id)));

  function changeCategories(event) {
    const nextIds = event.target.value.map(Number);
    setSelectedIds(nextIds);
    setRegistrations((current) => nextIds.reduce((next, id) => {
      next[id] = current[id] ?? { ...emptyRegistration };
      return next;
    }, { ...current }));
  }

  function changeField(categoryId, key, value) {
    setRegistrations((previous) => ({
      ...previous,
      [categoryId]: {
        ...previous[categoryId],
        categoryDetails: {
          ...previous[categoryId].categoryDetails,
          [key]: value,
          ...(key === 'department_id' ? { job_role_id: '' } : {}),
        },
      },
    }));
  }

  function optionsFor(field, categoryId) {
    if (field.source === 'AREA') {
      return (options?.locations ?? []).filter((item) => item.location_type === 'AREA')
        .map((item) => ({ value: item.location_id, label: item.name }));
    }
    return (options?.lookups ?? [])
      .filter((item) => item.lookup_type === field.source
        && (field.source !== 'JOB_ROLE' || String(item.parent_id) === String(registrations[categoryId]?.categoryDetails.department_id))
        && (field.source !== 'SUBCATEGORY' || !item.category_id || Number(item.category_id) === Number(categoryId)))
      .map((item) => ({ value: item.lookup_id, label: item.name }));
  }

  function changeLocations(categoryId, locationId, checked) {
    setRegistrations((previous) => {
      const current = previous[categoryId] ?? { ...emptyRegistration };
      const locationIds = checked
        ? [...new Set([...current.locationIds, Number(locationId)])]
        : current.locationIds.filter((id) => Number(id) !== Number(locationId));
      return { ...previous, [categoryId]: { ...current, locationIds } };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!selectedIds.length) {
      setError('Select at least one category to assign.');
      return;
    }
    const missingConsent = selectedIds.find((id) => !registrations[id]?.consent);
    if (missingConsent) {
      setError('Confirm consent for every selected category.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/persons/${personId}/category-assignments`, {
        registrations: selectedIds.map((categoryId) => ({
          categoryId,
          ...(registrations[categoryId] ?? emptyRegistration),
        })),
      });
      navigate(`/persons/${personId}`, { state: { categoryAssignmentNotice: `${data.items.length} categor${data.items.length === 1 ? 'y' : 'ies'} assigned successfully.` } });
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!profile || !options) return <Alert severity="error">{error || 'Person details could not be loaded.'}</Alert>;

  return (
    <Box>
      <Box className="page-heading">
        <Box>
          <Typography variant="h1" component="h1">Assign categories</Typography>
          <Typography color="text.secondary">
            Add one or more category registrations to {profile.first_name} {profile.last_name}. Common details come from this profile, and its QR identity remains the same.
          </Typography>
        </Box>
        <Button component={Link} to={`/persons/${personId}`} startIcon={<ArrowBackOutlinedIcon />}>Back to person</Button>
      </Box>
      {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}

      <Box className="card" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>Shared profile</Typography>
        <Typography>{profile.first_name} {profile.last_name} · {formatPhoneNumber(profile.mobile)}</Typography>
        <Typography color="text.secondary">{profile.email || 'No email'}{profile.address ? ` · ${profile.address}` : ''}</Typography>
        {profile.categories.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Current categories</Typography>
            {profile.categories.map((category) => (
              <Typography key={`${category.category_id}-${category.status}`} variant="body2">
                {category.name} · {category.status}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      <Box component="form" onSubmit={submit}>
        <Box className="card" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Choose categories</Typography>
          {selectableCategories.length ? (
            <FormControl fullWidth>
              <InputLabel id="assign-categories-label">Categories</InputLabel>
              <Select
                labelId="assign-categories-label"
                id="assign-categories"
                multiple
                value={selectedIds}
                onChange={changeCategories}
                label="Categories"
                renderValue={(selected) => selected
                  .map((id) => selectableCategories.find((category) => Number(category.category_id) === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
              >
                {selectableCategories.map((category) => (
                  <MenuItem
                    key={category.category_id}
                    value={Number(category.category_id)}
                    disabled={category.approval_required === null}
                  >
                    <Checkbox checked={selectedIds.includes(Number(category.category_id))} />
                    <ListItemText primary={category.name} secondary={category.approval_required === null ? 'Approval rule needs confirmation' : undefined} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 1 }}>All active categories are already assigned to this profile.</Typography>
          )}
        </Box>

        {selectedCategories.map((category) => {
          const current = registrations[category.category_id] ?? emptyRegistration;
          const details = current.categoryDetails;
          return (
            <Box
              component="section"
              className="card"
              aria-labelledby={`category-${category.category_id}`}
              key={category.category_id}
              sx={{ p: 2, mb: 2 }}
            >
              <Typography id={`category-${category.category_id}`} variant="h3" sx={{ mb: 2 }}>
                {category.name} registration details
              </Typography>
              {(category.schema?.addressRequired && !profile.address)
                || (category.schema?.emergencyRequired && (!profile.emergency_contact_name || !profile.emergency_contact_mobile))
                ? <Alert severity="warning" sx={{ mb: 2 }}>
                    This category requires common address or emergency-contact details that are missing from the profile. Update the profile before assigning it.
                  </Alert>
                : null}
              <Box className="form-grid">
                {(category.schema?.fields ?? []).map((field) => {
                  if (field.type === 'select') {
                    const fieldOptions = field.source
                      ? optionsFor(field, category.category_id)
                      : (field.options ?? []).map((value) => ({ value, label: value }));
                    return (
                      <TextField
                        key={field.key}
                        select
                        label={field.label}
                        value={details[field.key] ?? ''}
                        onChange={(event) => changeField(category.category_id, field.key, event.target.value)}
                        required={field.required}
                        fullWidth
                      >
                        <MenuItem value="">Select</MenuItem>
                        {fieldOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </TextField>
                    );
                  }
                  return (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={field.type ?? 'text'}
                      value={details[field.key] ?? ''}
                      onChange={(event) => changeField(category.category_id, field.key, event.target.value)}
                      required={field.required}
                      fullWidth
                      inputProps={{ maxLength: 500, ...(field.type === 'number' ? { min: 1, step: 1 } : {}) }}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    />
                  );
                })}
                {category.schema?.addressRequired && <TextField label="Residential address (required on profile)" value={profile.address ?? ''} fullWidth InputProps={{ readOnly: true }} />}
                {category.schema?.emergencyRequired && (
                  <>
                    <TextField label="Emergency contact name (required on profile)" value={profile.emergency_contact_name ?? ''} fullWidth InputProps={{ readOnly: true }} />
                    <TextField label="Emergency contact mobile (required on profile)" value={profile.emergency_contact_mobile ?? ''} fullWidth InputProps={{ readOnly: true }} />
                  </>
                )}
              </Box>
              {(options.locations ?? []).some((location) => location.location_type === 'AREA') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Area access (optional)</Typography>
                  {(options.locations ?? []).filter((location) => location.location_type === 'AREA').map((location) => (
                    <FormControlLabel
                      key={location.location_id}
                      control={<Checkbox
                        checked={current.locationIds.includes(Number(location.location_id))}
                        onChange={(event) => changeLocations(category.category_id, location.location_id, event.target.checked)}
                      />}
                      label={location.name}
                    />
                  ))}
                </Box>
              )}
              <FormControlLabel
                sx={{ mt: 1, display: 'flex' }}
                control={<Checkbox
                  checked={current.consent}
                  onChange={(event) => setRegistrations((previous) => ({
                    ...previous,
                    [category.category_id]: { ...current, consent: event.target.checked },
                  }))}
                  required
                />}
                label={`Consent confirmed for ${category.name}`}
              />
            </Box>
          );
        })}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button component={Link} to={`/persons/${personId}`} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy || !selectedIds.length}>
            {busy ? <CircularProgress size={18} /> : 'Assign selected categories'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

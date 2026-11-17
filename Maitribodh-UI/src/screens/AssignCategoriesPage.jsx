import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress, FormControl,
  FormControlLabel, InputLabel, ListItemText, MenuItem, Select, Stack, TextField,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
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
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();
  const personCode = profile?.person_code ?? profile?.qr_code;

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
    <Box className="assign-categories-page">
      <Box className="page-heading assign-categories-heading">
        <Box className="assign-categories-title">
          <Typography className="assign-categories-eyebrow">PERSON MANAGEMENT / CATEGORY ASSIGNMENT</Typography>
          <Typography variant="h1" component="h1">Add categories</Typography>
          <Typography color="text.secondary">
            Add category registrations to this person. Their shared profile and QR identity stay the same.
          </Typography>
        </Box>
        <Button component={Link} to={`/persons/${personId}`} startIcon={<ArrowBackOutlinedIcon />} variant="outlined">
          Back to person
        </Button>
      </Box>
      {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="section" className="assign-profile-card" aria-label="Shared person profile">
        <Avatar className="assign-profile-avatar">{initials || <PersonOutlineOutlinedIcon />}</Avatar>
        <Box className="assign-profile-content">
          <Box className="assign-profile-heading">
            <Box>
              <Typography className="assign-profile-label">SHARED PERSON PROFILE</Typography>
              <Typography variant="h2">{profile.first_name} {profile.last_name}</Typography>
            </Box>
            {personCode && <Chip className="assign-person-code" label={personCode} size="small" variant="outlined" />}
          </Box>
          <Stack className="assign-profile-facts" direction="row" useFlexGap flexWrap="wrap" spacing={0.75}>
            <Chip icon={<PersonOutlineOutlinedIcon />} label={formatPhoneNumber(profile.mobile)} variant="outlined" />
            {profile.email && <Chip label={profile.email} variant="outlined" />}
            {profile.address && <Chip label={profile.address} variant="outlined" />}
          </Stack>
          <Box className="assign-current-categories">
            <Typography variant="body2" color="text.secondary">Currently assigned</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.75}>
              {profile.categories.length > 0 ? profile.categories.map((category) => (
                <Chip
                  key={`${category.category_id}-${category.status}`}
                  label={`${category.name} · ${statusLabel(category.status)}`}
                  size="small"
                  color={category.status === 'ACTIVE' ? 'success' : category.status === 'PENDING' ? 'warning' : 'default'}
                  variant="outlined"
                />
              )) : <Typography variant="body2" color="text.secondary">No categories assigned yet</Typography>}
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box component="form" onSubmit={submit}>
        <Box component="section" className="assign-category-picker">
          <Box className="assign-section-heading">
            <Box className="assign-step-number">1</Box>
            <Box>
              <Typography variant="h2">Choose categories</Typography>
              <Typography variant="body2" color="text.secondary">
                Select one or more categories. A separate form will appear for each selection.
              </Typography>
            </Box>
            {selectedIds.length > 0 && <Chip label={`${selectedIds.length} selected`} color="primary" size="small" />}
          </Box>
          {selectableCategories.length ? (
            <FormControl fullWidth className="assign-category-select">
              <InputLabel id="assign-categories-label">Categories</InputLabel>
              <Select
                labelId="assign-categories-label"
                id="assign-categories"
                multiple
                value={selectedIds}
                onChange={changeCategories}
                label="Categories"
                renderValue={(selected) => (
                  <Box className="assign-selected-chips">
                    {selected.map((id) => selectableCategories.find((category) => Number(category.category_id) === id))
                      .filter(Boolean)
                      .map((category) => <Chip key={category.category_id} label={category.name} size="small" />)}
                  </Box>
                )}
              >
                {selectableCategories.map((category) => (
                  <MenuItem
                    key={category.category_id}
                    value={Number(category.category_id)}
                    disabled={category.approval_required === null}
                  >
                    <Checkbox checked={selectedIds.includes(Number(category.category_id))} size="small" />
                    <ListItemText
                      primary={category.name}
                      secondary={category.approval_required === null
                        ? 'Approval rule needs confirmation'
                        : category.approval_required ? 'Approval required' : 'No approval required'}
                    />
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
          const categoryFields = category.schema?.fields ?? [];
          return (
            <Box
              component="section"
              className="assign-category-card"
              aria-labelledby={`category-${category.category_id}`}
              key={category.category_id}
            >
              <Box className="assign-category-card-heading">
                <Box className="assign-category-icon"><CategoryOutlinedIcon /></Box>
                <Box>
                  <Typography className="assign-category-step">CATEGORY REGISTRATION</Typography>
                  <Typography id={`category-${category.category_id}`} variant="h2">
                    {category.name}
                  </Typography>
                </Box>
                <Chip
                  icon={<FactCheckOutlinedIcon />}
                  label={category.approval_required ? 'Approval required' : 'No approval required'}
                  size="small"
                  variant="outlined"
                  color={category.approval_required ? 'warning' : 'success'}
                />
              </Box>
              <Box className="assign-category-card-body">
                <Box className="assign-form-intro">
                  <Typography variant="subtitle2">Category-specific details</Typography>
                  <Typography variant="body2" color="text.secondary">
                    These details are saved for {category.name} only. Shared profile information is not requested again.
                  </Typography>
                </Box>
                {(category.schema?.addressRequired && !profile.address)
                  || (category.schema?.emergencyRequired && (!profile.emergency_contact_name || !profile.emergency_contact_mobile))
                  ? <Alert severity="warning">
                    This category requires common address or emergency-contact details that are missing from the profile. Update the profile before assigning it.
                  </Alert>
                  : null}
                {categoryFields.length > 0 && (
                  <Box className="form-grid assign-category-fields">
                    {categoryFields.map((field) => {
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
                  </Box>
                )}
                {!categoryFields.length && <Alert severity="info">This category has no additional form fields.</Alert>}
                {(category.schema?.addressRequired || category.schema?.emergencyRequired) && (
                  <Box className="assign-common-details">
                    <Typography variant="subtitle2">Shared details used for this category</Typography>
                    {category.schema?.addressRequired && <TextField label="Residential address (required on profile)" value={profile.address ?? ''} fullWidth InputProps={{ readOnly: true }} />}
                    {category.schema?.emergencyRequired && (
                      <>
                        <TextField label="Emergency contact name (required on profile)" value={profile.emergency_contact_name ?? ''} fullWidth InputProps={{ readOnly: true }} />
                        <TextField label="Emergency contact mobile (required on profile)" value={profile.emergency_contact_mobile ?? ''} fullWidth InputProps={{ readOnly: true }} />
                      </>
                    )}
                  </Box>
                )}
                {(options.locations ?? []).some((location) => location.location_type === 'AREA') && (
                  <Box className="assign-area-access">
                    <Box className="assign-subsection-heading">
                      <LocationOnOutlinedIcon />
                      <Box>
                        <Typography variant="subtitle2">Area access</Typography>
                        <Typography variant="body2" color="text.secondary">Optional · choose the areas this registration can access</Typography>
                      </Box>
                    </Box>
                    <Box className="assign-area-options">
                      {(options.locations ?? []).filter((location) => location.location_type === 'AREA').map((location) => (
                        <FormControlLabel
                          className="assign-area-option"
                          key={location.location_id}
                          control={<Checkbox
                            checked={current.locationIds.includes(Number(location.location_id))}
                            onChange={(event) => changeLocations(category.category_id, location.location_id, event.target.checked)}
                          />}
                          label={location.name}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                <Box className="assign-consent-box">
                  <FormControlLabel
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
              </Box>
            </Box>
          );
        })}
        <Box className="assign-form-footer">
          <Box>
            <Typography variant="subtitle2">
              {selectedIds.length
                ? `${selectedIds.length} ${selectedIds.length === 1 ? 'category' : 'categories'} selected`
                : 'No categories selected'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length ? 'Confirm consent for each category before assigning.' : 'Choose categories above to continue.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button component={Link} to={`/persons/${personId}`} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy || !selectedIds.length} startIcon={!busy && <CheckCircleOutlineOutlinedIcon />}>
              {busy ? <CircularProgress size={18} /> : 'Assign categories'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function statusLabel(status = '') {
  return status.toLowerCase().replaceAll('_', ' ');
}

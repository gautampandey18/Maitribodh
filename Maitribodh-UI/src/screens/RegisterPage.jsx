import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { api } from '../api.js';
import { requestMessage, useResource } from '../utils/resources.js';

const initialValues = { firstName: '', lastName: '', mobile: '', alternateMobile: '', residentStatus: 'RESIDENT', passportNumber: '', idProofTypeId: '', idProofNumber: '', gender: '', dateOfBirth: '', address: '', email: '', emergencyName: '', emergencyMobile: '', permissionLevelId: '', locationIds: [], accompanyingCount: 0, remarks: '', categoryDetails: {}, consent: false };
const steps = ['Category', 'Profile', 'Access', 'Documents', 'Review'];
const categoryIcons = {
  STAFF: WorkOutlineIcon,
  VISITOR: PersonOutlineIcon,
  VENDOR: Inventory2OutlinedIcon,
  CONTRACTOR: BuildOutlinedIcon,
  PARTICIPANT: SchoolOutlinedIcon,
  PARIVAR: VolunteerActivismOutlinedIcon,
};
const commonFields = [
  { key: 'firstName', label: 'First Name', required: true, maxLength: 100, pattern: '[\\p{L}\\p{M} \\x2d]+' },
  { key: 'lastName', label: 'Last Name', required: true, maxLength: 100, pattern: '[\\p{L}\\p{M} \\x2d]+' },
  { key: 'mobile', label: 'Mobile Number', required: true, maxLength: 10, pattern: '[6-9][0-9]{9}' },
  { key: 'alternateMobile', label: 'Alternate Mobile', maxLength: 10, pattern: '[6-9][0-9]{9}' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'email', label: 'Email', type: 'email' },
];

export default function RegisterPage() {
  const { data: options, error: loadError } = useResource('/persons/registration/options');
  const { data: drafts, reload: reloadDrafts } = useResource('/persons/drafts');
  const role = useSelector((state) => state.auth.user?.role);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fromGate = params.get('from') === 'gate' || role === 'SECURITY_GUARD';
  const [categoryId, setCategoryId] = useState('');
  const [values, setValues] = useState(initialValues);
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const categories = (options?.categories ?? []).filter((category) => !fromGate || category.form_type === 'VISITOR');
  const category = categories.find((item) => String(item.category_id) === String(categoryId)) ?? (fromGate ? categories[0] : null);
  const schema = category?.schema ?? {};
  const change = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  const selectedOptions = (source) => source === 'AREA'
    ? (options?.locations ?? []).filter((item) => item.location_type === 'AREA').map((item) => ({ id: item.location_id, name: item.name }))
    : (options?.lookups ?? []).filter((item) => item.lookup_type === source && (source !== 'JOB_ROLE' || String(item.parent_id) === String(values.categoryDetails.department_id)) && (source !== 'SUBCATEGORY' || !item.category_id || Number(item.category_id) === Number(category?.category_id))).map((item) => ({ id: item.lookup_id, name: item.name }));

  function chooseCategory(next) {
    setCategoryId(next.category_id);
    setValues({ ...initialValues, permissionLevelId: next.permission_level_id ?? '', categoryDetails: {} });
    setStep(1); setNotice(''); setError('');
  }
  function pickFiles(files, isPhoto) {
    const maxSize = isPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    const valid = [...files].every((file) => file.size <= maxSize && (isPhoto ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png']).includes(file.type));
    if (!valid) { setError(isPhoto ? 'Choose a JPG or PNG photograph no larger than 2 MB.' : 'Each document must be a PDF, JPG, or PNG no larger than 5 MB.'); return; }
    setError('');
    if (isPhoto) setPhoto(files[0]); else setDocuments([...files]);
  }
  async function saveDraft() {
    if (!category) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/persons/drafts', { ...values, categoryId: Number(category.category_id), ...(draftId ? { draftId } : {}) });
      setDraftId(data.person_id); setNotice(`Draft saved for ${values.firstName || 'this registration'}.`); reloadDrafts();
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  function resumeDraft(draft) {
    setCategoryId(draft.draft_data.categoryId); setValues({ ...initialValues, ...draft.draft_data, passportNumber: '', consent: false }); setDraftId(draft.person_id); setStep(1); setPhoto(null); setDocuments([]);
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!category) { setError('Select a category'); return; }
    if (step < 4) { setStep(step + 1); return; }
    if (!values.consent) { setError('Consent is required before registration.'); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('metadata', JSON.stringify({ ...values, categoryId: Number(category.category_id), idProofTypeId: values.idProofTypeId ? Number(values.idProofTypeId) : null, permissionLevelId: values.permissionLevelId ? Number(values.permissionLevelId) : null, source: fromGate ? 'WALK_IN' : 'MANUAL' }));
      if (photo) form.append('photo', photo);
      documents.forEach((file) => form.append('documents', file));
      const { data } = await api.post('/persons', form, { headers: { 'Content-Type': undefined } });
      setNotice(`${values.firstName} ${values.lastName} registered as ${category.name} · ${data.status} · Person ID ${data.person_code} · ${data.status === 'ACTIVE' ? 'QR generated' : 'QR will be generated after approval'}`);
      if (fromGate && data.status === 'ACTIVE') {
        navigate(`/gate?person=${encodeURIComponent(data.person_code)}&gate=${params.get('gate') ?? ''}&area=${params.get('area') ?? ''}`, { state: { registered: true } });
      } else { setValues(initialValues); setPhoto(null); setDocuments([]); setStep(0); setCategoryId(''); setDraftId(null); }
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  const textField = (field, value, onChange) => <TextField key={field.key} label={field.label} value={value ?? ''} onChange={onChange} required={field.required} type={field.type ?? 'text'} fullWidth inputProps={{ maxLength: field.maxLength ?? 500, pattern: field.pattern, ...(field.type === 'date' ? { max: new Date().toISOString().slice(0, 10) } : {}) }} InputLabelProps={field.type === 'date' ? { shrink: true } : undefined} />;

  const backTo = fromGate ? `/gate?${new URLSearchParams({ gate: params.get('gate') ?? '', area: params.get('area') ?? '' })}` : '/persons';
  return <Box>
    <Box className="page-heading"><Box><Typography variant="h1" component="h1">{fromGate ? 'Register Visitor' : 'Register Person'}</Typography>{category && <Typography color="text.secondary">Category: {category.name}</Typography>}</Box><Button component={Link} to={backTo} startIcon={<ArrowBackOutlinedIcon />}>{fromGate ? 'Back to Security Gate' : 'Back to Person Management'}</Button></Box>
    {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
    {loadError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>Registration options could not be loaded ({loadError}). Restart the updated API server, then reload this page.</Alert>}
    {notice && <Alert severity="success" role="status" sx={{ mb: 2 }}>{notice}</Alert>}
    {!options && !loadError ? <CircularProgress /> : loadError ? null : <Box component="form" onSubmit={submit} className="registration-form">
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>{steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {step === 0 && <>
        {categories.length ? <Box className="category-grid">{categories.map((item) => {
          const Icon = categoryIcons[item.form_type] ?? PersonOutlineIcon;
          return <Button className="registration-category-card" key={item.category_id} variant={category?.category_id === item.category_id ? 'contained' : 'outlined'} aria-pressed={category?.category_id === item.category_id} onClick={() => chooseCategory(item)}><Icon aria-hidden="true" /><span className="registration-category-name">{item.name}</span><span className="registration-category-description">{item.description || 'Register a person for Ashram access.'}</span></Button>;
        })}</Box> : <Alert severity="warning">The registration options API returned no active categories. Check that categories are active and that this app is connected to the intended database.</Alert>}
        {!fromGate && drafts?.items?.length > 0 && <Box sx={{ mt: 3 }}><Typography variant="h3">Saved Drafts</Typography>{drafts.items.map((draft) => <Button key={draft.person_id} onClick={() => resumeDraft(draft)}>{draft.draft_data.firstName || 'Draft'} {draft.draft_data.lastName} · {new Date(draft.updated_at).toLocaleDateString()}</Button>)}</Box>}
      </>}
      {step === 1 && <Box className="form-grid">
        {commonFields.map((field) => textField(field, values[field.key], (event) => change(field.key, event.target.value)))}
        <TextField select label="Gender" value={values.gender} onChange={(event) => change('gender', event.target.value)} required>{['MALE', 'FEMALE', 'OTHER'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField select label="Resident Status" value={values.residentStatus} onChange={(event) => change('residentStatus', event.target.value)} required><MenuItem value="RESIDENT">Resident</MenuItem><MenuItem value="NON_RESIDENT">Non-Resident / International</MenuItem></TextField>
        {values.residentStatus === 'NON_RESIDENT' && <TextField label="Passport Number" value={values.passportNumber} onChange={(event) => change('passportNumber', event.target.value)} required inputProps={{ pattern: '[A-Za-z0-9]{6,9}', maxLength: 9 }} />}
        <TextField label="Residential Address" value={values.address} onChange={(event) => change('address', event.target.value)} required={schema.addressRequired} multiline inputProps={{ maxLength: 500 }} />
        <TextField select label="ID Proof Type" value={values.idProofTypeId} onChange={(event) => change('idProofTypeId', event.target.value)}><MenuItem value="">None</MenuItem>{selectedOptions('ID_PROOF_TYPE').map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
        <TextField label="ID Proof Number" value={values.idProofNumber} onChange={(event) => change('idProofNumber', event.target.value)} inputProps={{ maxLength: 50 }} />
        <Box><Typography component="label" htmlFor="registration-photo">Photograph *</Typography><input id="registration-photo" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => pickFiles(event.target.files, true)} required={!photo} /><Typography variant="caption">{photo?.name ?? 'JPG or PNG, maximum 2 MB.'}</Typography></Box>
        {(schema.fields ?? []).map((field) => {
          const onChange = (event) => setValues((previous) => ({ ...previous, categoryDetails: { ...previous.categoryDetails, [field.key]: event.target.value, ...(field.source === 'DEPARTMENT' ? { job_role_id: '' } : {}) } }));
          return field.type === 'select' ? <TextField key={field.key} select label={field.label} required={field.required} value={values.categoryDetails[field.key] ?? ''} onChange={onChange}><MenuItem value="">Select</MenuItem>{field.source ? selectedOptions(field.source).map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>) : (field.options ?? []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>
            : <TextField key={field.key} label={field.label} type={field.type} required={field.required} value={values.categoryDetails[field.key] ?? ''} onChange={onChange} inputProps={{ maxLength: 500, ...(field.type === 'number' ? { min: 1, step: 1 } : {}) }} InputLabelProps={field.type === 'date' ? { shrink: true } : undefined} />;
        })}
        <TextField label="Emergency Contact Name" value={values.emergencyName} onChange={(event) => change('emergencyName', event.target.value)} required={schema.emergencyRequired} />
        <TextField label="Emergency Contact Mobile" value={values.emergencyMobile} onChange={(event) => change('emergencyMobile', event.target.value)} required={schema.emergencyRequired} inputProps={{ pattern: '[6-9][0-9]{9}', maxLength: 10 }} />
      </Box>}
      {step === 2 && <Box className="form-grid">
        <TextField label="Assigned Permission Level" select value={values.permissionLevelId} onChange={(event) => change('permissionLevelId', event.target.value)}><MenuItem value="">Category default</MenuItem>{selectedOptions('PERMISSION_LEVEL').map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
        <TextField label="Assigned Areas" select SelectProps={{ multiple: true }} value={values.locationIds} onChange={(event) => change('locationIds', event.target.value)}>{selectedOptions('AREA').map((item) => <MenuItem key={item.id} value={Number(item.id)}>{item.name}</MenuItem>)}</TextField>
        <TextField label="Additional people accompanying" type="number" inputProps={{ min: 0, max: 32767, step: 1 }} value={values.accompanyingCount} onChange={(event) => change('accompanyingCount', event.target.value)} />
        <TextField label="Remarks" multiline value={values.remarks} onChange={(event) => change('remarks', event.target.value)} inputProps={{ maxLength: 500 }} />
      </Box>}
      {step === 3 && <Box><Typography component="label" htmlFor="registration-documents">Documents</Typography><input id="registration-documents" type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(event) => pickFiles(event.target.files, false)} />{documents.map((file) => <Typography key={file.name}>{file.name}</Typography>)}</Box>}
      {step === 4 && <Box><Typography variant="h3">{values.firstName} {values.lastName}</Typography><Typography>{category?.name} · {values.mobile}</Typography><Typography>{photo?.name} · {documents.length} document(s)</Typography><FormControlLabel control={<Checkbox checked={values.consent} onChange={(event) => change('consent', event.target.checked)} />} label="I confirm consent to store this profile and photograph for access management." /></Box>}
      {category?.approval_required === null && <Alert severity="warning">Submission is paused until the approval rule is confirmed.</Alert>}
      {category && <Alert severity={category.approval_required ? 'warning' : 'success'} sx={{ mt: 3 }}>{category.approval_required ? `${category.name} registrations go to the Approval Center. Access and QR are enabled only after an Approver/Admin approves.` : `${category.name} registration is live immediately. QR is generated on submit, no approval needed.`}</Alert>}
      <Box className="wizard-actions"><Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || busy}>Back</Button>{!fromGate && <Button startIcon={<SaveOutlinedIcon />} onClick={saveDraft} disabled={!category || busy}>Save Draft</Button>}<Button type="submit" variant="contained" endIcon={busy ? <CircularProgress size={16} /> : <ArrowForwardOutlinedIcon />} disabled={!category || busy || category.approval_required === null}>{step === 4 ? 'Submit Registration' : 'Continue'}</Button></Box>
    </Box>}
  </Box>;
}
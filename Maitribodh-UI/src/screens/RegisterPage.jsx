import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { api } from '../api.js';
import { requestMessage, useResource } from '../utils/resources.js';
import InternationalPhoneField from '../components/InternationalPhoneField.jsx';
import { formatPhoneNumber, splitPhoneNumber, toE164Phone } from '../utils/phone.js';

const initialValues = {
  firstName: '',
  lastName: '',
  mobile: '',
  mobileCountry: 'IN',
  alternateMobile: '',
  alternateMobileCountry: 'IN',
  residentStatus: 'RESIDENT',
  passportNumber: '',
  idProofTypeId: '',
  idProofNumber: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  email: '',
  emergencyName: '',
  emergencyMobile: '',
  emergencyMobileCountry: 'IN',
  locationIds: [],
  accompanyingCount: 0,
  remarks: '',
  categoryDetails: {
    driver_mobile_country: 'IN',
  },
  consent: false,
};
const steps = ['Category', 'Profile', 'Access', 'Documents', 'Review'];
const categoryIcons = {
  STAFF: WorkOutlineIcon,
  VISITOR: PersonOutlineIcon,
  VENDOR: Inventory2OutlinedIcon,
  CONTRACTOR: BuildOutlinedIcon,
  PARTICIPANT: SchoolOutlinedIcon,
  PARIVAR: VolunteerActivismOutlinedIcon,
};
const categoryTileColors = {
  STAFF: { accent: '#E17324', background: '#FFF6EF', border: '#F6D5BA' },
  VISITOR: { accent: '#0E8C99', background: '#EDF8F9', border: '#C0E4E8' },
  VENDOR: { accent: '#2E9E6B', background: '#F0FAF5', border: '#C3E7D4' },
  CONTRACTOR: { accent: '#5B6B7A', background: '#F4F6F8', border: '#D6DDE3' },
  PARTICIPANT: { accent: '#C98A0B', background: '#FFF9EA', border: '#F1DFAC' },
  PARIVAR: { accent: '#D0293B', background: '#FFF2F3', border: '#F4C5CB' },
};
const commonFields = [
  { key: 'firstName', label: 'First Name', required: true, maxLength: 100, pattern: '[\\p{L}\\p{M} \\x2d]+' },
  { key: 'lastName', label: 'Last Name', required: true, maxLength: 100, pattern: '[\\p{L}\\p{M} \\x2d]+' },
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
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoCameraOpen, setPhotoCameraOpen] = useState(false);
  const [photoCameraError, setPhotoCameraError] = useState('');
  const profileVideo = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [checkingMobile, setCheckingMobile] = useState(false);
  const lastCheckedMobileRef = useRef('');

  const categories = (options?.categories ?? []).filter((category) => !fromGate || category.form_type === 'VISITOR');
  const category = categories.find((item) => String(item.category_id) === String(categoryId)) ?? (fromGate ? categories[0] : null);
  const schema = category?.schema ?? {};
  const change = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  const changeMobileCountry = useCallback((mobileCountry) => {
    setValues((previous) => ({ ...previous, mobileCountry }));
    setMobileError('');
    lastCheckedMobileRef.current = '';
  }, []);
  const selectedOptions = (source) => source === 'AREA'
    ? (options?.locations ?? []).filter((item) => item.location_type === 'AREA').map((item) => ({ id: item.location_id, name: item.name }))
    : (options?.lookups ?? []).filter((item) => item.lookup_type === source && (source !== 'JOB_ROLE' || String(item.parent_id) === String(values.categoryDetails.department_id)) && (source !== 'SUBCATEGORY' || !item.category_id || Number(item.category_id) === Number(category?.category_id))).map((item) => ({ id: item.lookup_id, name: item.name }));

  const validateMobile = useCallback(async (mobileRaw = values.mobile, country = values.mobileCountry) => {
    if (!category) return { valid: true };
    const trimmed = String(mobileRaw ?? '').trim();
    if (!trimmed) {
      setMobileError('');
      return { valid: false, error: 'Mobile number is required.' };
    }
    const isVisitor = category.form_type === 'VISITOR';
    const e164 = toE164Phone(trimmed, country || 'IN');
    if (!e164) {
      const msg = isVisitor ? 'Enter a valid mobile number for the selected country.' : 'Enter a valid 10-digit mobile number.';
      setMobileError(msg);
      return { valid: false, error: msg };
    }
    if (!isVisitor && !e164.startsWith('+91')) {
      const msg = 'Use an Indian mobile number for this category.';
      setMobileError(msg);
      return { valid: false, error: msg };
    }
    const checkKey = `${category.category_id}:${e164}`;
    if (lastCheckedMobileRef.current === checkKey && !mobileError) {
      return { valid: true };
    }
    setCheckingMobile(true);
    try {
      const { data } = await api.get('/persons/registration/check-mobile', {
        params: { mobile: e164, categoryId: category.category_id },
      });
      lastCheckedMobileRef.current = checkKey;
      if (data?.available === false) {
        const message = data.message || 'This mobile number is already registered under this category.';
        setMobileError(message);
        return { valid: false, error: message };
      }
      setMobileError('');
      return { valid: true };
    } catch (err) {
      if (err.response?.status === 409) {
        const message = err.response?.data?.error?.message || 'This mobile number is already registered under this category.';
        setMobileError(message);
        return { valid: false, error: message };
      }
      return { valid: true };
    } finally {
      setCheckingMobile(false);
    }
  }, [category, mobileError, values.mobile, values.mobileCountry]);

  function chooseCategory(next) {
    setCategoryId(next.category_id);
    setValues({ ...initialValues, categoryDetails: { driver_mobile_country: 'IN' } });
    setMobileError('');
    lastCheckedMobileRef.current = '';
    setStep(1); setNotice(''); setError('');
  }
  function pickFiles(files, isPhoto) {
    const maxSize = isPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    const valid = [...files].every((file) => file.size <= maxSize && (isPhoto ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png']).includes(file.type));
    if (!valid) { setError(isPhoto ? 'Choose a JPG or PNG photograph no larger than 2 MB.' : 'Each document must be a PDF, JPG, or PNG no larger than 5 MB.'); return; }
    setError('');
    if (isPhoto) {
      setPhoto(files[0]);
      if (typeof URL?.createObjectURL === 'function') {
        setPhotoPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setDocuments((previous) => [...previous, ...files]);
    }
  }

  function startLiveCamera() {
    setPhotoCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhotoCameraError('Live camera is not supported on this browser.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
      .then((stream) => {
        if (profileVideo.current) {
          profileVideo.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setPhotoCameraError(err.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Unable to access the camera.');
      });
  }

  function stopLiveCamera() {
    if (profileVideo.current?.srcObject) {
      const stream = profileVideo.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      profileVideo.current.srcObject = null;
    }
  }

  const prevPhotoCameraOpen = useRef(photoCameraOpen);
  if (prevPhotoCameraOpen.current !== photoCameraOpen) {
    prevPhotoCameraOpen.current = photoCameraOpen;
    if (photoCameraOpen) {
      setTimeout(startLiveCamera, 50);
    } else {
      stopLiveCamera();
    }
  }

  function captureLivePhoto() {
    const video = profileVideo.current;
    if (!video || !video.videoWidth) {
      setPhotoCameraError('Camera stream is not ready.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setPhotoCameraError('Could not process captured image.');
        return;
      }
      const capturedFile = new File([blob], `live-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPhoto(capturedFile);
      if (typeof URL?.createObjectURL === 'function') {
        setPhotoPreview(URL.createObjectURL(capturedFile));
      }
      setPhotoCameraOpen(false);
      setError('');
    }, 'image/jpeg', 0.9);
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
    const pMobile = splitPhoneNumber(draft.draft_data?.mobile);
    const pAlt = splitPhoneNumber(draft.draft_data?.alternateMobile);
    const pEmerg = splitPhoneNumber(draft.draft_data?.emergencyMobile);
    const pDriver = splitPhoneNumber(draft.draft_data?.categoryDetails?.driver_mobile);
    setCategoryId(draft.draft_data.categoryId);
    setValues({
      ...initialValues,
      ...draft.draft_data,
      mobile: pMobile.number,
      mobileCountry: draft.draft_data.mobileCountry || pMobile.country,
      alternateMobile: pAlt.number,
      alternateMobileCountry: draft.draft_data.alternateMobileCountry || pAlt.country,
      emergencyMobile: pEmerg.number,
      emergencyMobileCountry: draft.draft_data.emergencyMobileCountry || pEmerg.country,
      categoryDetails: {
        ...draft.draft_data.categoryDetails,
        driver_mobile: pDriver.number,
        driver_mobile_country: draft.draft_data.categoryDetails?.driver_mobile_country || pDriver.country,
      },
      passportNumber: '',
      consent: false,
    });
    setDraftId(draft.person_id); setStep(1); setPhoto(null); setPhotoPreview(''); setDocuments([]); setMobileError(''); lastCheckedMobileRef.current = '';
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (!category) { setError('Select a category'); return; }
    if (step === 1) {
      const check = await validateMobile();
      if (!check.valid) {
        setError(check.error || 'Please provide a valid mobile number.');
        return;
      }
    }
    if (step < 4) { setStep(step + 1); return; }
    if (!values.consent) { setError('Consent is required before registration.'); return; }
    const mobile = toE164Phone(values.mobile, values.mobileCountry || 'IN');
    if (!mobile) { setError('Enter a valid mobile number for the selected country.'); return; }
    if (category.form_type !== 'VISITOR' && !mobile.startsWith('+91')) {
      setError('Use an Indian mobile number for this category.');
      return;
    }
    if (mobileError) { setError(mobileError); return; }

    let alternateMobile = '';
    if (values.alternateMobile?.trim()) {
      alternateMobile = toE164Phone(values.alternateMobile.trim(), values.alternateMobileCountry || 'IN');
      if (!alternateMobile) {
        setError('Enter a valid alternate mobile number for the selected country.');
        return;
      }
    }

    let emergencyMobile = '';
    if (values.emergencyMobile?.trim()) {
      emergencyMobile = toE164Phone(values.emergencyMobile.trim(), values.emergencyMobileCountry || 'IN');
      if (!emergencyMobile) {
        setError('Enter a valid emergency contact mobile number for the selected country.');
        return;
      }
    }

    let driverMobile = values.categoryDetails?.driver_mobile ?? '';
    if (values.categoryDetails?.driver_available === 'YES' && driverMobile?.trim()) {
      const parsedDriver = toE164Phone(driverMobile.trim(), values.categoryDetails?.driver_mobile_country || 'IN');
      if (!parsedDriver) {
        setError('Enter a valid driver contact number for the selected country.');
        return;
      }
      driverMobile = parsedDriver;
    }

    setBusy(true);
    try {
      const form = new FormData();
      const categoryDetails = {
        ...values.categoryDetails,
        ...(values.categoryDetails?.driver_available === 'YES' ? { driver_mobile: driverMobile } : {}),
      };
      form.append('metadata', JSON.stringify({
        ...values,
        mobile,
        alternateMobile,
        emergencyMobile,
        categoryDetails,
        categoryId: Number(category.category_id),
        idProofTypeId: values.idProofTypeId ? Number(values.idProofTypeId) : null,
        source: fromGate ? 'WALK_IN' : 'MANUAL',
      }));
      if (photo) form.append('photo', photo);
      documents.forEach((file) => form.append('documents', file));
      const { data } = await api.post('/persons', form, { headers: { 'Content-Type': undefined } });
      setNotice(`${values.firstName} ${values.lastName} registered as ${category.name} · ${data.status} · Person ID ${data.person_code} · ${data.status === 'ACTIVE' ? 'QR generated' : 'QR will be generated after approval'}`);
      if (fromGate && data.status === 'ACTIVE') {
        navigate(`/gate?mobile=${encodeURIComponent(mobile)}&gate=${params.get('gate') ?? ''}&area=${params.get('area') ?? ''}`, { state: { registered: true } });
      } else { setValues(initialValues); setPhoto(null); setPhotoPreview(''); setDocuments([]); setStep(0); setCategoryId(''); setDraftId(null); setMobileError(''); lastCheckedMobileRef.current = ''; }
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
          const colors = categoryTileColors[item.form_type] ?? categoryTileColors.STAFF;
          return <Button className="registration-category-card" key={item.category_id} variant="outlined" aria-pressed={category?.category_id === item.category_id} onClick={() => chooseCategory(item)} style={{ '--registration-accent': colors.accent, '--registration-background': colors.background, '--registration-border': colors.border }}><Icon aria-hidden="true" /><span className="registration-category-name">{item.name}</span><span className="registration-category-description">{item.description || 'Register a person for Ashram access.'}</span></Button>;
        })}</Box> : <Alert severity="warning">The registration options API returned no active categories. Check that categories are active and that this app is connected to the intended database.</Alert>}
        {!fromGate && drafts?.items?.length > 0 && <Box sx={{ mt: 3 }}><Typography variant="h3">Saved Drafts</Typography>{drafts.items.map((draft) => <Button key={draft.person_id} onClick={() => resumeDraft(draft)}>{draft.draft_data.firstName || 'Draft'} {draft.draft_data.lastName} · {new Date(draft.updated_at).toLocaleDateString()}</Button>)}</Box>}
      </>}
      {step === 1 && <Box className="form-grid">
        <InternationalPhoneField
          country={values.mobileCountry}
          number={values.mobile}
          onCountryChange={changeMobileCountry}
          onNumberChange={(value) => {
            change('mobile', value);
            if (mobileError) setMobileError('');
            lastCheckedMobileRef.current = '';
          }}
          onBlur={() => validateMobile()}
          error={Boolean(mobileError)}
          helperText={mobileError || (checkingMobile ? 'Checking availability…' : '')}
          required
          label="Mobile Number"
        />
        {commonFields.map((field) => textField(field, values[field.key], (event) => change(field.key, event.target.value)))}
        <InternationalPhoneField
          country={values.alternateMobileCountry || 'IN'}
          number={values.alternateMobile}
          onCountryChange={(country) => setValues((previous) => ({ ...previous, alternateMobileCountry: country }))}
          onNumberChange={(value) => change('alternateMobile', value)}
          required={false}
          label="Alternate Mobile"
        />
        <TextField select label="Gender" value={values.gender} onChange={(event) => change('gender', event.target.value)} required>{['MALE', 'FEMALE', 'OTHER'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField select label="Resident Status" value={values.residentStatus} onChange={(event) => change('residentStatus', event.target.value)} required><MenuItem value="RESIDENT">Resident</MenuItem><MenuItem value="NON_RESIDENT">Non-Resident / International</MenuItem></TextField>
        {values.residentStatus === 'NON_RESIDENT' && <TextField label="Passport Number" value={values.passportNumber} onChange={(event) => change('passportNumber', event.target.value)} required inputProps={{ pattern: '[A-Za-z0-9]{6,9}', maxLength: 9 }} />}
        <TextField label="Residential Address" value={values.address} onChange={(event) => change('address', event.target.value)} required={schema.addressRequired} multiline inputProps={{ maxLength: 500 }} />
        <TextField select label="ID Proof Type" value={values.idProofTypeId} onChange={(event) => change('idProofTypeId', event.target.value)}><MenuItem value="">None</MenuItem>{selectedOptions('ID_PROOF_TYPE').map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>
        <TextField label="ID Proof Number" value={values.idProofNumber} onChange={(event) => change('idProofNumber', event.target.value)} inputProps={{ maxLength: 50 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography component="label" htmlFor="registration-photo" sx={{ fontWeight: 600 }}>
            Photograph *
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color={photo ? 'secondary' : 'primary'}
              startIcon={<CameraAltOutlinedIcon />}
              onClick={() => { setPhotoCameraError(''); setPhotoCameraOpen(true); }}
            >
              {photo ? 'Retake Live Photo' : 'Click Live Photo'}
            </Button>
            {photo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {photoPreview && (
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="Captured preview"
                    sx={{ width: 44, height: 44, borderRadius: 1, objectFit: 'cover', border: '1px solid var(--th-card-border, #ccc)' }}
                  />
                )}
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  ✓ Photo captured
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Live photo capture required.
              </Typography>
            )}
          </Box>
          <input
            id="registration-photo"
            aria-label="Photograph *"
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={(event) => {
              if (event.target.files?.[0]) {
                pickFiles(event.target.files, true);
              }
            }}
          />
        </Box>
        {category?.form_type === 'VISITOR' && <>
          <TextField
            select
            label="Is a driver available?"
            value={values.categoryDetails.driver_available ?? ''}
            onChange={(event) => setValues((previous) => ({
              ...previous,
              categoryDetails: {
                ...previous.categoryDetails,
                driver_available: event.target.value,
                ...(event.target.value === 'YES' ? {} : { driver_name: '', driver_mobile: '' }),
              },
            }))}
          >
            <MenuItem value="">Select (optional)</MenuItem>
            <MenuItem value="YES">Yes</MenuItem>
            <MenuItem value="NO">No</MenuItem>
          </TextField>
          {values.categoryDetails.driver_available === 'YES' && <>
            <TextField
              label="Driver Name (optional)"
              value={values.categoryDetails.driver_name ?? ''}
              onChange={(event) => setValues((previous) => ({ ...previous, categoryDetails: { ...previous.categoryDetails, driver_name: event.target.value } }))}
              inputProps={{ maxLength: 100 }}
            />
            <InternationalPhoneField
              label="Driver Contact Number (optional)"
              country={values.categoryDetails.driver_mobile_country || 'IN'}
              number={values.categoryDetails.driver_mobile ?? ''}
              onCountryChange={(country) => setValues((previous) => ({
                ...previous,
                categoryDetails: { ...previous.categoryDetails, driver_mobile_country: country },
              }))}
              onNumberChange={(value) => setValues((previous) => ({
                ...previous,
                categoryDetails: { ...previous.categoryDetails, driver_mobile: value },
              }))}
              required={false}
            />
          </>}
        </>}
        {(schema.fields ?? []).map((field) => {
          const onChange = (event) => setValues((previous) => ({ ...previous, categoryDetails: { ...previous.categoryDetails, [field.key]: event.target.value, ...(field.source === 'DEPARTMENT' ? { job_role_id: '' } : {}) } }));
          return field.type === 'select' ? <TextField key={field.key} select label={field.label} required={field.required} value={values.categoryDetails[field.key] ?? ''} onChange={onChange}><MenuItem value="">Select</MenuItem>{field.source ? selectedOptions(field.source).map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>) : (field.options ?? []).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>
            : <TextField key={field.key} label={field.label} type={field.type} required={field.required} value={values.categoryDetails[field.key] ?? ''} onChange={onChange} inputProps={{ maxLength: 500, ...(field.type === 'number' ? { min: 1, step: 1 } : {}) }} InputLabelProps={field.type === 'date' ? { shrink: true } : undefined} />;
        })}
        <TextField label="Emergency Contact Name" value={values.emergencyName} onChange={(event) => change('emergencyName', event.target.value)} required={schema.emergencyRequired} />
        <InternationalPhoneField
          label="Emergency Contact Mobile"
          country={values.emergencyMobileCountry || 'IN'}
          number={values.emergencyMobile}
          onCountryChange={(country) => setValues((previous) => ({ ...previous, emergencyMobileCountry: country }))}
          onNumberChange={(value) => change('emergencyMobile', value)}
          required={Boolean(schema.emergencyRequired)}
        />
      </Box>}
      {step === 2 && <Box className="form-grid">
        <TextField label="Assigned Areas" select SelectProps={{ multiple: true }} value={values.locationIds} onChange={(event) => change('locationIds', event.target.value)}>{selectedOptions('AREA').map((item) => <MenuItem key={item.id} value={Number(item.id)}>{item.name}</MenuItem>)}</TextField>
        <TextField label="Remarks" multiline value={values.remarks} onChange={(event) => change('remarks', event.target.value)} inputProps={{ maxLength: 500 }} />
      </Box>}
      {step === 3 && <Box><Typography component="label" htmlFor="registration-documents">Documents</Typography><input id="registration-documents" type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(event) => pickFiles(event.target.files, false)} />{documents.map((file) => <Typography key={file.name}>{file.name}</Typography>)}</Box>}
      {step === 4 && <Box component="section" className="registration-review" aria-label="Registration review">
        <Box className="registration-review-header">
          <Typography component="h2" variant="h3">{values.firstName} {values.lastName}</Typography>
          <Typography className="registration-review-summary">{category?.name} <span aria-hidden="true">·</span> {formatPhoneNumber(toE164Phone(values.mobile, values.mobileCountry || 'IN')) || values.mobile}</Typography>
        </Box>
        <Box className="registration-review-facts">
          <Box className="registration-review-fact">
            <Typography variant="caption">Photograph</Typography>
            <Typography>{photo?.name ?? 'No photograph selected'}</Typography>
          </Box>
          <Box className="registration-review-fact">
            <Typography variant="caption">Documents</Typography>
            <Typography>{documents.length} document(s)</Typography>
          </Box>
          {category?.form_type === 'VISITOR' && values.categoryDetails.driver_available && <Box className="registration-review-fact registration-review-driver">
            <Typography variant="caption">Driver</Typography>
            <Typography>{values.categoryDetails.driver_available === 'YES' ? 'Available' : 'Not available'}{values.categoryDetails.driver_available === 'YES' && [values.categoryDetails.driver_name, values.categoryDetails.driver_mobile].filter(Boolean).length > 0 ? ` · ${[values.categoryDetails.driver_name, formatPhoneNumber(toE164Phone(values.categoryDetails.driver_mobile, values.categoryDetails.driver_mobile_country || 'IN')) || values.categoryDetails.driver_mobile].filter(Boolean).join(' · ')}` : ''}</Typography>
          </Box>}
        </Box>
        <FormControlLabel className="registration-review-consent" control={<Checkbox checked={values.consent} onChange={(event) => change('consent', event.target.checked)} />} label="I confirm consent to store this profile and photograph for access management." />
      </Box>}
      {category?.approval_required === null && <Alert severity="warning">Submission is paused until the approval rule is confirmed.</Alert>}
      {category && <Alert severity={category.approval_required ? 'warning' : 'success'} sx={{ mt: 3 }}>{category.approval_required ? `${category.name} registrations go to the Approval Center. Access and QR are enabled only after an Approver/Admin approves.` : `${category.name} registration is live immediately. QR is generated on submit, no approval needed.`}</Alert>}
      <Box className="wizard-actions"><Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || busy}>Back</Button>{!fromGate && <Button startIcon={<SaveOutlinedIcon />} onClick={saveDraft} disabled={!category || busy}>Save Draft</Button>}<Button type="submit" variant="contained" endIcon={busy ? <CircularProgress size={16} /> : <ArrowForwardOutlinedIcon />} disabled={!category || busy || category.approval_required === null}>{step === 4 ? 'Submit Registration' : 'Continue'}</Button></Box>
    </Box>}
    <Dialog open={photoCameraOpen} onClose={() => setPhotoCameraOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Capture live photo</DialogTitle>
      <DialogContent>
        <Box
          component="video"
          ref={profileVideo}
          autoPlay
          playsInline
          muted
          aria-label="Live camera preview"
          sx={{ display: 'block', width: '100%', maxHeight: '60vh', aspectRatio: '4 / 3', objectFit: 'cover', backgroundColor: '#161616' }}
        />
        {photoCameraError && <Alert severity="error" sx={{ mt: 2 }}>{photoCameraError}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPhotoCameraOpen(false)}>Cancel</Button>
        <Button
          startIcon={<CameraAltOutlinedIcon />}
          onClick={captureLivePhoto}
          variant="contained"
          disabled={Boolean(photoCameraError)}
        >
          Capture photo
        </Button>
      </DialogActions>
    </Dialog>
  </Box>;
}

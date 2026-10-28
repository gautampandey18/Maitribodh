import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { api } from '../api.js';
import { downloadBlob, requestMessage, useResource } from '../utils/resources.js';
import InternationalPhoneField from '../components/InternationalPhoneField.jsx';
import PersonIdentityCard from '../components/PersonIdentityCard.jsx';
import { formatPhoneNumber, splitPhoneNumber, toE164Phone } from '../utils/phone.js';

/* ── Section card wrapper ───────────────────────────────────────────── */
function SectionCard({ id, title, action, wide, children, editing }) {
  return (
    <Box component="section" aria-labelledby={`sec-${id}`} className={`idc-sec card${wide ? ' wide' : ''}${editing ? ' editing' : ''}`}>
      <Box className="person-section-heading">
        <Typography id={`sec-${id}`} variant="h3">{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

/* ── Read-only field ────────────────────────────────────────────────── */
function Field({ label, value }) {
  return (
    <Box className="person-readonly-field">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography>{value || '—'}</Typography>
    </Box>
  );
}

/* ── Identity Card ──────────────────────────────────────────────────── */
function usePersonPhoto(personId, photoKey) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!photoKey) return;
    let url;
    api.get(`/persons/${personId}/files/${encodeURIComponent(photoKey)}`, { responseType: 'blob' })
      .then(({ data }) => { url = URL.createObjectURL(data); setSrc(url); })
      .catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [personId, photoKey]);
  return src;
}

function IdentityCard({ person, role, onToggleStatus, displayCard = true }) {
  const photoSrc = usePersonPhoto(person.person_id, person.photo_key);
  const st = person.status;
  return (
    <PersonIdentityCard
      personId={person.person_id}
      personCode={person.person_code}
      name={`${person.first_name} ${person.last_name}`}
      category={person.category}
      status={st}
      photoSrc={photoSrc}
      mobile={formatPhoneNumber(person.mobile)}
      qrVersion={person.qr_version ?? 1}
      displayCard={displayCard}
      fields={[
        ['Address', person.address],
        ['Emergency contact', [person.emergency_contact_name, person.emergency_contact_mobile].filter(Boolean).join(' · ')],
        ['Access valid until', person.expires_on ? new Date(`${String(person.expires_on).slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Until revoked'],
      ]}
      footer={<>
        {['ADMIN', 'SUPER_ADMIN'].includes(role) && (
          <Button size="small" color="inherit" onClick={onToggleStatus} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {st === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate'}
          </Button>
        )}
      </>}
    />
  );
}

/* ══ Main page ══════════════════════════════════════════════════════════ */
export default function PersonDetailPage() {
  const { personId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const autoEditStarted = useRef(false);
  const { data: person, error, reload } = useResource(`/persons/${personId}`);
  const role = useSelector((state) => state.auth.user?.role);

  /* state */
  const [edit, setEdit] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessOptions, setAccessOptions] = useState(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [activity, setActivity] = useState(null);
  const [audit, setAudit] = useState(null);
  const [statusTarget, setStatusTarget] = useState('');
  const [reason, setReason] = useState('');

  const changePhoneCountry = useCallback((country) => {
    setEdit((prev) => prev ? { ...prev, country } : prev);
  }, []);

  const canEdit = person?.form_type !== 'STAFF' || ['ADMIN', 'SUPER_ADMIN'].includes(role);

  /* load access options + activity/audit once */
  useEffect(() => {
    if (!person) return;
    api.get('/persons/registration/options').then(({ data }) => setAccessOptions(data)).catch(() => {});
    api.get(`/persons/${personId}/activity`).then(({ data }) => setActivity(data.items)).catch(() => setActivity([]));
    if (['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      api.get(`/audit?personId=${personId}`).then(({ data }) => setAudit(data.items)).catch(() => setAudit([]));
    }
  }, [person, personId, role]);

  /* auto-open edit from ?edit=1 */
  useEffect(() => {
    if (!person || new URLSearchParams(location.search).get('edit') !== '1' || autoEditStarted.current) return;
    autoEditStarted.current = true;
    beginEdit();
    navigate(location.pathname, { replace: true });
  }, [person, location.pathname, location.search, navigate]);

  function beginEdit() {
    setProfilePhoto(null);
    const phone = splitPhoneNumber(person.mobile);
    setEdit({
      firstName: person.first_name,
      lastName: person.last_name,
      mobile: phone.number,
      country: phone.country,
      alternateMobile: person.alternate_mobile ?? '',
      email: person.email ?? '',
      address: person.address ?? '',
      emergencyName: person.emergency_contact_name ?? '',
      emergencyMobile: person.emergency_contact_mobile ?? '',
      locationIds: person.location_ids ?? [],
      expiresOn: person.expires_on ? String(person.expires_on).slice(0, 10) : '',
    });
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setFailure('');
    let profileSaved = false;
    let accessSaved = false;
    try {
      const mobile = toE164Phone(edit.mobile, person.form_type === 'VISITOR' ? edit.country : 'IN');
      if (!mobile) { setFailure('Enter a valid mobile number for the selected country.'); return; }
      const { locationIds, expiresOn, ...profileChanges } = edit;
      delete profileChanges.country;
      await api.patch(`/persons/${personId}`, { ...profileChanges, mobile });
      profileSaved = true;
      if (profilePhoto) {
        const form = new FormData(); form.append('photo', profilePhoto);
        await api.post(`/persons/${personId}/photo`, form, { headers: { 'Content-Type': undefined } });
      }
      await api.patch(`/persons/${personId}/access`, { locationIds: locationIds.map(Number), expiresOn });
      accessSaved = true;
      setEdit(null); setProfilePhoto(null); reload();
    } catch (e) {
      setFailure(profileSaved || accessSaved
        ? `Some details were saved, but another update failed: ${requestMessage(e)}`
        : requestMessage(e));
      if (profileSaved || accessSaved) {
        setEdit(null);
        setProfilePhoto(null);
        reload();
      }
    } finally { setBusy(false); }
  }

  async function saveStatus(event) {
    event.preventDefault(); setBusy(true);
    try { await api.post(`/persons/${personId}/status`, { status: statusTarget, reason }); setStatusTarget(''); setReason(''); reload(); }
    catch (e) { setFailure(requestMessage(e)); } finally { setBusy(false); }
  }

  async function downloadDocument(doc) {
    try { const { data } = await api.get(`/persons/${personId}/files/${doc.key}`, { responseType: 'blob' }); downloadBlob(data, doc.name); }
    catch (e) { setFailure(requestMessage(e)); }
  }

  async function uploadDocuments(event) {
    const files = [...event.target.files]; event.target.value = '';
    if (!files.length) return;
    const form = new FormData(); files.forEach((f) => form.append('documents', f));
    setDocumentBusy(true); setFailure('');
    try { await api.post(`/persons/${personId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }); reload(); }
    catch (e) { setFailure(requestMessage(e)); } finally { setDocumentBusy(false); }
  }

  /* derived */
  const category = accessOptions?.categories.find((c) => c.name === person?.category);
  const areas = accessOptions?.locations.filter((l) => l.location_type === 'AREA') ?? [];
  const locationNames = new Map(areas.map((a) => [String(a.location_id), a.name]));
  const categoryFieldNames = new Map((category?.schema?.fields ?? []).map((f) => [f.key, f.label]));
  const builtInCategoryFieldNames = new Map([['driver_available', 'Driver available'], ['driver_name', 'Driver name'], ['driver_mobile', 'Driver contact number']]);
  const resolvedCategoryDetails = Object.entries(person?.category_details ?? {}).map(([key, value]) => {
    const field = category?.schema?.fields?.find((f) => f.key === key);
    let displayValue = value;
    if (field?.source) {
      const src = field.source === 'AREA' ? areas : accessOptions?.lookups.filter((l) => l.lookup_type === field.source) ?? [];
      displayValue = src.find((i) => String(i.location_id ?? i.lookup_id) === String(value))?.name ?? value;
    }
    return [categoryFieldNames.get(key) ?? builtInCategoryFieldNames.get(key) ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '), key === 'driver_available' ? (value === 'YES' ? 'Yes' : value === 'NO' ? 'No' : value) : displayValue];
  });

  const profileReadFields = !person ? [] : [
    ['Full Name', `${person.first_name} ${person.last_name}`],
    ['Mobile Number', formatPhoneNumber(person.mobile)],
    ['Alternate Mobile', person.alternate_mobile],
    ['Email', person.email],
    ['Category', person.category],
    ['Address', person.address],
    ['Emergency Contact', [person.emergency_contact_name, person.emergency_contact_mobile].filter(Boolean).join(' · ')],
    ['Passport Number', person.passport_last4 ? `******${person.passport_last4}` : ''],
  ];

  const editFields = !edit ? [] : [
    ['First Name', 'firstName'], ['Last Name', 'lastName'], ['Mobile Number', 'mobile'],
    ['Alternate Mobile', 'alternateMobile'], ['Email', 'email'], ['Address', 'address'],
    ['Emergency Contact Name', 'emergencyName'], ['Emergency Contact Mobile', 'emergencyMobile'],
    ['Category', null, person?.category], ['Passport Number', null, person?.passport_last4 ? `******${person.passport_last4}` : ''],
  ];

  if (!person && !error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box className="person-detail-page">
      <Button size="small" component={Link} to="/persons" sx={{ mb: 1.5 }}>← Back to Person Management</Button>
      {(error || failure) && <Alert severity="error" sx={{ mb: 2 }}>{error || failure}</Alert>}

      {person && (
        <Box className="idc-layout">
          <SectionCard
            id="details"
            title="Person details"
            editing={Boolean(edit)}
            action={<Box className="person-detail-header-actions">
              <IdentityCard
                person={person}
                role={role}
                displayCard={false}
                onToggleStatus={() => setStatusTarget(person.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED')}
              />
              {canEdit && !edit && <Button size="small" startIcon={<EditOutlinedIcon />} onClick={beginEdit}>Edit details</Button>}
              {canEdit && (person.documents?.length ?? 0) < 12 && (
                <Button size="small" component="label" startIcon={<UploadOutlinedIcon />} disabled={documentBusy}>
                  {documentBusy ? 'Uploading…' : 'Add documents'}
                  <input hidden type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={uploadDocuments} />
                </Button>
              )}
            </Box>}
          >
            {edit ? (
              <Box id="person-details-form" component="form" onSubmit={save} className="form-grid person-overview-grid">
                <Typography className="person-detail-subheading">Profile details</Typography>
                {editFields.map(([label, key, value]) =>
                  key === 'mobile' && person.form_type === 'VISITOR'
                    ? <InternationalPhoneField key={key} country={edit.country} number={edit.mobile} onCountryChange={changePhoneCountry} onNumberChange={(m) => setEdit({ ...edit, mobile: m })} required />
                    : <TextField key={key ?? label} label={label} value={key ? edit[key] : value ?? ''} InputProps={{ readOnly: !key }} required={['firstName', 'lastName'].includes(key)} type={key === 'email' ? 'email' : 'text'} onChange={key ? (e) => setEdit({ ...edit, [key]: e.target.value }) : undefined} inputProps={{ maxLength: key?.toLowerCase().includes('mobile') ? 10 : ['firstName', 'lastName', 'emergencyName'].includes(key) ? 100 : key === 'email' ? 150 : 500, ...(key?.toLowerCase().includes('mobile') ? { pattern: '[6-9][0-9]{9}' } : {}) }} />
                )}
                <Box>
                  <Typography component="label" htmlFor="profile-photo-edit">Profile photo (optional)</Typography>
                  <input id="profile-photo-edit" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && (f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(f.type))) { setFailure('Choose a JPG or PNG photograph no larger than 5 MB.'); setProfilePhoto(null); e.target.value = ''; return; } setFailure(''); setProfilePhoto(f); }} />
                  <Typography variant="caption">{profilePhoto?.name ?? (person.photo_key ? 'Leave empty to keep the current photo.' : 'Leave empty; Security will capture a photo at first check-in.')}</Typography>
                </Box>
                <Typography className="person-detail-subheading">Access details</Typography>
                <FormControl>
                  <InputLabel id="assigned-areas-label">Assigned areas</InputLabel>
                  <Select labelId="assigned-areas-label" multiple value={edit.locationIds.map(Number)} label="Assigned areas" onChange={(e) => setEdit({ ...edit, locationIds: e.target.value.map(Number) })} renderValue={(sel) => sel.map((id) => locationNames.get(String(id)) ?? id).join(', ')}>
                    {areas.map((a) => <MenuItem key={a.location_id} value={a.location_id}><Checkbox checked={edit.locationIds.map(Number).includes(a.location_id)} />{a.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Access valid until" type="date" value={edit.expiresOn} onChange={(e) => setEdit({ ...edit, expiresOn: e.target.value })} InputLabelProps={{ shrink: true }} />
                <Box className="person-form-actions">
                  <Button size="small" onClick={() => { setEdit(null); setProfilePhoto(null); }} disabled={busy}>Cancel</Button>
                  <Button size="small" variant="contained" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box component="section" className="person-detail-subsection">
                  <Typography component="h3" className="person-detail-subheading">Profile details</Typography>
                  <Box className="person-readonly-grid">
                    {profileReadFields.map(([label, value]) => <Field key={label} label={label} value={value} />)}
                  </Box>
                </Box>
                <Box component="section" className="person-detail-subsection">
                  <Typography component="h3" className="person-detail-subheading">Access details</Typography>
                  <Box className="person-readonly-grid">
                    <Field label="Assigned areas" value={person.location_ids?.length ? person.location_ids.map((id) => locationNames.get(String(id)) ?? id).join(', ') : 'None assigned'} />
                    <Field label="Access valid until" value={person.expires_on ? new Date(`${String(person.expires_on).slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Until revoked'} />
                    <Field label="QR version" value={person.qr_version} />
                  </Box>
                  {resolvedCategoryDetails.length > 0 && (
                    <>
                      <Typography variant="h3" sx={{ mt: 2, mb: 1, fontSize: '0.8125rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category details</Typography>
                      <Box className="person-category-details">
                        {resolvedCategoryDetails.map(([label, value]) => (
                          <Box className="person-category-detail" key={label}>
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                            <Typography>{String(value)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </>
            )}

            <Box component="section" className="person-detail-subsection">
              <Typography component="h3" className="person-detail-subheading">Documents</Typography>
              {person.documents?.length
                ? <Box className="person-document-list">
                    {person.documents.map((doc) => (
                      <Box className="person-document-row" key={doc.key}>
                        <Typography>{doc.name}</Typography>
                        <Button size="small" startIcon={<DownloadOutlinedIcon />} onClick={() => downloadDocument(doc)}>Download</Button>
                      </Box>
                    ))}
                  </Box>
                : <Typography color="text.secondary">No documents uploaded.</Typography>}
            </Box>

            <Box component="section" className="person-detail-subsection">
              <Typography component="h3" className="person-detail-subheading">Visit activity</Typography>
              {activity === null
                ? <CircularProgress size={20} />
                : activity.length
                  ? activity.map((item, i) => (
                      <Box key={item.visit_id ?? i} className="idc-activity-row">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{item.location}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.status}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{new Date(item.checkin_at).toLocaleString()}</Typography>
                      </Box>
                    ))
                  : <Typography color="text.secondary">No activity.</Typography>}
            </Box>

            {['ADMIN', 'SUPER_ADMIN'].includes(role) && (
              <Box component="section" className="person-detail-subsection">
                <Typography component="h3" className="person-detail-subheading">Audit trail</Typography>
                {audit === null
                  ? <CircularProgress size={20} />
                  : audit.length
                    ? audit.map((item, i) => (
                        <Box key={item.audit_id ?? i} className="idc-activity-row">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{item.activity}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.actor}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">{new Date(item.occurred_at).toLocaleString()}</Typography>
                        </Box>
                      ))
                    : <Typography color="text.secondary">No audit records.</Typography>}
              </Box>
            )}
          </SectionCard>
        </Box>
      )}

      {/* Status change dialog */}
      <Dialog open={Boolean(statusTarget)} onClose={() => !busy && setStatusTarget('')}>
        <Box component="form" onSubmit={saveStatus}>
          <DialogTitle>{statusTarget === 'ACTIVE' ? 'Reactivate' : 'Deactivate'} Person</DialogTitle>
          <DialogContent>
            <TextField label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} fullWidth sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusTarget('')}>Cancel</Button>
            <Button type="submit" disabled={busy}>Confirm</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { Alert, Avatar, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Tab, Tabs, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { api } from '../api.js';
import { downloadBlob, requestMessage, useResource } from '../utils/resources.js';

export function QrPreview({ personId, personCode }) {
  const [image, setImage] = useState('');
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; let url;
    api.get(`/persons/${personId}/qr`, { responseType: 'blob' }).then(({ data }) => {
      if (active) { url = URL.createObjectURL(data); setImage(url); setBlob(data); }
    }).catch((failure) => { if (active) setError(requestMessage(failure, 'QR is not available for this person.')); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [personId]);
  return <Box>{error ? <Alert severity="warning">{error}</Alert> : image && <><Box component="img" src={image} alt={`QR code for ${personCode}`} sx={{ width: 240, height: 240, maxWidth: '100%', objectFit: 'contain' }} /><Box><Button startIcon={<DownloadOutlinedIcon />} onClick={() => downloadBlob(blob, `Maitribodh-QR-${personCode}.png`)}>Download</Button><Button onClick={() => { const popup = window.open('', '_blank'); if (popup) { const imageElement = popup.document.createElement('img'); imageElement.src = image; imageElement.onload = () => popup.print(); popup.document.body.append(imageElement); } }}>Print</Button></Box><Typography>Expiry: Never</Typography></>}</Box>;
}

export default function PersonDetailPage() {
  const { personId } = useParams();
  const { data: person, error, reload } = useResource(`/persons/${personId}`);
  const role = useSelector((state) => state.auth.user?.role);
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessOptions, setAccessOptions] = useState(null);
  const [accessEdit, setAccessEdit] = useState(false);
  const [accessDraft, setAccessDraft] = useState(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [activity, setActivity] = useState([]);
  const [statusTarget, setStatusTarget] = useState('');
  const [reason, setReason] = useState('');
  const canEdit = person?.form_type !== 'STAFF' || ['ADMIN', 'SUPER_ADMIN'].includes(role);
  async function chooseTab(value) {
    setTab(value); setFailure('');
    if (value === 'access' && !accessOptions) {
      try { const { data } = await api.get('/persons/registration/options'); setAccessOptions(data); }
      catch (requestError) { setFailure(requestMessage(requestError)); }
    }
    if (value === 'activity' || value === 'audit') {
      try { const { data } = await api.get(value === 'activity' ? `/persons/${personId}/activity` : `/audit?personId=${personId}`); setActivity(data.items); }
      catch (requestError) { setFailure(requestMessage(requestError)); }
    }
  }
  function beginEdit() {
    setProfilePhoto(null);
    setEdit({ firstName: person.first_name, lastName: person.last_name, mobile: person.mobile, alternateMobile: person.alternate_mobile ?? '', email: person.email ?? '', address: person.address ?? '', emergencyName: person.emergency_contact_name ?? '', emergencyMobile: person.emergency_contact_mobile ?? '' });
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setFailure('');
    try {
      await api.patch(`/persons/${personId}`, edit);
      if (profilePhoto) {
        const form = new FormData();
        form.append('photo', profilePhoto);
        await api.post(`/persons/${personId}/photo`, form, { headers: { 'Content-Type': undefined } });
      }
      setEdit(null); setProfilePhoto(null); reload();
    }
    catch (requestError) { setFailure(requestMessage(requestError)); } finally { setBusy(false); }
  }
  async function saveStatus(event) {
    event.preventDefault(); setBusy(true);
    try { await api.post(`/persons/${personId}/status`, { status: statusTarget, reason }); setStatusTarget(''); setReason(''); reload(); }
    catch (requestError) { setFailure(requestMessage(requestError)); } finally { setBusy(false); }
  }
  async function downloadDocument(document) {
    try { const { data } = await api.get(`/persons/${personId}/files/${document.key}`, { responseType: 'blob' }); downloadBlob(data, document.name); }
    catch (requestError) { setFailure(requestMessage(requestError)); }
  }
  async function saveAccess(event) {
    event.preventDefault(); setBusy(true); setFailure('');
    try {
      await api.patch(`/persons/${personId}/access`, { ...accessDraft, permissionLevelId: accessDraft.permissionLevelId ? Number(accessDraft.permissionLevelId) : null });
      setAccessEdit(false); reload();
    } catch (requestError) { setFailure(requestMessage(requestError)); } finally { setBusy(false); }
  }
  async function uploadDocuments(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    const form = new FormData();
    files.forEach((file) => form.append('documents', file));
    setDocumentBusy(true); setFailure('');
    try { await api.post(`/persons/${personId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }); reload(); }
    catch (requestError) { setFailure(requestMessage(requestError)); } finally { setDocumentBusy(false); }
  }
  const category = accessOptions?.categories.find((item) => item.name === person?.category);
  const permissionLevels = accessOptions?.lookups.filter((item) => item.lookup_type === 'PERMISSION_LEVEL') ?? [];
  const areas = accessOptions?.locations.filter((item) => item.location_type === 'AREA') ?? [];
  const locationNames = new Map(areas.map((area) => [String(area.location_id), area.name]));
  const categoryFieldNames = new Map((category?.schema?.fields ?? []).map((field) => [field.key, field.label]));
  const resolvedCategoryDetails = Object.entries(person?.category_details ?? {}).map(([key, value]) => {
    const field = category?.schema?.fields?.find((item) => item.key === key);
    let displayValue = value;
    if (field?.source) {
      const sourceItems = field.source === 'AREA' ? areas : accessOptions?.lookups.filter((item) => item.lookup_type === field.source) ?? [];
      displayValue = sourceItems.find((item) => String(item.location_id ?? item.lookup_id) === String(value))?.name ?? value;
    }
    return [categoryFieldNames.get(key) ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '), displayValue];
  });
  const profileFields = !person ? [] : edit ? [
    ['First Name', 'firstName'], ['Last Name', 'lastName'], ['Mobile Number', 'mobile'], ['Alternate Mobile', 'alternateMobile'], ['Email', 'email'], ['Address', 'address'], ['Emergency Contact Name', 'emergencyName'], ['Emergency Contact Mobile', 'emergencyMobile'], ['Category', null, person.category], ['Passport Number', null, person.passport_last4 ? `******${person.passport_last4}` : ''],
  ] : [
    ['Full Name', `${person.first_name} ${person.last_name}`], ['Mobile Number', person.mobile], ['Alternate Mobile', person.alternate_mobile], ['Email', person.email], ['Category', person.category], ['Address', person.address], ['Emergency Contact', `${person.emergency_contact_name ?? ''} ${person.emergency_contact_mobile ?? ''}`], ['Passport Number', person.passport_last4 ? `******${person.passport_last4}` : ''],
  ];
  return <Box className="person-detail-page"><Button size="small" component={Link} to="/persons">Back to Person Management</Button>{(error || failure) && <Alert severity="error" sx={{ my: 1 }}>{error || failure}</Alert>}{person && <>
    <Box className="page-heading"><Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}><Avatar sx={{ width: 40, height: 40 }}>{person.first_name?.[0]}{person.last_name?.[0]}</Avatar><Box><Typography component="h1" variant="h2">{person.first_name} {person.last_name}</Typography><Typography variant="body2" color="text.secondary">{person.person_code} · {person.category} · {person.status}</Typography></Box></Box><Box>{<Button size="small" onClick={() => chooseTab('qr')}>View QR</Button>}{['ADMIN', 'SUPER_ADMIN'].includes(role) && <Button size="small" onClick={() => setStatusTarget(person.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED')}>{person.status === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate'}</Button>}</Box></Box>
    <Tabs value={tab} onChange={(_event, value) => chooseTab(value)} variant="scrollable"><Tab value="overview" label="Overview" /><Tab value="documents" label="Documents" /><Tab value="access" label="Access Details" /><Tab value="activity" label="Activity" /><Tab value="qr" label="QR" />{['ADMIN', 'SUPER_ADMIN'].includes(role) && <Tab value="audit" label="Audit" />}</Tabs>
    {tab === 'overview' && <Box component="form" onSubmit={save} sx={{ mt: 1.5 }}><Box className="person-section-heading"><Typography variant="h3">Profile details</Typography>{canEdit && (edit ? <Box><Button size="small" onClick={() => { setEdit(null); setProfilePhoto(null); }} disabled={busy}>Cancel</Button><Button size="small" type="submit" variant="contained" disabled={busy}>Save</Button></Box> : <Button size="small" startIcon={<EditOutlinedIcon />} onClick={beginEdit}>Edit profile</Button>)}</Box>{edit ? <Box className="form-grid person-overview-grid">{profileFields.map(([label, key, value]) => <TextField key={key ?? label} label={label} value={key ? edit[key] : value ?? ''} InputProps={{ readOnly: !key }} required={['firstName', 'lastName', 'mobile'].includes(key)} type={key === 'email' ? 'email' : 'text'} onChange={key ? (event) => setEdit({ ...edit, [key]: event.target.value }) : undefined} inputProps={{ maxLength: key?.toLowerCase().includes('mobile') ? 10 : ['firstName', 'lastName', 'emergencyName'].includes(key) ? 100 : key === 'email' ? 150 : 500, ...(key?.toLowerCase().includes('mobile') ? { pattern: '[6-9][0-9]{9}' } : {}) }} />)}<Box><Typography component="label" htmlFor="profile-photo-edit">Profile photo (optional)</Typography><input id="profile-photo-edit" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))) { setFailure('Choose a JPG or PNG photograph no larger than 5 MB.'); setProfilePhoto(null); event.target.value = ''; return; } setFailure(''); setProfilePhoto(file); }} /><Typography variant="caption">{profilePhoto?.name ?? (person.photo_key ? 'Leave empty to keep the current photo.' : 'Leave empty; Security will capture a photo at first check-in.')}</Typography></Box></Box> : <Box className="person-readonly-grid">{profileFields.map(([label, value]) => <Box className="person-readonly-field" key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography>{value || '—'}</Typography></Box>)}</Box>}</Box>}
    {tab === 'documents' && <Box sx={{ mt: 1.5 }}><Box className="person-section-heading"><Typography variant="h3">Documents</Typography>{canEdit && (person.documents?.length ?? 0) < 12 && <Button size="small" component="label" startIcon={<UploadOutlinedIcon />} disabled={documentBusy}>{documentBusy ? 'Uploading' : 'Add documents'}<input hidden type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={uploadDocuments} /></Button>}</Box>{person.documents?.length ? <Box className="person-document-list">{person.documents.map((document) => <Box className="person-document-row" key={document.key}><Typography>{document.name}</Typography><Button size="small" startIcon={<DownloadOutlinedIcon />} onClick={() => downloadDocument(document)}>Download</Button></Box>)}</Box> : <Typography color="text.secondary">No documents uploaded.</Typography>}</Box>}
    {tab === 'access' && <Box sx={{ mt: 1.5 }}><Box className="person-section-heading"><Typography variant="h3">Access details</Typography>{canEdit && (accessEdit ? <Box><Button size="small" onClick={() => setAccessEdit(false)} disabled={busy}>Cancel</Button><Button size="small" type="submit" form="person-access-form" variant="contained" disabled={busy}>Save</Button></Box> : <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => { setAccessDraft({ permissionLevelId: person.permission_level_id ?? '', locationIds: person.location_ids ?? [], expiresOn: person.expires_on ? String(person.expires_on).slice(0, 10) : '' }); setAccessEdit(true); }}>Edit access</Button>)}</Box>{accessEdit ? <Box id="person-access-form" component="form" onSubmit={saveAccess} className="form-grid person-overview-grid">
      <TextField select label="Permission level" value={accessDraft.permissionLevelId} onChange={(event) => setAccessDraft({ ...accessDraft, permissionLevelId: event.target.value })}><MenuItem value="">None</MenuItem>{permissionLevels.map((level) => <MenuItem key={level.lookup_id} value={level.lookup_id}>{level.name}</MenuItem>)}</TextField>
      <FormControl><InputLabel id="assigned-areas-label">Assigned areas</InputLabel><Select labelId="assigned-areas-label" multiple value={accessDraft.locationIds.map(Number)} label="Assigned areas" onChange={(event) => setAccessDraft({ ...accessDraft, locationIds: event.target.value.map(Number) })} renderValue={(selected) => selected.map((id) => locationNames.get(String(id)) ?? id).join(', ')}>{areas.map((area) => <MenuItem key={area.location_id} value={area.location_id}><Checkbox checked={accessDraft.locationIds.map(Number).includes(area.location_id)} />{area.name}</MenuItem>)}</Select></FormControl>
      <TextField label="Access valid until" type="date" value={accessDraft.expiresOn} onChange={(event) => setAccessDraft({ ...accessDraft, expiresOn: event.target.value })} InputLabelProps={{ shrink: true }} />
    </Box> : <><Box className="person-access-summary"><Typography><strong>Permission level</strong>{' '}{permissionLevels.find((level) => String(level.lookup_id) === String(person.permission_level_id))?.name ?? 'Default'}</Typography><Typography><strong>Assigned areas</strong>{' '}{person.location_ids?.length ? person.location_ids.map((id) => locationNames.get(String(id)) ?? id).join(', ') : 'None assigned'}</Typography><Typography><strong>Access valid until</strong>{' '}{person.expires_on ? new Date(`${String(person.expires_on).slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Until revoked'}</Typography><Typography><strong>QR version</strong>{' '}{person.qr_version}</Typography></Box>{resolvedCategoryDetails.length > 0 && <><Typography variant="h3" sx={{ mt: 2, mb: 1 }}>Category details</Typography><Box className="person-category-details">{resolvedCategoryDetails.map(([label, value]) => <Box className="person-category-detail" key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography>{String(value)}</Typography></Box>)}</Box></>}</>}</Box>}
    {(tab === 'activity' || tab === 'audit') && <Box sx={{ mt: 3 }}>{activity.length ? activity.map((item, index) => <Box key={item.visit_id ?? item.audit_id ?? index} sx={{ py: 1, borderBottom: '1px solid #ddd' }}><Typography>{item.location ?? item.activity} · {item.status ?? item.actor}</Typography><Typography variant="caption">{new Date(item.checkin_at ?? item.occurred_at).toLocaleString()}</Typography></Box>) : <Typography>No activity.</Typography>}</Box>}
    {tab === 'qr' && <Box sx={{ mt: 3 }}><QrPreview personId={personId} personCode={person.person_code} /></Box>}
    <Dialog open={Boolean(statusTarget)} onClose={() => !busy && setStatusTarget('')}><Box component="form" onSubmit={saveStatus}><DialogTitle>{statusTarget === 'ACTIVE' ? 'Reactivate' : 'Deactivate'} Person</DialogTitle><DialogContent><TextField label="Reason" required value={reason} onChange={(event) => setReason(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setStatusTarget('')}>Cancel</Button><Button type="submit" disabled={busy}>Confirm</Button></DialogActions></Box></Dialog>
  </>}</Box>;
}
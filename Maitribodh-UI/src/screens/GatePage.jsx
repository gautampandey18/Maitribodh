import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, TextField, Typography } from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { api } from '../api.js';
import { blobRequestMessage, requestMessage, useResource } from '../utils/resources.js';
import PersonIdentityCard from '../components/PersonIdentityCard.jsx';

const profilePhotoDimension = 600;

async function releaseScanner(current) {
  if (current.isScanning) await current.stop();
  current.clear();
}

const states = {
  ELIGIBLE: { title: 'PROFILE FOUND', message: 'Active profile · No blacklist match', severity: 'success' },
  ALREADY_INSIDE: { title: 'PERSON ALREADY INSIDE', message: 'Check out before another check-in.', severity: 'success' },
  NOT_ACTIVE: { title: 'PENDING APPROVAL', message: 'Only Active profiles with valid access may check in.', severity: 'warning' },
  BLOCKED_BLACKLIST: { title: 'BLACKLISTED - ENTRY NOT ALLOWED', message: 'Blacklist match blocks check-in. Alert recorded.', severity: 'error' },
  LOCATION_WARNING: { title: 'LOCATION ACCESS WARNING', message: 'This person is not assigned to the selected restricted area. Verify access before proceeding.', severity: 'warning' },
  INVALID_QR: { title: 'INVALID QR', message: 'This QR code is no longer valid.', severity: 'error' },
};

export default function GatePage() {
  const { data: options, error: loadError } = useResource('/persons/registration/options');
  const [params] = useSearchParams();
  const route = useLocation();
  const [gateId, setGateId] = useState(params.get('gate') ?? '');
  const [areaId, setAreaId] = useState(params.get('area') ?? '');
  const [query, setQuery] = useState(params.get('person') ?? '');
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMissing, setPhotoMissing] = useState(false);
  const [photoRevision, setPhotoRevision] = useState(0);
  const [verified, setVerified] = useState(false);
  const [locationAcknowledged, setLocationAcknowledged] = useState(false);
  const [accompanyingCount, setAccompanyingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [scanning, setScanning] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraFallback, setCameraFallback] = useState(false);
  const [photoCameraOpen, setPhotoCameraOpen] = useState(false);
  const [photoCameraError, setPhotoCameraError] = useState('');
  const scanner = useRef(null);
  const cameraInput = useRef(null);
  const qrImageInput = useRef(null);
  const profilePhotoInput = useRef(null);
  const scannerSession = useRef(0);
  const scannerStarting = useRef(false);
  const profileVideo = useRef(null);
  const scanned = useRef(false);
  const [photoCaptureBusy, setPhotoCaptureBusy] = useState(false);
  const gates = options?.locations?.filter((item) => item.location_type === 'GATE') ?? [];
  const areas = options?.locations?.filter((item) => item.location_type === 'AREA') ?? [];
  const selectedGate = gateId || gates[0]?.location_id;
  const selectedArea = areaId || areas[0]?.location_id;
  const state = states[selected?.outcome];
  const canRecoverPhoto = ['ELIGIBLE', 'LOCATION_WARNING', 'ALREADY_INSIDE'].includes(selected?.outcome);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    let active = true;
    let url;
    setPhotoUrl('');
    setPhotoError('');
    setPhotoMissing(false);
    setVerified(false);
    setPhotoLoading(Boolean(selected?.photoKey));
    if (selected?.photoKey) api.get(`/persons/${selected.personId}/files/${encodeURIComponent(selected.photoKey)}`, { responseType: 'blob' }).then(({ data }) => {
      if (active) { url = URL.createObjectURL(data); setPhotoUrl(url); }
    }).catch(async (failure) => {
      const detail = await blobRequestMessage(failure);
      if (active) {
        setPhotoMissing(failure.response?.status === 404);
        setPhotoError(`Could not load the profile photo. ${detail} Verification is unavailable until the photo loads.`);
      }
    }).finally(() => { if (active) setPhotoLoading(false); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [selected?.personId, selected?.photoKey, photoRevision]);
  useEffect(() => () => {
    scannerSession.current += 1;
    const current = scanner.current;
    scanner.current = null;
    if (current && !scannerStarting.current) releaseScanner(current).catch((failure) => console.warn('Could not release QR camera', failure));
  }, []);
  useEffect(() => {
    if (!photoCameraOpen) return undefined;
    let active = true;
    let stream;
    setPhotoCameraError('');
    if (!window.isSecureContext) {
      setPhotoCameraError('Camera access requires HTTPS or localhost. Open the app on a secure address and try again.');
      return () => { active = false; };
    }
    const getUserMedia = navigator.mediaDevices?.getUserMedia;
    if (!getUserMedia) {
      setPhotoCameraError('This browser does not support camera capture. Open the app in a current browser over HTTPS or localhost.');
      return () => { active = false; };
    }
    getUserMedia.call(navigator.mediaDevices, { video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((cameraStream) => {
        if (!active) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = cameraStream;
        if (profileVideo.current) {
          profileVideo.current.srcObject = cameraStream;
          profileVideo.current.play().catch(() => { });
        }
      })
      .catch((failure) => {
        if (!active) return;
        const detail = failure?.name === 'NotAllowedError' || failure?.name === 'SecurityError'
          ? `The browser denied camera access for ${window.location.origin}. Allow this exact address in site settings, check OS camera privacy, then reload.`
          : failure?.name === 'NotFoundError'
            ? 'No camera was found. Connect or enable a camera, then try again.'
            : failure?.name === 'NotReadableError'
              ? 'The camera is in use by another app. Close that app and try again.'
              : 'Check camera availability and browser permissions, then try again.';
        setPhotoCameraError(detail);
      });
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
      if (profileVideo.current) profileVideo.current.srcObject = null;
    };
  }, [photoCameraOpen]);

  async function lookup(payload) {
    if (!selectedArea) { setError('Select a gate and area.'); return; }
    setBusy(true); setError(''); setItems(null); setSelected(null); setVerified(false); setLocationAcknowledged(false); setPhotoUrl(''); setAccompanyingCount(0);
    try {
      const { data } = await api.post('/gate/lookups', { ...payload, locationId: Number(selectedArea) });
      setItems(data.items);
      if (data.items.length === 1) selectPerson(data.items[0]);
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  function personForArea(person, locationId) {
    const assignedAreaIds = (person.assignedAreaIds ?? []).map(Number);
    const area = areas.find((item) => Number(item.location_id) === Number(locationId));
    const locationWarning = Boolean(area?.is_restricted && !assignedAreaIds.includes(Number(locationId)));
    return {
      ...person,
      locationWarning,
      outcome: ['ELIGIBLE', 'LOCATION_WARNING'].includes(person.outcome)
        ? locationWarning ? 'LOCATION_WARNING' : 'ELIGIBLE'
        : person.outcome,
    };
  }
  function selectPerson(person) {
    const assignedAreaIds = (person.assignedAreaIds ?? []).map(Number);
    const assignedArea = areas.find((area) => assignedAreaIds.includes(Number(area.location_id)));
    let locationId = selectedArea;
    if (assignedArea && !assignedAreaIds.includes(Number(selectedArea))) {
      locationId = assignedArea.location_id;
      setAreaId(assignedArea.location_id);
    }
    setSelected(personForArea(person, locationId));
    setVerified(false);
    setLocationAcknowledged(false);
    setAccompanyingCount(0);
  }
  async function stopCamera() {
    const current = scanner.current;
    try {
      if (current) await releaseScanner(current);
      return true;
    } catch (failure) {
      console.warn('Could not release QR camera', failure);
      setError('Could not stop the QR camera. Reload this page before starting another scan.');
      return false;
    } finally {
      if (!current?.isScanning) scanner.current = null;
      setScanning(Boolean(current?.isScanning));
    }
  }
  async function startCamera() {
    if (scanning || busy) return;
    const session = scannerSession.current;
    setError(''); scanned.current = false;
    setItems(null); setSelected(null); setVerified(false); setLocationAcknowledged(false); setPhotoUrl(''); setAccompanyingCount(0);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraFallback(true);
      setError('Live camera scanning requires HTTPS or localhost and a supported browser. Upload a QR image or capture it with the phone camera.');
      cameraInput.current?.click();
      return;
    }
    setCameraFallback(false);
    setScanning(true);
    setCameraStarting(true);
    scannerStarting.current = true;
    let current;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (session !== scannerSession.current) return;
      current = new Html5Qrcode('gate-camera', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] }); scanner.current = current;
      await current.start({ facingMode: 'environment' }, { fps: 10 }, async (value) => {
        if (session !== scannerSession.current) return;
        if (scanned.current) return;
        scanned.current = true;
        const [stopped] = await Promise.all([
          stopCamera(),
          lookup({ qrPayload: value }),
        ]);
        if (!stopped && session === scannerSession.current) setError('Could not stop the QR camera. Reload this page before starting another scan.');
      }, () => { });
      if (session !== scannerSession.current) await releaseScanner(current);
    } catch (failure) {
      if (current) {
        try {
          await releaseScanner(current);
        } catch (cleanupFailure) {
          console.warn('Could not release QR camera after startup failure', cleanupFailure);
        }
      }
      if (session !== scannerSession.current) return;
      scanner.current = null;
      const detail = failure instanceof Error ? failure.message : String(failure);
      setError(`Live camera unavailable. ${detail.slice(0, 180)} Allow camera access for this site, close other apps using the camera, or upload a QR image.`);
      setCameraFallback(true);
      setScanning(false);
    } finally {
      scannerStarting.current = false;
      if (session === scannerSession.current) setCameraStarting(false);
    }
  }
  async function scanCapturedQr(event) {
    const image = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!image) return;

    const session = scannerSession.current;
    setScanning(true);
    setCameraStarting(true);
    setError('');
    setItems(null); setSelected(null); setVerified(false); setLocationAcknowledged(false); setPhotoUrl(''); setAccompanyingCount(0);
    let current;
    let value;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (session !== scannerSession.current) return;
      current = new Html5Qrcode('gate-camera', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
      scanner.current = current;
      const { scanQrImage } = await import('../utils/qrImage.js');
      value = await scanQrImage(current, image);
    } catch (failure) {
      const detail = failure instanceof Error ? failure.message : String(failure);
      setError(`Could not read a QR code from that image. ${detail.slice(0, 240)} Use the original downloaded QR PNG or a close-up with all four corners and the white border visible. You can also search by mobile number, name or Person ID.`);
    } finally {
      try {
        current?.clear();
      } catch (cleanupFailure) {
        console.warn('Could not clear captured QR image from scanner', cleanupFailure);
      }
      scanner.current = null;
      if (session === scannerSession.current) {
        setScanning(false);
        setCameraStarting(false);
      }
    }
    if (value && session === scannerSession.current) await lookup({ qrPayload: value });
  }
  async function uploadProfilePhoto(file) {
    if (!file || !selected) return;
    const form = new FormData();
    form.append('photo', file);
    setPhotoCaptureBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post(`/persons/${selected.personId}/photo`, form, { headers: { 'Content-Type': undefined } });
      setSelected((current) => current?.personId === selected.personId ? { ...current, hasPhoto: true, photoKey: data.photo_key } : current);
      setVerified(false);
      setNotice('Photo saved. Verify the person against this photo before check-in.');
    } catch (failure) { setError(requestMessage(failure)); } finally { setPhotoCaptureBusy(false); }
  }
  function captureProfilePhoto() {
    const video = profileVideo.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setPhotoCameraError('Camera preview is not ready yet. Try again in a moment.');
      return;
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, profilePhotoDimension / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setPhotoCameraError('Could not capture the camera image. Try again.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setPhotoCameraError('Could not capture the camera image. Try again.');
        return;
      }
      const file = new File([blob], `profile-${selected.personCode}.jpg`, { type: 'image/jpeg' });
      setPhotoCameraOpen(false);
      uploadProfilePhoto(file);
    }, 'image/jpeg', 0.9);
  }
  async function movement(checkIn) {
    if (!selected || !online) return;
    setBusy(true); setError('');
    try {
      if (checkIn) await api.post('/visits', {
        personId: Number(selected.personId),
        checkinGateId: Number(selectedGate),
        checkinLocationId: Number(selectedArea),
        device: 'Gate Terminal 01',
        accompanyingCount: Number(accompanyingCount || 0),
      });
      else await api.post(`/visits/${selected.openVisitId}/check-outs`, { checkoutGateId: Number(selectedGate), checkoutLocationId: Number(selectedArea), device: 'Gate Terminal 01' });
      setNotice(checkIn ? 'Check-In recorded.' : 'Check-Out recorded.');
      await lookup({ query: selected.personCode });
    } catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  return <Box>
    <Box className="page-heading"><Typography component="h1" variant="h1">Security Gate</Typography></Box>
    {!online && <Alert severity="warning" sx={{ mb: 2 }}>System or network unavailable. Continue entry and exit on the manual paper register. Paper entries are not back-entered into MAMS.</Alert>}
    {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }}>{error || loadError}</Alert>}
    {notice && <Alert severity="success" role="status" sx={{ mb: 2 }}>{notice}</Alert>}
    {route.state?.registered && <Alert severity="success" sx={{ mb: 2 }}>Visitor registered. Find the profile and verify the photograph before check-in.</Alert>}
      <Box className={`gate-layout ${selected ? 'has-selected' : 'no-selected'}`}>
        {selected && <Box component="section" className="gate-person-panel" aria-label="Selected person details">
          <PersonIdentityCard
            personId={selected.personId}
            personCode={selected.personCode}
            name={selected.name}
            category={selected.category}
            status={selected.status}
            photoSrc={photoUrl}
            mobile={selected.mobileMasked}
            fields={[
              ['Gate', gates.find((item) => String(item.location_id) === String(selectedGate))?.name],
              ['Area', areas.find((item) => String(item.location_id) === String(selectedArea))?.name],
              ['Entry status', selected.outcome?.replaceAll('_', ' ').toLowerCase() ?? 'Ready to verify'],
              ['Additional people', selected.openVisitId ? (selected.accompanyingCount ?? 0) : accompanyingCount],
              ...(selected.insideSince ? [['Inside since', new Date(selected.insideSince).toLocaleString()]] : []),
            ]}
          />
          {photoLoading && <Typography role="status">Loading profile photo...</Typography>}
          {photoError && <Alert severity="error" sx={{ my: 1 }}>{photoError}{!photoMissing && <Button onClick={() => setPhotoRevision((value) => value + 1)} disabled={!online || photoLoading}>Retry profile photo</Button>}</Alert>}
          {(!selected.photoKey || photoMissing) && <Box sx={{ my: 1 }}>
            <Typography color="text.secondary">{photoMissing ? 'The stored profile photo is missing. Capture or upload a real photo before check-in.' : 'No profile photo. Capture one before check-in.'}</Typography>
            {canRecoverPhoto && (!selected.hasPhoto || photoMissing) && <>
              <Button startIcon={<CameraAltOutlinedIcon />} onClick={() => setPhotoCameraOpen(true)} disabled={!online || photoCaptureBusy}>{photoCaptureBusy ? 'Saving photo' : 'Open camera'}</Button>
              <input ref={profilePhotoInput} aria-label="Upload profile photo" type="file" accept="image/jpeg,image/png" hidden onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) uploadProfilePhoto(file); }} />
              <Button onClick={() => profilePhotoInput.current?.click()} disabled={!online || photoCaptureBusy}>Upload profile photo</Button>
            </>}
            {!canRecoverPhoto && <Alert severity="warning">Photo recovery is unavailable for this profile state. Ask an administrator to restore the actual profile photo and resolve the profile status or QR issue.</Alert>}
            {selected.hasPhoto && !photoMissing && <Alert severity="warning">The profile photo reference is missing. Ask an administrator to correct this profile, then scan again.</Alert>}
          </Box>}
          <FormControlLabel control={<Checkbox checked={verified} disabled={!photoUrl || photoLoading} onChange={(event) => setVerified(event.target.checked)} />} label="I verified the person against the profile photo" />
          {selected.locationWarning && <FormControlLabel control={<Checkbox checked={locationAcknowledged} onChange={(event) => setLocationAcknowledged(event.target.checked)} />} label="I acknowledge this person is not assigned to the selected restricted area" />}
        </Box>}
        <Box className="gate-scanner">
          <Typography color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>Point the camera at the QR code, upload a QR code image, or search by person details.</Typography>
          <Box id="gate-camera" sx={{ width: '100%', maxWidth: 360, minHeight: scanning ? 200 : 0, height: scanning ? 'auto' : 0, overflow: 'hidden', mx: 'auto', mb: scanning ? 1.5 : 0, borderRadius: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Button size="small" variant="outlined" startIcon={<CameraAltOutlinedIcon />} onClick={scanning ? stopCamera : startCamera} disabled={!online || !selectedArea || busy || cameraStarting}>{scanning ? 'Stop camera scan' : 'Start camera scan'}</Button>
            <input ref={qrImageInput} aria-label="Upload QR image" type="file" accept="image/jpeg,image/png" hidden onChange={scanCapturedQr} />
            <Button size="small" variant="outlined" onClick={() => qrImageInput.current?.click()} disabled={!online || !selectedArea || busy || scanning}>Upload QR image</Button>
            <input ref={cameraInput} aria-label="Capture QR code with phone camera" type="file" accept="image/jpeg,image/png" capture="environment" hidden onChange={scanCapturedQr} />
            {cameraFallback && <Button size="small" variant="outlined" onClick={() => cameraInput.current?.click()} disabled={!online || !selectedArea || busy || scanning}>Capture QR with phone camera</Button>}
          </Box>
          <Box component="form" onSubmit={(event) => { event.preventDefault(); const value = query.trim(); lookup(value.startsWith('AMS1.') ? { qrPayload: value } : { query: value }); }} sx={{ display: 'flex', gap: 1.5, mt: 1.5, alignItems: 'flex-start' }}>
            <TextField size="small" label="Mobile number, name or Person ID" value={query} onChange={(event) => setQuery(event.target.value)} required sx={{ flex: 1, maxWidth: 460 }} />
            <Button size="medium" type="submit" startIcon={<SearchOutlinedIcon />} variant="contained" disabled={busy || scanning || !online} sx={{ minHeight: 40, px: 2.5 }}>Find Person</Button>
          </Box>
          {items?.length > 1 && <Box sx={{ mt: 1.5 }}><Typography variant="body2">{items.length} registrations found</Typography>{items.map((item) => <Button key={item.personId} onClick={() => selectPerson(item)} size="small" fullWidth sx={{ justifyContent: 'flex-start' }}>{item.name} · {item.category} · {item.personCode}</Button>)}</Box>}
        </Box>
        <Box className="gate-result-panel">
          <Box className="form-grid"><Autocomplete options={gates} value={gates.find((item) => String(item.location_id) === String(selectedGate)) ?? null} getOptionLabel={(item) => item.name} isOptionEqualToValue={(item, value) => item.location_id === value.location_id} onChange={(_event, item) => { setGateId(item?.location_id ?? ''); setSelected(null); setLocationAcknowledged(false); setAccompanyingCount(0); }} renderInput={(inputParams) => <TextField {...inputParams} label="Gate" required />} /><Autocomplete options={areas} value={areas.find((item) => String(item.location_id) === String(selectedArea)) ?? null} getOptionLabel={(item) => item.name} isOptionEqualToValue={(item, value) => item.location_id === value.location_id} onChange={(_event, item) => { if (!item) return; const nextArea = Number(item.location_id); setAreaId(nextArea); setVerified(false); setLocationAcknowledged(false); if (selected) setSelected(personForArea(selected, nextArea)); else setItems(null); }} renderInput={(inputParams) => <TextField {...inputParams} label="Area" required />} /></Box>
          {busy && <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}><CircularProgress size={20} /><Typography>Loading person information...</Typography></Box>}
          <Alert severity={state?.severity ?? 'info'} sx={{ my: 3 }}><Typography variant="h3">{state?.title ?? (items?.length === 0 ? 'PERSON NOT FOUND' : 'READY TO VERIFY')}</Typography>{state?.message ?? (items?.length === 0 ? 'A valid person record is required before entry.' : 'Scan a QR code to automatically display the person, or search by registered mobile number, name, or Person ID.')}</Alert>
          {selected && !selected.openVisitId && (
            <TextField
              label="Additional people accompanying"
              type="number"
              size="small"
              value={accompanyingCount}
              onChange={(event) => setAccompanyingCount(Math.max(0, parseInt(event.target.value, 10) || 0))}
              inputProps={{ min: 0, max: 32767, step: 1 }}
              helperText="Number of guests entering together with this person"
              sx={{ mb: 2, maxWidth: 300 }}
              disabled={busy || !online}
            />
          )}
          <Box sx={{ display: 'flex', gap: 2 }}><Button variant="contained" startIcon={busy ? <CircularProgress size={18} /> : <LoginOutlinedIcon />} onClick={() => movement(true)} disabled={busy || !online || !['ELIGIBLE', 'LOCATION_WARNING'].includes(selected?.outcome) || !verified || !photoUrl || (selected?.locationWarning && !locationAcknowledged) || !selectedGate}>Check-In</Button><Button variant="outlined" startIcon={<LogoutOutlinedIcon />} onClick={() => movement(false)} disabled={busy || !online || !selected?.openVisitId || !selectedGate}>Check-Out</Button></Box>
          {items?.length === 0 && <Button sx={{ mt: 3 }} component={Link} to={`/register?from=gate&gate=${selectedGate}&area=${selectedArea}`} disabled={!online}>Register Visitor</Button>}
        </Box>
      </Box>
      <Dialog open={photoCameraOpen} onClose={() => setPhotoCameraOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Capture profile photo</DialogTitle><DialogContent><Box component="video" ref={profileVideo} autoPlay playsInline muted aria-label="Live profile photo camera preview" sx={{ display: 'block', width: '100%', maxHeight: '60vh', aspectRatio: '4 / 3', objectFit: 'cover', backgroundColor: '#161616' }} />{photoCameraError && <Alert severity="error" sx={{ mt: 2 }}>{photoCameraError}</Alert>}</DialogContent><DialogActions><Button onClick={() => setPhotoCameraOpen(false)} disabled={photoCaptureBusy}>Cancel</Button><Button startIcon={<CameraAltOutlinedIcon />} onClick={captureProfilePhoto} variant="contained" disabled={photoCaptureBusy || Boolean(photoCameraError)}>Capture photo</Button></DialogActions></Dialog>
    </Box>;
}
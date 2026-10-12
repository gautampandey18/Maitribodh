import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import GatePage from './GatePage.jsx';

const scannerMocks = vi.hoisted(() => ({ scanFile: vi.fn(), start: vi.fn(), stop: vi.fn(), clear: vi.fn() }));
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    constructor() { this.isScanning = false; }
    scanFile(...args) { return scannerMocks.scanFile(...args); }
    start(...args) { return scannerMocks.start(...args); }
    stop(...args) { return scannerMocks.stop(...args); }
    clear(...args) { return scannerMocks.clear(...args); }
  },
}));

beforeEach(() => {
  scannerMocks.scanFile.mockReset().mockResolvedValue('signed-qr-payload');
  scannerMocks.start.mockReset();
  scannerMocks.stop.mockReset();
  scannerMocks.clear.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const options = { categories: [], lookups: [], locations: [{ location_id: 1, location_type: 'GATE', name: 'Main Gate' }, { location_id: 2, location_type: 'AREA', name: 'Goushala' }] };
it('searches configured gates and areas from their selectors', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: {
    ...options,
    locations: [
      ...options.locations,
      { location_id: 3, location_type: 'GATE', name: 'North Gate' },
      { location_id: 4, location_type: 'AREA', name: 'Workshop Area' },
    ],
  } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);

  const gate = await screen.findByRole('combobox', { name: 'Gate' });
  await user.click(gate);
  await user.clear(gate);
  await user.type(gate, 'North');
  expect(await screen.findByRole('option', { name: 'North Gate' })).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'North Gate' }));

  const area = screen.getByRole('combobox', { name: 'Area' });
  await user.click(area);
  await user.clear(area);
  await user.type(area, 'Workshop');
  expect(await screen.findByRole('option', { name: 'Workshop Area' })).toBeInTheDocument();
}, 30_000);

it('requires lookup and photo confirmation before check-in', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', category: 'Visitor', outcome: 'ELIGIBLE', status: 'ACTIVE', openVisitId: null }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  expect(await screen.findByRole('combobox', { name: 'Area' })).toHaveValue('Goushala');
  await user.type(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' }), 'MB-000008');
  await user.click(screen.getByRole('button', { name: 'Find Person' }));
  expect(await screen.findByText('PROFILE FOUND')).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith('/gate/lookups', { query: 'MB-000008', locationId: 2 });
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Check-Out' })).toBeDisabled();
}, 30_000);
it('auto-selects an assigned area and warns when another restricted area is selected', async () => {
  const restrictedOptions = {
    ...options,
    locations: [
      options.locations[0],
      { location_id: 2, location_type: 'AREA', name: 'Assigned Hall', is_restricted: true },
      { location_id: 3, location_type: 'AREA', name: 'Other Hall', is_restricted: true },
    ],
  };
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:person-photo'), revokeObjectURL: vi.fn() });
  vi.spyOn(api, 'get').mockImplementation((url) => Promise.resolve({ data: url === '/persons/registration/options' ? restrictedOptions : new Blob(['photo'], { type: 'image/jpeg' }) }));
  vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 12, personCode: 'MB-000012', name: 'Maya Rao', category: 'Visitor', outcome: 'LOCATION_WARNING', locationWarning: true, assignedAreaIds: [2], status: 'ACTIVE', hasPhoto: true, photoKey: 'maya.jpg', openVisitId: null }] } });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/gate?gate=1&area=3']}><GatePage /></MemoryRouter>);

  expect(await screen.findByRole('combobox', { name: 'Area' })).toHaveValue('Other Hall');
  await user.type(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' }), 'MB-000012');
  await user.click(screen.getByRole('button', { name: 'Find Person' }));
  expect(await screen.findByText('PROFILE FOUND')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Area' })).toHaveValue('Assigned Hall');

  await user.click(screen.getByRole('combobox', { name: 'Area' }));
  await user.click(screen.getByRole('option', { name: 'Other Hall' }));
  expect(await screen.findByText('LOCATION ACCESS WARNING')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  const photoVerification = screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' });
  await waitFor(() => expect(photoVerification).toBeEnabled());
  await user.click(photoVerification);
  await user.click(screen.getByRole('checkbox', { name: 'I acknowledge this person is not assigned to the selected restricted area' }));
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeEnabled();
}, 30_000);
it('blacklisted persons cannot check in but can leave an open visit', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', category: 'Visitor', outcome: 'BLOCKED_BLACKLIST', status: 'ACTIVE', openVisitId: 10 }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  expect(await screen.findByRole('combobox', { name: 'Area' })).toHaveValue('Goushala');
  await user.type(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' }), 'Asha Patel');
  await user.click(screen.getByRole('button', { name: 'Find Person' }));
  expect(await screen.findByText('BLACKLISTED - ENTRY NOT ALLOWED')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Check-Out' })).toBeEnabled();
}, 30_000);

it('offers phone camera capture when live scanning is unavailable on mobile', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [] } });
  const user = userEvent.setup();

  render(<MemoryRouter><GatePage /></MemoryRouter>);
  expect(await screen.findByRole('combobox', { name: 'Area' })).toHaveValue('Goushala');
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));

  expect(await screen.findByText(/Live camera scanning requires HTTPS on mobile/)).toBeInTheDocument();
  expect(scannerMocks.scanFile).not.toHaveBeenCalled();
  const image = new File(['qr image'], 'qr.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Capture QR code with phone camera'), { target: { files: [image] } });

  await waitFor(() => expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 }));
  expect(scannerMocks.scanFile).toHaveBeenCalledWith(image, false);
}, 30_000);
it('captures and saves a missing profile photo before enabling check-in', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:profile-photo'), revokeObjectURL: vi.fn() });
  const stopTrack = vi.fn();
  const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  vi.stubGlobal('navigator', { onLine: true, mediaDevices: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob(['captured'], { type })));
  vi.spyOn(api, 'get').mockImplementation((url) => Promise.resolve({ data: url === '/persons/registration/options' ? options : new Blob(['photo'], { type: 'image/jpeg' }) }));
  const person = { personId: 9, personCode: 'MB-000009', name: 'Anya Shah', category: 'Visitor', outcome: 'ELIGIBLE', status: 'ACTIVE', hasPhoto: false, openVisitId: null };
  const post = vi.spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { items: [person] } })
    .mockResolvedValueOnce({ data: { photo_key: 'profile-photo.jpg' } })
    .mockResolvedValue({ data: { items: [{ ...person, hasPhoto: true, photoKey: 'profile-photo.jpg' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  expect(await screen.findByRole('combobox', { name: 'Area' })).toHaveValue('Goushala');
  await user.type(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' }), 'MB-000009');
  await user.click(screen.getByRole('button', { name: 'Find Person' }));
  expect(await screen.findByText('No profile photo. Capture one before check-in.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: 'Open camera' }));
  expect(await screen.findByRole('heading', { name: 'Capture profile photo' })).toBeInTheDocument();
  await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: 'environment' } }, audio: false }));
  const preview = screen.getByLabelText('Live profile photo camera preview');
  Object.defineProperty(preview, 'videoWidth', { configurable: true, value: 1280 });
  Object.defineProperty(preview, 'videoHeight', { configurable: true, value: 960 });
  await user.click(screen.getByRole('button', { name: 'Capture photo' }));
  expect(drawImage).toHaveBeenCalledWith(preview, 0, 0, 600, 450);
  await waitFor(() => expect(post).toHaveBeenNthCalledWith(2, '/persons/9/photo', expect.any(FormData), { headers: { 'Content-Type': undefined } }));
  expect(post.mock.calls[1][1].get('photo').type).toBe('image/jpeg');
  expect(stopTrack).toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const verification = screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' });
  await waitFor(() => expect(verification).toBeEnabled());
  await user.click(screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' }));
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeEnabled();
}, 30_000);
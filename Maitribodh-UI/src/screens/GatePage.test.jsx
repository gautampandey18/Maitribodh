import { MemoryRouter } from 'react-router-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import GatePage from './GatePage.jsx';

const scannerMocks = vi.hoisted(() => ({ scanFile: vi.fn(), start: vi.fn(), stop: vi.fn(), clear: vi.fn(), scanQrImage: vi.fn() }));
vi.mock('../utils/qrImage.js', () => ({ scanQrImage: scannerMocks.scanQrImage }));
vi.mock('html5-qrcode', () => ({
  Html5QrcodeSupportedFormats: { QR_CODE: 0 },
  Html5Qrcode: class {
    constructor() { this.isScanning = false; }
    scanFile(...args) { return scannerMocks.scanFile(...args); }
    async start(...args) { await scannerMocks.start(...args); this.isScanning = true; }
    async stop(...args) { await scannerMocks.stop(...args); this.isScanning = false; }
    clear(...args) { return scannerMocks.clear(...args); }
  },
}));

beforeEach(() => {
  scannerMocks.scanFile.mockReset().mockResolvedValue('signed-qr-payload');
  scannerMocks.start.mockReset();
  scannerMocks.stop.mockReset();
  scannerMocks.clear.mockReset();
  scannerMocks.scanQrImage.mockReset().mockImplementation((reader, image) => reader.scanFile(image, false));
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
  const personCard = screen.getByRole('region', { name: 'Selected person details' });
  expect(personCard).toHaveClass('gate-person-panel');
  expect(personCard).toHaveTextContent('Asha Patel');
  expect(personCard).toHaveTextContent('MB-000008');
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

  expect(await screen.findByText(/Live camera scanning requires HTTPS or localhost/)).toBeInTheDocument();
  expect(scannerMocks.scanFile).not.toHaveBeenCalled();
  const image = new File(['qr image'], 'qr.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Capture QR code with phone camera'), { target: { files: [image] } });

  await waitFor(() => expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 }));
  expect(scannerMocks.scanFile).toHaveBeenCalledWith(image, false);
}, 30_000);
it('identifies a person from an uploaded QR without camera access', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', category: 'Visitor', outcome: 'ELIGIBLE', status: 'ACTIVE' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  const image = new File(['qr'], 'qr.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText('Upload QR image'), image);
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getByText('MB-000008')).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 });
  expect(scannerMocks.start).not.toHaveBeenCalled();
  expect(scannerMocks.clear).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
});

it('uses a desktop-compatible camera preference and looks up each scan only once', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', outcome: 'ELIGIBLE' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start camera scan' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stop camera scan' })).toBeEnabled());
  expect(scannerMocks.start).toHaveBeenCalledWith({ facingMode: 'environment' }, { fps: 10 }, expect.any(Function), expect.any(Function));
  const onScan = scannerMocks.start.mock.calls[0][2];
  await act(async () => { await Promise.all([onScan('signed-qr-payload'), onScan('signed-qr-payload')]); });
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 });
  expect(scannerMocks.stop).toHaveBeenCalledTimes(1);
});

it('still looks up a decoded QR if camera cleanup fails', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
  scannerMocks.stop.mockRejectedValue(new Error('Camera stop failed'));
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start camera scan' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stop camera scan' })).toBeEnabled());
  await act(async () => { await scannerMocks.start.mock.calls[0][2]('signed-qr-payload'); });
  expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 });
  expect(warn).toHaveBeenCalled();
  expect(screen.getByText(/Could not stop the QR camera/)).toBeInTheDocument();
  scannerMocks.stop.mockResolvedValue();
  cleanup();
});

it('automatically displays the detected person and photo before camera shutdown finishes', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:person-photo'), revokeObjectURL: vi.fn() });
  let finishStop;
  scannerMocks.stop.mockImplementation(() => new Promise((resolve) => { finishStop = resolve; }));
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({ data: path === '/persons/registration/options' ? options : new Blob(['photo'], { type: 'image/jpeg' }) }));
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', category: 'Visitor', mobileMasked: '******3210', status: 'ACTIVE', outcome: 'ELIGIBLE', photoKey: 'asha.jpg' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start camera scan' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stop camera scan' })).toBeEnabled());
  let detection;
  act(() => { detection = scannerMocks.start.mock.calls[0][2]('signed-qr-payload'); });
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(screen.getByText('MB-000008')).toBeInTheDocument();
  expect(screen.getByText('******3210')).toBeInTheDocument();
  expect(screen.getByText('Visitor')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' })).toHaveValue('');
  expect(post).toHaveBeenCalledExactlyOnceWith('/gate/lookups', { qrPayload: 'signed-qr-payload', locationId: 2 });
  await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:person-photo'));
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  await act(async () => { finishStop(); await detection; });
});

it('reports camera permission failure and leaves image upload available', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
  scannerMocks.start.mockRejectedValue(new Error('Permission denied'));
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start camera scan' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));
  expect(await screen.findByText(/Live camera unavailable. Permission denied/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Capture QR with phone camera' })).toBeEnabled();
  expect(scannerMocks.clear).toHaveBeenCalled();
});

it('releases a camera that finishes starting after leaving the screen', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
  let finishStart;
  scannerMocks.start.mockImplementation(() => new Promise((resolve) => { finishStart = resolve; }));
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const user = userEvent.setup();
  const { unmount } = render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start camera scan' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Start camera scan' }));
  await waitFor(() => expect(scannerMocks.start).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: 'Stop camera scan' })).toBeDisabled();
  unmount();
  await act(async () => { finishStart(); });
  await waitFor(() => expect(scannerMocks.stop).toHaveBeenCalledTimes(1));
  expect(scannerMocks.clear).toHaveBeenCalledTimes(1);
});

it('routes signed QR text from a USB reader to QR verification instead of name search', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Area' })).toHaveValue('Goushala'));
  await user.type(screen.getByRole('textbox', { name: 'Mobile number, name or Person ID' }), 'AMS1.MB-000008.1.signature{Enter}');
  await waitFor(() => expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'AMS1.MB-000008.1.signature', locationId: 2 }));
});

it('reports unreadable images without performing a person lookup', async () => {
  scannerMocks.scanFile.mockRejectedValue(new Error('No QR code found'));
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post');
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['bad image'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText(/Could not read a QR code from that image/)).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled();
});

it('identifies a person after Html5-QRCode image preparation retries', async () => {
  scannerMocks.scanFile.mockRejectedValue(new Error('No MultiFormat Readers were able to detect the code.'));
  scannerMocks.scanQrImage.mockResolvedValue('AMS1.MB-000008.1.signature');
  vi.spyOn(api, 'get').mockResolvedValue({ data: options });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', outcome: 'ELIGIBLE' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  const image = new File(['qr'], 'qr.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText('Upload QR image'), image);
  expect(await screen.findByText('Asha Patel')).toBeInTheDocument();
  expect(scannerMocks.scanQrImage).toHaveBeenCalledWith(expect.objectContaining({ scanFile: expect.any(Function) }), image);
  expect(post).toHaveBeenCalledWith('/gate/lookups', { qrPayload: 'AMS1.MB-000008.1.signature', locationId: 2 });
  expect(screen.queryByText(/Could not read a QR code/)).not.toBeInTheDocument();
});

it.each([
  ['INVALID_QR', 'INVALID QR'],
  ['BLOCKED_BLACKLIST', 'BLACKLISTED - ENTRY NOT ALLOWED'],
  ['NOT_ACTIVE', 'PENDING APPROVAL'],
  ['ALREADY_INSIDE', 'PERSON ALREADY INSIDE'],
])('preserves %s when scanning a person in an unassigned restricted area', async (outcome, title) => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { ...options, locations: [options.locations[0], { ...options.locations[1], is_restricted: true }] } });
  vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, personCode: 'MB-000008', name: 'Asha Patel', outcome, assignedAreaIds: [] }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['qr'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText(title)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
});

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

it('explains photo loading failure and enables verification after retry succeeds', async () => {
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:retried-photo'), revokeObjectURL: vi.fn() });
  const photoFailure = { response: { status: 503, data: { error: { message: 'Photo storage unavailable' } } } };
  let photoRequests = 0;
  vi.spyOn(api, 'get').mockImplementation((path) => {
    if (path === '/persons/registration/options') return Promise.resolve({ data: options });
    photoRequests += 1;
    return photoRequests === 1 ? Promise.reject(photoFailure) : Promise.resolve({ data: new Blob(['photo'], { type: 'image/jpeg' }) });
  });
  vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 8, name: 'Asha Patel', personCode: 'MB-000008', outcome: 'ELIGIBLE', hasPhoto: true, photoKey: 'asha.jpg' }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['qr'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText(/Could not load the profile photo. Photo storage unavailable/)).toBeInTheDocument();
  const verification = screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' });
  expect(verification).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Retry profile photo' }));
  await waitFor(() => expect(verification).toBeEnabled());
  expect(screen.queryByText(/Could not load the profile photo/)).not.toBeInTheDocument();
  await user.click(verification);
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeEnabled();
});

it('allows uploading a missing photo for a profile with a restricted-area warning', async () => {
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:uploaded-photo'), revokeObjectURL: vi.fn() });
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({ data: path === '/persons/registration/options' ? { ...options, locations: [options.locations[0], { ...options.locations[1], is_restricted: true }] } : new Blob(['photo'], { type: 'image/jpeg' }) }));
  const post = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { items: [{ personId: 8, name: 'Asha Patel', outcome: 'LOCATION_WARNING', hasPhoto: false, assignedAreaIds: [] }] } }).mockResolvedValueOnce({ data: { photo_key: 'uploaded.jpg' } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['qr'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText('LOCATION ACCESS WARNING')).toBeInTheDocument();
  const verification = screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' });
  expect(verification).toBeDisabled();
  const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  await user.upload(screen.getByLabelText('Upload profile photo'), photo);
  await waitFor(() => expect(verification).toBeEnabled());
  expect(post).toHaveBeenNthCalledWith(2, '/persons/8/photo', expect.any(FormData), { headers: { 'Content-Type': undefined } });
  expect(post.mock.calls[1][1].get('photo')).toEqual(photo);
  await user.click(verification);
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  await user.click(screen.getByRole('checkbox', { name: 'I acknowledge this person is not assigned to the selected restricted area' }));
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeEnabled();
});

it('recovers a missing stored photo after reading the API error from a blob', async () => {
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:recovered-photo'), revokeObjectURL: vi.fn() });
  const blob = new Blob([], { type: 'application/json' });
  blob.text = async () => JSON.stringify({ error: { code: 'FILE_NOT_FOUND', message: 'File not found' } });
  const get = vi.spyOn(api, 'get').mockImplementation((path) => {
    if (path === '/persons/registration/options') return Promise.resolve({ data: options });
    if (path.includes('dev-seed')) return Promise.reject({ response: { status: 404, data: blob } });
    return Promise.resolve({ data: new Blob(['real photo'], { type: 'image/jpeg' }) });
  });
  vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { items: [{ personId: 8, name: 'Asha Patel', outcome: 'ELIGIBLE', hasPhoto: true, photoKey: 'dev-seed/no-object-asha.jpg' }] } }).mockResolvedValueOnce({ data: { photo_key: 'recovered.jpg' } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['qr'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText(/Could not load the profile photo. File not found/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry profile photo' })).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons/8/files/dev-seed%2Fno-object-asha.jpg', { responseType: 'blob' });
  const verification = screen.getByRole('checkbox', { name: 'I verified the person against the profile photo' });
  expect(verification).toBeDisabled();
  await user.upload(screen.getByLabelText('Upload profile photo'), new File(['real photo'], 'photo.jpg', { type: 'image/jpeg' }));
  await waitFor(() => expect(verification).toBeEnabled());
  expect(screen.queryByText(/Could not load the profile photo/)).not.toBeInTheDocument();
  await user.click(verification);
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeEnabled();
});

it('offers missing photo recovery for a person already inside without allowing another check-in', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => path === '/persons/registration/options'
    ? Promise.resolve({ data: options })
    : Promise.reject({ response: { status: 404, data: { error: { message: 'File not found' } } } }));
  vi.spyOn(api, 'post').mockResolvedValue({ data: { items: [{ personId: 16, personCode: 'MB-000016', name: 'Asha Patel', outcome: 'ALREADY_INSIDE', status: 'ACTIVE', hasPhoto: true, photoKey: 'missing.jpg', openVisitId: 20 }] } });
  const user = userEvent.setup();
  render(<MemoryRouter><GatePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload QR image' })).toBeEnabled());
  await user.upload(screen.getByLabelText('Upload QR image'), new File(['qr'], 'qr.png', { type: 'image/png' }));
  expect(await screen.findByText(/stored profile photo is missing/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open camera' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Upload profile photo' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Check-In' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Check-Out' })).toBeEnabled();
});
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import PersonDetailPage from './PersonDetailPage.jsx';

const nativeCreateObjectURL = URL.createObjectURL;
const nativeRevokeObjectURL = URL.revokeObjectURL;

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
  if (nativeCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: nativeCreateObjectURL });
  else URL.createObjectURL = () => 'blob:person-qr';
  if (nativeRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: nativeRevokeObjectURL });
  else URL.revokeObjectURL = () => {};
});

function mockPersonApi(person) {
  URL.createObjectURL = () => 'blob:person-qr';
  URL.revokeObjectURL = () => {};
  return vi.spyOn(api, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/persons/registration/options'
      ? { categories: [{ name: person.category, schema: { fields: person.category_details?.purpose ? [{ key: 'purpose', label: 'Purpose' }] : [] } }], lookups: [], locations: [] }
      : url.endsWith('/activity') || url.startsWith('/audit')
        ? { items: [] }
        : url.endsWith('/qr')
          ? new Blob(['qr'], { type: 'image/png' })
          : person,
  }));
}

it('opens profile edit mode when Update is selected from Person Management', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    email: 'asha@example.com',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  mockPersonApi(person);

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/persons/8?edit=1']}>
        <Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  expect(await screen.findByRole('heading', { name: 'Person details' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Download ID card' })).toBeInTheDocument();
  expect(screen.getByLabelText('ID card download')).toContainElement(screen.getByRole('button', { name: 'Download ID card' }));
  expect(screen.queryByLabelText('Identity card')).not.toBeInTheDocument();
  expect(screen.queryByText(/QR active/)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'QR code' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Person details' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Person details' })).toHaveClass('idc-sec');
  expect(await screen.findByRole('textbox', { name: 'First Name' })).toHaveValue('Asha');
  expect(screen.getByRole('button', { name: 'Save details' })).toBeInTheDocument();
}, 30_000);

it('downloads a PNG containing the complete identity card', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    email: 'asha@example.com',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  mockPersonApi(person);
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);

  const download = await screen.findByRole('button', { name: 'Download ID card' });
  await waitFor(() => expect(download).toBeEnabled());
  const drawImage = vi.fn();
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName, ...args) => {
    const element = createElement(tagName, ...args);
    if (tagName === 'canvas') {
      element.getContext = () => ({ drawImage });
      element.toBlob = (callback) => callback(new Blob(['png'], { type: 'image/png' }));
    }
    return element;
  });
  vi.stubGlobal('Image', class {
    naturalWidth = 1200;
    naturalHeight = 610;
    set src(value) {
      this.source = value;
      queueMicrotask(() => this.onload?.());
    }
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clickDownload() {
    expect(this.download).toBe('Maitribodh-ID-Card-MB-000008.png');
  });

  await user.click(download);
  await waitFor(() => expect(click).toHaveBeenCalledOnce());
  expect(drawImage).toHaveBeenCalledOnce();
}, 30_000);

it('edits profile inline and renders access details as readable fields', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    email: 'asha@example.com',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    documents: [],
    category_details: { purpose: 'Meeting' },
    location_ids: [],
    qr_version: 1,
  };
  const get = mockPersonApi(person);
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: person });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { photo_key: 'new-profile.jpg' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);

  expect(await screen.findByRole('heading', { name: 'Person details' })).toBeInTheDocument();
  await screen.findByRole('button', { name: 'Download ID card' });
  expect(screen.getByLabelText('ID card download')).toContainElement(screen.getByRole('button', { name: 'Download ID card' }));
  expect(screen.getByLabelText('ID card download')).toContainElement(screen.getByRole('button', { name: 'Deactivate' }));
  expect(screen.queryByLabelText('Identity card')).not.toBeInTheDocument();
  expect(await screen.findByRole('img', { name: 'QR code for MB-000008' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit details' }));
  const firstName = screen.getByRole('textbox', { name: 'First Name' });
  const form = firstName.closest('form');
  const formActions = form.querySelector('.person-form-actions');
  expect(form).toHaveAttribute('id', 'person-details-form');
  expect(form).toContainElement(screen.getByRole('combobox', { name: 'Assigned areas' }));
  expect(form).toContainElement(screen.getByLabelText('Access valid until'));
  expect(formActions).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  expect(formActions).toContainElement(screen.getByRole('button', { name: 'Save details' }));
  await user.clear(firstName);
  await user.type(firstName, 'Anya');
  await user.click(screen.getByRole('button', { name: 'Save details' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.objectContaining({ firstName: 'Anya' })));
  expect(patch).toHaveBeenCalledWith('/persons/8/access', expect.objectContaining({ locationIds: [], expiresOn: '' }));
  expect(post).not.toHaveBeenCalled();

  const detailsBox = screen.getByRole('region', { name: 'Person details' });
  expect(detailsBox).toContainElement(screen.getByRole('heading', { name: 'Profile details' }));
  expect(detailsBox).toContainElement(screen.getByRole('heading', { name: 'Access details' }));
  expect(detailsBox).toContainElement(screen.getByRole('heading', { name: 'Documents' }));
  expect(screen.queryByRole('button', { name: 'Edit access' })).not.toBeInTheDocument();
  expect(await screen.findByText('Purpose')).toBeInTheDocument();
  expect(screen.getByText('Meeting')).toBeInTheDocument();
  expect(screen.queryByText(/\{\s*"purpose"/)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons/registration/options');
}, 30_000);

it('uploads a profile photo only when one is selected during edit', async () => {
  const person = { person_id: 8, person_code: 'MB-000008', first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', category: 'Visitor', form_type: 'VISITOR', status: 'ACTIVE', documents: [], category_details: {}, location_ids: [], qr_version: 1 };
  mockPersonApi(person);
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: person });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { photo_key: 'new-profile.jpg' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);
  expect(await screen.findByRole('heading', { name: 'Person details' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit details' }));
  const image = new File(['profile'], 'profile.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Profile photo (optional)'), { target: { files: [image] } });
  await user.click(screen.getByRole('button', { name: 'Save details' }));

  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.any(Object)));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/photo', expect.any(FormData), { headers: { 'Content-Type': undefined } }));
  expect(post.mock.calls[0][1].get('photo')).toBe(image);
}, 30_000);

it('displays the profile image and QR code on the person details page without identity card view', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    photo_key: 'profile-photo.jpg',
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  mockPersonApi(person);

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/persons/8']}>
        <Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );

  expect(screen.queryByLabelText('Identity card')).not.toBeInTheDocument();
  expect(await screen.findByRole('img', { name: 'Asha Patel profile' })).toBeInTheDocument();
  expect(await screen.findByRole('img', { name: 'QR code for MB-000008' })).toBeInTheDocument();
  expect(screen.getByText('Scan at gate')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Download ID card' })).toBeInTheDocument();
  expect(screen.getByLabelText('ID card download')).toContainElement(screen.getByRole('button', { name: 'Download ID card' }));
}, 30_000);

it('displays fallback avatar initials and QR code when person has no photo', async () => {
  const person = {
    person_id: 9,
    person_code: 'MB-000009',
    first_name: 'Vikram',
    last_name: 'Singh',
    mobile: '+919820000001',
    category: 'Staff',
    form_type: 'STAFF',
    status: 'ACTIVE',
    photo_key: null,
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  mockPersonApi(person);

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/persons/9']}>
        <Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );

  expect(screen.queryByLabelText('Identity card')).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Vikram Singh profile' })).not.toBeInTheDocument();
  expect(await screen.findByRole('img', { name: 'QR code for MB-000009' })).toBeInTheDocument();
  expect(screen.getByText('VS')).toBeInTheDocument();
  expect(screen.getByText('Scan at gate')).toBeInTheDocument();
}, 30_000);

it('opens status change dialog and deactivates person with reason', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    photo_key: null,
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  mockPersonApi(person);
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { ...person, status: 'DEACTIVATED' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/persons/8']}>
        <Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );

  await screen.findByRole('heading', { name: 'Person details' });
  const deactivateBtn = screen.getByRole('button', { name: 'Deactivate' });
  await user.click(deactivateBtn);

  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('heading', { name: 'Deactivate person' })).toBeInTheDocument();
  expect(within(dialog).getByText(/Asha Patel/)).toBeInTheDocument();
  expect(within(dialog).getByText('(MB-000008)')).toBeInTheDocument();

  const reasonInput = within(dialog).getByRole('textbox', { name: 'Reason for deactivation' });
  const confirmBtn = within(dialog).getByRole('button', { name: 'Confirm deactivation' });
  expect(confirmBtn).toBeDisabled();

  await user.type(reasonInput, 'Temporary leave of absence');
  expect(confirmBtn).toBeEnabled();

  await user.click(confirmBtn);
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/status', {
    status: 'DEACTIVATED',
    reason: 'Temporary leave of absence',
  }));
}, 30_000);
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  await waitFor(() => expect(document.querySelector('.idc-name')).toHaveTextContent('Asha Patel'));
  const cardActions = screen.getByLabelText('Identity card').querySelector('.idc-actions');
  expect(await screen.findByRole('button', { name: 'Download QR code' })).toBeInTheDocument();
  expect(cardActions).toContainElement(screen.getByRole('button', { name: 'Download QR code' }));
  expect(cardActions).toContainElement(screen.getByText('v1'));
  expect(screen.queryByText(/QR active/)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'QR code' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Identity card').querySelector('.idc-top')).not.toHaveTextContent('asha@example.com');
  expect(screen.getByLabelText('Identity card')).toHaveTextContent('asha@example.com');
  expect(screen.getByLabelText('Identity card')).not.toHaveTextContent('Alternate mobile');
  expect(await screen.findByRole('textbox', { name: 'First Name' })).toHaveValue('Asha');
  expect(screen.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
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

  await waitFor(() => expect(document.querySelector('.idc-name')).toHaveTextContent('Asha Patel'));
  const cardActions = screen.getByLabelText('Identity card').querySelector('.idc-actions');
  await screen.findByRole('button', { name: 'Download QR code' });
  expect(cardActions).toContainElement(screen.getByRole('button', { name: 'Download QR code' }));
  expect(cardActions).toContainElement(screen.getByText('v1'));
  expect(cardActions).toContainElement(screen.getByRole('button', { name: 'Deactivate' }));
  await user.click(screen.getByRole('button', { name: 'Edit profile' }));
  const firstName = screen.getByRole('textbox', { name: 'First Name' });
  const profileActions = firstName.closest('form').querySelector('.person-form-actions');
  expect(profileActions).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  expect(profileActions).toContainElement(screen.getByRole('button', { name: 'Save', exact: true }));
  await user.clear(firstName);
  await user.type(firstName, 'Anya');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.objectContaining({ firstName: 'Anya' })));
  expect(post).not.toHaveBeenCalled();

  expect(screen.getByRole('heading', { name: 'Access details' })).toBeInTheDocument();
  expect(await screen.findByText('Purpose')).toBeInTheDocument();
  expect(screen.getByText('Meeting')).toBeInTheDocument();
  expect(screen.queryByText(/\{\s*"purpose"/)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons/registration/options');
  await user.click(screen.getByRole('button', { name: 'Edit access' }));
  const accessActions = document.getElementById('person-access-form').querySelector('.person-form-actions');
  expect(accessActions).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  expect(accessActions).toContainElement(screen.getByRole('button', { name: 'Save', exact: true }));
}, 30_000);

it('uploads a profile photo only when one is selected during edit', async () => {
  const person = { person_id: 8, person_code: 'MB-000008', first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', category: 'Visitor', form_type: 'VISITOR', status: 'ACTIVE', documents: [], category_details: {}, location_ids: [], qr_version: 1 };
  mockPersonApi(person);
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: person });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { photo_key: 'new-profile.jpg' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);
  await waitFor(() => expect(document.querySelector('.idc-name')).toHaveTextContent('Asha Patel'));
  await user.click(screen.getByRole('button', { name: 'Edit profile' }));
  const image = new File(['profile'], 'profile.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Profile photo (optional)'), { target: { files: [image] } });
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));

  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.any(Object)));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/photo', expect.any(FormData), { headers: { 'Content-Type': undefined } }));
  expect(post.mock.calls[0][1].get('photo')).toBe(image);
}, 30_000);
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, sessionStarted, store } from '../store.js';
import PersonDetailPage from './PersonDetailPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('opens profile edit mode when Update is selected from Person Management', async () => {
  const person = {
    person_id: 8,
    person_code: 'MB-000008',
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    category: 'Visitor',
    form_type: 'VISITOR',
    status: 'ACTIVE',
    documents: [],
    category_details: {},
    location_ids: [],
    qr_version: 1,
  };
  vi.spyOn(api, 'get').mockResolvedValue({ data: person });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/persons/8?edit=1']}>
        <Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  expect(await screen.findByRole('heading', { name: 'Asha Patel' })).toBeInTheDocument();
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
    form_type: 'VISITOR',
    status: 'ACTIVE',
    documents: [],
    category_details: { purpose: 'Meeting' },
    location_ids: [],
    qr_version: 1,
  };
  const get = vi.spyOn(api, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/persons/registration/options'
      ? { categories: [{ name: 'Visitor', schema: { fields: [{ key: 'purpose', label: 'Purpose' }] } }], lookups: [], locations: [] }
      : person,
  }));
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: person });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { photo_key: 'new-profile.jpg' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);

  expect(await screen.findByRole('heading', { name: 'Asha Patel' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit profile' }));
  const firstName = screen.getByRole('textbox', { name: 'First Name' });
  await user.clear(firstName);
  await user.type(firstName, 'Anya');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.objectContaining({ firstName: 'Anya' })));
  expect(post).not.toHaveBeenCalled();

  await user.click(screen.getByRole('tab', { name: 'Access Details' }));
  expect(await screen.findByText('Purpose')).toBeInTheDocument();
  expect(screen.getByText('Meeting')).toBeInTheDocument();
  expect(screen.queryByText(/\{\s*"purpose"/)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/persons/registration/options');
  await user.click(screen.getByRole('button', { name: 'Edit access' }));
  expect(screen.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
}, 30_000);

it('uploads a profile photo only when one is selected during edit', async () => {
  const person = { person_id: 8, person_code: 'MB-000008', first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', category: 'Visitor', form_type: 'VISITOR', status: 'ACTIVE', documents: [], category_details: {}, location_ids: [], qr_version: 1 };
  vi.spyOn(api, 'get').mockResolvedValue({ data: person });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: person });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { photo_key: 'new-profile.jpg' } });
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));

  render(<Provider store={store}><MemoryRouter initialEntries={['/persons/8']}><Routes><Route path="/persons/:personId" element={<PersonDetailPage />} /></Routes></MemoryRouter></Provider>);
  await screen.findByRole('heading', { name: 'Asha Patel' });
  await user.click(screen.getByRole('button', { name: 'Edit profile' }));
  const image = new File(['profile'], 'profile.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Profile photo (optional)'), { target: { files: [image] } });
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));

  await waitFor(() => expect(patch).toHaveBeenCalledWith('/persons/8', expect.any(Object)));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/photo', expect.any(FormData), { headers: { 'Content-Type': undefined } }));
  expect(post.mock.calls[0][1].get('photo')).toBe(image);
}, 30_000);
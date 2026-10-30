import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { store, sessionStarted, sessionEnded } from '../store.js';
import RegisterPage from './RegisterPage.jsx';

afterEach(() => { store.dispatch(sessionEnded()); vi.restoreAllMocks(); });
const options = { categories: [{ category_id: 1, form_type: 'VISITOR', name: 'Visitor', icon: 'fa-user', description: 'General visitors and devotees', approval_required: false, schema: { fields: [{ key: 'purpose', label: 'Purpose of Visit', required: true, type: 'text' }] } }, { category_id: 2, form_type: 'STAFF', name: 'Staff', icon: 'fa-user-tie', description: 'Ashram employees and functional staff', approval_required: true, schema: { fields: [] } }], lookups: [], locations: [] };
function renderPage(role, registrationOptions = options, initialEntries = ['/register']) {
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role } }));
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({ data: path === '/persons/registration/options' ? registrationOptions : { items: [] } }));
  render(<Provider store={store}><MemoryRouter initialEntries={initialEntries}><RegisterPage /></MemoryRouter></Provider>);
}
it('renders fields from the API schema and saves a partial draft', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { person_id: 8 } });
  const user = userEvent.setup();
  renderPage('ADMIN');
  const visitorTile = await screen.findByRole('button', { name: /^Visitor/ });
  expect(visitorTile).toHaveStyle({ '--registration-accent': '#0E8C99', '--registration-background': '#EDF8F9' });
  expect(screen.getByText('General visitors and devotees')).toBeInTheDocument();
  await user.click(visitorTile);
  expect(screen.getByRole('textbox', { name: /Purpose of Visit/ })).toBeRequired();
  await user.type(screen.getByRole('textbox', { name: /First Name/ }), 'Asha');
  await user.click(screen.getByRole('button', { name: 'Save Draft' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/drafts', expect.objectContaining({ firstName: 'Asha', categoryId: 1 })));
  expect(await screen.findByText('Draft saved for Asha.')).toBeInTheDocument();
}, 30_000);
it('shows optional driver details only when a visitor has a driver and saves them', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { person_id: 8 } });
  const user = userEvent.setup();
  renderPage('ADMIN');
  await user.click(await screen.findByRole('button', { name: /^Visitor/ }));
  expect(screen.queryByRole('textbox', { name: /Driver Name/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: 'Is a driver available?' }));
  await user.click(screen.getByRole('option', { name: 'Yes' }));
  await user.type(screen.getByRole('textbox', { name: /Driver Name/ }), 'Ravi Kumar');
  await user.type(screen.getByRole('textbox', { name: /Driver Contact Number/ }), '9876543210');
  await user.click(screen.getByRole('button', { name: 'Save Draft' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/drafts', expect.objectContaining({
    categoryDetails: expect.objectContaining({ driver_available: 'YES', driver_name: 'Ravi Kumar', driver_mobile: '9876543210' }),
  })));
  expect(screen.getByRole('textbox', { name: /Driver Contact Number/ })).toHaveValue('9876543210');
}, 30_000);
it('clears hidden driver details when driver availability changes to No', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { person_id: 8 } });
  const user = userEvent.setup();
  renderPage('ADMIN');
  await user.click(await screen.findByRole('button', { name: /^Visitor/ }));
  await user.click(screen.getByRole('combobox', { name: 'Is a driver available?' }));
  await user.click(screen.getByRole('option', { name: 'Yes' }));
  await user.type(screen.getByRole('textbox', { name: /Driver Name/ }), 'Ravi Kumar');
  await user.click(screen.getByRole('combobox', { name: 'Is a driver available?' }));
  await user.click(screen.getByRole('option', { name: 'No' }));
  expect(screen.queryByRole('textbox', { name: /Driver Name/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save Draft' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/drafts', expect.objectContaining({
    categoryDetails: expect.objectContaining({ driver_available: 'NO', driver_name: '', driver_mobile: '' }),
  })));
}, 30_000);
it('restricts guards to the visitor category', async () => {
  renderPage('SECURITY_GUARD', options, ['/register?from=gate&gate=1&area=2']);
  expect(await screen.findByRole('button', { name: /^Visitor/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Staff' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /^Visitor/ }));
  expect(screen.getByText('Category: Visitor')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to Security Gate' })).toHaveAttribute('href', '/gate?gate=1&area=2');
});
it('explains when no active categories are configured', async () => {
  renderPage('ADMIN', { categories: [], lookups: [], locations: [] });
  expect(await screen.findByText(/API returned no active categories/)).toBeInTheDocument();
});
it('distinguishes an unavailable options API from an empty category list', async () => {
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));
  vi.spyOn(api, 'get').mockRejectedValue(new Error('Request failed with status code 404'));
  render(<Provider store={store}><MemoryRouter><RegisterPage /></MemoryRouter></Provider>);
  expect(await screen.findByText(/Restart the updated API server/)).toBeInTheDocument();
  expect(screen.queryByText(/API returned no active categories/)).not.toBeInTheDocument();
});
it('requires and submits a photograph with a valid registration', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { status: 'ACTIVE', person_code: 'MB-000009' } });
  const user = userEvent.setup();
  renderPage('ADMIN');

  await user.click(await screen.findByRole('button', { name: /^Visitor/ }));
  expect(screen.getByText('Category: Visitor')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'First Name' }), 'Asha');
  await user.type(screen.getByRole('textbox', { name: 'Last Name' }), 'Patel');
  await user.click(screen.getByRole('combobox', { name: 'Country code' }));
  await user.click(screen.getByRole('option', { name: /United States \(\+1\)/ }));
  await user.type(screen.getByRole('textbox', { name: 'Mobile Number' }), '4155552671');
  const photo = new File(['portrait'], 'asha.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Photograph *'), { target: { files: [photo] } });
  await user.click(screen.getByRole('combobox', { name: 'Gender' }));
  await user.click(screen.getByRole('option', { name: 'FEMALE' }));
  await user.type(screen.getByRole('textbox', { name: 'Purpose of Visit' }), 'Meeting');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  const review = screen.getByRole('region', { name: 'Registration review' });
  expect(review).toHaveTextContent('Asha Patel');
  expect(review).toHaveTextContent('Visitor');
  expect(review).toHaveTextContent('asha.png');
  expect(review).toHaveTextContent('0 document(s)');
  await user.click(screen.getByRole('checkbox', { name: /I confirm consent/ }));
  await user.click(screen.getByRole('button', { name: 'Submit Registration' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons', expect.any(FormData), expect.any(Object)));
  expect(post.mock.calls.at(-1)[1].get('photo')).toBe(photo);
  expect(JSON.parse(post.mock.calls.at(-1)[1].get('metadata')).mobile).toBe('+14155552671');
}, 60_000);

it('opens live camera capture dialog and shows Click Live Photo button', async () => {
  const user = userEvent.setup();
  renderPage('ADMIN');

  await user.click(await screen.findByRole('button', { name: /^Visitor/ }));
  expect(screen.getByRole('button', { name: 'Click Live Photo' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Click Live Photo' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Capture live photo' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}, 30_000);

it('validates mobile number in real time on blur and prevents advancing to next step if duplicate', async () => {
  const user = userEvent.setup();
  store.dispatch(sessionStarted({ accessToken: 'test', user: { role: 'ADMIN' } }));
  vi.spyOn(api, 'get').mockImplementation((path, config) => {
    if (path === '/persons/registration/options') return Promise.resolve({ data: options });
    if (path === '/persons/registration/check-mobile') {
      if (config?.params?.mobile === '+919820000000') {
        return Promise.resolve({
          data: { available: false, message: 'This mobile number is already registered under this category.' },
        });
      }
      return Promise.resolve({ data: { available: true } });
    }
    return Promise.resolve({ data: { items: [] } });
  });

  render(<Provider store={store}><MemoryRouter initialEntries={['/register']}><RegisterPage /></MemoryRouter></Provider>);

  await user.click(await screen.findByRole('button', { name: /^Staff/ }));
  expect(screen.getByText('Category: Staff')).toBeInTheDocument();

  const mobileInput = screen.getByRole('textbox', { name: 'Mobile Number' });
  await user.type(mobileInput, '9820000000');

  fireEvent.blur(mobileInput);

  expect(await screen.findByText('This mobile number is already registered under this category.')).toBeInTheDocument();

  // Navigation to next step is blocked
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('textbox', { name: 'Mobile Number' })).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Assigned Areas' })).not.toBeInTheDocument();

  // Changing to a non-duplicate number clears the error
  await user.clear(mobileInput);
  await user.type(mobileInput, '9821111111');
  fireEvent.blur(mobileInput);

  await waitFor(() => {
    expect(screen.queryByText('This mobile number is already registered under this category.')).not.toBeInTheDocument();
  });
}, 30_000);

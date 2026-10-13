import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import { sessionEnded, store } from '../store.js';
import LocationsPage from './LocationsPage.jsx';

afterEach(() => {
  store.dispatch(sessionEnded());
  vi.restoreAllMocks();
});

it('creates a restricted area with a department and prevents restricting gates', async () => {
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: {
      items: path === '/locations'
        ? [{ location_id: 1, name: 'Main Gate', location_type: 'GATE', is_restricted: false }]
        : [{ lookup_id: 12, name: 'Facilities' }],
    },
  }));
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { location_id: 4, name: 'Workshop', location_type: 'AREA', is_restricted: true, department_id: 12 },
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter>
        <LocationsPage />
      </MemoryRouter>
    </Provider>,
  );

  expect(await screen.findByText('Main Gate')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add location' }));
  expect(screen.getByRole('checkbox', { name: 'Restricted area' })).toBeDisabled();
  await user.click(screen.getByRole('combobox', { name: 'Location type' }));
  await user.click(screen.getByRole('option', { name: 'Area' }));
  const restricted = screen.getByRole('checkbox', { name: 'Restricted area' });
  expect(restricted).toBeEnabled();
  await user.type(screen.getByRole('textbox', { name: 'Location name' }), 'Workshop');
  await user.click(restricted);
  await user.click(screen.getByRole('combobox', { name: 'Department' }));
  await user.click(screen.getByRole('option', { name: 'Facilities' }));
  await user.click(screen.getByRole('button', { name: 'Create location' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/locations', {
    name: 'Workshop',
    locationType: 'AREA',
    isRestricted: true,
    departmentId: 12,
  }));
}, 30_000);

it('requests only the remaining locations on page two at page size ten', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path, config = {}) => {
    if (path !== '/locations') return Promise.resolve({ data: { items: [] } });
    const { page, pageSize } = config.params;
    const offset = (page - 1) * pageSize;
    const length = Math.max(0, Math.min(pageSize, 12 - offset));
    return Promise.resolve({ data: {
      items: Array.from({ length }, (_, index) => ({
        location_id: offset + index + 1,
        name: `Location ${offset + index + 1}`,
        location_type: 'AREA',
        is_restricted: false,
      })),
      total: 12,
      page,
      pageSize,
    } });
  });
  const user = userEvent.setup();

  render(<Provider store={store}><MemoryRouter><LocationsPage /></MemoryRouter></Provider>);
  expect(await screen.findByText('Location 1')).toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: /rows per page/i }));
  await user.click(screen.getByRole('option', { name: '10' }));
  await user.click(await screen.findByRole('button', { name: 'Go to next page' }));

  expect(await screen.findByText('Location 11')).toBeInTheDocument();
  expect(screen.getByText('Location 12')).toBeInTheDocument();
  expect(screen.queryByText('Location 1')).not.toBeInTheDocument();
  expect(screen.getByText('11–12 of 12')).toBeInTheDocument();
  expect(get.mock.calls.filter(([path]) => path === '/locations').at(-1)).toEqual([
    '/locations',
    { params: { page: 2, pageSize: 10 } },
  ]);
}, 30_000);

it('filters locations by name and gate/area type', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path, config = {}) => Promise.resolve({
    data: path === '/locations'
      ? { items: [], total: 0, page: config.params.page, pageSize: config.params.pageSize }
      : { items: [] },
  }));
  const user = userEvent.setup();
  render(<Provider store={store}><MemoryRouter><LocationsPage /></MemoryRouter></Provider>);

  await user.type(await screen.findByRole('textbox', { name: 'Search locations' }), 'North');
  await user.click(screen.getByRole('combobox', { name: 'Type' }));
  await user.click(screen.getByRole('option', { name: 'Gates' }));
  await user.click(screen.getByRole('button', { name: 'Apply' }));

  await waitFor(() => expect(get.mock.calls.filter(([path]) => path === '/locations').at(-1)).toEqual([
    '/locations', { params: { query: 'North', locationType: 'GATE', page: 1, pageSize: 5 } },
  ]));
}, 30_000);

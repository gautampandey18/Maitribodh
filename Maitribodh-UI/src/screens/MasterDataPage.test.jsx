import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import MasterDataPage from './MasterDataPage.jsx';

afterEach(() => vi.restoreAllMocks());

it('searches master values within the selected lookup type', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path.startsWith('/persons/registration/options')
      ? { categories: [], lookups: [], locations: [] }
      : { items: [{ lookup_id: 1, name: 'Operations', status: 'ACTIVE' }], total: 1, page: 1, pageSize: 5 },
  }));
  const user = userEvent.setup();
  render(<MasterDataPage />);

  expect(await screen.findByText('Operations')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Search departments' }), 'Finance');
  await user.click(screen.getByRole('button', { name: 'Search' }));

  await waitFor(() => expect(get.mock.calls.some(([path]) => path.includes('query=Finance'))).toBe(true));
  expect(get.mock.calls.at(-1)[0]).toContain('/lookups/DEPARTMENT?');
}, 30_000);
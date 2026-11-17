import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import AssignCategoriesPage from './AssignCategoriesPage.jsx';

afterEach(() => vi.restoreAllMocks());

it('lets an admin select a dynamic category, fill its form, and submit its consent', async () => {
  const profile = {
    person_id: 8,
    first_name: 'Asha',
    last_name: 'Patel',
    mobile: '+919820000000',
    email: 'asha@example.com',
    address: 'Ashram Road',
    categories: [{ category_id: 1, name: 'Existing', status: 'ACTIVE' }],
  };
  vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path.includes('category-assignments')
      ? profile
      : {
          categories: [
            { category_id: 1, name: 'Existing', schema: { fields: [] } },
            { category_id: 2, name: 'Dynamic Category', schema: { fields: [{ key: 'reference', label: 'Reference Number', type: 'text', required: true }] } },
          ],
          lookups: [],
          locations: [],
        },
  }));
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { items: [{ person_id: 9 }], identity_qr_code: 'MB-000008' },
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/persons/8/categories']}>
      <Routes>
        <Route path="/persons/:personId/categories" element={<AssignCategoriesPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.queryByRole('checkbox', { name: 'Existing' })).not.toBeInTheDocument();
  await user.click(await screen.findByRole('combobox', { name: 'Categories' }));
  await user.click(await screen.findByRole('option', { name: /^Dynamic Category/ }));
  await user.keyboard('{Escape}');
  const reference = screen.getByRole('textbox', { name: 'Reference Number' });
  await user.type(reference, 'REF-001');
  await user.click(screen.getByRole('checkbox', { name: 'Consent confirmed for Dynamic Category' }));
  fireEvent.click(screen.getByRole('button', { name: 'Assign categories' }));

  await waitFor(() => expect(post).toHaveBeenCalledWith('/persons/8/category-assignments', {
    registrations: [{
      categoryId: 2,
      categoryDetails: { reference: 'REF-001' },
      locationIds: [],
      accompanyingCount: 0,
      consent: true,
    }],
  }));
});

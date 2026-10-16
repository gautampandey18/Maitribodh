import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../api.js';
import CategoriesPage from './CategoriesPage.jsx';

afterEach(() => vi.restoreAllMocks());

it('filters categories by name, form type, and status', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path === '/categories'
      ? { items: [{ category_id: 1, name: 'Visitor', form_type: 'VISITOR', approval_required: false, status: 'ACTIVE' }], total: 1, page: 1, pageSize: 5 }
      : { items: [] },
  }));
  const user = userEvent.setup();
  render(<CategoriesPage />);

  expect(await screen.findByText('Visitor')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Search categories' }), 'visitor');
  await user.click(screen.getByRole('combobox', { name: 'Form type' }));
  await user.click(screen.getByRole('option', { name: 'VISITOR' }));
  await user.click(screen.getByRole('combobox', { name: 'Status' }));
  await user.click(screen.getByRole('option', { name: 'ACTIVE' }));
  await user.click(screen.getByRole('button', { name: 'Apply' }));

  await waitFor(() => expect(get.mock.calls.filter(([path]) => path === '/categories').at(-1)).toEqual([
    '/categories', { params: { query: 'visitor', formType: 'VISITOR', status: 'ACTIVE', page: 1, pageSize: 5 } },
  ]));
}, 30_000);

it('deletes an unreferenced category after confirmation', async () => {
  const get = vi.spyOn(api, 'get').mockImplementation((path) => Promise.resolve({
    data: path === '/categories'
      ? { items: [{ category_id: 1, name: 'Visitor', form_type: 'VISITOR', approval_required: false, status: 'ACTIVE' }], total: 1, page: 1, pageSize: 5 }
      : { items: [] },
  }));
  const remove = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204 });
  const user = userEvent.setup();
  render(<CategoriesPage />);

  await screen.findByText('Visitor');
  await user.click(screen.getByRole('button', { name: 'Delete Visitor' }));
  expect(screen.getByText(/permanently delete this category/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  await waitFor(() => expect(remove).toHaveBeenCalledWith('/categories/1'));
  expect(get).toHaveBeenCalled();
}, 30_000);
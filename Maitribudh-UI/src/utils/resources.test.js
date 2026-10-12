import { expect, it } from 'vitest';
import { requestMessage } from './resources.js';

it('adds local API diagnostics to an unexpected error message', () => {
  const message = requestMessage({
    response: {
      data: {
        error: { message: 'An unexpected error occurred' },
        debug: { code: '22001', column: 'email', table: 'person', message: 'value too long' },
      },
    },
  });

  expect(message).toContain('22001 | email | person | value too long');
});

it('does not change normal API error messages', () => {
  const error = { response: { data: { error: { message: 'Invalid request' } } } };
  expect(requestMessage(error)).toBe('Invalid request');
});
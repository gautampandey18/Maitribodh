import { expect, it } from 'vitest';
import { blobRequestMessage, requestMessage } from './resources.js';

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

it('reads the actual API message from a JSON blob response', async () => {
  const blob = new Blob([], { type: 'application/json' });
  blob.text = async () => JSON.stringify({ error: { code: 'FILE_NOT_FOUND', message: 'File not found' } });
  expect(await blobRequestMessage({ response: { status: 404, data: blob } })).toBe('File not found');
});

it('shows HTTP status or a network explanation when no JSON file error is available', async () => {
  expect(await blobRequestMessage({ response: { status: 403, data: new Blob(['Forbidden'], { type: 'text/plain' }) } })).toContain('HTTP 403');
  expect(await blobRequestMessage({})).toContain('could not be reached');
});
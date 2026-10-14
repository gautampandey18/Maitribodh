import { useEffect, useState } from 'react';
import { api } from '../api.js';

export function requestMessage(error, fallback = 'The request could not be completed. Try again.') {
  const message = error.response?.data?.error?.message ?? fallback;
  const debug = import.meta.env.DEV ? error.response?.data?.debug : null;
  if (!debug?.message) return message;
  const context = [debug.code, debug.constraint, debug.column, debug.table, debug.message].filter(Boolean).join(' | ');
  return `${message} (${context})`;
}

export async function blobRequestMessage(error) {
  const response = error.response;
  if (response?.data instanceof Blob && response.data.type.includes('json')) {
    try {
      const data = JSON.parse(await response.data.text());
      return requestMessage({ ...error, response: { ...response, data } });
    } catch (failure) {
      console.warn('Could not read API error from file response', failure);
    }
  }
  const fallback = response?.status
    ? `The photo request failed (HTTP ${response.status}).`
    : 'The photo server could not be reached. Check the network connection and try again.';
  return requestMessage(error, fallback);
}

export function useResource(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api.get(path, { signal: controller.signal }).then((response) => {
      if (active) { setData(response.data); setError(''); }
    }).catch((failure) => { if (active) setError(requestMessage(failure)); });
    return () => { active = false; controller.abort(); };
  }, [path, revision]);
  return { data, error, reload: () => setRevision((value) => value + 1) };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvBlob(rows) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const escape = (value) => {
    const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return new Blob([[columns, ...rows.map((row) => columns.map((key) => row[key]))].map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
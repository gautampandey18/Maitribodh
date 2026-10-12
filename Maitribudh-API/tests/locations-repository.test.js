import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocationsRepository } from '../src/modules/locations/locations.repository.js';

test('active locations use the approved selection and sort order', async () => {
  let query;
  let values;
  const repository = createLocationsRepository({
    async query(sql, params) {
      query = sql;
      values = params;
      return { rows: [] };
    },
  });

  await repository.listActiveLocations({ pageSize: 10, offset: 10 });

  assert.match(query, /WHERE status = 'ACTIVE'/);
  assert.match(query, /name ILIKE/);
  assert.match(query, /location_type = \$2/);
  assert.match(query, /ORDER BY location_type, name/);
  assert.match(query, /LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(values, ['', null, 10, 10]);
});

test('location creation commits with an audit row', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('RETURNING location_id')) {
        return { rows: [{ location_id: 9, name: 'North Gate', location_type: 'GATE', is_restricted: false }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createLocationsRepository({ async connect() { return client; } });

  const result = await repository.createLocation({
    name: 'North Gate',
    locationType: 'GATE',
    isRestricted: false,
    departmentId: null,
    actorUserId: 2,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(result.location_id, 9);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /INSERT INTO mams\.location/);
  assert.match(calls[2].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[2].values[5].length, 100);
  assert.equal(calls[3].sql, 'COMMIT');
});

test('location update uses fixed columns and audits old/new values', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ location_id: 9, name: 'Gate', location_type: 'GATE', is_restricted: false }] };
      }
      if (sql.includes('UPDATE mams.location')) {
        return { rows: [{ location_id: 9, name: 'Main Gate', location_type: 'GATE', is_restricted: false }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createLocationsRepository({ async connect() { return client; } });

  const location = await repository.updateLocation({
    locationId: 9,
    changes: { name: 'Main Gate' },
    actorUserId: 2,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(location.name, 'Main Gate');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[2].sql, /SET name = \$1, updated_at = now\(\)/);
  assert.deepEqual(calls[2].values, ['Main Gate', 9]);
  assert.deepEqual(JSON.parse(calls[3].values[3]), { name: 'Gate' });
  assert.deepEqual(JSON.parse(calls[3].values[4]), { name: 'Main Gate' });
  assert.equal(calls[3].values[6].length, 100);
  assert.equal(calls[4].sql, 'COMMIT');
});
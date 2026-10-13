import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthRepository } from '../src/modules/auth/auth.repository.js';

test('temporary password reset truncates audit device metadata to the database limit', async () => {
  let auditValues;
  const client = {
    async query(sql, values) {
      if (sql.includes('SELECT user_id, role')) return { rows: [{ user_id: 12, role: 'REG_OFFICER' }] };
      if (sql.includes('INSERT INTO mams.audit_log')) auditValues = values;
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createAuthRepository({ async connect() { return client; } });

  const reset = await repository.setTemporaryPassword({
    targetUserId: 12,
    passwordHash: 'hashed',
    expiresAt: new Date('2026-10-11T12:00:00.000Z'),
    adminUserId: 3,
    adminRole: 'SUPER_ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(reset, true);
  assert.equal(auditValues[5].length, 100);
});

test('Admin may reset another Admin account password', async () => {
  const statements = [];
  const client = {
    async query(sql) {
      statements.push(sql);
      if (sql.includes('SELECT user_id, role')) return { rows: [{ user_id: 12, role: 'ADMIN' }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createAuthRepository({ async connect() { return client; } });

  const reset = await repository.setTemporaryPassword({
    targetUserId: 12,
    passwordHash: 'hashed',
    expiresAt: new Date('2026-10-11T12:00:00.000Z'),
    adminUserId: 3,
    adminRole: 'ADMIN',
  });

  assert.equal(reset, true);
  assert.ok(statements.some((sql) => sql.includes('UPDATE mams.app_user')));
});
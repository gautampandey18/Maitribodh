import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES } from '../src/constants/roles.js';
import { createUsersService } from '../src/modules/users/users.service.js';

test('users cannot delete their own account even when ID types differ', async () => {
  const service = createUsersService({ repository: {
    async deleteUser() { assert.fail('Self-deletion must not reach the database'); },
  } });
  for (const targetUserId of [7, '7']) {
    for (const userId of [7, '7']) {
      await assert.rejects(service.deleteUser({ targetUserId, actor: { userId, role: ROLES.ADMIN } }),
        (error) => error.statusCode === 400 && error.code === 'SELF_DELETE_FORBIDDEN'
          && error.message === 'You cannot delete your own account');
    }
  }
});

test('deleting another account still forwards the audit actor', async () => {
  let received;
  const service = createUsersService({ repository: {
    async deleteUser(input) { received = input; return { user_id: 8 }; },
  } });
  await service.deleteUser({ targetUserId: 8, actor: { userId: '7', role: ROLES.ADMIN } });
  assert.equal(received.targetUserId, 8);
  assert.equal(received.actorUserId, '7');
});

test('user list delegates to safe repository projection', async () => {
  const users = [{ user_id: 2, username: 'operator', role: 'VIEWER' }];
  const service = createUsersService({
    repository: {
      async listUsers() { return users.map((user) => ({ ...user, total: 2 })); },
    },
  });

  assert.deepEqual(await service.listUsers({ page: 1, pageSize: 25 }), { items: users, total: 2, page: 1, pageSize: 25 });
});

test('user detail returns not found for a missing account', async () => {
  const service = createUsersService({
    repository: {
      async getUser() { return null; },
    },
  });

  await assert.rejects(
    service.getUser(404),
    (error) => error.statusCode === 404 && error.code === 'USER_NOT_FOUND',
  );
});

test('Admin cannot assign the Super Admin role', async () => {
  let inserted = false;
  const service = createUsersService({
    repository: {
      async createUser() {
        inserted = true;
      },
    },
  });

  await assert.rejects(
    service.createUser({
      input: { role: ROLES.SUPER_ADMIN },
      actor: { userId: 10, role: ROLES.ADMIN },
    }),
    (error) => error.code === 'FORBIDDEN' && /Only a Super Admin/.test(error.message),
  );
  assert.equal(inserted, false);
});

test('Admin can assign multiple operational roles on creation and update', async () => {
  const calls = [];
  const repository = {
    async createUser(input) { calls.push(input); return input; },
    async updateUser(input) { calls.push(input); return input; },
  };
  const service = createUsersService({ repository });
  const input = { roles: [ROLES.SECURITY_GUARD, ROLES.APPROVER] };
  const actor = { userId: 7, role: ROLES.ADMIN };
  await service.createUser({ input, actor });
  await service.updateUser({ targetUserId: 25, input, actor });
  for (const call of calls) {
    assert.deepEqual(call.roles, [ROLES.APPROVER, ROLES.SECURITY_GUARD]);
    assert.equal(call.role, ROLES.APPROVER);
  }
});

test('Admin cannot add Super Admin through a multi-role create or update', async () => {
  const service = createUsersService({
    repository: {
      async createUser() { assert.fail('must not insert'); },
      async updateUser() { assert.fail('must not update'); },
    },
  });
  const input = { roles: [ROLES.APPROVER, ROLES.SUPER_ADMIN] };
  const actor = { userId: 7, role: ROLES.ADMIN };
  await assert.rejects(service.createUser({ input, actor }), { code: 'FORBIDDEN' });
  await assert.rejects(service.updateUser({ targetUserId: 25, input, actor }), { code: 'FORBIDDEN' });
});

test('Super Admin can assign multiple roles containing Super Admin', async () => {
  const service = createUsersService({
    repository: { async updateUser(input) { return input; } },
  });
  const user = await service.updateUser({
    targetUserId: 1,
    input: { roles: [ROLES.SECURITY_GUARD, ROLES.SUPER_ADMIN] },
    actor: { userId: 1, role: ROLES.SUPER_ADMIN },
  });
  assert.deepEqual(user.roles, [ROLES.SUPER_ADMIN, ROLES.SECURITY_GUARD]);
  assert.equal(user.role, ROLES.SUPER_ADMIN);
});

test('Admin may create Admin and other roles; Super Admin may assign Super Admin', async () => {
  const createdRoles = [];
  const service = createUsersService({
    repository: {
      async createUser(input) {
        createdRoles.push(input.role);
        return { user_id: createdRoles.length, role: input.role };
      },
    },
  });

  await service.createUser({
    input: { role: ROLES.ADMIN },
    actor: { userId: 1, role: ROLES.SUPER_ADMIN },
  });
  await service.createUser({
    input: { role: ROLES.ADMIN },
    actor: { userId: 2, role: ROLES.ADMIN },
  });
  await service.createUser({
    input: { role: ROLES.APPROVER },
    actor: { userId: 2, role: ROLES.ADMIN },
  });

  assert.deepEqual(createdRoles, [ROLES.ADMIN, ROLES.ADMIN, ROLES.APPROVER]);
});

test('duplicate account constraints become a safe conflict response', async () => {
  const service = createUsersService({
    repository: {
      async createUser() {
        throw { code: '23505' };
      },
    },
  });

  await assert.rejects(
    service.createUser({
      input: { role: ROLES.APPROVER },
      actor: { userId: 2, role: ROLES.ADMIN },
    }),
    (error) => error.statusCode === 409 && error.code === 'USER_ALREADY_EXISTS',
  );
});

test('user update forwards deactivation and bulk-upload changes with actor context', async () => {
  let updateInput;
  const service = createUsersService({
    repository: {
      async updateUser(input) {
        updateInput = input;
        return { user_id: input.targetUserId, status: 'INACTIVE', can_bulk_upload: false };
      },
    },
  });

  const user = await service.updateUser({
    targetUserId: 25,
    input: { deactivate: true, canBulkUpload: false },
    actor: { userId: 7, role: ROLES.ADMIN, ipAddress: '127.0.0.1' },
  });

  assert.equal(user.user_id, 25);
  assert.equal(updateInput.deactivate, true);
  assert.equal(updateInput.canBulkUpload, false);
  assert.equal(updateInput.actorUserId, 7);
});

test('user update forwards activation with actor context', async () => {
  let updateInput;
  const service = createUsersService({
    repository: {
      async updateUser(input) {
        updateInput = input;
        return { user_id: input.targetUserId, status: 'ACTIVE' };
      },
    },
  });

  const user = await service.updateUser({
    targetUserId: 25,
    input: { activate: true },
    actor: { userId: 7, role: ROLES.ADMIN },
  });

  assert.equal(user.status, 'ACTIVE');
  assert.equal(updateInput.activate, true);
  assert.equal(updateInput.actorUserId, 7);
});
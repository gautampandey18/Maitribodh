import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES } from '../src/constants/roles.js';
import { createUsersService } from '../src/modules/users/users.service.js';

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
import assert from 'node:assert/strict';
import test from 'node:test';
import { createApprovalsService } from '../src/modules/approvals/approvals.service.js';

test('rejection requires a reason of at least ten characters', async () => {
  let decided = false;
  const service = createApprovalsService({
    repository: { async decide() { decided = true; } },
  });

  await assert.rejects(
    service.decide({
      personId: 8,
      decision: 'REJECT',
      reason: 'too short',
      actor: { userId: 3, role: 'APPROVER' },
    }),
    (error) => error.statusCode === 400 && error.code === 'VALIDATION_ERROR',
  );
  assert.equal(decided, false);
});

test('self-approval policy errors map to forbidden', async () => {
  const service = createApprovalsService({
    repository: {
      async decide() {
        const error = new Error('Self-approval denied');
        error.code = 'SELF_APPROVAL_FORBIDDEN';
        throw error;
      },
    },
  });

  await assert.rejects(
    service.decide({
      personId: 8,
      decision: 'APPROVE',
      actor: { userId: 3, role: 'APPROVER' },
    }),
    (error) => error.statusCode === 403 && error.code === 'SELF_APPROVAL_FORBIDDEN',
  );
});

test('resubmission authorization errors map to forbidden', async () => {
  const service = createApprovalsService({
    repository: {
      async resubmit() {
        const error = new Error('Only submitter or Admin');
        error.code = 'RESUBMISSION_FORBIDDEN';
        throw error;
      },
    },
  });

  await assert.rejects(
    service.resubmit({ personId: 5, actor: { userId: 8, role: 'REG_OFFICER' } }),
    (error) => error.statusCode === 403 && error.code === 'RESUBMISSION_FORBIDDEN',
  );
});

test('resubmission rejects records that are not in a rejected state', async () => {
  const service = createApprovalsService({
    repository: {
      async resubmit() {
        const error = new Error('Only rejected registrations');
        error.code = 'PERSON_NOT_REJECTED';
        throw error;
      },
    },
  });

  await assert.rejects(
    service.resubmit({ personId: 5, actor: { userId: 8, role: 'REG_OFFICER' } }),
    (error) => error.statusCode === 409 && error.code === 'PERSON_NOT_REJECTED',
  );
});

test('resubmission rejects non-approval categories with 400', async () => {
  const service = createApprovalsService({
    repository: {
      async resubmit() {
        const error = new Error('Approval is not required');
        error.code = 'APPROVAL_NOT_REQUIRED';
        throw error;
      },
    },
  });

  await assert.rejects(
    service.resubmit({ personId: 5, actor: { userId: 8, role: 'ADMIN' } }),
    (error) => error.statusCode === 400 && error.code === 'APPROVAL_NOT_REQUIRED',
  );
});
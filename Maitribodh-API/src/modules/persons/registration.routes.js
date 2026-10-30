import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { createCipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { REGISTRATION_LIMITS } from '../../constants/registration.js';
import { registrationInputSchema, validateCategoryDetails } from './registration.validation.js';

const registrationRoles = ['SUPER_ADMIN', 'ADMIN', 'REG_OFFICER', 'APPROVER', 'SECURITY_GUARD'];
const managementRoles = registrationRoles.filter((role) => role !== 'SECURITY_GUARD');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: REGISTRATION_LIMITS.fileBytes, files: REGISTRATION_LIMITS.documentCount + 1, fields: 1, fieldSize: 64 * 1024 } }).fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: REGISTRATION_LIMITS.documentCount }]);
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: REGISTRATION_LIMITS.fileBytes, files: REGISTRATION_LIMITS.documentCount } }).array('documents', REGISTRATION_LIMITS.documentCount);
const profilePhotoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: REGISTRATION_LIMITS.photoBytes, files: 1 } }).single('photo');
const uploadRoot = path.resolve(process.env.UPLOAD_DIRECTORY ?? './private-uploads');
const isStoredKey = (key) => typeof key === 'string' && /^[a-f0-9-]+\.(jpg|pdf)$/.test(key);
async function readStoredFile(key) {
  if (!isStoredKey(key)) return null;
  try {
    return await readFile(path.join(uploadRoot, key));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
const actorFrom = (request) => ({ userId: request.auth.userId, role: request.auth.role, ipAddress: request.ip, device: request.get('user-agent') });
const idFrom = (value) => {
  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
  return parsed.data;
};
const parseInput = (schema, data) => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
  return parsed.data;
};

export function createRegistrationRouter({ repository, authenticate, encryptionSecret }) {
  const router = express.Router();
  const encryptionKey = createHash('sha256').update(`mams-passport:${encryptionSecret}`).digest();
  const encrypt = (value) => {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [nonce, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64')).join('.');
  };
  router.use(authenticate);
  router.get('/registration/options', authorize(...registrationRoles), asyncHandler(async (_request, response) => response.json(await repository.options())));
  router.get('/registration/check-mobile', authorize(...registrationRoles), asyncHandler(async (request, response) => {
    const mobile = String(request.query.mobile ?? '').trim();
    const categoryParsed = z.coerce.number().int().positive().safeParse(request.query.categoryId);
    if (!mobile || !categoryParsed.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Mobile number and category are required');
    const personId = request.query.personId ? z.coerce.number().int().positive().parse(request.query.personId) : null;
    const result = await repository.checkMobile({ mobile, categoryId: categoryParsed.data, personId });
    response.json(result);
  }));
  router.get('/drafts', authorize(...registrationRoles), asyncHandler(async (request, response) => response.json({ items: await repository.drafts(request.auth.userId) })));
  router.post('/drafts', authorize(...registrationRoles), asyncHandler(async (request, response) => {
    const categoryId = idFrom(request.body.categoryId);
    const category = await repository.category(categoryId);
    if (!category || category.status !== 'ACTIVE') throw new ApiError(400, 'VALIDATION_ERROR', 'Select an active category');
    if (request.auth.role === 'SECURITY_GUARD' && category.form_type !== 'VISITOR') throw new ApiError(403, 'FORBIDDEN', 'Security Guard can register Visitor only');
    const draftId = request.body.draftId ? idFrom(request.body.draftId) : undefined;
    response.status(201).json(await repository.saveDraft({ draftId, input: { ...request.body, categoryId }, actor: actorFrom(request) }));
  }));
  router.post('/', authorize(...registrationRoles), (request, response, next) => upload(request, response, (error) => next(error ? new ApiError(400, 'UPLOAD_ERROR', 'Each file must be no larger than 5 MB, with at most 12 documents.') : undefined)), asyncHandler(async (request, response) => {
    let metadata;
    try { metadata = JSON.parse(request.body.metadata); } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid registration details'); }
    const input = parseInput(registrationInputSchema, metadata);
    const category = await repository.category(input.categoryId);
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    validateCategoryDetails(input, category, request.auth.role);
    if (request.auth.role === 'SECURITY_GUARD') {
      input.locationIds = [];
      input.source = 'WALK_IN';
    }
    const photo = request.files?.photo?.[0];
    if (!photo || !['image/jpeg', 'image/png'].includes(photo.mimetype) || photo.size > REGISTRATION_LIMITS.photoBytes) throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a JPG or PNG photograph no larger than 2 MB.');
    const written = [];
    try {
      await mkdir(uploadRoot, { recursive: true });
      const photoKey = `${randomUUID()}.jpg`;
      let image;
      try { image = await sharp(photo.buffer, { limitInputPixels: 40000000 }).rotate().resize(REGISTRATION_LIMITS.photoDimension, REGISTRATION_LIMITS.photoDimension, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer(); }
      catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a valid JPG or PNG photograph.'); }
      await writeFile(path.join(uploadRoot, photoKey), image, { flag: 'wx' });
      written.push(photoKey);
      const documents = [];
      for (const file of request.files?.documents ?? []) {
        const isPdf = file.buffer.subarray(0, 5).toString() === '%PDF-';
        let buffer = file.buffer;
        if (!isPdf) {
          try { buffer = await sharp(file.buffer, { limitInputPixels: 40000000 }).jpeg().toBuffer(); }
          catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Documents must be valid PDF, JPG or PNG files.'); }
        }
        const key = `${randomUUID()}.${isPdf ? 'pdf' : 'jpg'}`;
        await writeFile(path.join(uploadRoot, key), buffer, { flag: 'wx' });
        written.push(key);
        documents.push({ key, name: path.basename(file.originalname).slice(0, 150), type: isPdf ? 'application/pdf' : 'image/jpeg' });
      }
      const person = await repository.create({ input, category, photoKey, documents, passportEncrypted: input.residentStatus === 'NON_RESIDENT' ? encrypt(input.passportNumber) : null, idProofEncrypted: input.idProofNumber ? encrypt(input.idProofNumber) : null, actor: actorFrom(request) });
      response.status(201).json(person);
    } catch (error) {
      await Promise.all(written.map((key) => unlink(path.join(uploadRoot, key)).catch(() => {})));
      throw error;
    }
  }));
  router.get('/:personId', authorize(...managementRoles), asyncHandler(async (request, response) => response.json(await repository.get(idFrom(request.params.personId)))));
  router.get('/:personId/activity', authorize(...managementRoles), asyncHandler(async (request, response) => response.json({ items: await repository.activity(idFrom(request.params.personId)) })));
  router.post('/:personId/photo', authorize(...registrationRoles), (request, response, next) => profilePhotoUpload(request, response, (error) => next(error ? new ApiError(400, 'UPLOAD_ERROR', 'The photo must be a JPG or PNG image no larger than 2 MB.') : undefined)), asyncHandler(async (request, response) => {
    const file = request.file;
    if (!file || !['image/jpeg', 'image/png'].includes(file.mimetype)) throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a JPG or PNG photograph no larger than 2 MB.');
    let image;
    try { image = await sharp(file.buffer, { limitInputPixels: 40000000 }).rotate().resize(REGISTRATION_LIMITS.photoDimension, REGISTRATION_LIMITS.photoDimension, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer(); }
    catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a valid JPG or PNG photograph.'); }
    const personId = idFrom(request.params.personId);
    let expectedMissingPhotoKey;
    if (request.auth.role === 'SECURITY_GUARD') {
      const person = await repository.get(personId);
      if (person.photo_key && !await readStoredFile(person.photo_key)) expectedMissingPhotoKey = person.photo_key;
    }
    const photoKey = `${randomUUID()}.jpg`;
    await mkdir(uploadRoot, { recursive: true });
    await writeFile(path.join(uploadRoot, photoKey), image, { flag: 'wx' });
    try {
      const result = await repository.capturePhoto({ personId, photoKey, expectedMissingPhotoKey, actor: actorFrom(request) });
      if (isStoredKey(result.previous_photo_key) && result.previous_photo_key !== photoKey) {
        try { await unlink(path.join(uploadRoot, result.previous_photo_key)); }
        catch (error) { if (error.code !== 'ENOENT') request.log?.warn({ err: error }, 'Could not remove previous profile photo'); }
      }
      response.json({ photo_key: result.photo_key });
    } catch (error) {
      await unlink(path.join(uploadRoot, photoKey)).catch(() => {});
      throw error;
    }
  }));
  router.get('/:personId/files/:key', authorize(...registrationRoles), asyncHandler(async (request, response) => {
    const person = await repository.get(idFrom(request.params.personId));
    const key = request.params.key;
    const document = person.documents.find((item) => item.key === key);
    if (!isStoredKey(key) || (key !== person.photo_key && !document)) throw new ApiError(404, 'FILE_NOT_FOUND', 'File not found');
    if (request.auth.role === 'SECURITY_GUARD' && key !== person.photo_key) throw new ApiError(403, 'FORBIDDEN', 'Document access is not permitted');
    const buffer = await readStoredFile(key);
    if (!buffer) throw new ApiError(404, 'FILE_NOT_FOUND', 'File not found');
    response.set({ 'Content-Type': document?.type ?? 'image/jpeg', 'Cache-Control': 'private, no-store', 'Content-Disposition': 'attachment' }).send(buffer);
  }));
  router.post('/:personId/files', authorize(...managementRoles), (request, response, next) => documentUpload(request, response, (error) => next(error ? new ApiError(400, 'UPLOAD_ERROR', 'Each file must be no larger than 5 MB, with at most 12 documents.') : undefined)), asyncHandler(async (request, response) => {
    const personId = idFrom(request.params.personId);
    const written = [];
    try {
      await mkdir(uploadRoot, { recursive: true });
      const documents = [];
      for (const file of request.files ?? []) {
        const isPdf = file.buffer.subarray(0, 5).toString() === '%PDF-';
        let buffer;
        let extension;
        let type;
        if (isPdf && file.mimetype === 'application/pdf') {
          buffer = file.buffer;
          extension = 'pdf';
          type = 'application/pdf';
        } else {
          let image;
          try { image = await sharp(file.buffer, { limitInputPixels: 40000000 }).metadata(); }
          catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Documents must be valid PDF, JPG or PNG files.'); }
          if (!['jpeg', 'png'].includes(image.format) || !['image/jpeg', 'image/png'].includes(file.mimetype)) throw new ApiError(400, 'VALIDATION_ERROR', 'Documents must be valid PDF, JPG or PNG files.');
          buffer = await sharp(file.buffer).jpeg().toBuffer();
          extension = 'jpg';
          type = 'image/jpeg';
        }
        const key = `${randomUUID()}.${extension}`;
        await writeFile(path.join(uploadRoot, key), buffer, { flag: 'wx' });
        written.push(key);
        documents.push({ key, name: path.basename(file.originalname).slice(0, 150), type });
      }
      response.json(await repository.addDocuments({ personId, documents, actor: actorFrom(request) }));
    } catch (error) {
      await Promise.all(written.map((key) => unlink(path.join(uploadRoot, key)).catch(() => {})));
      throw error;
    }
  }));
  router.patch('/:personId', authorize(...managementRoles), asyncHandler(async (request, response) => {
    const schema = registrationInputSchema.pick({ firstName: true, lastName: true, mobile: true, alternateMobile: true, email: true, address: true, emergencyName: true, emergencyMobile: true });
    response.json(await repository.update({ personId: idFrom(request.params.personId), changes: parseInput(schema, request.body), actor: actorFrom(request) }));
  }));
  router.delete('/:personId', authorize(...managementRoles), asyncHandler(async (request, response) => {
    let deleted;
    try {
      deleted = await repository.delete({ personId: idFrom(request.params.personId), actor: actorFrom(request) });
    } catch (error) {
      if (error.code === '23503') {
        throw new ApiError(409, 'PERSON_IN_USE', 'The person still has linked records that could not be safely removed.');
      }
      throw error;
    }

    const fileKeys = [deleted.photo_key, ...deleted.documents.map((document) => document.key)];
    await Promise.all(fileKeys.filter(isStoredKey).map(async (key) => {
      try {
        await unlink(path.join(uploadRoot, key));
      } catch (error) {
        if (error.code !== 'ENOENT') request.log?.warn({ err: error, key }, 'Could not remove deleted person file');
      }
    }));
    response.status(204).send();
  }));
  router.patch('/:personId/access', authorize(...managementRoles), asyncHandler(async (request, response) => {
    const schema = z.object({
      locationIds: z.array(z.coerce.number().int().positive()).max(100),
      expiresOn: z.union([z.iso.date(), z.literal('')]),
    });
    const changes = parseInput(schema, request.body);
    response.json(await repository.updateAccess({ personId: idFrom(request.params.personId), changes, actor: actorFrom(request) }));
  }));
  router.post('/:personId/status', authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (request, response) => {
    const input = parseInput(z.object({ status: z.enum(['ACTIVE', 'DEACTIVATED']), reason: z.string().trim().min(1).max(300) }), request.body);
    response.json(await repository.setStatus({ personId: idFrom(request.params.personId), ...input, actor: actorFrom(request) }));
  }));
  return router;
}

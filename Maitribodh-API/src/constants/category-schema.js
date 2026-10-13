import { z } from 'zod';

export const categoryFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), label: z.string().trim().min(1).max(100),
  type: z.enum(['text', 'date', 'number', 'select']), required: z.boolean().default(false),
  source: z.enum(['DEPARTMENT', 'JOB_ROLE', 'SUBCATEGORY', 'PROGRAM_BATCH', 'ID_PROOF_TYPE', 'BLACKLIST_REASON', 'PERMISSION_LEVEL', 'AREA']).nullable().optional(),
  options: z.array(z.string().trim().min(1).max(100)).max(100).nullable().optional(),
});
export const categoryFormSchema = z.object({
  fields: z.array(categoryFieldSchema).max(50), addressRequired: z.boolean().default(false), emergencyRequired: z.boolean().default(false),
}).refine((schema) => new Set(schema.fields.map((field) => field.key)).size === schema.fields.length, 'Field keys must be unique');
import { z } from 'zod'

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  path: z.string().optional(),
  icon: z.string().optional(),
  order: z.coerce.number().min(0).optional(),
  parentId: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  module: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido').optional(),
  path: z.string().optional(),
  icon: z.string().optional(),
  order: z.coerce.number().min(0).optional(),
  parentId: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  module: z.string().optional(),
  isActive: z.boolean(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

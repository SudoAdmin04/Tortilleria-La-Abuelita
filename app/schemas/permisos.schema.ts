import { z } from 'zod'

export const createSchema = z.object({
  roleId: z.coerce.number().min(1, 'Selecciona un rol'),
  screenId: z.coerce.number().min(1, 'Selecciona una pantalla'),
  canRead: z.boolean().default(false),
  canCreate: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
})

export const editSchema = z.object({
  roleId: z.coerce.number().min(1).optional(),
  screenId: z.coerce.number().min(1).optional(),
  canRead: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

import { z } from 'zod'

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  isAdmin: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido').optional(),
  description: z.string().optional(),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

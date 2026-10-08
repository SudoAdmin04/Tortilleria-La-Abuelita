import { z } from 'zod'

export const createSchema = z.object({
  title: z.string().min(1, 'Requerido'),
  body: z.string().min(1, 'Requerido'),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  isRead: z.boolean().default(false),
})

export const editSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
  isRead: z.boolean(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

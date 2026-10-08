import { z } from 'zod'

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  kind: z.enum(['income', 'expense', 'savings', 'debt']).default('expense'),
  parentId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido').optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

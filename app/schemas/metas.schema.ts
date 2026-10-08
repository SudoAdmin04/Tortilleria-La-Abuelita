import { z } from 'zod'

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  monthlyContribution: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  targetAmount: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().min(0).optional()),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
})

export const editSchema = z.object({
  name: z.string().min(1).optional(),
  monthlyContribution: z.coerce.number().min(0.01).optional(),
  targetAmount: z.preprocess(v => (v === '' || v === null ? undefined : v), z.coerce.number().min(0).optional()),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

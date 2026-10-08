import { z } from 'zod'

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  direction: z.enum(['payable', 'receivable']).default('payable'),
  principalAmount: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  counterparty: z.string().optional(),
  reference: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export const editSchema = z.object({
  name: z.string().min(1).optional(),
  direction: z.enum(['payable', 'receivable']),
  principalAmount: z.coerce.number().min(0.01).optional(),
  counterparty: z.string().optional(),
  reference: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['open', 'paid']).optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

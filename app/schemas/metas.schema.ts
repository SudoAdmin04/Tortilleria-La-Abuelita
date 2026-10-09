import { z } from 'zod'

const uuidOptional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().uuid('UUID inválido').optional(),
)

const targetAmount = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.coerce.number().min(0, 'Debe ser mayor o igual a 0').optional(),
)

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres'),
  monthlyContribution: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  targetAmount,
  accountId: uuidOptional,
  categoryId: uuidOptional,
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres').optional(),
  monthlyContribution: z.coerce.number().min(0.01, 'Debe ser mayor a 0').optional(),
  targetAmount,
  accountId: uuidOptional,
  categoryId: uuidOptional,
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

const fechaContable = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

/** POST /savings-goals/:id/deposits — sumar saldo (fromAccountId requerido). */
export const depositoSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  date: fechaContable,
  fromAccountId: z.string().uuid('Selecciona la cuenta origen'),
  concept: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

/** POST /savings-goals/:id/withdrawals — restar saldo (toAccountId opcional). */
export const retiroSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  date: fechaContable,
  toAccountId: uuidOptional,
  concept: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

export type DepositoSchema = z.output<typeof depositoSchema>
export type RetiroSchema = z.output<typeof retiroSchema>

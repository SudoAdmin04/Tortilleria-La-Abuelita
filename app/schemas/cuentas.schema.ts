import { z } from 'zod'

export const tiposCuenta = ['checking', 'savings', 'cash', 'credit_card'] as const
export type TipoCuenta = (typeof tiposCuenta)[number]

const optionalText = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().max(120, 'Máximo 120 caracteres').optional(),
)

const last4 = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().regex(/^\d{4}$/, 'Deben ser exactamente 4 dígitos').optional(),
)

const creditLimit = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.coerce.number().min(0, 'Debe ser mayor o igual a 0').optional(),
)

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres'),
  type: z.enum(tiposCuenta),
  institution: optionalText,
  last4,
  currency: z.string().min(1, 'Requerido').default('MXN'),
  initialBalance: z.coerce.number().default(0),
  creditLimit,
  isPrimary: z.boolean().default(false),
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres').optional(),
  type: z.enum(tiposCuenta).optional(),
  institution: optionalText,
  last4,
  currency: z.string().min(1, 'Requerido'),
  initialBalance: z.coerce.number(),
  creditLimit,
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

import { z } from 'zod'

export const tiposMovimiento = ['income', 'expense', 'transfer'] as const
export const estadosMovimiento = ['pending', 'reconciled'] as const
export const mediosPago = ['cash', 'debit_card', 'credit_card', 'bank_transfer'] as const

const uuidRequerido = z.string().uuid('Selecciona una opción válida')

const uuidOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().uuid('UUID inválido').optional(),
)

const textoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().max(200, 'Máximo 200 caracteres').optional(),
)

const fechaContable = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

const medioPagoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.enum(mediosPago).optional(),
)

function reglasPorTipo(data: { type?: string, destinationAccountId?: string, categoryId?: string }, ctx: z.RefinementCtx) {
  if (data.type === 'transfer') {
    if (!data.destinationAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['destinationAccountId'], message: 'Requerido en traspasos' })
    }
    if (data.type === 'transfer' && data.destinationAccountId === (data as { accountId?: string }).accountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['destinationAccountId'], message: 'Debe ser distinta a la origen' })
    }
  } else if (data.type === 'income' || data.type === 'expense') {
    if (!data.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['categoryId'], message: 'Requerida en ingresos/egresos' })
    }
  }
}

export const createSchema = z.object({
  type: z.enum(tiposMovimiento),
  accountId: uuidRequerido,
  destinationAccountId: uuidOpcional,
  categoryId: uuidOpcional,
  amount: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  date: fechaContable,
  concept: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres'),
  description: textoOpcional,
  paymentMethod: medioPagoOpcional,
  status: z.enum(estadosMovimiento).default('pending'),
  reference: textoOpcional,
}).superRefine(reglasPorTipo)

export const editSchema = z.object({
  type: z.enum(tiposMovimiento).optional(),
  accountId: uuidRequerido.optional(),
  destinationAccountId: uuidOpcional,
  categoryId: uuidOpcional,
  amount: z.coerce.number().min(0.01, 'Debe ser mayor a 0').optional(),
  date: fechaContable.optional(),
  concept: z.string().min(1, 'Requerido').max(120, 'Máximo 120 caracteres').optional(),
  description: textoOpcional,
  paymentMethod: medioPagoOpcional,
  status: z.enum(estadosMovimiento).optional(),
  reference: textoOpcional,
}).superRefine(reglasPorTipo)

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

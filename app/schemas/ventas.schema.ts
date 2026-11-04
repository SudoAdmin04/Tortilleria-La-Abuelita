import { z } from 'zod'

export const metodosPagoVenta = ['cash', 'debit_card', 'credit_card', 'bank_transfer'] as const

const fecha = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

const metodoPagoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.enum(metodosPagoVenta).optional(),
)

export const createSchema = z.object({
  accountId: z.string().uuid('Selecciona una cuenta válida'),
  date: fecha,
  customerName: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(150, 'Máximo 150 caracteres').optional(),
  ),
  paymentMethod: metodoPagoOpcional,
  discount: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  notes: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(500, 'Máximo 500 caracteres').optional(),
  ),
  items: z.array(z.object({
    productId: z.string().uuid('Selecciona un producto válido'),
    quantity: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
    unitPrice: z.preprocess(
      v => (v === '' || v === null ? undefined : v),
      z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
    ),
  })).min(1, 'Agrega al menos un producto'),
})

export type CreateSchema = z.output<typeof createSchema>

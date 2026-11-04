import { z } from 'zod'

export const metodosPago = ['cash', 'debit_card', 'credit_card', 'bank_transfer'] as const

const textoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().max(500, 'Máximo 500 caracteres').optional(),
)

const fecha = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

const metodoPagoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.enum(metodosPago).optional(),
)

export const createSchema = z.object({
  supplierId: z.string().uuid('Selecciona un proveedor válido'),
  accountId: z.string().uuid('Selecciona una cuenta válida'),
  date: fecha,
  invoiceNumber: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(60, 'Máximo 60 caracteres').optional(),
  ),
  paymentMethod: metodoPagoOpcional,
  tax: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  notes: textoOpcional,
  items: z.array(z.object({
    supplyId: z.string().uuid('Selecciona un insumo válido'),
    quantity: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
    unitCost: z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0'),
  })).min(1, 'Agrega al menos un insumo'),
})

export type CreateSchema = z.output<typeof createSchema>

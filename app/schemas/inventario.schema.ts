import { z } from 'zod'

export const tiposAjuste = ['adjustment_in', 'adjustment_out', 'waste', 'return_in', 'return_out'] as const
export const tiposArticulo = ['supply', 'product'] as const

const fecha = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

export const createSchema = z.object({
  itemType: z.enum(tiposArticulo),
  itemId: z.string().uuid('Selecciona un artículo válido'),
  type: z.enum(tiposAjuste),
  quantity: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
  unitCost: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
  ),
  date: fecha,
  notes: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(500, 'Máximo 500 caracteres').optional(),
  ),
})

export type CreateSchema = z.output<typeof createSchema>

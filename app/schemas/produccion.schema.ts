import { z } from 'zod'

const fecha = z.string().min(1, 'Requerido').regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

export const createSchema = z.object({
  productId: z.string().uuid('Selecciona un producto válido'),
  date: fecha,
  quantity: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
  notes: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(500, 'Máximo 500 caracteres').optional(),
  ),
})

export type CreateSchema = z.output<typeof createSchema>

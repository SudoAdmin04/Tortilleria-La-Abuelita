import { z } from 'zod'

export const unidadesInsumo = ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'box'] as const

const textoOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().max(150, 'Máximo 150 caracteres').optional(),
)

const numeroOpcional = z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.coerce.number().min(0, 'Debe ser mayor o igual a 0').optional(),
)

export const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  sku: textoOpcional,
  unit: z.enum(unidadesInsumo),
  minStock: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  initialStock: numeroOpcional,
  initialCost: numeroOpcional,
  notes: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(500, 'Máximo 500 caracteres').optional(),
  ),
})

export const editSchema = createSchema.extend({
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

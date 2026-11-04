import { z } from 'zod'

export const unidadesProducto = ['kg', 'piece', 'dozen', 'pack', 'box'] as const

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
  unit: z.enum(unidadesProducto),
  price: z.coerce.number().min(0.01, 'El precio debe ser mayor a 0'),
  minStock: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  initialStock: numeroOpcional,
  cost: numeroOpcional,
  description: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().max(500, 'Máximo 500 caracteres').optional(),
  ),
})

export const editSchema = createSchema.extend({
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

export const recipeSchema = z.object({
  items: z.array(z.object({
    supplyId: z.string().uuid('Selecciona un insumo válido'),
    quantity: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
  })),
})

export type RecipeSchema = z.output<typeof recipeSchema>

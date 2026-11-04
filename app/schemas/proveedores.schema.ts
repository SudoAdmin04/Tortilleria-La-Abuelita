import { z } from 'zod'

const textoOpcional = (max: number, mensaje: string) => z.preprocess(
  v => (v === '' || v === null ? undefined : v),
  z.string().max(max, mensaje).optional(),
)

export const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  contactName: textoOpcional(120, 'Máximo 120 caracteres'),
  phone: textoOpcional(30, 'Máximo 30 caracteres'),
  email: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.string().email('Correo inválido').optional(),
  ),
  address: textoOpcional(200, 'Máximo 200 caracteres'),
  notes: textoOpcional(500, 'Máximo 500 caracteres'),
})

export const editSchema = createSchema.extend({
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

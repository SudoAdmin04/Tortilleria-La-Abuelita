import { z } from 'zod'

export const createSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
  currency: z.string().min(1, 'Requerido'),
  timezone: z.string().min(1, 'Requerido'),
  roleId: z.number().nullable().optional(),
})

export const editSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().optional(),
  currency: z.string().min(1, 'Requerido'),
  timezone: z.string().min(1, 'Requerido'),
  roleId: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
})

export type CreateSchema = z.output<typeof createSchema>
export type EditSchema = z.output<typeof editSchema>

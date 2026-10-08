import { z } from 'zod'

export const createSchema = z.object({
  nombreUsuario: z.string().min(1, 'Requerido'),
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(4, 'Mínimo 4 caracteres'),
  rolId: z.number().min(1, 'Selecciona un rol'),
  perfil: z.object({
    nombre: z.string().min(1, 'Requerido'),
    apellidoPaterno: z.string().min(1, 'Requerido'),
    apellidoMaterno: z.string().min(1, 'Requerido'),
    genero: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    foto: z.string().optional(),
  }),
})

export const editSchema = z.object({
  nombreUsuario: z.string().min(1, 'Requerido'),
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().optional(),
  rolId: z.number().min(1, 'Selecciona un rol'),
})

export type Schema = z.output<typeof createSchema>
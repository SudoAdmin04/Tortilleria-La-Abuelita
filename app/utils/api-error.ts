export interface ApiErrorBody { message?: string | string[]; error?: string; statusCode?: number }

export interface ApiError extends Error {
  statusCode?: number
  data?: ApiErrorBody | string
}

/** Extrae un mensaje legible de un error de $fetch del backend. */
export function getApiMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  const err = error as { data?: ApiErrorBody | string, message?: string }
  const data = err?.data
  if (typeof data === 'string' && data) return data
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as ApiErrorBody
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message) return message
  }
  if (typeof err?.message === 'string' && err.message) return err.message
  return fallback
}

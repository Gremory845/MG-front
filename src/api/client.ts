// Cliente HTTP con manejo de tokens.
//  - access token: solo en memoria (vive 15 min)
//  - refresh token: en localStorage (vive 7 días, se rota en cada uso)
//
// IMPORTANTE: el backend rota el refresh token en cada uso y detecta
// reutilización (revoca todas las sesiones). Por eso el refresh se hace
// "single-flight": si varias peticiones fallan a la vez con 401, todas
// comparten UNA sola llamada a /auth/refresh.

const BASE = '/api'
const REFRESH_KEY = 'mg_refresh_token'

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null
let onSessionExpired: (() => void) | null = null

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const tokens = {
  setSession(access: string, refresh: string) {
    accessToken = access
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    accessToken = null
    localStorage.removeItem(REFRESH_KEY)
  },
  hasRefresh() {
    return localStorage.getItem(REFRESH_KEY) !== null
  },
}

export function setSessionExpiredHandler(fn: (() => void) | null) {
  onSessionExpired = fn
}

export function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return Promise.resolve(false)

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) {
        tokens.clear()
        return false
      }
      const data = await res.json()
      tokens.setSession(data.access_token, data.refresh_token)
      return true
    } catch {
      return false // error de red: conservamos el refresh token para reintentar
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  auth?: boolean
}

function extractError(status: number, data: any): ApiError {
  // { error: { code, message } }   -> errores de dominio
  if (data?.error && typeof data.error === 'object') {
    return new ApiError(status, data.error.code ?? 'ERROR', data.error.message ?? 'Error inesperado')
  }
  // { errors: [{ field, message }] } -> errores de validación
  if (Array.isArray(data?.errors)) {
    const msg = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
    return new ApiError(status, 'VALIDATION', msg)
  }
  // { error: "texto" }
  if (typeof data?.error === 'string') {
    return new ApiError(status, 'ERROR', data.error)
  }
  return new ApiError(status, 'ERROR', `Error ${status}`)
}

export async function request<T>(path: string, opts: RequestOptions = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor')
  }

  if (res.status === 401 && opts.auth && retry) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(path, opts, false)
    onSessionExpired?.()
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw extractError(res.status, data)
  return data as T
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../api/endpoints'
import { refreshSession, setSessionExpiredHandler, tokens } from '../api/client'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthValue {
  status: Status
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')

  // Al cargar la app: si hay refresh token guardado, intentamos recuperar la sesión.
  useEffect(() => {
    setSessionExpiredHandler(() => setStatus('anonymous'))

    if (!tokens.hasRefresh()) {
      setStatus('anonymous')
      return
    }
    refreshSession().then((ok) => setStatus(ok ? 'authenticated' : 'anonymous'))

    return () => setSessionExpiredHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password)
    setStatus('authenticated')
  }, [])

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      await api.register(email, username, password)
      await login(email, password)
    },
    [login],
  )

  // Nota: el backend aún no tiene endpoint de logout; por ahora solo
  // borramos los tokens locales.
  const logout = useCallback(() => {
    tokens.clear()
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({ status, login, register, logout }), [status, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

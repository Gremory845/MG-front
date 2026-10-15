import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: string | null
  loading: boolean
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: null, loading: true })

  useEffect(() => {
    let cancelled = false
    setState({ data: undefined, error: null, loading: true })
    fn()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Error inesperado'
        setState({ data: undefined, error: message, loading: false })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

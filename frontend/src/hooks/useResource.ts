import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError } from '../api/client'

interface Options {
  interval?: number // автооновлення, мс: симуляція йде на сервері, тому дані застарівають
  deps?: unknown[]
}

// Завантаження даних з API: стани loading/error, повторне завантаження,
// тихе оновлення за таймером і при поверненні у вкладку.
export function useResource<T>(fetcher: () => Promise<T>, { interval, deps = [] }: Options = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true)
    try {
      setData(await fetcherRef.current())
      setError('')
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(false) }, [load, ...deps])

  useEffect(() => {
    if (!interval) return
    const id = setInterval(() => void load(true), interval)
    const onFocus = () => void load(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [interval, load])

  const reload = useCallback(() => load(false), [load])
  const refresh = useCallback(() => load(true), [load])
  return { data, error, loading, reload, refresh, setData }
}

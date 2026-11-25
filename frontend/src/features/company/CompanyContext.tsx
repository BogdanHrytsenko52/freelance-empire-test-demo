import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { toApiError } from '../../api/client'
import type { Company } from '../../types'
import { getMyCompany } from './companyApi'

type Status = 'loading' | 'ready' | 'none' | 'error'

interface CompanyState {
  company: Company | null
  status: Status
  error: string
  reload: () => Promise<void>
  setCompany: (c: Company) => void
}

const CompanyContext = createContext<CompanyState | null>(null)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const c = await getMyCompany()
      setCompanyState(c ?? null)
      setStatus(c ? 'ready' : 'none')
    } catch (err) {
      const apiErr = toApiError(err)
      if (apiErr.status === 404) {
        setCompanyState(null)
        setStatus('none') // компанії ще немає: гравця веде на /company/create
      } else {
        setError(apiErr.message)
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const setCompany = useCallback((c: Company) => {
    setCompanyState(c)
    setStatus('ready')
  }, [])

  const value = useMemo(() => ({ company, status, error, reload, setCompany }), [company, status, error, reload, setCompany])
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used inside CompanyProvider')
  return ctx
}

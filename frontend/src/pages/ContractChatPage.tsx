import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { Card } from '../components/Card'
import Loading from '../components/Loading'
import { ConfirmDialog } from '../components/Modal'
import { ErrorState } from '../components/PageState'
import { useToast } from '../components/Toast'
import { toApiError } from '../api/client'
import { acceptContract, getChat, getContract, sendChatMessage } from '../features/contracts/contractsApi'
import { useResource } from '../hooks/useResource'
import { describeDeadline } from '../utils/format'
import { formatMoney } from '../utils/money'

export default function ContractChatPage() {
  const { id } = useParams()
  const contractId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()

  const contract = useResource(() => getContract(contractId), { deps: [contractId] })
  const chat = useResource(() => getChat(contractId), { deps: [contractId] })
  const [text, setText] = useState('')
  const [pending, setPending] = useState<string | null>(null) // повідомлення, що очікує відповіді
  const [sendError, setSendError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const messageCount = chat.data?.messages.length
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messageCount, pending])

  async function send(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value || pending) return
    setSendError('')
    setPending(value)
    setText('')
    try {
      chat.setData(await sendChatMessage(contractId, value))
      void contract.refresh()
    } catch (err) {
      const message = toApiError(err).message // помилки Groq/ліміти приходять від Django
      setSendError(message)
      setText(value)
      toast.error(message)
    } finally {
      setPending(null)
    }
  }

  async function accept() {
    setAccepting(true)
    try {
      const { project_id } = await acceptContract(contractId)
      toast.success('Умови прийнято, проєкт створено')
      navigate(`/projects/${project_id}`)
    } catch (err) {
      toast.error(toApiError(err).message)
      setConfirming(false)
    } finally {
      setAccepting(false)
    }
  }

  if ((contract.loading && !contract.data) || (chat.loading && !chat.data)) return <Loading />
  if (!contract.data || !chat.data) {
    return <ErrorState message={contract.error || chat.error || 'Не вдалося завантажити чат'} onRetry={() => { void contract.reload(); void chat.reload() }} />
  }

  const c = contract.data
  const state = chat.data
  const open = c.status === 'available' || c.status === 'negotiating'
  const budget = state.proposal?.budget ?? c.budget
  const deadline = state.proposal?.deadline ?? c.deadline

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-[480px] flex-col gap-4 lg:flex-row">
      <Card className="flex min-h-0 flex-1 flex-col !p-0">
        <div className="border-b border-border px-4 py-3">
          <Link to="/contracts" className="text-xs text-muted hover:text-text">← До біржі</Link>
          <h1 className="font-semibold">{c.client.name}</h1>
          <p className="text-xs text-muted">{c.title}</p>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-label="Історія діалогу">
          {state.messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender === 'player' ? 'self-end bg-primary text-white' : 'self-start bg-elevated'}`}>
              {m.text}
            </div>
          ))}
          {pending && (
            <>
              <div className="max-w-[80%] self-end rounded-2xl bg-primary/60 px-3 py-2 text-sm text-white">{pending}</div>
              <div role="status" className="self-start rounded-2xl bg-elevated px-3 py-2 text-sm text-muted">Клієнт друкує…</div>
            </>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3">
          {state.fallback && <div className="mb-2"><Alert>AI тимчасово недоступний: клієнт відповів шаблонним повідомленням.</Alert></div>}
          {sendError && <div className="mb-2"><Alert>{sendError}</Alert></div>}
          {open ? (
            <form onSubmit={send} className="flex gap-2">
              <div className="flex-1">
                <textarea
                  aria-label="Повідомлення"
                  value={text}
                  maxLength={state.max_message_length}
                  rows={2}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder="Запитайте про вимоги, бюджет або дедлайн…"
                  className="w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-right text-xs text-muted">{text.length}/{state.max_message_length}</p>
              </div>
              <Button type="submit" loading={!!pending} disabled={!text.trim()} className="self-start">Надіслати</Button>
            </form>
          ) : (
            <p className="text-sm text-muted">Переговори за цим контрактом закрито.</p>
          )}
        </div>
      </Card>

      <Card className="flex w-full flex-col gap-3 lg:w-72">
        <h2 className="font-semibold">Поточна пропозиція</h2>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-muted">Бюджет</dt><dd className="font-medium">{formatMoney(budget)}</dd>
          <dt className="text-muted">Дедлайн</dt><dd>{describeDeadline(deadline)}</dd>
          <dt className="text-muted">Переговорів</dt><dd>залишилось {state.negotiations_left}</dd>
        </dl>
        <p className="text-xs text-muted">Умови змінюються лише після перевірки сервером. Клієнт не може вийти за допустимі межі бюджету й дедлайну.</p>
        <Button disabled={!open} onClick={() => setConfirming(true)}>Прийняти узгоджені умови</Button>
      </Card>

      {confirming && (
        <ConfirmDialog
          title="Прийняти узгоджені умови?"
          text={`Бюджет ${formatMoney(budget)}, ${describeDeadline(deadline)}. Після прийняття створиться проєкт.`}
          confirmLabel="Прийняти"
          loading={accepting}
          onConfirm={() => void accept()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

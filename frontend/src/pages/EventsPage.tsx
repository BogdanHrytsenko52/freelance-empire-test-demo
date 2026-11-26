import { useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card } from '../components/Card'
import Loading from '../components/Loading'
import { EmptyState, ErrorState, PageHeader } from '../components/PageState'
import { useToast } from '../components/Toast'
import { toApiError } from '../api/client'
import EventCard, { KIND_TONE } from '../features/events/EventCard'
import { chooseEvent, getActiveEvents, getEventHistory } from '../features/events/eventsApi'
import { EVENT_KIND_LABELS } from '../constants/labels'
import { useResource } from '../hooks/useResource'
import type { GameEvent } from '../types'
import { formatDate } from '../utils/format'

export default function EventsPage() {
  const toast = useToast()
  const active = useResource(getActiveEvents, { interval: 15000 })
  const history = useResource(getEventHistory, { interval: 30000 })
  const [lastResult, setLastResult] = useState<GameEvent | null>(null)

  async function onChoose(eventId: number, choiceId: number) {
    try {
      const resolved = await chooseEvent(eventId, choiceId)
      setLastResult(resolved)
      toast.success('Рішення прийнято')
    } catch (e) {
      toast.error(toApiError(e).message)
    }
    await Promise.all([active.refresh(), history.refresh()])
  }

  if (active.loading && !active.data) return <Loading />
  if (!active.data) return <ErrorState message={active.error || 'Не вдалося завантажити події'} onRetry={() => void active.reload()} />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Івенти" subtitle="Випадкові події компанії та ваші рішення" />

      {lastResult && (
        <Card className="border-primary/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Наслідки рішення: {lastResult.title}</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {lastResult.outcome.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
            <Button variant="ghost" onClick={() => setLastResult(null)}>Закрити</Button>
          </div>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Активні події ({active.data.length})</h2>
        {active.data.length === 0 ? (
          <EmptyState title="Активних подій немає" text="Події зʼявляються випадково з часом. Не більше двох одночасно." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.data.map((e) => <EventCard key={e.id} event={e} onChoose={onChoose} />)}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Історія</h2>
        {!history.data || history.data.length === 0 ? (
          <p className="text-sm text-muted">Завершених подій ще немає</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.data.map((e) => {
              const picked = e.choices.find((c) => c.id === e.chosen_choice_id)
              return (
                <Card key={e.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{e.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge tone={KIND_TONE[e.kind]}>{EVENT_KIND_LABELS[e.kind]}</Badge>
                      {e.resolved_at && <span className="text-xs text-muted">{formatDate(e.resolved_at)}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted">{picked ? `Рішення: ${picked.text}` : 'Подія завершилась без вибору'}</p>
                  {e.outcome.length > 0 && <ul className="list-disc pl-5 text-sm">{e.outcome.map((o) => <li key={o}>{o}</li>)}</ul>}
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState } from 'react'
import Badge, { Tone } from '../../components/Badge'
import Button from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/Modal'
import { EVENT_KIND_LABELS } from '../../constants/labels'
import type { EventKind, GameEvent } from '../../types'

export const KIND_TONE: Record<EventKind, Tone> = { positive: 'success', negative: 'danger', neutral: 'warning' }

interface Props {
  event: GameEvent
  onChoose: (eventId: number, choiceId: number) => Promise<void>
}

// Вибір застосовується один раз: після підтвердження кнопки блокуються, а повторне рішення відхилить сервер.
export default function EventCard({ event, onChoose }: Props) {
  const [choice, setChoice] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const chosen = event.choices.find((c) => c.id === choice)

  async function confirm() {
    if (choice === null || busy) return
    setBusy(true)
    try {
      await onChoose(event.id, choice)
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{event.title}</h3>
        <Badge tone={KIND_TONE[event.kind]}>{EVENT_KIND_LABELS[event.kind]}</Badge>
      </div>
      <p className="text-sm text-muted">{event.description}</p>

      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className="mb-1 text-xs uppercase text-muted">Варіанти рішення</legend>
        {event.choices.map((c) => (
          <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${choice === c.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <input type="radio" name={`event-${event.id}`} checked={choice === c.id} onChange={() => setChoice(c.id)} />
            {c.text}
          </label>
        ))}
      </fieldset>

      <Button className="self-start" disabled={choice === null || busy} onClick={() => setConfirming(true)}>Підтвердити вибір</Button>

      {confirming && chosen && (
        <ConfirmDialog
          title="Підтвердити рішення?"
          text={`Ви обрали: «${chosen.text}». Змінити рішення після підтвердження не можна.`}
          loading={busy}
          onConfirm={() => void confirm()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Card>
  )
}

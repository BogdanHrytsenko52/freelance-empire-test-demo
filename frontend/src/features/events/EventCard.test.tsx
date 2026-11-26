import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { describe, it, expect, vi } from 'vitest'
import EventCard from './EventCard'
import type { GameEvent } from '../../types'

const event: GameEvent = {
  id: 7, title: 'Працівник просить підвищення', description: 'Просить підвищити зарплату.', kind: 'neutral', status: 'pending',
  choices: [{ id: 1, text: 'Підвищити зарплату' }, { id: 2, text: 'Відмовити' }],
  created_at: '2026-01-01', resolved_at: null, chosen_choice_id: null, outcome: [],
}

const user = userEvent.setup({ delay: null })

describe('EventCard', () => {
  it('показує подію та варіанти рішення, кнопка вимкнена до вибору', () => {
    render(<EventCard event={event} onChoose={vi.fn()} />)
    expect(screen.getByText('Працівник просить підвищення')).toBeInTheDocument()
    expect(screen.getByLabelText('Підвищити зарплату')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Підтвердити вибір' })).toBeDisabled()
  })

  it('обирає рішення, просить підтвердження й викликає onChoose один раз', async () => {
    const onChoose = vi.fn().mockResolvedValue(undefined)
    render(<EventCard event={event} onChoose={onChoose} />)
    await user.click(screen.getByLabelText('Відмовити'))
    await user.click(screen.getByRole('button', { name: 'Підтвердити вибір' }))
    expect(onChoose).not.toHaveBeenCalled() // спершу діалог підтвердження
    await user.click(screen.getByRole('button', { name: 'Підтвердити' }))
    expect(onChoose).toHaveBeenCalledTimes(1)
    expect(onChoose).toHaveBeenCalledWith(7, 2)
  })
})

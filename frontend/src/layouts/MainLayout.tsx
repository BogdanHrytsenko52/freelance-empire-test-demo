import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { getGameState } from '../features/game/gameApi'
import { useResource } from '../hooks/useResource'

const NAV = [
  { to: '/dashboard', label: 'Дашборд' },
  { to: '/employees', label: 'Працівники' },
  { to: '/contracts', label: 'Контракти' },
  { to: '/projects', label: 'Проєкти' },
  { to: '/events', label: 'Івенти' },
  { to: '/finance', label: 'Фінанси' },
  { to: '/leaderboard', label: 'Рейтинг' },
  { to: '/profile', label: 'Профіль' },
]

export default function MainLayout() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  // 1 реальна година = 1 ігровий день, тому оновлюємо день за таймером.
  const game = useResource(getGameState, { interval: 30000 })
  const day = game.data?.game_day

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="font-semibold">Freelance Empire</span>
        <div className="flex items-center gap-3">
          {day !== undefined && <span className="text-xs text-muted">День {day}</span>}
          <button onClick={() => setOpen((o) => !o)} aria-label="Меню" className="rounded px-2 py-1 hover:bg-elevated">☰</button>
        </div>
      </header>

      <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-r border-border bg-surface md:block md:w-60`}>
        <div className="hidden px-5 py-5 md:block">
          <p className="text-lg font-semibold">Freelance Empire</p>
          {day !== undefined && <p className="mt-1 text-xs text-muted">Ігровий день {day}</p>}
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-white' : 'text-muted hover:bg-elevated hover:text-text'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button onClick={logout} className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-elevated">Вийти</button>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

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

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="font-semibold">Freelance Empire</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Меню" className="rounded px-2 py-1 hover:bg-elevated">
          ☰
        </button>
      </header>

      <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-r border-border bg-surface md:block md:w-60`}>
        <div className="hidden px-5 py-5 text-lg font-semibold md:block">Freelance Empire</div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-muted hover:bg-elevated hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button onClick={logout} className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-elevated">
            Вийти
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

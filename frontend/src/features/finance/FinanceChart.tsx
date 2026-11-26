import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FinanceDaily } from '../../types'

// Графік доходів і витрат за ігровими днями (Recharts).
export default function FinanceChart({ data }: { data: FinanceDaily[] }) {
  const rows = data.map((d) => ({ day: `д.${d.game_day}`, Доходи: Number(d.income), Витрати: Number(d.expenses) }))
  return (
    <div className="h-64 w-full" aria-label="Графік доходів і витрат">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
          <XAxis dataKey="day" stroke="#8b93a7" fontSize={12} />
          <YAxis stroke="#8b93a7" fontSize={12} />
          <Tooltip contentStyle={{ background: '#1f2330', border: '1px solid #2a2f3e', borderRadius: 8 }} />
          <Legend />
          <Bar dataKey="Доходи" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Витрати" fill="#f0616d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

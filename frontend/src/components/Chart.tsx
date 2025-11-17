import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import type { ChartDataPoint } from '../types'

interface ChartProps {
  data: ChartDataPoint[]
}

function Chart({ data }: ChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="bg-app-secondary dark:bg-dark-app-secondary p-6 rounded-lg shadow-lg border border-app-primary dark:border-dark-app-primary">
      <h3 className="text-lg font-semibold text-app-primary dark:text-dark-app-primary mb-4">Evolucao de Vendas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 204, 106, 0.2)'}
          />
          <XAxis
            dataKey="date"
            stroke={isDark ? '#b3b3b3' : '#666666'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={isDark ? '#b3b3b3' : '#666666'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#111111' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 204, 106, 0.2)'}`,
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#0a0a0a'
            }}
          />
          <Legend
            wrapperStyle={{
              color: isDark ? '#ffffff' : '#0a0a0a'
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isDark ? '#00ff88' : '#00cc6a'}
            strokeWidth={2}
            name="Valor (R$)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart

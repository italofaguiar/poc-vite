import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardData, logout } from '../services/api'
import Chart from '../components/Chart'
import Table from '../components/Table'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/Logo'
import type { DashboardData, AsyncState } from '../types'
import { getErrorMessage } from '../types'

function Dashboard() {
  const [state, setState] = useState<AsyncState<DashboardData>>({ status: 'loading' })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setState({ status: 'loading' })
      try {
        const data = await getDashboardData()
        setState({ status: 'success', data })
      } catch (err) {
        setState({
          status: 'error',
          error: getErrorMessage(err, 'Erro ao carregar dados do dashboard'),
        })
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
      // Navigate anyway
      navigate('/login')
    }
  }

  // Render loading state
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-primary dark:bg-dark-app-primary transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-app-secondary dark:text-dark-app-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-primary dark:bg-dark-app-primary transition-colors duration-300">
        <div className="text-center">
          <p className="text-red-600">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4 px-4 py-2 text-white rounded-md"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // At this point, TypeScript knows state.status === 'success'
  const data = state.data

  return (
    <div className="min-h-screen bg-app-primary dark:bg-dark-app-primary transition-colors duration-300">
      {/* Header */}
      <header className="bg-app-secondary dark:bg-dark-app-secondary shadow border-b border-app-primary dark:border-dark-app-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Logo + User Info */}
            <div className="flex items-center gap-4">
              <Logo variant="compact" size="sm" />
              <div className="border-l border-app-primary dark:border-dark-app-primary pl-4">
                <h1 className="text-lg sm:text-xl font-bold text-app-primary dark:text-dark-app-primary">Dashboard</h1>
                <p className="text-xs sm:text-sm text-app-secondary dark:text-dark-app-secondary">{data.user_email}</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 justify-end sm:justify-start">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Chart Section */}
          <Chart data={data.chart_data} />

          {/* Table Section */}
          <Table data={data.table_data} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard

import type { TableRow } from '../types'

interface TableProps {
  data: TableRow[]
}

function Table({ data }: TableProps) {
  const getStatusColor = (status: TableRow['status']): string => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'Pendente':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      case 'Inativo':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="bg-app-secondary dark:bg-dark-app-secondary rounded-lg shadow-lg overflow-hidden border border-app-primary dark:border-dark-app-primary">
      <div className="px-6 py-4 border-b border-app-primary dark:border-dark-app-primary">
        <h3 className="text-lg font-semibold text-app-primary dark:text-dark-app-primary">Produtos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-app-primary dark:divide-dark-app-primary">
          <thead className="bg-app-primary dark:bg-dark-app-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-app-secondary dark:text-dark-app-secondary uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-app-secondary dark:text-dark-app-secondary uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-app-secondary dark:text-dark-app-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-app-secondary dark:text-dark-app-secondary uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="bg-app-secondary dark:bg-dark-app-secondary divide-y divide-app-primary dark:divide-dark-app-primary">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-app-primary dark:hover:bg-dark-app-primary transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-app-primary dark:text-dark-app-primary">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-app-primary dark:text-dark-app-primary">
                  {item.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-app-primary dark:text-dark-app-primary">
                  {formatCurrency(item.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table

import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AlertsDropdown from './AlertsDropdown'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = ['super_admin', 'org_admin'].includes(user?.role)

  const navLinks = isAdmin ? [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Contracts & Sites', path: '/admin/contracts' },
    { name: 'Inventory', path: '/admin/inventory' },
    { name: 'Users', path: '/admin/users' },
  ] : [
    { name: 'My Sites', path: '/manager' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">EICMS</span>
              </div>
              <div className="hidden md:flex space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === link.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdmin && <AlertsDropdown />}
              <div className="flex flex-col text-right">
                 <span className="text-sm font-medium text-gray-900">{user?.full_name}</span>
                 <span className="text-xs text-gray-500">{user?.role.replace('_', ' ').toUpperCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full mx-auto">
        {children}
      </main>
    </div>
  )
}

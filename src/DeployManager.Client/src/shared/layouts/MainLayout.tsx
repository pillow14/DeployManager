import { Outlet, Link, useNavigate } from 'react-router-dom'

export function MainLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav aria-label="Main navigation" className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                DeployManager
              </Link>
              <div className="hidden sm:flex sm:gap-6">
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link to="/sites" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Sites
                </Link>
                <Link to="/rules" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Rules
                </Link>
                <Link to="/history" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  History
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

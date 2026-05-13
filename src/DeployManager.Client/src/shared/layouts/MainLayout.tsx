import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe,
  Server,
  GitBranch,
  Package,
  Upload,
  Clock,
  RotateCcw,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/providers/useAuth'
import { useTheme } from '@/shared/utils/ThemeProvider'

interface NavItem {
  icon: typeof LayoutDashboard
  label: string
  path: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Globe, label: 'Entornos', path: '/environments' },
  { icon: Server, label: 'Sitios', path: '/sites' },
  { icon: GitBranch, label: 'Reglas', path: '/rules' },
  { icon: Package, label: 'Paquetes', path: '/packages' },
  { icon: Upload, label: 'Nuevo Despliegue', path: '/new-deploy' },
  { icon: Clock, label: 'Historial', path: '/history' },
  { icon: RotateCcw, label: 'Rollback', path: '/rollback' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.filter((item) => {
        if (!item.roles) return true
        return user && item.roles.includes(user.role)
      }).map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const pageTitle = NAV_ITEMS.find((i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'))?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5 dark:border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Server className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">DeployManager</span>
          <button
            className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav onNavigate={() => setMobileOpen(false)} />

        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <button
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Páginas /</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Todo operativo</span>
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{user?.username}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

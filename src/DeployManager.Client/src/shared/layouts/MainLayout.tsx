import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { X, Menu } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/providers/useAuth'

interface NavItem {
  icon: string
  label: string
  path: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'layers', label: 'Entornos', path: '/environments' },
  { icon: 'language', label: 'Sitios', path: '/sites' },
  { icon: 'rule', label: 'Reglas', path: '/rules' },
  { icon: 'inventory_2', label: 'Paquetes', path: '/packages' },
  { icon: 'rocket_launch', label: 'Nuevo Despliegue', path: '/new-deploy' },
  { icon: 'history', label: 'Historial', path: '/history' },
  { icon: 'settings_backup_restore', label: 'Rollback', path: '/rollback' },
  { icon: 'calendar_month', label: 'Programados', path: '/scheduled-deploys' },
  { icon: 'settings', label: 'Configuración', path: '/settings' },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <nav className="mt-md flex flex-1 flex-col gap-xs">
      {NAV_ITEMS.filter((item) => {
        if (!item.roles) return true
        return user && item.roles.includes(user.role)
      }).map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-sm rounded-lg px-md py-sm text-body-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-container/10 text-primary-container border border-primary-container/30 font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary-container',
            )}
          >
            <span className={cn('material-symbols-outlined text-[20px]', isActive && "font-variation-settings: 'FILL' 1;")}>{item.icon}</span>
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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const pageTitle = NAV_ITEMS.find((i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'))?.label ?? 'Dashboard'

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-outline-variant bg-surface-container p-md transition-transform duration-300 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-sm px-sm py-md animate-fade-in">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
          </div>
          <div>
            <h1 className="text-title-md font-bold text-on-surface leading-none">DeployManager</h1>
            <p className="text-label-code text-outline">ASP.NET Operations</p>
          </div>
          <button
            className="ml-auto rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav onNavigate={() => setMobileOpen(false)} />

        <div className="mt-auto border-t border-outline-variant pt-md">
          <div className="flex items-center gap-sm px-sm py-sm">
            <div className="h-8 w-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs border border-primary-fixed-dim/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-on-surface">{user?.username}</p>
              <p className="text-label-code text-outline">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md px-lg">
          <button
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-md w-1/2">
            <div className="relative hidden sm:block w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-colors"
                placeholder="Buscar sitios, despliegues..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-lg">
            <div className="hidden items-center gap-xs px-sm py-1 bg-secondary-container/10 border border-secondary-container/30 text-secondary-container rounded-full text-label-code font-bold sm:flex">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              Producción
            </div>

            <div className="flex items-center gap-md">
              <button className="text-on-surface-variant hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              <div className="relative">
                <button
                  className="flex items-center gap-sm rounded-lg p-1 text-on-surface-variant hover:bg-surface-container transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs overflow-hidden border border-primary-fixed-dim/30">
                    {initials}
                  </div>
                  <span className="hidden md:inline text-label-code font-semibold text-on-surface">{user?.username}</span>
                  <span className="material-symbols-outlined text-outline text-[18px]">expand_more</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-outline-variant bg-surface-container-high py-1 shadow-lg">
                      <div className="border-b border-outline-variant px-4 py-3">
                        <p className="text-body-sm font-semibold text-on-surface">{user?.username}</p>
                        <p className="text-label-code text-outline">{user?.role}</p>
                      </div>
                      <button
                        onClick={() => { handleLogout(); setUserMenuOpen(false) }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-body-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-lg">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>

        <footer className="px-lg py-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-label-code text-outline">
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_5px_rgba(0,255,159,0.8)]" />
              Sistemas operativos
            </div>
          </div>
          <span>{pageTitle} &middot; DeployManager</span>
        </footer>
      </div>
    </div>
  )
}

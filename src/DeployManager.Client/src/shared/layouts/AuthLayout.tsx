import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="login-shell">
      <div className="login-grid" />

      <div className="login-orb o1" />
      <div className="login-orb o2" />
      <div className="login-orb o3" />

      <div className="login-beam" style={{ left: '12%' }} />
      <div className="login-beam b2" style={{ left: '30%' }} />
      <div className="login-beam b3" style={{ left: '65%' }} />
      <div className="login-beam b4" style={{ left: '88%' }} />

      <div className="login-particles" aria-hidden="true">
        {[
          { cls: 'g', left: '8%', top: '60%', dur: '18s', del: '0s' },
          { cls: 'b', left: '18%', top: '80%', dur: '22s', del: '2s' },
          { cls: 'g', left: '25%', top: '70%', dur: '20s', del: '5s' },
          { cls: 'w', left: '35%', top: '90%', dur: '24s', del: '1s' },
          { cls: 'g', left: '42%', top: '75%', dur: '21s', del: '7s' },
          { cls: 'b', left: '55%', top: '85%', dur: '19s', del: '3s' },
          { cls: 'w', left: '62%', top: '65%', dur: '25s', del: '9s' },
          { cls: 'g', left: '72%', top: '78%', dur: '17s', del: '11s' },
          { cls: 'b', left: '82%', top: '92%', dur: '23s', del: '4s' },
          { cls: 'w', left: '90%', top: '70%', dur: '26s', del: '6s' },
          { cls: 'g', left: '5%', top: '40%', dur: '28s', del: '8s' },
          { cls: 'b', left: '38%', top: '50%', dur: '30s', del: '12s' },
          { cls: 'g', left: '67%', top: '55%', dur: '27s', del: '13s' },
          { cls: 'w', left: '88%', top: '45%', dur: '29s', del: '15s' },
          { cls: 'g', left: '15%', top: '30%', dur: '32s', del: '14s' },
          { cls: 'b', left: '50%', top: '35%', dur: '31s', del: '16s' },
          { cls: 'g', left: '78%', top: '25%', dur: '33s', del: '18s' },
          { cls: 'w', left: '95%', top: '15%', dur: '35s', del: '10s' },
        ].map((p, i) => (
          <div
            key={i}
            className={`pp ${p.cls}`}
            style={{ left: p.left, top: p.top, animationDuration: p.dur, animationDelay: p.del }}
          />
        ))}
      </div>

      <div className="login-side">
        <div className="login-hero-brand">
          <div className="brand-mark brand-mark--hero">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#grad)" />
              <path d="M12 20L18 14L26 22L20 28L12 20Z" fill="white" fillOpacity="0.9" />
              <path d="M20 12L28 20L22 26L14 18L20 12Z" fill="white" fillOpacity="0.5" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-spec" aria-hidden="true" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.6rem' }}>
              Deploy<span className="accent">Manager</span>
            </h1>
            <div className="tagline">Gestion de despliegues</div>
          </div>
        </div>

        <div>
          <h2>Despliega con confianza</h2>
          <p>
            Administra, programa y ejecuta despliegues de forma centralizada.
            Monitoreo en tiempo real, historial completo y rollback automatico.
          </p>
        </div>

        <div className="login-stats">
          <div className="login-stat">
            <div className="value">CI/CD</div>
            <div className="label">Automatizado</div>
          </div>
          <div className="login-stat">
            <div className="value">JWT</div>
            <div className="label">Seguro</div>
          </div>
          <div className="login-stat">
            <div className="value">99.9%</div>
            <div className="label">Uptime</div>
          </div>
        </div>

        <div className="text-xs text-outline flex items-center gap-2 mt-4">
          <span className="material-symbols-outlined text-[14px] text-primary-container">verified_user</span>
          Conexion cifrada · auditoria activa
        </div>
      </div>

      <div className="login-card">
        <div className="login-hero-brand lg:!hidden">
          <div className="brand-mark brand-mark--nav">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#grad2)" />
              <path d="M12 20L18 14L26 22L20 28L12 20Z" fill="white" fillOpacity="0.9" />
              <path d="M20 12L28 20L22 26L14 18L20 12Z" fill="white" fillOpacity="0.5" />
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-spec" aria-hidden="true" />
          </div>
          <div>
            <h1>
              Deploy<span className="accent">Manager</span>
            </h1>
            <div className="tagline">Iniciar sesion</div>
          </div>
        </div>

        <div className="hidden lg:block mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-outline mb-1">Bienvenido de vuelta</div>
          <h2 className="text-2xl font-bold text-on-surface leading-tight">Acceso al sistema</h2>
        </div>

        <Outlet />

        <div className="mt-5 pt-4 border-t border-outline-variant/40 text-center text-xs text-outline">
          <div className="flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
            <span>Plataforma de uso interno · Valgreti</span>
          </div>
          <div className="text-[10px] text-outline mt-1">
            Si no tienes cuenta, solicitela a un administrador.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-outline">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_6px_rgba(0,255,159,0.6)]" />
            TLS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container shadow-[0_0_6px_rgba(0,227,253,0.6)]" />
            JWT
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shadow-[0_0_6px_rgba(180,171,255,0.6)]" />
            CORS
          </span>
        </div>
      </div>

      <div className="login-footer">
        DeployManager · 2026 · Powered by Valgreti
      </div>
    </div>
  )
}

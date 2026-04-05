import { Bell, ClipboardList, LayoutDashboard, User } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { WhatsAppSupportButton } from '../components/WhatsAppSupportButton'
import { useAppData } from '../context/AppDataContext'
import { cn } from '../utils/cn'

const bottomNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Claims', to: '/claims', icon: ClipboardList },
  { label: 'Alerts', to: '/alerts', icon: Bell },
  { label: 'Profile', to: '/profile', icon: User },
]

export function AppLayout() {
  const { data, error, isLoading, refreshData } = useAppData()

  return (
    <div className="min-h-screen bg-kavach">
      <Navbar isApp />
      <Sidebar />
      <main className="min-h-screen px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-20 lg:ml-60 lg:px-8">
        {isLoading ? (
          <div className="grid min-h-[60vh] place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-4xl text-navy">Kavach</p>
              <p className="mt-3 text-sm font-medium text-muted">Syncing live protection data…</p>
            </div>
          </div>
        ) : error ? (
          <div className="grid min-h-[60vh] place-items-center px-6">
            <div className="panel-card max-w-xl p-8 text-center">
              <p className="mono-label">Connection error</p>
              <h2 className="mt-3 text-3xl text-navy">Live data could not be loaded.</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{error}</p>
              <button
                type="button"
                onClick={() => void refreshData()}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-semibold text-white"
              >
                Retry sync
              </button>
            </div>
          </div>
        ) : !data ? (
          <div className="grid min-h-[60vh] place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-4xl text-navy">Kavach</p>
              <p className="mt-3 text-sm font-medium text-muted">No protected data is available yet.</p>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-full border border-sky-light bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {bottomNavItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-full px-2 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-muted transition',
                  isActive && 'bg-navy text-white',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <WhatsAppSupportButton />
    </div>
  )
}

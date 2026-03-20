import { Bell, ClipboardList, LayoutDashboard, User } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { WhatsAppSupportButton } from '../components/WhatsAppSupportButton'
import { cn } from '../lib/cn'

const bottomNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Claims', to: '/claims', icon: ClipboardList },
  { label: 'Alerts', to: '/alerts', icon: Bell },
  { label: 'Profile', to: '/profile', icon: User },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-kavach">
      <Navbar isApp />
      <Sidebar />
      <main className="min-h-screen px-4 pb-28 pt-20 lg:ml-60 lg:px-8">
        <Outlet />
      </main>
      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-full border border-sky-light bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
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

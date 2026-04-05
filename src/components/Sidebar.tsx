import {
  BarChart3,
  Bell,
  FileBadge2,
  LayoutDashboard,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'
import { formatCurrency } from '../utils/format'

const mainLinks = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Claims', to: '/claims', icon: FileBadge2 },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
]

const accountLinks = [
  { label: 'Policy', to: '/policy', icon: ShieldCheck },
  { label: 'Alerts', to: '/alerts', icon: Bell },
  { label: 'Profile', to: '/profile', icon: UserCircle2 },
]

function SidebarLink({
  label,
  to,
  icon: Icon,
}: {
  label: string
  to: string
  icon: typeof LayoutDashboard
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-navy text-white shadow-card'
            : 'text-muted hover:bg-sky-pale hover:text-navy',
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const visibleMainLinks =
    user?.role === 'admin' ? mainLinks : mainLinks.filter((link) => link.to !== '/analytics')

  return (
    <aside className="fixed bottom-0 left-0 top-16 hidden w-60 border-r border-sky-light bg-white px-4 pb-6 pt-6 md:flex md:flex-col">
      <div className="space-y-7">
        <div>
          <p className="mono-label">Main</p>
          <div className="mt-3 space-y-1">
            {visibleMainLinks.map((link) => (
              <SidebarLink
                key={link.to}
                {...link}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mono-label">Account</p>
          <div className="mt-3 space-y-1">
            {accountLinks.map((link) => (
              <SidebarLink
                key={link.to}
                {...link}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-2xl bg-navy p-4 text-white shadow-lg">
        <p className="mono-label !text-sky-light">Active plan</p>
        <h3 className="mt-2 font-serif text-2xl text-white">{user?.plan ?? 'Kavach Shield'}</h3>
        <p className="mt-2 text-sm text-sky-light/80">
          Weekly premium {formatCurrency(user?.weeklyPremium ?? 49)}
        </p>
        <Link
          to="/policy#upgrade"
          className="mt-5 block w-full rounded-full bg-gold px-4 py-3 text-center text-sm font-semibold text-navy"
        >
          Upgrade plan
        </Link>
      </div>
    </aside>
  )
}

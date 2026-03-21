import { Dialog, Transition } from '@headlessui/react'
import { CalendarDays, Menu, ShieldCheck, X } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'
import { StatusPill } from './StatusPill'

const landingLinks = [
  { label: 'Home', href: '/#top' },
  { label: 'Features', href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
]

type NavbarProps = {
  isApp?: boolean
}

export function Navbar({ isApp = false }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, loginAsDemo, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async () => {
    if (isAuthenticated) {
      navigate('/dashboard')
      return
    }

    try {
      await loginAsDemo()
      navigate('/dashboard')
    } catch (error) {
      console.error('Unable to start demo session', error)
    }
  }

  const ctaHref = isAuthenticated ? '/dashboard' : '/signup'

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-sky-light bg-kavach/90 backdrop-blur-md">
        <div className="container-shell flex h-16 items-center justify-between gap-4">
          <Link
            to={isApp ? '/dashboard' : '/'}
            className="flex items-center gap-2"
          >
            <span className="text-lg">🛡️</span>
            <span className="font-serif text-2xl">Kavach</span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {isApp ? (
              <div className="flex items-center gap-3">
                <StatusPill status="active">Coverage Active</StatusPill>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-light bg-white px-4 py-2 text-sm text-muted">
                  <CalendarDays className="h-4 w-4 text-sky" />
                  18 Mar - 24 Mar 2026
                </span>
              </div>
            ) : (
              landingLinks.map((link) => {
                const active =
                  location.pathname === '/' &&
                  (location.hash === link.href.replace('/#', '#') ||
                    (link.href === '/#top' && location.hash === ''))

                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm text-muted transition hover:bg-sky-pale hover:text-navy',
                      active && 'bg-sky-pale text-navy',
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isApp ? (
              <>
                <span className="text-sm text-muted">{user?.zone ?? 'Coverage Monitor'}</span>
                <button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      await logout()
                      navigate('/')
                    })()
                  }
                  className="text-sm font-medium text-muted transition hover:text-navy"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleLogin()}
                className="text-sm font-medium text-muted transition hover:text-navy"
              >
                Log in
              </button>
            )}

            <Link
              to={ctaHref}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid"
            >
              {isApp ? 'Open Shield' : 'Get Protected'}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-light text-navy lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <Transition
        show={open}
        as={Fragment}
      >
        <Dialog
          as="div"
          className="relative z-[60] lg:hidden"
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-start justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex h-full w-full max-w-sm flex-col bg-navy px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <span className="font-serif text-2xl text-white">Kavach</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-10 space-y-3">
                  {(isApp ? [] : landingLinks).map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl border border-white/10 px-5 py-4 text-lg"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isApp ? (
                    <>
                      <div className="rounded-2xl border border-white/10 px-5 py-4">
                        <p className="mono-label !text-sky-light">Coverage Monitor</p>
                        <p className="mt-2 text-lg">{user?.zone ?? 'Bengaluru live zone'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void (async () => {
                            await logout()
                            setOpen(false)
                            navigate('/')
                          })()
                        }
                        className="w-full rounded-2xl border border-white/10 px-5 py-4 text-left text-lg text-white/80"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        void handleLogin()
                      }}
                      className="mt-6 w-full rounded-2xl border border-white/10 px-5 py-4 text-left text-lg text-white/80"
                    >
                      Log in
                    </button>
                  )}

                  <Link
                    to={ctaHref}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl px-5 py-4 text-lg font-semibold',
                      isApp ? 'bg-white text-navy' : 'bg-gold text-navy',
                    )}
                  >
                    {isApp ? 'Open Shield' : 'Get Protected'}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                {isApp ? (
                  <div className="mt-auto rounded-2xl border border-white/10 p-5">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <ShieldCheck className="h-4 w-4 text-gold" />
                      Guardian active
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      Parametric protection is running across weather, pollution, and civic feeds.
                    </p>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

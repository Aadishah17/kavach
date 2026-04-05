import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Loader2, MessageSquare, ShieldCheck, LogOut, ArrowRight } from 'lucide-react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { requestEmergencySupport } from '../utils/api'
import { formatCurrency } from '../utils/format'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const { data, saveProfileSettings } = useAppData()
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const initials = useMemo(
    () =>
      (user?.name ?? '')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  )

  if (!user || !data) {
    return null
  }

  const handleSupport = async () => {
    setBusy(true)
    setStatusMessage(null)

    try {
      const response = await requestEmergencySupport(token, 'chat')
      setStatusMessage(`${response.message} Ticket ${response.ticketId}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to contact support right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4"
    >
      <header className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-[linear-gradient(135deg,#0D2B3E_0%,#5BA3BE_100%)] text-2xl font-semibold text-white shadow-card">
          {initials}
        </div>
        <div>
          <p className="mono-label">Verified partner</p>
          <h1 className="mt-3 text-[44px] leading-none">{user.name}</h1>
          <p className="mt-3 text-base text-muted">{user.platform} Delivery Executive · ID KV-09281</p>
        </div>
        <StatusPill status="verified" />
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 text-sm text-muted shadow-card">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel-card p-5">
          <p className="mono-label">Current plan</p>
          <div className="mt-3 font-serif text-4xl text-navy">{user.plan.replace('Kavach ', '')}</div>
          <p className="mt-3 text-sm text-muted">Active</p>
        </div>
        <div className="panel-card bg-navy p-5 text-white">
          <p className="mono-label !text-sky-light">Earnings protected</p>
          <div className="mt-3 font-serif text-4xl text-gold">{formatCurrency(data.profile.monthlyProtectedAmount)}</div>
          <p className="mt-3 text-sm text-sky-light/75">This month</p>
        </div>
        <div className="panel-card p-5">
          <p className="mono-label">UPI destination</p>
          <div className="mt-3 font-serif text-4xl text-navy">{user.upi}</div>
          <p className="mt-3 text-sm text-muted">AutoPay mandate linked</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Document vault</p>
              <h2 className="mt-2 text-3xl">Verified records</h2>
            </div>
            <Link
              to="/policy"
              className="inline-flex items-center gap-2 rounded-full border border-sky-light px-4 py-2 text-sm font-semibold text-navy"
            >
              Manage all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {data.profile.documents.map((document) => (
              <div
                key={document.name}
                className="flex items-center justify-between rounded-2xl bg-kavach px-4 py-4"
              >
                <div>
                  <div className="font-semibold text-navy">{document.name}</div>
                  <div className="mt-1 text-sm text-muted">{document.meta}</div>
                </div>
                <StatusPill status={document.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-card p-6">
            <p className="mono-label">Settings</p>
            <h2 className="mt-2 text-3xl">Preferences</h2>
            <div className="mt-6 space-y-4">
              {data.profile.settings.map((setting, index) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between rounded-2xl bg-kavach px-4 py-4"
                >
                  <div>
                    <div className="font-semibold text-navy">{setting.label}</div>
                    <div className="mt-1 text-sm text-muted">{setting.value}</div>
                  </div>
                  <button
                    type="button"
                    disabled={setting.kind === 'link'}
                    onClick={() =>
                      void saveProfileSettings(
                        data.profile.settings.map((item, itemIndex) =>
                          itemIndex === index && item.kind !== 'link'
                            ? { ...item, enabled: !item.enabled }
                            : item,
                        ),
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${setting.enabled ? 'bg-sky' : 'bg-sky-light'} ${setting.kind === 'link' ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${setting.enabled ? 'left-6' : 'left-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card bg-sky-pale p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sky">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl">Need assistance?</h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Route policy, claims, and emergency questions into a live support ticket.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSupport()}
              disabled={busy}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Chat with Kavach support
            </button>
            <button
              type="button"
              onClick={() =>
                void (async () => {
                  await logout()
                  navigate('/')
                })()
              }
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-k-red/20 bg-rose-50 px-5 text-sm font-semibold text-k-red transition hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </section>
    </motion.section>
  )
}

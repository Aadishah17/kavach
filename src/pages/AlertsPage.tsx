import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, PhoneCall, MessageSquare, MapPinned } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { requestEmergencySupport } from '../utils/api'

const statusOrder = ['Triggered', 'Alert', 'Active']

export function AlertsPage() {
  const { data } = useAppData()
  const { token, user } = useAuth()
  const [busy, setBusy] = useState<null | 'support' | 'roadside' | 'chat' | 'hospital'>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!data) {
    return null
  }

  const groupedFeed = useMemo(() => {
    const groups = new Map<string, typeof data.alerts.feed>()

    for (const item of data.alerts.feed) {
      const key = item.status || item.category
      const current = groups.get(key) ?? []
      current.push(item)
      groups.set(key, current)
    }

    return statusOrder
      .filter((status) => groups.has(status))
      .map((status) => ({ title: status, items: groups.get(status) ?? [] }))
      .concat(
        [...groups.entries()]
          .filter(([status]) => !statusOrder.includes(status))
          .map(([title, items]) => ({ title, items })),
      )
  }, [data.alerts.feed])

  const handleSupport = async (channel: 'callback' | 'chat' | 'phone', busyKey: typeof busy) => {
    setBusy(busyKey)
    setStatusMessage(null)

    try {
      const response = await requestEmergencySupport(token, channel)
      setStatusMessage(`${response.message} Ticket ${response.ticketId} · ETA ${response.callbackEtaMinutes} min.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to queue support right now.')
    } finally {
      setBusy(null)
    }
  }

  const openHospitalLocator = () => {
    const query = encodeURIComponent(`${user?.city ?? 'near me'} hospitals`)
    window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noreferrer')
    setStatusMessage('Opened hospital locator in a new tab.')
  }

  return (
    <motion.section
      {...pageTransition}
      className="section-shell space-y-8 pb-4 overflow-x-hidden"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mono-label">Alert center</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.6rem)] leading-[0.95] text-navy">Kavach Sentinel</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            A mobile-friendly inbox for live trigger alerts, emergency support, and backup contacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSupport('callback', 'support')}
          disabled={busy === 'support'}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-k-green px-5 text-sm font-semibold text-white transition hover:bg-k-green/90 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
        >
          {busy === 'support' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
          Emergency support
        </button>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 text-sm text-muted shadow-card">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-label">Live feed</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">Notification inbox</h2>
            </div>
            <StatusPill status="alert" />
          </div>
          <div className="mt-6 space-y-5">
            {groupedFeed.map((group) => (
              <section key={group.title} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted">{group.title}</p>
                  <span className="rounded-full bg-sky-pale px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <article key={item.title} className="rounded-[24px] bg-kavach px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mono-label break-words">{item.category}</div>
                          <h3 className="mt-3 text-lg font-semibold text-navy sm:text-xl">{item.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                        </div>
                        <StatusPill status={item.status} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-card p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-light text-gold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="mono-label">Response mode</p>
                <h2 className="mt-2 text-3xl font-serif text-navy">Emergency resources</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.alerts.emergencyResources.map((resource) => (
                <div key={resource.title} className="rounded-[24px] bg-kavach px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-navy">{resource.title}</div>
                      <p className="mt-2 text-sm leading-7 text-muted">{resource.description}</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-sky shadow-card">
                      {resource.title === 'Roadside Assistance' ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : resource.title === 'Nearby Hospitals' ? (
                        <MapPinned className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (resource.title === 'Roadside Assistance') {
                        void handleSupport('phone', 'roadside')
                        return
                      }

                      if (resource.title === 'Guardian Chat') {
                        void handleSupport('chat', 'chat')
                        return
                      }

                      openHospitalLocator()
                    }}
                    disabled={busy === 'roadside' || busy === 'chat' || busy === 'hospital'}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-light bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-sky disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === 'roadside' || busy === 'chat' || busy === 'hospital' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {resource.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6">
            <p className="mono-label">Support contacts</p>
            <h2 className="mt-2 text-3xl font-serif text-navy">Backup network</h2>
            <div className="mt-6 space-y-4">
              {data.alerts.supportContacts.map((contact) => (
                <a
                  key={contact.phone}
                  href={`tel:${contact.phone}`}
                  className="flex flex-col gap-3 rounded-[24px] bg-kavach px-4 py-4 transition hover:border hover:border-sky-light sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-navy text-sm font-semibold text-white">
                      {contact.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-navy">{contact.name}</div>
                      <div className="text-sm text-muted">{contact.relation}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-sky">{contact.phone}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.section>
  )
}

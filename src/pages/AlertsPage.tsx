import { motion } from 'framer-motion'
import { AlertTriangle, PhoneCall } from 'lucide-react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { pageTransition } from '../lib/motion'

export function AlertsPage() {
  const { data } = useAppData()

  if (!data) {
    return null
  }

  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono-label">Alert center</p>
          <h1 className="mt-3 text-[44px] leading-none">Kavach Sentinel</h1>
          <p className="mt-3 text-base text-muted">
            Monitor live trigger alerts, emergency support and backup contacts from one place.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-k-green px-5 text-sm font-semibold text-white transition hover:bg-k-green/90"
        >
          <PhoneCall className="h-4 w-4" />
          Emergency support
        </button>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Live feed</p>
              <h2 className="mt-2 text-3xl">Current notifications</h2>
            </div>
            <StatusPill status="alert" />
          </div>
          <div className="mt-6 space-y-4">
            {data.alerts.feed.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-kavach px-5 py-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mono-label">{item.category}</div>
                    <h3 className="mt-3 text-xl font-semibold text-navy">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </article>
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
                <h2 className="mt-2 text-3xl">Emergency resources</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.alerts.emergencyResources.map((resource) => (
                <div
                  key={resource.title}
                  className="rounded-2xl bg-kavach px-4 py-4"
                >
                  <div className="font-semibold text-navy">{resource.title}</div>
                  <p className="mt-2 text-sm leading-6 text-muted">{resource.description}</p>
                  <button
                    type="button"
                    className="mt-4 text-sm font-semibold text-sky"
                  >
                    {resource.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6">
            <p className="mono-label">Support contacts</p>
            <h2 className="mt-2 text-3xl">Backup network</h2>
            <div className="mt-6 space-y-4">
              {data.alerts.supportContacts.map((contact) => (
                <div
                  key={contact.phone}
                  className="flex items-center justify-between rounded-2xl bg-kavach px-4 py-4"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.section>
  )
}

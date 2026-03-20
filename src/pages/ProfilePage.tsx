import { motion } from 'framer-motion'
import { useState } from 'react'
import { StatusPill } from '../components/StatusPill'
import { profileDocuments, profileSettings, worker } from '../data/mockData'
import { pageTransition } from '../lib/motion'
import { formatCurrency } from '../utils/format'

export function ProfilePage() {
  const [settings, setSettings] = useState(profileSettings)

  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4"
    >
      <header className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-[linear-gradient(135deg,#0D2B3E_0%,#5BA3BE_100%)] text-2xl font-semibold text-white shadow-card">
          RK
        </div>
        <div>
          <p className="mono-label">Verified partner</p>
          <h1 className="mt-3 text-[44px] leading-none">{worker.name}</h1>
          <p className="mt-3 text-base text-muted">{worker.platform} Delivery Executive · ID KV-09281</p>
        </div>
        <StatusPill status="verified" />
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel-card p-5">
          <p className="mono-label">Current plan</p>
          <div className="mt-3 font-serif text-4xl text-navy">Suraksha Pro</div>
          <p className="mt-3 text-sm text-muted">Active</p>
        </div>
        <div className="panel-card bg-navy p-5 text-white">
          <p className="mono-label !text-sky-light">Earnings protected</p>
          <div className="mt-3 font-serif text-4xl text-gold">{formatCurrency(42500)}</div>
          <p className="mt-3 text-sm text-sky-light/75">This month</p>
        </div>
        <div className="panel-card p-5">
          <p className="mono-label">UPI destination</p>
          <div className="mt-3 font-serif text-4xl text-navy">{worker.upi}</div>
          <p className="mt-3 text-sm text-muted">AutoPay mandate linked</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Document vault</p>
              <h2 className="mt-2 text-3xl">Verified records</h2>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-sky"
            >
              Manage all
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {profileDocuments.map((document) => (
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
              {settings.map((setting, index) => (
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
                    onClick={() =>
                      setSettings((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index && item.kind !== 'link'
                            ? { ...item, enabled: !item.enabled }
                            : item,
                        ),
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${setting.enabled ? 'bg-sky' : 'bg-sky-light'}`}
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
            <h2 className="text-3xl">Need assistance?</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Our dedicated partner support is available 24/7 for policy, claims, and emergency coordination.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid"
            >
              Chat with Kavach AI
            </button>
          </div>
        </div>
      </section>
    </motion.section>
  )
}

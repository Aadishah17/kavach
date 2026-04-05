import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onboardingChecklist, pricingTiers } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { ApiError } from '../utils/api'

const platformOptions = ['Swiggy', 'Zomato', 'Blinkit', 'Amazon Flex', 'Other']

const zoneSuggestions: Record<string, string[]> = {
  Bengaluru: ['Koramangala Central', 'HSR Layout Hub', 'Indiranagar East'],
  Delhi: ['Saket South', 'Karol Bagh Core', 'Dwarka West'],
  Mumbai: ['Andheri West', 'Powai Lakeside', 'Bandra East'],
}

type FormState = {
  name: string
  email: string
  phone: string
  platforms: string[]
  city: string
  zone: string
  plan: string
  upi: string
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    platforms: [],
    city: 'Bengaluru',
    zone: 'Koramangala Central',
    plan: 'Standard',
    upi: '',
  })

  const suggestions = useMemo(
    () => zoneSuggestions[form.city] ?? ['Auto-detecting zone...'],
    [form.city],
  )
  const redirectTarget = searchParams.get('redirect') ?? '/dashboard'

  const steps = useMemo(
    () => [
      {
        title: 'Tell us who you are',
        content: (
          <div className="grid gap-5">
            <Field label="Full name">
              <input
                className="form-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Arjun Kumar"
              />
            </Field>
            <Field label="Email address (optional)">
              <input
                className="form-input"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="aman@kavach.app"
                inputMode="email"
                autoComplete="email"
              />
            </Field>
            <Field label="Phone number">
              <input
                className="form-input"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>
        ),
      },
      {
        title: 'Select your platforms',
        content: (
          <div>
            <div className="flex flex-wrap gap-3">
              {platformOptions.map((platform) => {
                const selected = form.platforms.includes(platform)

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        platforms: selected
                          ? current.platforms.filter((item) => item !== platform)
                          : [...current.platforms, platform],
                      }))
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selected
                        ? 'border-navy bg-navy text-white'
                        : 'border-sky-light bg-white text-muted hover:border-sky hover:text-navy'
                    }`}
                  >
                    {platform}
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-sm text-muted">Choose all partners you currently deliver for.</p>
          </div>
        ),
      },
      {
        title: 'Where do you usually ride?',
        content: (
          <div className="grid gap-5">
            <Field label="City">
              <input
                className="form-input"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Bengaluru"
              />
            </Field>
            <Field label="Zone">
              <input
                className="form-input"
                value={form.zone}
                onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
                placeholder="Koramangala Central"
              />
            </Field>
            <div className="rounded-2xl border border-sky-light bg-sky-pale px-4 py-4">
              <p className="mono-label">Auto-detected suggestions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, zone: suggestion }))}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-navy shadow-card"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Pick your shield plan',
        content: (
          <div className="grid gap-4 lg:grid-cols-3">
            {pricingTiers.map((tier) => {
              const selected = form.plan === tier.tier

              return (
                <button
                  key={tier.tier}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, plan: tier.tier }))}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected ? 'border-navy bg-sky-pale shadow-card' : 'border-sky-light bg-white hover:border-sky'
                  }`}
                >
                  <div className="mono-label">{tier.tier}</div>
                  <div className="mt-3 font-serif text-3xl text-navy">₹{tier.price}</div>
                  <p className="mt-2 text-sm leading-6 text-muted">{tier.coverage}</p>
                </button>
              )
            })}
          </div>
        ),
      },
      {
        title: 'Activate payouts',
        content: (
          <div className="grid gap-5">
            <Field label="UPI ID">
              <input
                className="form-input"
                value={form.upi}
                onChange={(event) => setForm((current) => ({ ...current, upi: event.target.value }))}
                placeholder="rahul@phonepe"
              />
            </Field>
            <div className="rounded-2xl border border-sky-light bg-white px-5 py-5 shadow-card">
              <p className="mono-label">Setup AutoPay</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-pale text-sky">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-navy">Weekly autopay mandate ready</p>
                  <p className="text-sm text-muted">First week is free. Premium starts from the next Monday cycle.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [form.city, form.name, form.phone, form.plan, form.platforms, form.upi, form.zone, suggestions],
  )

  const validateCurrentStep = () => {
    if (step === 0 && (!form.name.trim() || !form.phone.trim())) {
      return 'Add your name and phone number to continue.'
    }

    if (step === 1 && form.platforms.length === 0) {
      return 'Select at least one active delivery platform.'
    }

    if (step === 2 && (!form.city.trim() || !form.zone.trim())) {
      return 'Add your city and preferred delivery zone.'
    }

    if (step === 4 && !form.upi.trim()) {
      return 'Add a UPI ID so Kavach knows where to send payouts.'
    }

    return ''
  }

  const handleNext = async () => {
    const nextError = validateCurrentStep()

    if (nextError) {
      setError(nextError)
      return
    }

    setError('')

    if (step === steps.length - 1) {
      setIsSubmitting(true)

      try {
        await completeOnboarding({
          name: form.name,
          email: form.email.trim() || undefined,
          phone: form.phone,
          platforms: form.platforms,
          city: form.city,
          zone: form.zone,
          plan: form.plan as 'Basic' | 'Standard' | 'Pro',
          upi: form.upi,
        })
        navigate(redirectTarget === '/analytics' ? '/dashboard' : redirectTarget)
      } catch (submissionError) {
        setError(
          submissionError instanceof ApiError
            ? submissionError.message
            : 'We could not activate your Kavach account. Please try again.',
        )
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setStep((current) => current + 1)
  }

  return (
    <motion.main
      {...pageTransition}
      className="min-h-screen bg-kavach"
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-navy px-12 py-12 text-white lg:flex lg:flex-col">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="font-serif text-[42px] text-gold">Kavach</span>
            </div>
            <h1 className="mt-12 max-w-md text-[64px] leading-[0.95] text-white">
              Income protection in 4 simple steps.
            </h1>
            <p className="mt-6 max-w-md text-2xl italic text-gold">
              Tailored security for the backbone of India&apos;s gig economy.
            </p>
          </div>

          <div className="relative mt-14 space-y-6">
            {onboardingChecklist.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4"
              >
                <div className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-bold ${index === 0 ? 'border-gold text-gold' : 'border-white/10 text-white/35'}`}>
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-sky-light/65">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-auto rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="mono-label !text-sky-light">Worker story</p>
            <p className="mt-4 text-lg leading-8 text-white/85">
              “Rain used to wipe out my peak slots. Kavach means the bad-weather day is no longer a zero-income day.”
            </p>
            <p className="mt-5 text-sm text-gold">Rahul Kumar · Swiggy Fleet Partner</p>
          </div>
        </aside>

        <section className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="absolute inset-y-0 right-0 hidden w-48 rounded-l-full bg-sky-pale/80 lg:block" />

          <div className="relative w-full max-w-2xl rounded-[36px] bg-white p-6 shadow-lg sm:p-10">
            <div className="mb-6 rounded-[24px] bg-kavach px-4 py-4 lg:hidden">
              <p className="mono-label">Mobile onboarding</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Add your contact, pick a plan, and activate payouts without switching screens.
              </p>
            </div>

            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-8 rounded-full ${index < step ? 'bg-navy' : index === step ? 'bg-gold' : 'bg-sky-light'}`}
                  />
                ))}
              </div>
              <div className="mono-label">Step {step + 1} of {steps.length}</div>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl">{steps[step].title}</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                {step === 0 && 'Start with your basic details to create your Kavach account.'}
                {step === 1 && 'Select every platform Kavach should watch for disruption-linked income risk.'}
                {step === 2 && 'We use your city and zone to personalize trigger thresholds and alerts.'}
                {step === 3 && 'Choose a plan sized to your real weekly earnings.'}
                {step === 4 && 'Set the payout rail and activate autopay once.'}
              </p>
            </div>

            {steps[step].content}

            {error ? <p className="mt-5 text-sm font-medium text-k-red">{error}</p> : null}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => (step === 0 ? navigate('/') : setStep((current) => current - 1))}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-navy"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 0 ? 'Back to home' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:bg-navy-mid/70"
              >
                {step === steps.length - 1 ? (isSubmitting ? 'Activating…' : 'Setup AutoPay & Activate') : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sky-light pt-6 text-[11px] font-mono uppercase tracking-[0.2em] text-muted">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-k-green" />
                End-to-end encrypted
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky" />
                IRDAI certified flow
              </span>
            </div>
          </div>
        </section>
      </div>
    </motion.main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mono-label mb-3 block text-navy">{label}</span>
      {children}
    </label>
  )
}

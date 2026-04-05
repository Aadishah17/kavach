import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { ApiError } from '../utils/api'

const quickPhones = ['9876543210', '+91 98765 43210']

function safeRedirect(value: string | null) {
  if (!value) {
    return '/dashboard'
  }

  if (!value.startsWith('/') || value.startsWith('/login') || value.startsWith('/signup')) {
    return '/dashboard'
  }

  return value
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, loginAsDemo, loginWithPhone } = useAuth()
  const [phone, setPhone] = useState('9876543210')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTarget = useMemo(
    () => safeRedirect(searchParams.get('redirect')),
    [searchParams],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    navigate(redirectTarget, { replace: true })
  }, [isAuthenticated, navigate, redirectTarget])

  if (isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-kavach px-6 text-center">
        <div>
          <p className="font-serif text-4xl text-navy">Kavach</p>
          <p className="mt-3 text-sm font-medium text-muted">Restoring your protection session…</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await loginWithPhone(phone.trim())
      navigate(redirectTarget, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'We could not sign you in right now. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemo = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await loginAsDemo()
      navigate(redirectTarget, { replace: true })
    } catch (demoError) {
      setError(
        demoError instanceof ApiError
          ? demoError.message
          : 'Unable to open the demo account right now.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.main
      {...pageTransition}
      className="min-h-[calc(100vh-4rem)] bg-kavach px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="container-shell grid min-h-[calc(100vh-6rem)] items-center gap-8 py-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-navy px-8 py-10 text-white shadow-lg sm:px-10 sm:py-12">
          <div className="absolute inset-0 hero-grid opacity-60" />
          <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-sky/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-sky-light">
              Returning workers
            </span>
            <h1 className="mt-6 max-w-xl text-balance text-[clamp(2.7rem,6vw,4.8rem)] leading-[0.95] text-white">
              Sign in with the phone number linked to your shield.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-sky-light/80">
              Use your registered phone number to resume protection, payouts, and support.
              Demo and admin access remain available for quick walkthroughs.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard label="Live payout" value="2 min" hint="Instant UPI settlement" />
              <MetricCard label="Support" value="24/7" hint="Queue a callback or chat" />
              <MetricCard label="Demo" value="Admin" hint="Shortcut still available" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                New worker? Start signup
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/alerts"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-navy transition hover:bg-gold/90"
              >
                Emergency support
              </Link>
            </div>
          </div>
        </section>

        <section className="panel-card relative overflow-hidden p-6 shadow-lg sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#5BA3BE_0%,#C9A96E_50%,#1E7E5E_100%)]" />
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-sky-pale text-sky">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="mono-label">Sign in</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">Welcome back</h2>
            </div>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <label className="block">
              <span className="mono-label">Phone number</span>
              <input
                className="form-input mt-2"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {quickPhones.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPhone(item)}
                  className="rounded-full border border-sky-light bg-sky-pale px-3 py-1.5 text-sm font-medium text-navy transition hover:border-sky"
                >
                  {item}
                </button>
              ))}
            </div>

            {error ? (
              <div className="rounded-2xl border border-k-red/20 bg-rose-50 px-4 py-3 text-sm text-k-red">
                {error}
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-light bg-sky-pale/60 px-4 py-3 text-sm text-muted">
                If your phone number is not found, check that you used the same number during signup.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Continue to my dashboard'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDemo()}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-light bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-sky disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Demo admin shortcut
            </button>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-light bg-sky-pale px-4 py-3 text-sm font-semibold text-navy transition hover:border-sky"
            >
              New worker signup
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] bg-navy px-5 py-5 text-white">
            <div className="flex items-center gap-2 text-sm text-sky-light/80">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Protected entry
            </div>
            <p className="mt-3 text-sm leading-7 text-sky-light/75">
              Once signed in, Kavach restores your coverage dashboard, payout receipt access, autopay controls,
              and emergency support without re-entering profile data.
            </p>
          </div>
        </section>
      </div>
    </motion.main>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-sky-light/75">{label}</p>
      <div className="mt-3 font-serif text-3xl text-white">{value}</div>
      <p className="mt-2 text-sm text-sky-light/70">{hint}</p>
    </div>
  )
}

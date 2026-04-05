import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, MessageSquare, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { faq, trustProof } from '../data/mockData'
import { pageTransition } from '../lib/motion'

const supportChannels = [
  {
    title: 'WhatsApp help',
    description: 'Fastest route for enrollment, coverage questions, and claim guidance.',
    href: 'https://wa.me/919876543210?text=Hi%20Kavach%20team%2C%20I%20need%20help%20with%20coverage.',
    cta: 'Open WhatsApp',
  },
  {
    title: 'Phone support',
    description: 'Call when you need live guidance about payouts, coverage, or policy changes.',
    href: 'tel:+919876543210',
    cta: 'Call support',
  },
  {
    title: 'Email help',
    description: 'Use email for documents, receipts, or longer policy questions.',
    href: 'mailto:support@kavach.example',
    cta: 'Send email',
  },
]

const educationCards = [
  {
    title: 'Coverage trigger',
    description: 'A verified city signal crosses your zone threshold and unlocks the payout path.',
  },
  {
    title: 'Automatic settlement',
    description: 'There is no manual claim form. The backend checks the event and settles eligible payouts.',
  },
  {
    title: 'Support when needed',
    description: 'Use this page for education, signup help, and general assistance before or after activation.',
  },
]

export function HelpPage() {
  return (
    <motion.main
      {...pageTransition}
      className="overflow-x-hidden bg-kavach"
    >
      <section className="bg-navy pt-28 text-white">
        <div className="container-shell grid gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-light">
              <ShieldQuestion className="mr-2 h-3.5 w-3.5" />
              Public help center
            </span>
            <h1 className="mt-6 text-[clamp(2.7rem,8vw,5rem)] leading-[0.94] text-white">
              Help that is public, practical, and mobile friendly.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-sky-light/80 sm:text-lg sm:leading-8">
              Use this page to learn how Kavach works, check payout behavior, and reach the team before you sign in.
              Logged-in workers can still open alerts and live support inside the app.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-semibold text-navy transition hover:bg-gold/90 sm:w-auto"
              >
                Start signup
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="panel-card overflow-hidden bg-white/95 p-6 text-navy shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-sky-pale text-sky">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="mono-label">What this page covers</p>
                <h2 className="mt-2 text-2xl font-serif text-navy">Education, proof, and support</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {educationCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl bg-kavach p-4"
                >
                  <h3 className="text-base font-semibold text-navy">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Trust proof</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Recent payouts and working proof.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              These examples are meant to explain the product, not to promise a fixed outcome. Real settlements depend
              on the live trigger, fraud checks, and payout rail.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustProof.map((item) => (
              <article
                key={item.title}
                className="panel-card flex h-full flex-col justify-between p-5"
              >
                <div>
                  <p className="mono-label">Proof point</p>
                  <h3 className="mt-3 text-xl font-semibold text-navy">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
                </div>
                <div className="mt-6 inline-flex w-fit rounded-full bg-sky-pale px-4 py-2 font-serif text-lg text-navy">
                  {item.metric}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-kavach py-16">
        <div className="container-shell">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="panel-card bg-navy p-6 text-white">
              <p className="mono-label !text-sky-light">Need help now?</p>
              <h2 className="mt-3 text-3xl font-serif text-white">Choose the quickest support path.</h2>
              <p className="mt-3 text-sm leading-7 text-sky-light/80">
                If you are blocked on signup, coverage, or receipts, pick the channel that matches how urgent the issue is.
              </p>
              <div className="mt-6 space-y-3">
                {supportChannels.map((channel) => (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target={channel.href.startsWith('http') ? '_blank' : undefined}
                    rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10"
                  >
                    <div>
                      <div className="font-semibold text-white">{channel.title}</div>
                      <div className="mt-1 text-sm text-sky-light/80">{channel.description}</div>
                    </div>
                    <span className="text-sm font-semibold text-gold">{channel.cta}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="panel-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-light text-gold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="mono-label">FAQ</p>
                  <h2 className="mt-2 text-3xl">Questions people ask before joining</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                {faq.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-sky-light bg-kavach px-4 py-4"
                  >
                    <summary className="cursor-pointer list-none text-base font-semibold text-navy">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-shell flex flex-col gap-4 rounded-[32px] border border-sky-light bg-navy px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mono-label !text-sky-light">Direct links</p>
            <h2 className="mt-2 text-2xl font-serif text-white">Need to get moving again?</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://wa.me/919876543210"
              className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-navy transition hover:bg-gold/90"
            >
              WhatsApp support
            </a>
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Join Kavach
            </Link>
          </div>
        </div>
      </section>
    </motion.main>
  )
}

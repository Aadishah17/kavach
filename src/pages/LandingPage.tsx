import { motion } from 'framer-motion'
import { ArrowRight, Play, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MockDashboardCard } from '../components/MockDashboardCard'
import { PriceCard } from '../components/PriceCard'
import { TriggerCard } from '../components/TriggerCard'
import { faq, howItWorksSteps, platformPartners, pricingTiers, problemCards, trustProof, triggerCards } from '../data/mockData'
import { pageTransition } from '../lib/motion'

const heroStats = ['₹49/week', '<4 min payout', '7 triggers']
const payoutExamples = [
  { route: 'Koramangala', trigger: 'Heavy rain', payout: '₹571', time: '4 min' },
  { route: 'HSR Layout', trigger: 'Flood watch', payout: '₹428', time: '6 min' },
  { route: 'Indiranagar', trigger: 'Bandh shutdown', payout: '₹214', time: '8 min' },
]

export function LandingPage() {
  return (
    <motion.main
      {...pageTransition}
      className="overflow-x-hidden"
    >
      <section
        id="top"
        className="relative overflow-hidden bg-navy pt-24 text-white sm:pt-28"
      >
        <div className="absolute inset-0 hero-grid opacity-80" />
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div className="absolute right-[-80px] top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />

        <div className="container-shell relative grid gap-12 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-light">
              🛡️ DEVTrails 2026 · Parametric Insurance
            </span>
            <h1 className="mt-8 max-w-xl text-balance text-[54px] leading-[0.94] text-white sm:text-[64px]">
              Your income,
              <span className="mx-2 italic text-gold">protected</span>
              from the storm.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-sky-light/85">
              Kavach is AI-powered income insurance for India&apos;s delivery workforce. Weather, pollution,
              bandhs and civic disruptions trigger verified payouts automatically, with no paperwork-heavy claims flow.
            </p>
            <p className="mt-4 text-base italic text-sky-light/65">
              "Jab kaam rukta hai, tab bhi kamai ka sahara milta hai."
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                to="/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-semibold text-navy transition hover:bg-gold/90 sm:w-auto"
              >
                Enroll in 4 Minutes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Returning worker login
              </Link>
              <a
                href="/downloads/kavach-android.apk"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky px-6 text-sm font-semibold text-navy transition hover:bg-sky-light sm:w-auto"
                download
              >
                <Smartphone className="h-4 w-4" />
                Download App (Android)
              </a>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="font-serif text-2xl text-gold">{stat}</div>
                  <div className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-white/55">
                    Kavach shield
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative pb-6 lg:pb-0">
            <MockDashboardCard />
          </div>
        </div>
      </section>

      <section className="border-b border-sky-light bg-white py-5">
        <div className="container-shell flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="mono-label shrink-0">Platform Partners</div>
          <div className="fine-scrollbar overflow-x-auto">
            <div className="flex min-w-max gap-3">
              {platformPartners.concat(platformPartners).map((partner, index) => (
                <div
                  key={`${partner}-${index}`}
                  className="rounded-full border border-sky-light bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-sky hover:text-navy"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="bg-white py-20"
      >
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="eyebrow">Why Kavach exists</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">When work stops, income shouldn&apos;t disappear.</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Gig workers carry weather, pollution and civic risk on their own. Kavach turns those city-level disruptions
              into verified parametric cover designed around real earning days.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {problemCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                whileHover={{ y: -4 }}
                className="panel-card p-6 transition hover:border-sky hover:shadow-lg"
              >
                <div className="text-2xl">{card.emoji}</div>
                <h3 className="mt-5 text-xl font-semibold text-navy">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{card.description}</p>
                <div className="mt-8 font-serif text-4xl text-navy">{card.stat}</div>
                <div className="mt-2 text-sm text-muted">{card.statLabel}</div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-kavach py-20">
        <div className="container-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Proof from the field</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Recent payout examples and trust signals.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              These examples show how the public product is meant to feel on mobile: simple, concrete, and easy to scan.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {trustProof.map((item) => (
              <article
                key={item.title}
                className="panel-card flex h-full flex-col justify-between p-6"
              >
                <div>
                  <p className="mono-label">Trust signal</p>
                  <h3 className="mt-3 text-xl font-semibold text-navy">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
                </div>
                <div className="mt-6 inline-flex w-fit rounded-full bg-sky-pale px-4 py-2 font-serif text-lg text-navy">
                  {item.metric}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {payoutExamples.map((example) => (
              <article
                key={`${example.route}-${example.trigger}`}
                className="rounded-[24px] border border-white/10 bg-white/6 p-5 text-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-light/70">
                      Live example
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{example.route}</h3>
                  </div>
                  <div className="rounded-full bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-navy">
                    {example.time}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-sky-light/80">{example.trigger}</p>
                <div className="mt-6 text-3xl font-serif text-gold">{example.payout}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-navy py-20 text-white"
      >
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold">The 4-minute shield</p>
            <h2 className="mt-4 text-4xl text-white sm:text-5xl">AI watches the city. Kavach protects the shift.</h2>
            <p className="mt-4 text-lg leading-8 text-sky-light/75">
              Parametric cover only works when signals are trusted. Kavach fuses weather, mobility, movement, and payment
              rails so low-risk payouts can clear in minutes.
            </p>
          </div>
          <div className="relative mt-14 grid gap-8 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-5 hidden h-px bg-white/10 lg:block" />
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gold font-mono text-sm font-bold text-navy">
                  0{index + 1}
                </div>
                <h3 className="mt-6 text-xl text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-sky-light/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-kavach py-20">
        <div className="container-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Coverage triggers</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">What the shield can see.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              Each trigger uses transparent rules, zone-level thresholds, and fraud-aware verification before payout release.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {triggerCards.map((card) => (
              <TriggerCard
                key={card.name}
                {...card}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="bg-white py-20"
      >
        <div className="container-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Simple, fair pricing.</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Choose a weekly shield that fits your earning rhythm. Every plan includes AI-triggered cover, autopay and
              UPI settlement.
            </p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <PriceCard
                key={tier.tier}
                {...tier}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">FAQ</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Answers before you sign up.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted">
              Public help stays lightweight, and it points away from protected support surfaces unless you are signed in.
            </p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {faq.map((item) => (
              <details
                key={item.question}
                className="panel-card group rounded-[24px] p-5"
              >
                <summary className="cursor-pointer list-none text-lg font-semibold text-navy">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-kavach py-20">
        <div className="container-shell">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] px-8 py-12 text-center text-white shadow-lg sm:px-12">
            <h2 className="text-4xl text-white sm:text-5xl">Stop gambling with the weather.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-sky-light/75">
              First week free for new members. Activate Kavach once and let the city-risk layer do the hard work.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-semibold text-navy transition hover:bg-gold/90"
              >
                Start Free Week
              </Link>
              <Link
                to="/help"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Visit help center
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white py-12">
        <div className="container-shell">
          <div className="grid gap-10 border-b border-sky-light pb-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <span className="font-serif text-2xl">Kavach</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
                Calm, trustworthy income protection for delivery workers navigating India&apos;s urban risk.
              </p>
            </div>
            <FooterColumn
              title="Product"
              links={['Coverage triggers', 'Pricing', 'Claims automation', 'Trust score']}
            />
            <FooterColumn
              title="Company"
              links={['About Kavach', 'Partner networks', 'Hackathon build', 'Contact']}
            />
            <FooterColumn
              title="Support"
              links={['Emergency support', 'Login', 'Policy docs', 'Help center']}
            />
          </div>
          <div className="flex flex-col gap-4 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Kavach. Built for the backbone of India&apos;s gig economy.</p>
            <div className="flex flex-wrap gap-2">
              {['AI Guardian', 'UPI Ready', 'Parametric Cover'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sky-pale px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sky"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </motion.main>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: string[]
}) {
  return (
    <div>
      <div className="mono-label">{title}</div>
      <div className="mt-4 space-y-3">
        {links.map((link) => (
          <Link
            key={link}
            to={footerHref(link)}
            className="block text-sm text-muted transition hover:text-navy"
          >
            {link}
          </Link>
        ))}
      </div>
    </div>
  )
}

function footerHref(label: string) {
  const map: Record<string, string> = {
    'Coverage triggers': '/policy',
    Pricing: '/#pricing',
    'Claims automation': '/claims',
    'Trust score': '/dashboard',
    'About Kavach': '/#top',
    'Partner networks': '/#features',
    'Hackathon build': '/#top',
    Contact: '/help',
    'Emergency support': '/help',
    Login: '/login',
    'Policy docs': '/policy',
    'Help center': '/help',
  }

  return map[label] ?? '/help'
}

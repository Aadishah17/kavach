import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Kicker, Pill, PrimaryButton, SecondaryButton } from '../components/Ui'
import { getLandingData } from '../lib/api'
import { colors, radius, spacing, typography } from '../theme/tokens'
import type { LandingPayload } from '../types'

type LandingScreenProps = {
  onStart: () => void
  onDemo: () => Promise<void>
  isBusy?: boolean
  authError?: string | null
}

const fallbackLanding: LandingPayload = {
  platformPartners: ['Zomato', 'Swiggy', 'Blinkit', 'Amazon Flex', 'Zepto', 'Porter'],
  landingStats: [
    { label: 'Weekly premium', value: '₹49' },
    { label: 'Payout speed', value: '< 4 min' },
    { label: 'Triggers', value: '7 live' },
  ],
  problemCards: [
    {
      title: 'Weather shocks',
      description: 'Rain, flooding, and fog interrupt peak-hour earning windows.',
      stat: '18-30 days',
    },
    {
      title: 'City disruptions',
      description: 'Bandhs, curfews, and closures cut routes without warning.',
      stat: '₹17.5K',
    },
    {
      title: 'AI-backed decisions',
      description: 'Parametric rules trigger fast without manual filing friction.',
      stat: '92 trust',
    },
  ],
  howItWorksSteps: [
    { title: 'Enroll once', description: 'Quick rider details and UPI setup in minutes.' },
    { title: 'Monitor live', description: 'Kavach watches weather, civic, and movement signals.' },
    { title: 'Trigger payout', description: 'When your zone crosses a threshold, coverage turns on.' },
    { title: 'Receive instantly', description: 'Approved payouts move to UPI in minutes, not weeks.' },
  ],
  triggerCards: [
    { emoji: '🌧️', name: 'Heavy Rain', condition: 'IMD red alert', coverage: 100 },
    { emoji: '🌫️', name: 'Pollution', condition: 'AQI emergency band', coverage: 75 },
    { emoji: '✊', name: 'Bandh', condition: 'Declared closure zone', coverage: 100 },
    { emoji: '🌡️', name: 'Heat', condition: 'Extreme heat watch', coverage: 50 },
  ],
  pricingTiers: [
    {
      tier: 'Basic',
      price: '₹29/week',
      coverage: 'Entry weather cover',
      features: ['Rain triggers', 'Weekly summaries'],
    },
    {
      tier: 'Standard',
      price: '₹49/week',
      coverage: 'Best for active riders',
      features: ['All live triggers', 'Fast payout routing', 'Priority support'],
      featured: true,
    },
    {
      tier: 'Pro',
      price: '₹79/week',
      coverage: 'Maximum income cushion',
      features: ['Higher caps', 'More event classes', 'Claims concierge'],
    },
  ],
}

export function LandingScreen({
  onStart,
  onDemo,
  isBusy = false,
  authError,
}: LandingScreenProps) {
  const [landingData, setLandingData] = useState<LandingPayload>(fallbackLanding)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadLanding = async () => {
      setIsLoading(true)

      try {
        const payload = await getLandingData()
        setLandingData(payload)
      } catch {
        setLandingData(fallbackLanding)
      } finally {
        setIsLoading(false)
      }
    }

    void loadLanding()
  }, [])

  const featuredTier = useMemo(
    () => landingData.pricingTiers.find((tier) => tier.featured) ?? landingData.pricingTiers[1],
    [landingData.pricingTiers],
  )

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.navy, colors.navyDeep]} style={styles.hero}>
        <BrandHeader subtitle="Mobile" />
        <View style={styles.heroCopy}>
          <Pill tone="gold">DevTrails 2026</Pill>
          <Text style={styles.heroTitle}>
            Kavach keeps gig income protected when the city turns unstable.
          </Text>
          <Text style={styles.heroBody}>
            AI-triggered parametric insurance for riders across Swiggy, Zomato, Blinkit,
            Amazon Flex, and more.
          </Text>
          <Text style={styles.heroTagline}>Aapki mehnat. Aapka suraksha layer.</Text>
        </View>

        <View style={styles.heroActions}>
          <PrimaryButton label="Enroll in 4 minutes" onPress={onStart} />
          <SecondaryButton label="Preview demo account" onPress={() => void onDemo()} />
        </View>

        <View style={styles.statsRow}>
          {landingData.landingStats.map((item) => (
            <View key={item.label} style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.frostCard}
        >
          <View style={styles.frostTopRow}>
            <Pill tone="navy">Coverage active</Pill>
            <Text style={styles.frostZone}>Koramangala</Text>
          </View>
          <Text style={styles.frostTitle}>Heavy rain trigger verified</Text>
          <Text style={styles.frostAmount}>₹571 payout cleared</Text>
          <View style={styles.progressRow}>
            {['Verified', 'Processing', 'Paid'].map((step) => (
              <View key={step} style={styles.progressItem}>
                <View style={styles.progressDot} />
                <Text style={styles.progressLabel}>{step}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </LinearGradient>

      {authError ? <Text style={styles.inlineError}>{authError}</Text> : null}
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.navy} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Kicker>Platform Partners</Kicker>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {landingData.platformPartners.map((partner) => (
            <View key={partner} style={styles.partnerChip}>
              <Text style={styles.partnerText}>{partner}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Kicker>The Problem</Kicker>
        <Text style={styles.sectionTitle}>Protection should start before a rider files a claim.</Text>
        {landingData.problemCards.map((card) => (
          <CardSurface key={card.title} style={styles.problemCard}>
            <Text style={styles.problemTitle}>{card.title}</Text>
            <Text style={styles.problemBody}>{card.description}</Text>
            <Text style={styles.problemStat}>{card.stat}</Text>
          </CardSurface>
        ))}
      </View>

      <View style={styles.section}>
        <Kicker>How It Works</Kicker>
        {landingData.howItWorksSteps.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>0{index + 1}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Kicker>Coverage Triggers</Kicker>
        <View style={styles.triggerGrid}>
          {landingData.triggerCards.map((card) => (
            <View key={card.name} style={styles.triggerCard}>
              <Text style={styles.triggerEmoji}>{card.emoji}</Text>
              <Text style={styles.triggerTitle}>{card.name}</Text>
              <Text style={styles.triggerBody}>{card.condition}</Text>
              <Text style={styles.triggerCoverage}>{card.coverage}% cover</Text>
            </View>
          ))}
        </View>
      </View>

      {featuredTier ? (
        <View style={styles.section}>
          <Kicker>Pricing</Kicker>
          <LinearGradient colors={[colors.navy, colors.navyDeep]} style={styles.pricingCard}>
            <Text style={styles.pricingBadge}>Most Popular</Text>
            <Text style={styles.pricingTier}>{featuredTier.tier}</Text>
            <Text style={styles.pricingValue}>{featuredTier.price}</Text>
            <Text style={styles.pricingCoverage}>{featuredTier.coverage}</Text>
            {featuredTier.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Feather name="check" size={16} color={colors.gold} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            <Pressable onPress={onStart} style={styles.ctaRow}>
              <Text style={styles.ctaRowText}>Start mobile onboarding</Text>
              <Feather name="arrow-right" size={16} color={colors.white} />
            </Pressable>
          </LinearGradient>
        </View>
      ) : null}

      <View style={styles.footerSpace}>
        {isBusy ? <ActivityIndicator color={colors.navy} /> : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 36,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.md,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 42,
    lineHeight: 46,
    color: colors.white,
  },
  heroBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.74)',
  },
  heroTagline: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.gold,
  },
  heroActions: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  statValue: {
    fontFamily: typography.headline,
    fontSize: 24,
    color: colors.white,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.68)',
  },
  frostCard: {
    borderRadius: 28,
    padding: 20,
    gap: 16,
  },
  frostTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frostZone: {
    fontFamily: typography.labelMedium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  frostTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 19,
    color: colors.white,
  },
  frostAmount: {
    fontFamily: typography.display,
    fontSize: 34,
    color: colors.gold,
  },
  progressRow: {
    gap: 10,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  progressLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.white,
  },
  inlineError: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    fontFamily: typography.bodyMedium,
    color: colors.red,
  },
  loadingRow: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
    gap: 14,
  },
  chipRow: {
    gap: 10,
    paddingRight: spacing.lg,
  },
  partnerChip: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.skyLine,
  },
  partnerText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  sectionTitle: {
    fontFamily: typography.headline,
    fontSize: 30,
    lineHeight: 34,
    color: colors.navy,
  },
  problemCard: {
    gap: 8,
  },
  problemTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.navy,
  },
  problemBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  problemStat: {
    fontFamily: typography.display,
    fontSize: 30,
    color: colors.sky,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepBadge: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  stepBadgeText: {
    fontFamily: typography.label,
    fontSize: 12,
    color: colors.navy,
  },
  stepCopy: {
    flex: 1,
    paddingTop: 5,
    gap: 4,
  },
  stepTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 17,
    color: colors.navy,
  },
  stepBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  triggerCard: {
    width: '47%',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.skyLine,
  },
  triggerEmoji: {
    fontSize: 24,
  },
  triggerTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  triggerBody: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  triggerCoverage: {
    marginTop: 4,
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.teal,
  },
  pricingCard: {
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  pricingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: typography.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.navy,
  },
  pricingTier: {
    marginTop: 6,
    fontFamily: typography.bodyBold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
  },
  pricingValue: {
    fontFamily: typography.display,
    fontSize: 38,
    color: colors.white,
  },
  pricingCoverage: {
    marginBottom: 6,
    fontFamily: typography.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.white,
  },
  ctaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: 16,
  },
  ctaRowText: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
  footerSpace: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
})

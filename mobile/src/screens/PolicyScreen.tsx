import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Pill, SectionHeading } from '../components/Ui'
import { formatCurrency } from '../lib/format'
import { colors, radius, spacing, typography } from '../theme/tokens'
import type { PolicyData, WorkerProfile } from '../types'

type PolicyScreenProps = {
  user: WorkerProfile
  policy: PolicyData
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

export function PolicyScreen({
  user,
  policy,
  isRefreshing = false,
  onRefresh,
  onMenuPress,
}: PolicyScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.navy}
            colors={[colors.navy]}
          />
        ) : undefined
      }
    >
      <BrandHeader subtitle="Policy details" onMenuPress={onMenuPress} />

      <LinearGradient colors={[colors.navy, colors.navyDeep]} style={styles.heroCard}>
        <Pill tone="gold">Active policy</Pill>
        <Text style={styles.heroTitle}>{user.plan}</Text>
        <Text style={styles.heroBody}>
          A parametric protection plan designed around real gig-economy risk.
        </Text>
      </LinearGradient>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Weekly premium" value={formatCurrency(user.weeklyPremium)} hint="Every Monday" />
        <SummaryCard label="Insured income" value={`₹${user.iwi.toLocaleString('en-IN')}`} hint="Weekly cap" />
        <SummaryCard label="Trust score" value={`${user.trustScore}`} hint="Auto-approved" />
        <SummaryCard label="Next deduction" value={user.nextDeduction} hint="UPI autopay" />
      </View>

      <View style={styles.section}>
        <SectionHeading title="Coverage" action="Live policy" />
        <View style={styles.coverageStack}>
          {policy.coverage.map((item) => (
            <CardSurface key={item.title} style={styles.coverageCard}>
              <Pill tone="gold">{item.badge}</Pill>
              <Text style={styles.coverageTitle}>{item.title}</Text>
              <Text style={styles.coverageBody}>{item.description}</Text>
            </CardSurface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Triggers" action="Coverage readiness" />
        <CardSurface style={styles.triggerListCard}>
          {policy.triggers.map((card, index) => (
            <View
              key={card.name}
              style={[
                styles.triggerRow,
                index < policy.triggers.length - 1 && styles.triggerBorder,
              ]}
            >
              <View style={styles.triggerLeft}>
                <Text style={styles.triggerEmoji}>{card.emoji}</Text>
                <View style={styles.triggerCopy}>
                  <Text style={styles.triggerName}>{card.name}</Text>
                  <Text style={styles.triggerCondition}>{card.condition}</Text>
                </View>
              </View>
              <View style={styles.triggerBadge}>
                <Text style={styles.triggerCoverage}>{card.coverage}%</Text>
              </View>
            </View>
          ))}
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Premiums" action="Mandate schedule" />
        <CardSurface style={styles.premiumCard}>
          {policy.premiumHistory.map((item, index) => (
            <View
              key={`${item.cycle}-${index}`}
              style={[
                styles.premiumRow,
                index < policy.premiumHistory.length - 1 && styles.triggerBorder,
              ]}
            >
              <View style={styles.premiumLeft}>
                <Text style={styles.premiumCycle}>{item.cycle}</Text>
                <Text style={styles.premiumDate}>{item.paidOn}</Text>
                {item.note ? <Text style={styles.premiumNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.premiumRight}>
                <Text style={styles.premiumAmount}>{formatCurrency(item.amount)}</Text>
                <Feather name="check-circle" size={14} color={colors.green} />
              </View>
            </View>
          ))}
        </CardSurface>
      </View>
    </ScrollView>
  )
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <CardSurface style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHint}>{hint}</Text>
    </CardSurface>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 34,
    gap: 24,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    gap: 12,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 38,
    color: colors.white,
  },
  heroBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.74)',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    gap: 6,
  },
  summaryLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  summaryValue: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.navy,
  },
  summaryHint: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    gap: 14,
  },
  coverageStack: {
    gap: 12,
  },
  coverageCard: {
    gap: 10,
  },
  coverageTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.navy,
  },
  coverageBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  triggerListCard: {
    paddingVertical: 10,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  triggerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  triggerEmoji: {
    fontSize: 26,
  },
  triggerCopy: {
    flex: 1,
    gap: 3,
  },
  triggerName: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  triggerCondition: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  triggerBadge: {
    borderRadius: 999,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  triggerCoverage: {
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.gold,
  },
  premiumCard: {
    paddingVertical: 10,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 16,
  },
  premiumLeft: {
    flex: 1,
    gap: 4,
  },
  premiumCycle: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  premiumDate: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  premiumNote: {
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  premiumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumAmount: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.gold,
  },
})

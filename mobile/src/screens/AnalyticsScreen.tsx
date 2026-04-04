import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Pill, SectionHeading } from '../components/Ui'
import { formatCompactCurrency } from '../lib/format'
import { colors, spacing, typography } from '../theme/tokens'
import type { AnalyticsData, WorkerProfile } from '../types'

type AnalyticsScreenProps = {
  user: WorkerProfile
  analytics?: AnalyticsData
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

export function AnalyticsScreen({ user, analytics, isRefreshing = false, onRefresh, onMenuPress }: AnalyticsScreenProps) {
  if (!analytics) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader subtitle="Admin only" onMenuPress={onMenuPress} />
        <CardSurface style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Analytics is reserved for admin accounts.</Text>
          <Text style={styles.emptyBody}>
            {user.name} is signed in as a worker profile, so portfolio-wide metrics stay hidden here.
          </Text>
        </CardSurface>
      </ScrollView>
    )
  }

  const maxPremium = Math.max(...analytics.weeklyChartData.map((item) => item.premium), 1)

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
      <BrandHeader subtitle="Admin analytics" onMenuPress={onMenuPress} />

      <View style={styles.kpiGrid}>
        <CardSurface style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active workers</Text>
          <Text style={styles.kpiValue}>{analytics.kpis.activeWorkers.toLocaleString('en-IN')}</Text>
        </CardSurface>
        <CardSurface style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Premium / week</Text>
          <Text style={styles.kpiValue}>{formatCompactCurrency(analytics.kpis.weeklyPremium)}</Text>
        </CardSurface>
        <CardSurface style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Claims paid</Text>
          <Text style={styles.kpiValue}>{formatCompactCurrency(analytics.kpis.claimsPaid)}</Text>
        </CardSurface>
        <CardSurface style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Fraud detection</Text>
          <Text style={styles.kpiValue}>{analytics.kpis.fraudDetectionRate}%</Text>
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Weekly premium" action="8 weeks" />
        <CardSurface style={styles.chartCard}>
          <View style={styles.barRow}>
            {analytics.weeklyChartData.map((item) => (
              <View key={item.week} style={styles.barItem}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(item.premium / maxPremium) * 100}%`,
                        backgroundColor: item.current ? colors.gold : colors.sky,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.week}</Text>
              </View>
            ))}
          </View>
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Claims mix" action="Live" />
        <CardSurface style={styles.mixCard}>
          {analytics.claimsBreakdown.map((item) => (
            <View key={item.name} style={styles.mixRow}>
              <View style={styles.mixLeft}>
                <View style={[styles.mixDot, { backgroundColor: item.fill }]} />
                <Text style={styles.mixName}>{item.name}</Text>
              </View>
                <Pill tone="gold">{`${item.value}%`}</Pill>
              </View>
            ))}
          </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Fraud signals" action="Model feed" />
        <CardSurface style={styles.metricsCard}>
          {analytics.fraudSignals.map((signal) => (
            <MetricProgress
              key={signal.label}
              label={signal.label}
              value={signal.value}
              tone={signal.tone}
              note={signal.note}
            />
          ))}
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Financial health" action="Portfolio" />
        <CardSurface style={styles.metricsCard}>
          {analytics.financialHealth.map((metric) => (
            <MetricProgress
              key={metric.label}
              label={metric.label}
              value={metric.value}
              tone={metric.tone}
              note={metric.note}
            />
          ))}

          <View style={styles.economicsTable}>
            {analytics.unitEconomics.map((row) => (
              <View key={row.metric} style={styles.economicsRow}>
                <Text style={styles.economicsMetric}>{row.metric}</Text>
                <Text style={styles.economicsValue}>{row.unitValue}</Text>
                <Text style={styles.economicsMargin}>{row.margin}</Text>
              </View>
            ))}
          </View>
        </CardSurface>
      </View>
    </ScrollView>
  )
}

function MetricProgress({
  label,
  value,
  tone,
  note,
}: {
  label: string
  value: number
  tone: string
  note?: string
}) {
  const fillColor =
    tone === 'green' ? colors.green : tone === 'gold' ? colors.gold : colors.sky

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: fillColor }]} />
      </View>
      {note ? <Text style={styles.progressNote}>{note}</Text> : null}
    </View>
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
  emptyCard: {
    gap: 10,
  },
  emptyTitle: {
    fontFamily: typography.headline,
    fontSize: 28,
    color: colors.navy,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  kpiLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  kpiValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.navy,
  },
  section: {
    gap: 14,
  },
  chartCard: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 190,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 16,
  },
  barLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  mixCard: {
    gap: 12,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mixLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mixDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  mixName: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  metricsCard: {
    gap: 14,
  },
  progressBlock: {
    gap: 8,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  progressValue: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressNote: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  economicsTable: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    paddingTop: 12,
    gap: 12,
  },
  economicsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  economicsMetric: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  economicsValue: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  economicsMargin: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.green,
  },
})

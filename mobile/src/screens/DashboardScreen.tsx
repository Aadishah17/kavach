import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Kicker, Pill, SectionHeading } from '../components/Ui'
import { formatCurrency } from '../lib/format'
import { colors, radius, spacing, typography } from '../theme/tokens'
import type { DashboardData, WorkerProfile } from '../types'

type DashboardScreenProps = {
  user: WorkerProfile
  dashboard: DashboardData
  onOpenClaims: () => void
  onOpenAlerts?: () => void
  onOpenPolicy?: () => void
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

export function DashboardScreen({
  user,
  dashboard,
  onOpenClaims,
  onOpenAlerts,
  onOpenPolicy,
  isRefreshing = false,
  onRefresh,
  onMenuPress,
}: DashboardScreenProps) {
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
      <LinearGradient colors={[colors.background, '#EDF6FB']} style={styles.topBand}>
        <BrandHeader subtitle="Coverage active" onMenuPress={onMenuPress} />
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Kicker>Good morning</Kicker>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.subtitle}>{user.zone}</Text>
          </View>
          <Pressable onPress={onOpenPolicy}>
            <Pill tone="navy">{dashboard.coverageStatus}</Pill>
          </Pressable>
        </View>

        <Pressable
          onPress={onOpenClaims}
          style={({ pressed }) => [styles.activeCard, pressed && styles.activeCardPressed]}
        >
          <View style={styles.activeTop}>
            <Pill tone="gold">{dashboard.activeAlert.type}</Pill>
            <Feather name="arrow-right" size={16} color={colors.white} />
          </View>
          <Text style={styles.activeTitle}>{dashboard.activeAlert.emoji} Payout live in {dashboard.activeAlert.zone}</Text>
          <Text style={styles.activeBody}>{dashboard.activeAlert.condition}</Text>
          <Text style={styles.activeAmount}>{formatCurrency(dashboard.activeAlert.payoutAmount)}</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeading title="Today" action={dashboard.dateRange} />
        <View style={styles.metricsGrid}>
          {dashboard.kpis.map((kpi) => (
            <CardSurface
              key={kpi.label}
              style={[
                styles.metricCard,
                kpi.inverse && styles.metricCardInverse,
              ]}
            >
              <Text style={[styles.metricLabel, kpi.inverse && styles.metricLabelInverse]}>
                {kpi.label}
              </Text>
              <Text style={[styles.metricValue, kpi.inverse && styles.metricValueInverse]}>
                {kpi.value}
              </Text>
              <Text style={[styles.metricHint, kpi.inverse && styles.metricHintInverse]}>
                {kpi.hint}
              </Text>
              <View
                style={[
                  styles.metricAccent,
                  kpi.accent === 'green' && { backgroundColor: colors.green },
                  kpi.accent === 'sky' && { backgroundColor: colors.sky },
                  kpi.accent === 'gold' && { backgroundColor: colors.gold },
                  kpi.accent === 'navy' && { backgroundColor: colors.white },
                ]}
              />
            </CardSurface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Zone risk map" action={dashboard.zoneMap.cityLabel} />
        <CardSurface style={styles.mapCard}>
          <View style={styles.mapBackdrop}>
            {dashboard.zoneMap.zones.map((zone) => (
              <View
                key={zone.name}
                style={[
                  styles.zoneBubble,
                  {
                    top: zone.top as `${number}%`,
                    left: zone.left as `${number}%`,
                    backgroundColor:
                      zone.tone === 'red'
                        ? 'rgba(200,91,74,0.28)'
                        : zone.tone === 'gold'
                          ? 'rgba(201,169,110,0.28)'
                          : 'rgba(30,126,94,0.22)',
                  },
                ]}
              >
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneRisk}>{zone.risk}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.activeWatch}>Active watch: {dashboard.zoneMap.activeWatch}</Text>
        </CardSurface>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={onOpenAlerts}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <SectionHeading title="Active alerts" action={`${dashboard.alerts.length} live ›`} />
        </Pressable>
        <View style={styles.alertStack}>
          {dashboard.alerts.map((alert) => (
            <Pressable
              key={alert.title}
              onPress={onOpenAlerts}
              style={({ pressed }) => [pressed && styles.alertCardPressed]}
            >
              <CardSurface style={styles.alertCard}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertEmoji}>{alert.emoji}</Text>
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertBody}>{alert.subtitle}</Text>
                  </View>
                  <Pill tone={alert.tone === 'gold' ? 'gold' : alert.tone === 'green' ? 'navy' : 'soft'}>
                    {alert.status}
                  </Pill>
                </View>
              </CardSurface>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={onOpenClaims}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <SectionHeading title="Recent payouts" action="View all ›" />
        </Pressable>
        <CardSurface style={styles.historyCard}>
          {dashboard.payoutHistory.slice(0, 5).map((item, index) => (
            <Pressable
              key={`${item.date}-${item.type}-${index}`}
              onPress={onOpenClaims}
              style={({ pressed }) => [
                styles.historyRow,
                index < dashboard.payoutHistory.slice(0, 5).length - 1 && styles.historyBorder,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyType}>{item.type}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyDetail}>{item.disruption}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text
                  style={[
                    styles.historyAmount,
                    item.amount < 0 && styles.historyDebit,
                  ]}
                >
                  {item.amount < 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(item.amount))}
                </Text>
                <Text style={styles.historyZone}>{item.zone}</Text>
              </View>
            </Pressable>
          ))}
        </CardSurface>
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
    paddingBottom: 34,
  },
  topBand: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 18,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  greetingCopy: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontFamily: typography.headline,
    fontSize: 34,
    lineHeight: 38,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  activeCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    padding: 20,
    gap: 10,
  },
  activeCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  activeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTitle: {
    fontFamily: typography.headline,
    fontSize: 28,
    lineHeight: 32,
    color: colors.white,
  },
  activeBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
  },
  activeAmount: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.gold,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: 26,
    gap: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  metricCardInverse: {
    backgroundColor: colors.navy,
  },
  metricLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  metricLabelInverse: {
    color: 'rgba(255,255,255,0.65)',
  },
  metricValue: {
    fontFamily: typography.display,
    fontSize: 30,
    color: colors.navy,
  },
  metricValueInverse: {
    color: colors.white,
  },
  metricHint: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  metricHintInverse: {
    color: 'rgba(255,255,255,0.72)',
  },
  metricAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
  },
  mapCard: {
    gap: 14,
  },
  mapBackdrop: {
    height: 220,
    borderRadius: 24,
    backgroundColor: '#E9F3FA',
    overflow: 'hidden',
    position: 'relative',
  },
  zoneBubble: {
    position: 'absolute',
    minWidth: 90,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    transform: [{ translateX: -35 }, { translateY: -20 }],
  },
  zoneName: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  zoneRisk: {
    marginTop: 2,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  activeWatch: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  alertStack: {
    gap: 10,
  },
  alertCard: {
    paddingVertical: 16,
  },
  alertCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  alertTitleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  alertEmoji: {
    fontSize: 22,
  },
  alertCopy: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  alertBody: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  historyCard: {
    paddingVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
  },
  historyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  historyLeft: {
    flex: 1,
    gap: 3,
  },
  historyType: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  historyDate: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  historyDetail: {
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmount: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.green,
  },
  historyDebit: {
    color: colors.red,
  },
  historyZone: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
})

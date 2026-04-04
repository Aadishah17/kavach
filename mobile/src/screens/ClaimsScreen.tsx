import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BrandHeader } from '../components/BrandHeader'
import { TrustScoreRing } from '../components/TrustScoreRing'
import { CardSurface, Pill, SectionHeading } from '../components/Ui'
import { formatCurrency } from '../lib/format'
import { colors, spacing, typography } from '../theme/tokens'
import type { ClaimsData, WorkerProfile } from '../types'

type ClaimsScreenProps = {
  user: WorkerProfile
  claims: ClaimsData
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

export function ClaimsScreen({
  user,
  claims,
  isRefreshing = false,
  onRefresh,
  onMenuPress,
}: ClaimsScreenProps) {
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
      <BrandHeader subtitle="Claims and trust" onMenuPress={onMenuPress} />

      <LinearGradient colors={[colors.navy, colors.navyDeep]} style={styles.activeCard}>
        <View style={styles.activeTopRow}>
          <Pill tone="gold">Active trigger</Pill>
          <Text style={styles.activeMeta}>{claims.activeAlert.zone}</Text>
        </View>
        <Text style={styles.activeTitle}>
          {claims.activeAlert.emoji} {claims.activeAlert.type} alert
        </Text>
        <Text style={styles.activeBody}>{claims.activeAlert.condition}</Text>

        <View style={styles.payoutBox}>
          <Text style={styles.payoutLabel}>Payout sent</Text>
          <Text style={styles.payoutValue}>{formatCurrency(claims.activeAlert.payoutAmount)}</Text>
          <Text style={styles.payoutMeta}>UPI {user.upi} • {claims.activeAlert.paidAt}</Text>
        </View>

        <View style={styles.progressStack}>
          {[
            `Trigger verified • ${claims.activeAlert.triggeredAt}`,
            'Fraud check cleared by sensor fusion',
            'Funds moved successfully to UPI',
          ].map((item) => (
            <View key={item} style={styles.progressRow}>
              <Feather name="check-circle" size={15} color={colors.green} />
              <Text style={styles.progressText}>{item}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeading title="Trust score" action="Auto-approved" />
        <CardSurface style={styles.trustCard}>
          <TrustScoreRing score={user.trustScore} />
          <View style={styles.signalGrid}>
            {claims.verificationSignals.map((signal) => (
              <View key={signal} style={styles.signalChip}>
                <Feather name="check" size={14} color={colors.green} />
                <Text style={styles.signalText}>{signal}</Text>
              </View>
            ))}
          </View>
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Payout history" action={`${claims.payoutHistory.length} events`} />
        <CardSurface style={styles.listCard}>
          {claims.payoutHistory.map((item, index) => (
            <Pressable
              key={`${item.date}-${item.type}-${index}`}
              style={({ pressed }) => [
                styles.historyRow,
                index < claims.payoutHistory.length - 1 && styles.historyBorder,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyTitle}>{item.type}</Text>
                <Text style={styles.historyMeta}>{item.date} • {item.zone}</Text>
                <Text style={styles.historyBody}>{item.disruption}</Text>
              </View>
              <View style={styles.amountCol}>
                <Text
                  style={[
                    styles.historyAmount,
                    item.amount < 0 && styles.historyDebit,
                  ]}
                >
                  {item.amount < 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(item.amount))}
                </Text>
                <View style={[
                  styles.statusBadge,
                  item.status === 'Paid' && styles.statusPaid,
                  item.status === 'Pending' && styles.statusPending,
                  item.status === 'Flagged' && styles.statusFlagged,
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.status === 'Paid' && styles.statusTextPaid,
                    item.status === 'Pending' && styles.statusTextPending,
                    item.status === 'Flagged' && styles.statusTextFlagged,
                  ]}>{item.status}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Premium timeline" action="Autopay" />
        <CardSurface style={styles.listCard}>
          {claims.premiumHistory.map((item, index) => (
            <View
              key={`${item.cycle}-${index}`}
              style={[styles.premiumRow, index < claims.premiumHistory.length - 1 && styles.historyBorder]}
            >
              <View style={styles.premiumLeft}>
                <Text style={styles.premiumCycle}>{item.cycle}</Text>
                <Text style={styles.premiumMeta}>{item.paidOn}</Text>
                <Text style={styles.premiumNote}>{item.note}</Text>
              </View>
              <Text style={styles.premiumAmount}>{formatCurrency(item.amount)}</Text>
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 34,
    gap: 24,
  },
  activeCard: {
    borderRadius: 30,
    padding: 20,
    gap: 14,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeMeta: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.64)',
  },
  activeTitle: {
    fontFamily: typography.headline,
    fontSize: 30,
    lineHeight: 34,
    color: colors.white,
  },
  activeBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.74)',
  },
  payoutBox: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 6,
  },
  payoutLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.64)',
  },
  payoutValue: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.gold,
  },
  payoutMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  progressStack: {
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.white,
  },
  section: {
    gap: 14,
  },
  trustCard: {
    alignItems: 'center',
    gap: 18,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signalChip: {
    width: '47%',
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  listCard: {
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
    gap: 4,
  },
  historyTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  historyMeta: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  historyBody: {
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyAmount: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.green,
  },
  historyDebit: {
    color: colors.red,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surfaceSoft,
  },
  statusPaid: {
    backgroundColor: 'rgba(30,126,94,0.12)',
  },
  statusPending: {
    backgroundColor: colors.goldSoft,
  },
  statusFlagged: {
    backgroundColor: 'rgba(200,91,74,0.12)',
  },
  statusText: {
    fontFamily: typography.labelMedium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  statusTextPaid: {
    color: colors.green,
  },
  statusTextPending: {
    color: colors.gold,
  },
  statusTextFlagged: {
    color: colors.red,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
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
  premiumMeta: {
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
  premiumAmount: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.gold,
  },
})

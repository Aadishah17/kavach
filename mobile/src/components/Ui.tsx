import { Feather } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, spacing, typography } from '../theme/tokens'

export function Kicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>
}

export function Pill({
  children,
  tone = 'soft',
}: {
  children: string
  tone?: 'soft' | 'gold' | 'navy'
}) {
  return <Text style={[styles.pill, tone === 'gold' && styles.goldPill, tone === 'navy' && styles.navyPill]}>{children}</Text>
}

export function SectionHeading({
  title,
  action,
}: {
  title: string
  action?: string
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Feather name="arrow-right" size={16} color={colors.white} />
    </TouchableOpacity>
  )
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  )
}

export function CardSurface({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={[styles.cardSurface, style]}>{children}</View>
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: typography.labelMedium,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  pill: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.skySoft,
    color: colors.teal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: typography.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  goldPill: {
    backgroundColor: colors.goldSoft,
    color: colors.navy,
  },
  navyPill: {
    backgroundColor: colors.navy,
    color: colors.white,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: typography.headline,
    fontSize: 34,
    color: colors.navy,
  },
  sectionAction: {
    fontFamily: typography.labelMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.sky,
  },
  primaryButton: {
    backgroundColor: colors.navy,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: typography.bodyBold,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
  cardSurface: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
})

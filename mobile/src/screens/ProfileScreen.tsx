import { useEffect, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Pill, PrimaryButton, SecondaryButton, SectionHeading } from '../components/Ui'
import { formatCurrency, initialsFromName } from '../lib/format'
import { colors, spacing, typography } from '../theme/tokens'
import type { ProfileData, ProfileSetting, WorkerProfile } from '../types'

type ProfileScreenProps = {
  user: WorkerProfile
  profile: ProfileData
  onSaveSettings: (settings: ProfileSetting[]) => Promise<void>
  onLogout: () => Promise<void>
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

export function ProfileScreen({
  user,
  profile,
  onSaveSettings,
  onLogout,
  isRefreshing = false,
  onRefresh,
  onMenuPress,
}: ProfileScreenProps) {
  const [settings, setSettings] = useState(profile.settings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSettings(profile.settings)
  }, [profile.settings])

  const toggleSetting = (index: number) => {
    setSettings((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveSettings(settings)
      Alert.alert('Settings saved', 'Your preferences have been updated.')
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDocumentPress = (documentName: string, status: string) => {
    Alert.alert(
      documentName,
      `Status: ${status}\n\nThis document is stored securely with Kavach.`,
      [
        { text: 'OK', style: 'default' },
      ],
    )
  }

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
      <BrandHeader subtitle="Profile and policy" onMenuPress={onMenuPress} />

      <CardSurface style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFromName(user.name)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileMeta}>
            {user.platform} • {user.zone}
          </Text>
        </View>
        <Pill tone="gold">{user.plan}</Pill>
      </CardSurface>

      <View style={styles.section}>
        <SectionHeading title="Coverage summary" action="Live policy" />
        <CardSurface style={styles.summaryCard}>
          <SummaryMetric label="Protected this month" value={formatCurrency(profile.monthlyProtectedAmount)} />
          <SummaryMetric label="Weekly premium" value={formatCurrency(user.weeklyPremium)} />
          <SummaryMetric label="Trust score" value={`${user.trustScore}/100`} />
          <SummaryMetric label="Next deduction" value={user.nextDeduction} />
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Documents" action={`${profile.documents.length} stored`} />
        <CardSurface style={styles.listCard}>
          {profile.documents.map((document, index) => (
            <Pressable
              key={`${document.name}-${index}`}
              onPress={() => handleDocumentPress(document.name, document.status)}
              style={({ pressed }) => [
                styles.documentRow,
                index < profile.documents.length - 1 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.docIconWrap}>
                <Feather name="file-text" size={16} color={colors.sky} />
              </View>
              <View style={styles.documentCopy}>
                <Text style={styles.documentTitle}>{document.name}</Text>
                <Text style={styles.documentMeta}>{document.meta}</Text>
              </View>
              <View style={styles.docRight}>
                <Pill tone="soft">{document.status}</Pill>
                <Feather name="chevron-right" size={14} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </CardSurface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Settings" action="Personalized" />
        <CardSurface style={styles.listCard}>
          {settings.map((setting, index) => (
            <Pressable
              key={`${setting.label}-${index}`}
              onPress={() => toggleSetting(index)}
              style={[styles.settingRow, index < settings.length - 1 && styles.rowBorder]}
            >
              <View style={styles.documentCopy}>
                <Text style={styles.documentTitle}>{setting.label}</Text>
                <Text style={styles.documentMeta}>{setting.value}</Text>
              </View>
              <View style={[styles.toggle, setting.enabled && styles.toggleOn]}>
                <View style={[styles.toggleKnob, setting.enabled && styles.toggleKnobOn]} />
              </View>
            </Pressable>
          ))}
        </CardSurface>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={isSaving ? 'Saving settings...' : 'Save settings'} onPress={() => void handleSave()} />
        <SecondaryButton label="Log out" onPress={() => void onLogout()} />
      </View>
    </ScrollView>
  )
}

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    height: 54,
    width: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    fontFamily: typography.bodyBold,
    fontSize: 16,
    color: colors.white,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: typography.headline,
    fontSize: 28,
    color: colors.navy,
  },
  profileMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  section: {
    gap: 14,
  },
  summaryCard: {
    gap: 14,
  },
  summaryMetric: {
    gap: 4,
  },
  summaryLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  summaryValue: {
    fontFamily: typography.bodyBold,
    fontSize: 16,
    color: colors.navy,
  },
  listCard: {
    paddingVertical: 10,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.7,
    backgroundColor: colors.surfaceSoft,
  },
  docIconWrap: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentCopy: {
    flex: 1,
    gap: 4,
  },
  documentTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  documentMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  docRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.navy,
  },
  toggleKnob: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  actions: {
    gap: 12,
  },
})

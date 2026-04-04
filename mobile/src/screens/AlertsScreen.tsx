import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Pill, SectionHeading } from '../components/Ui'
import { colors, spacing, typography } from '../theme/tokens'
import type { AlertsData } from '../types'

type AlertsScreenProps = {
  alerts: AlertsData
  isRefreshing?: boolean
  onRefresh?: () => void
  onMenuPress?: () => void
}

const openDialer = (phone: string) => {
  const cleaned = phone.replace(/[^0-9+]/g, '')
  const url = `tel:${cleaned}`
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      void Linking.openURL(url)
    } else {
      Alert.alert('Cannot make call', `Dialer not available for ${phone}`)
    }
  }).catch(() => {
    Alert.alert('Cannot make call', `Failed to open dialer for ${phone}`)
  })
}

export function AlertsScreen({
  alerts,
  isRefreshing = false,
  onRefresh,
  onMenuPress,
}: AlertsScreenProps) {
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
      <BrandHeader subtitle="Alerts and safety" onMenuPress={onMenuPress} />

      {/* Emergency Support Quick Call */}
      <Pressable
        onPress={() => openDialer('112')}
        style={({ pressed }) => [styles.emergencyButton, pressed && styles.emergencyButtonPressed]}
      >
        <LinearGradient colors={[colors.green, '#166B4E']} style={styles.emergencyGradient}>
          <Feather name="phone-call" size={18} color={colors.white} />
          <View style={styles.emergencyCopy}>
            <Text style={styles.emergencyTitle}>Emergency support</Text>
            <Text style={styles.emergencyBody}>Tap to call emergency services</Text>
          </View>
          <Feather name="arrow-right" size={16} color={colors.white} />
        </LinearGradient>
      </Pressable>

      <View style={styles.section}>
        <SectionHeading title="Live alerts" action={`${alerts.feed.length} items`} />
        <View style={styles.stack}>
          {alerts.feed.map((item) => (
            <Pressable
              key={`${item.category}-${item.title}`}
              style={({ pressed }) => [pressed && styles.cardPressed]}
            >
              <CardSurface style={styles.alertCard}>
                <View style={styles.alertTop}>
                  <Text style={styles.alertCategory}>{item.category}</Text>
                  <Pill tone={item.status.toLowerCase().includes('high') ? 'gold' : 'soft'}>{item.status}</Pill>
                </View>
                <Text style={styles.alertTitle}>{item.title}</Text>
                <Text style={styles.alertBody}>{item.description}</Text>
              </CardSurface>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Emergency resources" action="Quick access" />
        <View style={styles.stack}>
          {alerts.emergencyResources.map((item) => (
            <CardSurface key={item.title} style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{item.title}</Text>
              <Text style={styles.resourceBody}>{item.description}</Text>
              <Pressable
                onPress={() => {
                  if (item.cta.toLowerCase().includes('call')) {
                    openDialer('112')
                  } else {
                    Alert.alert(item.title, item.description)
                  }
                }}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              >
                <Feather name="external-link" size={12} color={colors.white} />
                <Text style={styles.ctaText}>{item.cta}</Text>
              </Pressable>
            </CardSurface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Support contacts" action="Trusted list" />
        <View style={styles.stack}>
          {alerts.supportContacts.map((contact) => (
            <Pressable
              key={contact.phone}
              onPress={() => openDialer(contact.phone)}
              style={({ pressed }) => [pressed && styles.cardPressed]}
            >
              <CardSurface style={styles.contactCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{contact.initials}</Text>
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactMeta}>{contact.relation}</Text>
                </View>
                <View style={styles.phoneChip}>
                  <Feather name="phone" size={12} color={colors.sky} />
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
              </CardSurface>
            </Pressable>
          ))}
        </View>
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
  emergencyButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  emergencyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 22,
  },
  emergencyCopy: {
    flex: 1,
    gap: 3,
  },
  emergencyTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.white,
  },
  emergencyBody: {
    fontFamily: typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.76)',
  },
  section: {
    gap: 14,
  },
  stack: {
    gap: 10,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  alertCard: {
    gap: 10,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  alertCategory: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.sky,
  },
  alertTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  alertBody: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  resourceCard: {
    gap: 8,
  },
  resourceTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 16,
    color: colors.navy,
  },
  resourceBody: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  ctaButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaText: {
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  contactCopy: {
    flex: 1,
    gap: 3,
  },
  contactName: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  contactMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contactPhone: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.sky,
  },
})

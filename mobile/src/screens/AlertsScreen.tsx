import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { BrandHeader } from '../components/BrandHeader'
import { CardSurface, Pill, SectionHeading } from '../components/Ui'
import { colors, spacing, typography } from '../theme/tokens'
import type { AlertsData } from '../types'

type AlertsScreenProps = {
  alerts: AlertsData
}

export function AlertsScreen({ alerts }: AlertsScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader subtitle="Alerts and safety" />

      <View style={styles.section}>
        <SectionHeading title="Live alerts" action={`${alerts.feed.length} items`} />
        <View style={styles.stack}>
          {alerts.feed.map((item) => (
            <CardSurface key={`${item.category}-${item.title}`} style={styles.alertCard}>
              <View style={styles.alertTop}>
                <Text style={styles.alertCategory}>{item.category}</Text>
                <Pill tone={item.status.toLowerCase().includes('high') ? 'gold' : 'soft'}>{item.status}</Pill>
              </View>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertBody}>{item.description}</Text>
            </CardSurface>
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
              <Text style={styles.resourceCta}>{item.cta}</Text>
            </CardSurface>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Support contacts" action="Trusted list" />
        <View style={styles.stack}>
          {alerts.supportContacts.map((contact) => (
            <CardSurface key={contact.phone} style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{contact.initials}</Text>
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactMeta}>{contact.relation}</Text>
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </CardSurface>
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
  section: {
    gap: 14,
  },
  stack: {
    gap: 10,
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
  resourceCta: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
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
  contactPhone: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.sky,
  },
})

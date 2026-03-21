import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BrandHeader } from '../components/BrandHeader'
import { Kicker, Pill, PrimaryButton } from '../components/Ui'
import { colors, radius, spacing, typography } from '../theme/tokens'
import type { SignupPayload } from '../types'

type OnboardingScreenProps = {
  onBack: () => void
  onSubmit: (payload: SignupPayload) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}

const platforms = ['Swiggy', 'Zomato', 'Blinkit', 'Amazon Flex', 'Zepto', 'Porter']

const plans: Array<{
  label: SignupPayload['plan']
  title: string
  price: string
  detail: string
}> = [
  {
    label: 'Basic',
    title: 'Basic Shield',
    price: '₹29/week',
    detail: 'Rain and city disruption triggers for lighter schedules.',
  },
  {
    label: 'Standard',
    title: 'Standard Cover',
    price: '₹49/week',
    detail: 'Best mix of payout speed, live triggers, and weekly income protection.',
  },
  {
    label: 'Pro',
    title: 'Pro Guard',
    price: '₹79/week',
    detail: 'Higher caps and broader event coverage for heavy riders.',
  },
]

const initialForm: SignupPayload = {
  name: '',
  phone: '',
  platforms: ['Swiggy'],
  city: 'Bengaluru',
  zone: 'Koramangala',
  plan: 'Standard',
  upi: '',
}

export function OnboardingScreen({
  onBack,
  onSubmit,
  isSubmitting = false,
  error,
}: OnboardingScreenProps) {
  const [form, setForm] = useState<SignupPayload>(initialForm)
  const [localError, setLocalError] = useState<string | null>(null)

  const isValid = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.phone.trim().length >= 6 &&
      form.city.trim().length >= 2 &&
      form.zone.trim().length >= 2 &&
      form.platforms.length > 0 &&
      form.upi.trim().length >= 3,
    [form],
  )

  const togglePlatform = (platform: string) => {
    setForm((current) => {
      const exists = current.platforms.includes(platform)
      const nextPlatforms = exists
        ? current.platforms.filter((value) => value !== platform)
        : [...current.platforms, platform]

      return {
        ...current,
        platforms: nextPlatforms,
      }
    })
  }

  const handleSubmit = async () => {
    if (!isValid) {
      setLocalError('Fill every field and keep at least one platform selected.')
      return
    }

    setLocalError(null)
    await onSubmit(form)
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader subtitle="Sign up" onBack={onBack} />

      <LinearGradient colors={[colors.navy, colors.navyDeep]} style={styles.heroCard}>
        <Pill tone="gold">4 minute onboarding</Pill>
        <Text style={styles.heroTitle}>Income protection that fits a rider shift, not a paperwork queue.</Text>
        <Text style={styles.heroBody}>
          Enter your route basics, choose a plan, connect UPI, and Kavach starts watching your zone.
        </Text>
        <View style={styles.checklist}>
          {[
            'Fast sign-up with your active platform',
            'Zone-aware payout monitoring',
            'Direct UPI settlement for verified triggers',
          ].map((item) => (
            <View key={item} style={styles.checkRow}>
              <View style={styles.checkDot} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Kicker>Personal details</Kicker>
        <Field
          label="Full name"
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Rahul Kumar"
        />
        <Field
          label="Phone number"
          value={form.phone}
          onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
        />
      </View>

      <View style={styles.section}>
        <Kicker>Where you work</Kicker>
        <Text style={styles.inlineLabel}>Platforms</Text>
        <View style={styles.platformGrid}>
          {platforms.map((platform) => {
            const active = form.platforms.includes(platform)
            return (
              <Pressable
                key={platform}
                onPress={() => togglePlatform(platform)}
                style={[styles.platformChip, active && styles.platformChipActive]}
              >
                <Text style={[styles.platformChipText, active && styles.platformChipTextActive]}>
                  {platform}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Field
          label="City"
          value={form.city}
          onChangeText={(value) => setForm((current) => ({ ...current, city: value }))}
          placeholder="Bengaluru"
        />
        <Field
          label="Primary zone"
          value={form.zone}
          onChangeText={(value) => setForm((current) => ({ ...current, zone: value }))}
          placeholder="Koramangala"
        />
      </View>

      <View style={styles.section}>
        <Kicker>Choose your plan</Kicker>
        {plans.map((plan) => {
          const active = form.plan === plan.label

          return (
            <Pressable
              key={plan.label}
              onPress={() => setForm((current) => ({ ...current, plan: plan.label }))}
              style={[styles.planCard, active && styles.planCardActive]}
            >
              <View style={styles.planTopRow}>
                <View>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDetail}>{plan.detail}</Text>
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.section}>
        <Kicker>Payout destination</Kicker>
        <Field
          label="UPI ID"
          value={form.upi}
          onChangeText={(value) => setForm((current) => ({ ...current, upi: value }))}
          placeholder="rahul@phonepe"
          autoCapitalize="none"
        />
      </View>

      {error || localError ? <Text style={styles.errorText}>{error ?? localError}</Text> : null}
      <View style={styles.submitRow}>
        <PrimaryButton label={isSubmitting ? 'Creating cover...' : 'Create Kavach cover'} onPress={() => void handleSubmit()} />
      </View>
    </ScrollView>
  )
}

type FieldProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  keyboardType?: 'default' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.fieldShell}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.fieldInput}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
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
    paddingBottom: 40,
    gap: 24,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    gap: 14,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 34,
    lineHeight: 38,
    color: colors.white,
  },
  heroBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.74)',
  },
  checklist: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkDot: {
    height: 9,
    width: 9,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  checkText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.white,
  },
  section: {
    gap: 12,
  },
  inlineLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.navy,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  platformChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.skyLine,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  platformChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  platformChipText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  platformChipTextActive: {
    color: colors.white,
  },
  fieldShell: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.labelMedium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.navy,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.skyLine,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.text,
  },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.skyLine,
    backgroundColor: colors.surface,
    padding: 18,
  },
  planCardActive: {
    borderColor: colors.navy,
    borderWidth: 2,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  planTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 17,
    color: colors.navy,
  },
  planDetail: {
    marginTop: 4,
    maxWidth: 220,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  planPrice: {
    fontFamily: typography.headline,
    fontSize: 24,
    color: colors.gold,
  },
  errorText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.red,
  },
  submitRow: {
    paddingTop: 6,
  },
})

import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { AppDataProvider, useAppData } from '../context/AppDataContext'
import { getApiBaseUrl } from '../lib/api'
import { BottomTabBar } from '../components/BottomTabBar'
import { PrimaryButton, SecondaryButton } from '../components/Ui'
import { LandingScreen } from '../screens/LandingScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ClaimsScreen } from '../screens/ClaimsScreen'
import { AnalyticsScreen } from '../screens/AnalyticsScreen'
import { AlertsScreen } from '../screens/AlertsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { colors, spacing, typography } from '../theme/tokens'
import type { AppRoute, PublicRoute } from '../types'

const workerTabs: Array<{ route: AppRoute; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { route: 'dashboard', label: 'Home', icon: 'grid' },
  { route: 'claims', label: 'Claims', icon: 'shield' },
  { route: 'alerts', label: 'Alerts', icon: 'bell' },
  { route: 'profile', label: 'Profile', icon: 'user' },
]

const adminTabs: Array<{ route: AppRoute; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { route: 'dashboard', label: 'Home', icon: 'grid' },
  { route: 'claims', label: 'Claims', icon: 'shield' },
  { route: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { route: 'alerts', label: 'Alerts', icon: 'bell' },
  { route: 'profile', label: 'Profile', icon: 'user' },
]

export function KavachMobileApp() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          <RootShell />
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

function RootShell() {
  const insets = useSafeAreaInsets()
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    loginAsDemo,
    completeOnboarding,
    logout,
  } = useAuth()
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
    refreshData,
    saveProfileSettings,
  } = useAppData()
  const [publicRoute, setPublicRoute] = useState<PublicRoute>('landing')
  const [activeTab, setActiveTab] = useState<AppRoute>('dashboard')

  if (authLoading) {
    return <CenteredState label="Loading Kavach Mobile..." />
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {publicRoute === 'landing' ? (
          <LandingScreen
            onStart={() => setPublicRoute('onboarding')}
            onDemo={loginAsDemo}
            isBusy={authLoading}
            authError={authError}
          />
        ) : (
          <OnboardingScreen
            onBack={() => setPublicRoute('landing')}
            onSubmit={completeOnboarding}
            isSubmitting={authLoading}
            error={authError}
          />
        )}
      </SafeAreaView>
    )
  }

  if (!data && dataLoading) {
    return <CenteredState label="Syncing live payout data..." />
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Mobile app data could not load.</Text>
          <Text style={styles.errorBody}>{dataError ?? `Check API reachability at ${getApiBaseUrl()}.`}</Text>
          <PrimaryButton label="Retry sync" onPress={() => void refreshData()} />
          <SecondaryButton label="Sign out" onPress={() => void logout()} />
        </View>
      </SafeAreaView>
    )
  }

  const tabs = data.user.role === 'admin' ? adminTabs : workerTabs
  const resolvedActiveTab =
    data.user.role !== 'admin' && activeTab === 'analytics' ? 'dashboard' : activeTab

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appShell}>
        {resolvedActiveTab === 'dashboard' ? (
          <DashboardScreen
            user={data.user}
            dashboard={data.dashboard}
            onOpenClaims={() => setActiveTab('claims')}
          />
        ) : null}
        {resolvedActiveTab === 'claims' ? (
          <ClaimsScreen user={data.user} claims={data.claims} />
        ) : null}
        {resolvedActiveTab === 'analytics' ? (
          <AnalyticsScreen user={data.user} analytics={data.analytics} />
        ) : null}
        {resolvedActiveTab === 'alerts' ? <AlertsScreen alerts={data.alerts} /> : null}
        {resolvedActiveTab === 'profile' ? (
          <ProfileScreen
            user={data.user}
            profile={data.profile}
            onSaveSettings={saveProfileSettings}
            onLogout={logout}
          />
        ) : null}
      </View>

      <Pressable
        onPress={() => setActiveTab('alerts')}
        style={[styles.supportButton, { bottom: insets.bottom + 92 }]}
      >
        <Feather name="message-circle" size={16} color={colors.white} />
        <Text style={styles.supportText}>Support</Text>
      </Pressable>

      <SafeAreaView edges={['bottom']} style={styles.tabSafeArea}>
        <BottomTabBar activeTab={resolvedActiveTab} tabs={tabs} onSelect={setActiveTab} />
      </SafeAreaView>
    </SafeAreaView>
  )
}

function CenteredState({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.centeredState}>
        <ActivityIndicator color={colors.navy} />
        <Text style={styles.centeredText}>{label}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
  },
  centeredText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontFamily: typography.headline,
    fontSize: 30,
    textAlign: 'center',
    color: colors.navy,
  },
  errorBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
  },
  tabSafeArea: {
    backgroundColor: 'transparent',
  },
  supportButton: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.green,
    shadowColor: colors.navy,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  supportText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
})

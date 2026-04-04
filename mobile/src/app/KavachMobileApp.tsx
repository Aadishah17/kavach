import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { AuthProvider, useAuth } from '../context/AuthContext'
import { AppDataProvider, useAppData } from '../context/AppDataContext'
import { getApiBaseUrl } from '../lib/api'
import { BottomTabBar } from '../components/BottomTabBar'
import { SideMenuDrawer } from '../components/SideMenuDrawer'
import { PrimaryButton, SecondaryButton } from '../components/Ui'
import { LandingScreen } from '../screens/LandingScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ClaimsScreen } from '../screens/ClaimsScreen'
import { PolicyScreen } from '../screens/PolicyScreen'
import { AnalyticsScreen } from '../screens/AnalyticsScreen'
import { AlertsScreen } from '../screens/AlertsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { colors, spacing, typography } from '../theme/tokens'
import type { AppRoute } from '../types'

const workerTabs: Array<{ route: AppRoute; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { route: 'dashboard', label: 'Home', icon: 'grid' },
  { route: 'claims', label: 'Claims', icon: 'shield' },
  { route: 'policy', label: 'Policy', icon: 'file-text' },
  { route: 'alerts', label: 'Alerts', icon: 'bell' },
  { route: 'profile', label: 'Profile', icon: 'user' },
]

const adminTabs: Array<{ route: AppRoute; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { route: 'dashboard', label: 'Home', icon: 'grid' },
  { route: 'claims', label: 'Claims', icon: 'shield' },
  { route: 'policy', label: 'Policy', icon: 'file-text' },
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

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function RootShell() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    loginAsDemo,
    completeOnboarding,
  } = useAuth()

  if (authLoading) {
    return <CenteredState label="Loading Kavach Mobile..." />
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="landing">
            {(props) => (
              <SafeAreaView style={styles.safeArea} edges={['top']}>
                <LandingScreen
                  onStart={() => props.navigation.navigate('onboarding')}
                  onDemo={loginAsDemo}
                  isBusy={authLoading}
                  authError={authError}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen name="onboarding">
            {(props) => (
              <SafeAreaView style={styles.safeArea} edges={['top']}>
                <OnboardingScreen
                  onBack={() => props.navigation.goBack()}
                  onSubmit={completeOnboarding}
                  isSubmitting={authLoading}
                  error={authError}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <AuthenticatedShell />
      )}
    </NavigationContainer>
  )
}

function AuthenticatedShell() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { logout } = useAuth()
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
    refreshData,
    saveProfileSettings,
  } = useAppData()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTabDrawer, setActiveTabDrawer] = useState<AppRoute>('dashboard')

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData])

  const openMenu = useCallback(() => setIsMenuOpen(true), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appShell}>
        <Tab.Navigator
          screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
          screenListeners={{
            state: (e) => {
              if (e.data.state && e.data.state.routes.length > 0) {
                 const routeName = e.data.state.routes[e.data.state.index].name as AppRoute
                 setActiveTabDrawer(routeName)
              }
            }
          }}
          tabBar={(props) => {
            let activeRouteName = props.state.routes[props.state.index].name as AppRoute
            if (activeRouteName === 'analytics' && data.user.role !== 'admin') {
              activeRouteName = 'dashboard'
            }
            return (
              <SafeAreaView edges={['bottom']} style={styles.tabSafeArea}>
                <BottomTabBar
                  activeTab={activeRouteName}
                  tabs={tabs}
                  onSelect={(r) => props.navigation.navigate(r)}
                />
              </SafeAreaView>
            )
          }}
        >
          <Tab.Screen name="dashboard">
            {(props) => (
              <DashboardScreen
                user={data.user}
                dashboard={data.dashboard}
                onOpenClaims={() => props.navigation.navigate('claims')}
                onOpenAlerts={() => props.navigation.navigate('alerts')}
                onOpenPolicy={() => props.navigation.navigate('policy')}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="claims">
            {(props) => (
              <ClaimsScreen
                user={data.user}
                claims={data.claims}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="policy">
            {(props) => (
              <PolicyScreen
                user={data.user}
                policy={data.policy}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="analytics">
            {(props) => (
              <AnalyticsScreen
                user={data.user}
                analytics={data.analytics}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="alerts">
            {(props) => (
              <AlertsScreen
                alerts={data.alerts}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="profile">
            {(props) => (
              <ProfileScreen
                user={data.user}
                profile={data.profile}
                onSaveSettings={saveProfileSettings}
                onLogout={logout}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onMenuPress={openMenu}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>

      <Pressable
        onPress={() => navigation.navigate('alerts')}
        style={[styles.supportButton, { bottom: insets.bottom + 92 }]}
      >
        <Feather name="message-circle" size={16} color={colors.white} />
        <Text style={styles.supportText}>Support</Text>
      </Pressable>

      <SideMenuDrawer
        visible={isMenuOpen}
        onClose={closeMenu}
        user={data.user}
        activeTab={activeTabDrawer}
        onNavigate={(route) => {
          navigation.navigate(route)
          closeMenu()
        }}
        onLogout={() => {
          closeMenu()
          void logout()
        }}
      />
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

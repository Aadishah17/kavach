import { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, typography } from '../theme/tokens'
import type { AppRoute, WorkerProfile } from '../types'

const SCREEN_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78

type MenuItem = {
  route: AppRoute
  label: string
  icon: keyof typeof Feather.glyphMap
}

type SideMenuDrawerProps = {
  visible: boolean
  onClose: () => void
  user: WorkerProfile
  activeTab: AppRoute
  onNavigate: (route: AppRoute) => void
  onLogout: () => void
}

export function SideMenuDrawer({
  visible,
  onClose,
  user,
  activeTab,
  onNavigate,
  onLogout,
}: SideMenuDrawerProps) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: DRAWER_WIDTH,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, slideAnim, backdropOpacity])

  const menuItems: MenuItem[] = [
    { route: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { route: 'claims', label: 'Claims & Trust', icon: 'shield' },
    { route: 'policy', label: 'Policy Details', icon: 'file-text' },
    { route: 'alerts', label: 'Alerts & Safety', icon: 'bell' },
    { route: 'profile', label: 'My Profile', icon: 'user' },
  ]

  if (user.role === 'admin') {
    menuItems.splice(3, 0, {
      route: 'analytics',
      label: 'Analytics',
      icon: 'bar-chart-2',
    })
  }

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route)
    onClose()
  }

  if (!visible) {
    return null
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('')}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userMeta}>
            {user.plan} • {user.zone}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = item.route === activeTab
            return (
              <Pressable
                key={item.route}
                onPress={() => handleNavigate(item.route)}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={isActive ? colors.white : colors.textMuted}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive ? (
                  <View style={styles.activeDot} />
                ) : null}
              </Pressable>
            )
          })}
        </View>

        <View style={styles.spacer} />

        <View style={styles.divider} />

        <Pressable
          onPress={() => {
            onClose()
            onLogout()
          }}
          style={styles.logoutButton}
        >
          <Feather name="log-out" size={18} color={colors.red} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.version}>Kavach Mobile v1.0</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 34, 50, 0.55)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: 30,
    shadowColor: colors.navy,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: -10, height: 0 },
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  closeButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  avatar: {
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: typography.bodyBold,
    fontSize: 20,
    color: colors.white,
  },
  userName: {
    fontFamily: typography.headline,
    fontSize: 24,
    color: colors.navy,
    textAlign: 'center',
  },
  userMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginVertical: 16,
  },
  menuList: {
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  menuItemActive: {
    backgroundColor: colors.navy,
  },
  menuLabel: {
    flex: 1,
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  menuLabelActive: {
    color: colors.white,
  },
  activeDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  logoutText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.red,
  },
  version: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
})

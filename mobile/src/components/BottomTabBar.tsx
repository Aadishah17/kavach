import { Feather } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AppRoute } from '../types'
import { colors, typography } from '../theme/tokens'

type BottomTabBarProps = {
  activeTab: AppRoute
  tabs: Array<{ route: AppRoute; label: string; icon: keyof typeof Feather.glyphMap }>
  onSelect: (route: AppRoute) => void
}

export function BottomTabBar({ activeTab, tabs, onSelect }: BottomTabBarProps) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const active = tab.route === activeTab

        return (
          <Pressable
            key={tab.route}
            onPress={() => onSelect(tab.route)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Feather
              name={tab.icon}
              size={16}
              color={active ? colors.white : colors.textMuted}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: colors.navy,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: colors.navy,
  },
  label: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.white,
  },
})

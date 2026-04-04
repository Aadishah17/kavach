import { Feather } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, typography } from '../theme/tokens'

type BrandHeaderProps = {
  subtitle?: string
  onBack?: () => void
  onMenuPress?: () => void
}

export function BrandHeader({ subtitle, onBack, onMenuPress }: BrandHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconButton}>
            <Feather name="arrow-left" size={18} color={colors.navy} />
          </Pressable>
        ) : (
          <View style={styles.dot} />
        )}
        <Text style={styles.brand}>Kavach</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Pressable
        style={styles.iconButton}
        onPress={onMenuPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="menu" size={18} color={colors.navy} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: '#F6D4BE',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  brand: {
    fontFamily: typography.headline,
    fontSize: 30,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: typography.labelMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  iconButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

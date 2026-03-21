import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope'
import { Newsreader_700Bold, Newsreader_800ExtraBold } from '@expo-google-fonts/newsreader'
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk'
import { ActivityIndicator, View } from 'react-native'
import { KavachMobileApp } from './src/app/KavachMobileApp'
import { colors } from './src/theme/tokens'

export default function App() {
  const [fontsLoaded] = useFonts({
    Newsreader_700Bold,
    Newsreader_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.navy} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <KavachMobileApp />
    </>
  )
}

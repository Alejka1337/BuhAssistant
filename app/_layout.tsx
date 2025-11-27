import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import NotificationHandler from '../components/NotificationHandler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // SpaceMono - моноширинный шрифт
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    
    // Unbounded - для заголовков
    'Unbounded': require('../assets/fonts/Unbounded-Regular.ttf'),
    'Unbounded-Medium': require('../assets/fonts/Unbounded-Medium.ttf'),
    'Unbounded-SemiBold': require('../assets/fonts/Unbounded-SemiBold.ttf'),
    'Unbounded-Bold': require('../assets/fonts/Unbounded-Bold.ttf'),
    
    // Inter - для основного текста (используем 18pt версию)
    'Inter': require('../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_18pt-Bold.ttf'),
    
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationHandler />
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerBackTitle: '',
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="webview" options={{ headerShown: false }} />
        <Stack.Screen
          name="news"
          options={{
            headerShown: true,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="verify-email"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

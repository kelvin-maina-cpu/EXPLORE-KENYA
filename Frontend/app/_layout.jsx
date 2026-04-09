import { StyleSheet, View } from 'react-native';
import { Redirect, Slot, useRootNavigationState, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AppOpeningLoader from '../components/AppOpeningLoader';
import { LocalizationProvider } from '../context/LocalizationContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootNavigator() {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme } = useTheme();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const inAuthGroup = segments[0] === '(auth)';
  const onWelcomeScreen = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');
  const onAboutScreen = segments.length === 1 && segments[0] === 'about';
  const onLanguagesScreen = segments.length === 1 && segments[0] === 'languages';

  if (!rootNavigationState?.key || loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.colors.screenMuted }]}>
        <AppOpeningLoader />
      </View>
    );
  }

  if (!isAuthenticated && !inAuthGroup && !onWelcomeScreen && !onAboutScreen && !onLanguagesScreen) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && (inAuthGroup || onWelcomeScreen)) {
    return <Redirect href={user?.role === 'admin' ? '/admin-dashboard' : '/attractions'} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocalizationProvider>
            <RootNavigator />
          </LocalizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

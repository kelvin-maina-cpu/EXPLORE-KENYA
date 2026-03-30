import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Slot, useRootNavigationState, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocalizationProvider } from '../context/LocalizationContext';

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const inAuthGroup = segments[0] === '(auth)';
  const onWelcomeScreen = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');
  const onAboutScreen = segments.length === 1 && segments[0] === 'about';
  const onLanguagesScreen = segments.length === 1 && segments[0] === 'languages';

  if (!rootNavigationState?.key || loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#264E86" />
      </View>
    );
  }

  if (!isAuthenticated && !inAuthGroup && !onWelcomeScreen && !onAboutScreen && !onLanguagesScreen) {
    return <Redirect href="/" />;
  }

  if (isAuthenticated && (inAuthGroup || onWelcomeScreen)) {
    return <Redirect href="/attractions" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocalizationProvider>
          <RootNavigator />
        </LocalizationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F1E8',
  },
});

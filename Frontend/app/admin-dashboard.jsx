import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_ORIGIN } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { theme } = useTheme();
  const webViewRef = useRef(null);
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  const dashboardUrl = useMemo(() => `${API_ORIGIN}/admin-dashboard`, []);
  const injectedJavaScriptBeforeContentLoaded = useMemo(() => {
    if (!sessionToken || !sessionUser) {
      return '';
    }

    return `
      try {
        localStorage.setItem('adminToken', ${JSON.stringify(sessionToken)});
        localStorage.setItem('adminUser', ${JSON.stringify(JSON.stringify(sessionUser))});
      } catch (error) {}
      true;
    `;
  }, [sessionToken, sessionUser]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(AUTH_USER_KEY),
        ]);

        setSessionToken(storedToken || '');
        setSessionUser(storedUser ? JSON.parse(storedUser) : user || null);
      } finally {
        setBootstrapReady(true);
      }
    };

    void loadSession();
  }, [user]);

  if (loading || !bootstrapReady) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: theme.colors.screen }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)/profile" />;
  }

  const handleBackToLogin = async () => {
    try {
      webViewRef.current?.injectJavaScript(`
        try {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        } catch (error) {}
        true;
      `);
    } catch {}

    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.cardSoft, borderColor: theme.colors.borderSoft }]}
          onPress={() => {
            void handleBackToLogin();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Admin Dashboard</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Manage tours, attractions, bookings, and media uploads without leaving the app.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.openButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => {
            void Linking.openURL(dashboardUrl);
          }}
        >
          <MaterialCommunityIcons name="open-in-new" size={18} color={theme.colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.webviewWrap, { borderColor: theme.colors.border }]}>
        <WebView
          ref={webViewRef}
          source={{ uri: dashboardUrl }}
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.webviewLoader, { backgroundColor: theme.colors.screenMuted }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  openButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  webviewLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

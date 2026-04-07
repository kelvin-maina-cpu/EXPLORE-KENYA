import { useMemo } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function InAppBrowserScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const pageTitle = useMemo(() => {
    const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
    return rawTitle || 'Website';
  }, [params.title]);

  const pageUrl = useMemo(() => {
    const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
    return rawUrl || '';
  }, [params.url]);

  if (!pageUrl) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: theme.colors.screen }]}>
        <Text style={[styles.errorText, { color: theme.colors.danger || '#B24D34' }]}>
          Unable to open this page right now.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.cardSoft, borderColor: theme.colors.borderSoft }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {pageTitle}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {pageUrl}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.openButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => {
            void Linking.openURL(pageUrl);
          }}
        >
          <MaterialCommunityIcons name="open-in-new" size={18} color={theme.colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.webviewWrap, { borderColor: theme.colors.border }]}>
        <WebView
          source={{ uri: pageUrl }}
          originWhitelist={['*']}
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
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '700',
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
    fontSize: 19,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
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

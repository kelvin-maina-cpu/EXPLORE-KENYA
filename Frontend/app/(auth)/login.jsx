import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    login,
    loading,
    biometricAvailable,
    biometricEnabled,
    biometricSupportMessage,
    savedCredentials,
    clearSavedLoginCredentials,
    loginWithBiometrics,
  } = useAuth();
  const { t } = useLocale();
  const { theme } = useTheme();
  const router = useRouter();
  const postLoginRoute = '/(tabs)/home';
  const colors = theme.colors;

  useEffect(() => {
    if (savedCredentials?.email && !email) {
      setEmail(savedCredentials.email);
    }
  }, [savedCredentials]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const result = await login(trimmedEmail, password);
    if (result.success) {
      router.replace(postLoginRoute);
    } else {
      Alert.alert(t('error'), result.error);
    }
  };

  const handleBiometricLogin = async () => {
    const result = await loginWithBiometrics();
    if (result.success) {
      router.replace(postLoginRoute);
    } else {
      Alert.alert(t('error'), result.error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.screen, { backgroundColor: colors.screen }]}>
        <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
          <Text style={[styles.eyebrow, { color: colors.heroEyebrow }]}>{t('app_name')}</Text>
          <Text style={[styles.title, { color: colors.heroText }]}>{t('login_title')}</Text>
          <Text style={[styles.copy, { color: colors.heroMuted }]}>{t('login_copy')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {savedCredentials?.email ? (
            <View
              style={[
                styles.suggestionCard,
                {
                  backgroundColor: colors.successSoft,
                  borderColor: colors.successBorder,
                },
              ]}
            >
              <Text style={[styles.suggestionLabel, { color: colors.successText }]}>{t('auth_saved_login_suggestion')}</Text>
              <Text style={[styles.suggestionText, { color: colors.text }]}>{savedCredentials.email}</Text>
              <View style={styles.suggestionActions}>
                <TouchableOpacity
                  style={[styles.suggestionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setEmail(savedCredentials.email);
                    setPassword(savedCredentials.password || '');
                  }}
                >
                  <Text style={[styles.suggestionButtonText, { color: colors.secondaryText }]}>{t('auth_use_saved_credentials')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.suggestionClear, { borderColor: colors.border }]}
                  onPress={async () => {
                    const result = await clearSavedLoginCredentials();
                    if (!result.success) {
                      Alert.alert(t('error'), result.error);
                    } else {
                      setPassword('');
                    }
                  }}
                >
                  <Text style={[styles.suggestionClearText, { color: colors.textSoft }]}>{t('clear')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.textSoft }]}>{t('email')}</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderSoft,
                color: colors.inputText,
                backgroundColor: colors.cardSoft,
              },
            ]}
            placeholder={t('auth_enter_email')}
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[styles.label, { color: colors.textSoft }]}>{t('password')}</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderSoft,
                color: colors.inputText,
                backgroundColor: colors.cardSoft,
              },
            ]}
            placeholder={t('auth_enter_password')}
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>
              {loading ? t('loading') : t('login')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.biometricCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <View style={styles.biometricHeader}>
              <View style={[styles.biometricIconWrap, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="fingerprint" size={22} color={colors.primaryText} />
              </View>
              <View style={styles.biometricHeaderCopy}>
                <Text style={[styles.biometricTitle, { color: colors.text }]}>{t('biometric_login_title')}</Text>
                <Text style={[styles.biometricStatus, { color: colors.textMuted }]}>
                  {biometricAvailable
                    ? biometricEnabled
                      ? t('biometric_ready_device')
                      : t('biometric_available_not_enabled')
                    : t('biometric_not_available_now')}
                </Text>
              </View>
            </View>

            {biometricAvailable && biometricEnabled ? (
              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: colors.secondary }]}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <MaterialCommunityIcons name="fingerprint" size={18} color={colors.secondaryText} />
                <Text style={[styles.biometricButtonText, { color: colors.secondaryText }]}>{t('biometric_sign_in_cta')}</Text>
              </TouchableOpacity>
            ) : null}

            {!biometricEnabled && biometricAvailable ? (
              <Text style={[styles.biometricNotice, { color: colors.textMuted }]}>
                {t('biometric_enable_from_profile')}
              </Text>
            ) : null}

            {!biometricAvailable && biometricSupportMessage ? (
              <Text style={[styles.biometricNotice, { color: colors.textMuted }]}>{biometricSupportMessage}</Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={[styles.secondaryLink, { color: colors.textMuted }]}>{t('forgot_password')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.primaryLink, { color: colors.primary }]}>{t('no_account')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
    justifyContent: 'center',
    padding: 18,
  },
  heroCard: {
    backgroundColor: '#173457',
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
  },
  eyebrow: {
    color: '#C8D7EC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
  },
  copy: {
    marginTop: 10,
    color: '#D4DDEC',
    fontSize: 15,
    lineHeight: 23,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    gap: 12,
  },
  suggestionCard: {
    borderRadius: 16,
    backgroundColor: '#EEF6F2',
    borderWidth: 1,
    borderColor: '#CFE2DA',
    padding: 14,
    gap: 8,
  },
  suggestionLabel: {
    color: '#426456',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  suggestionText: {
    color: '#173457',
    fontSize: 15,
    fontWeight: '800',
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  suggestionButton: {
    flex: 1,
    backgroundColor: '#0F6E56',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  suggestionClear: {
    minWidth: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8C7C0',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionClearText: {
    color: '#55636A',
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#264E86',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  biometricButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#0F6E56',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  biometricCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    backgroundColor: '#F8FBFD',
    padding: 14,
    gap: 12,
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biometricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#264E86',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  biometricTitle: {
    color: '#173457',
    fontSize: 16,
    fontWeight: '900',
  },
  biometricStatus: {
    color: '#66707C',
    fontSize: 13,
    fontWeight: '700',
  },
  biometricNotice: {
    color: '#66707C',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryLink: {
    color: '#264E86',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryLink: {
    color: '#66707C',
    fontSize: 14,
    textAlign: 'center',
  },
});

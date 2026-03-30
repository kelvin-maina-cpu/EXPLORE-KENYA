import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';

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
  const router = useRouter();
  const postLoginRoute = '/(tabs)/home';

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
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{t('app_name')}</Text>
        <Text style={styles.title}>{t('login_title')}</Text>
        <Text style={styles.copy}>{t('login_copy')}</Text>
      </View>

      <View style={styles.formCard}>
        {savedCredentials?.email ? (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionLabel}>Saved login suggestion</Text>
            <Text style={styles.suggestionText}>{savedCredentials.email}</Text>
            <View style={styles.suggestionActions}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setEmail(savedCredentials.email);
                  setPassword(savedCredentials.password || '');
                }}
              >
                <Text style={styles.suggestionButtonText}>Use saved credentials</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionClear}
                onPress={async () => {
                  const result = await clearSavedLoginCredentials();
                  if (!result.success) {
                    Alert.alert(t('error'), result.error);
                  } else {
                    setPassword('');
                  }
                }}
              >
                <Text style={styles.suggestionClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth_enter_email')}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>{t('password')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth_enter_password')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('login')}</Text>
        </TouchableOpacity>

        {biometricAvailable && biometricEnabled ? (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin} disabled={loading}>
            <Text style={styles.biometricButtonText}>Login with Fingerprint</Text>
          </TouchableOpacity>
        ) : null}

        {!biometricAvailable && biometricSupportMessage ? (
          <Text style={styles.biometricNotice}>{biometricSupportMessage}</Text>
        ) : null}

        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.secondaryLink}>{t('forgot_password')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.primaryLink}>{t('no_account')}</Text>
        </TouchableOpacity>
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
    backgroundColor: '#0F6E56',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  biometricNotice: {
    color: '#66707C',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
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

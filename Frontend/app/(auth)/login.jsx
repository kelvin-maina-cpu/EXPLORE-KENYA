import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const handleLogin = async () => {
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/');
    } else {
      Alert.alert('Error', result.error);
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
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('login')}</Text>
        </TouchableOpacity>

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

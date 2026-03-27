import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const { register, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const handleRegister = async () => {
    const email = form.email.trim();
    const password = form.password.trim();

    if (!form.name.trim() || !email || !password) {
      Alert.alert(t('error'), t('auth_register_missing'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('auth_password_short'));
      return;
    }

    const emailRegex = /^[\w.-]+@[\w.-]+\.\w{2,}$/i;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), 'Please enter a valid email address');
      return;
    }

    const result = await register(form);
    if (result.success) {
      router.replace('/');
    } else {
      // Handle specific backend errors
      let errorMsg = result.error || 'Registration failed';
      if (result.errors && Array.isArray(result.errors)) {
        errorMsg = result.errors.join('\\n');
      }
      Alert.alert(t('error'), errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('app_name')}</Text>
          <Text style={styles.title}>{t('register_title')}</Text>
          <Text style={styles.copy}>{t('register_copy')}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>{t('full_name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_enter_full_name')}
            placeholderTextColor="#999"
            value={form.name}
            onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
          />
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_enter_email')}
            placeholderTextColor="#999"
            value={form.email}
            onChangeText={(text) => setForm((current) => ({ ...current, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>{t('auth_phone_mpesa')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_phone_placeholder')}
            placeholderTextColor="#999"
            value={form.phoneNumber}
            onChangeText={(text) => setForm((current) => ({ ...current, phoneNumber: text }))}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_enter_password')}
            placeholderTextColor="#999"
            value={form.password}
            onChangeText={(text) => setForm((current) => ({ ...current, password: text }))}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('register')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.primaryLink}>{t('already_have_account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  content: {
    padding: 18,
    paddingVertical: 28,
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
});

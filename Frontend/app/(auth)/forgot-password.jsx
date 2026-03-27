import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { requestPasswordReset, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const handleRequestCode = async () => {
    const result = await requestPasswordReset(email.trim());
    if (!result.success) {
      Alert.alert(t('error'), result.error);
      return;
    }

    Alert.alert(
      t('reset_code_generated'),
      result.resetCode ? `${t('use_code_now')}: ${result.resetCode}` : result.message,
      [{ text: t('continue_button'), onPress: () => router.push({ pathname: '/reset-password', params: { email } }) }]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('forgot_title')}</Text>
        <Text style={styles.copy}>{t('forgot_copy')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleRequestCode} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('request_code')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#F7F1E8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    gap: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#1D2D45',
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    color: '#66707C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 16,
    padding: 15,
    backgroundColor: '#FFFDF9',
    fontSize: 16,
  },
  primaryButton: {
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
  link: {
    color: '#264E86',
    textAlign: 'center',
    fontWeight: '800',
  },
});

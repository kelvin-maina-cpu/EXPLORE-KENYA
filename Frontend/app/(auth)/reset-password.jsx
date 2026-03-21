import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { resetPassword, loading } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState(String(params.email || ''));
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = async () => {
    if (!email.trim() || !code.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password confirmation does not match.');
      return;
    }

    const result = await resetPassword({
      email: email.trim(),
      code: code.trim(),
      newPassword,
    });

    if (!result.success) {
      Alert.alert('Error', result.error);
      return;
    }

    Alert.alert(t('reset_success'), result.message, [{ text: 'Login', onPress: () => router.replace('/login') }]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('reset_title')}</Text>
        <Text style={styles.copy}>{t('reset_copy')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder={t('reset_code')}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={t('new_password')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder={t('confirm_password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('reset_password')}</Text>
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
});

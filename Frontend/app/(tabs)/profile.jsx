import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AVAILABLE_LANGUAGES, useLocale } from '../../context/LocalizationContext';

const availableInterests = ['wildlife', 'culture', 'adventure', 'history'];

export default function ProfileScreen() {
  const {
    user,
    updateProfile,
    logout,
    loading,
    biometricAvailable,
    biometricEnabled,
    biometricSupportMessage,
    enableBiometricLoginFromSession,
    disableBiometricLogin,
  } = useAuth();
  const { language, setLanguage, t } = useLocale();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    languages: user?.preferences?.languages || [language || 'en'],
    interests: user?.preferences?.interests || [],
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      languages: user?.preferences?.languages || [language || 'en'],
      interests: user?.preferences?.interests || [],
    });
  }, [language, user]);

  const activeLanguage = useMemo(() => form.languages?.[0] || language || 'en', [form.languages, language]);
  const formatInterestLabel = (value) => {
    const key = `category_${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  };

  const handleSave = async () => {
    const result = await updateProfile({
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      preferences: {
        languages: form.languages,
        interests: form.interests,
      },
    });

    if (!result.success) {
      Alert.alert(t('error'), result.error);
      return;
    }

    await setLanguage(form.languages[0] || 'en');
    Alert.alert(t('profile_saved'), t('language_saved'));
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      const result = await enableBiometricLoginFromSession();
      if (!result.success) {
        Alert.alert(t('error'), result.error);
        return;
      }

      Alert.alert('Fingerprint login enabled', 'You can now use your fingerprint to sign in on this device.');
      return;
    }

    const result = await disableBiometricLogin();
    if (!result.success) {
      Alert.alert(t('error'), result.error);
      return;
    }

    Alert.alert('Fingerprint login disabled', 'Biometric sign-in has been turned off for this device.');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('settings')}</Text>
          <Text style={styles.title}>{t('profile_title')}</Text>
          <Text style={styles.copy}>{t('profile_copy')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t('full_name')}</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
          />

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm((current) => ({ ...current, email: text }))}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>{t('phone_number')}</Text>
          <TextInput
            style={styles.input}
            value={form.phoneNumber}
            onChangeText={(text) => setForm((current) => ({ ...current, phoneNumber: text }))}
            keyboardType="phone-pad"
          />

          <Text style={styles.meta}>
            {t('role')}: {user?.role || t('guest')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.optionRow}>
            {AVAILABLE_LANGUAGES.map((item) => {
              const active = activeLanguage === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setForm((current) => ({ ...current, languages: [item.code] }))}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {t(
                      item.code === 'en'
                        ? 'language_english'
                        : item.code === 'sw'
                          ? 'language_swahili'
                          : item.code === 'fr'
                            ? 'language_french'
                            : item.code === 'es'
                              ? 'language_spanish'
                              : item.code === 'de'
                                ? 'language_german'
                                : item.code === 'zh'
                                  ? 'language_chinese'
                                  : 'language_arabic'
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('interests')}</Text>
          <View style={styles.optionRow}>
            {availableInterests.map((interest) => {
              const active = form.interests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {formatInterestLabel(interest)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.biometricHeader}>
            <View style={styles.biometricIconWrap}>
              <MaterialCommunityIcons name="fingerprint" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.biometricHeaderCopy}>
              <Text style={styles.sectionTitle}>Fingerprint Login</Text>
              <Text style={styles.biometricCopy}>
                Use your device fingerprint or biometrics to sign in faster on future visits.
              </Text>
            </View>
          </View>
          <View style={styles.biometricRow}>
            <Text style={styles.biometricStatus}>
              {biometricAvailable
                ? biometricEnabled
                  ? 'Enabled on this device'
                  : 'Available on this device'
                : 'Not available on this device'}
            </Text>
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => {
                void handleBiometricToggle(value);
              }}
              disabled={!biometricAvailable || loading}
              trackColor={{ true: '#264E86' }}
            />
          </View>
          {!biometricAvailable && biometricSupportMessage ? (
            <Text style={styles.biometricHint}>{biometricSupportMessage}</Text>
          ) : null}
          {biometricAvailable ? (
            <TouchableOpacity
              style={[styles.biometricActionButton, biometricEnabled && styles.biometricActionButtonActive]}
              onPress={() => {
                void handleBiometricToggle(!biometricEnabled);
              }}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={biometricEnabled ? 'fingerprint-off' : 'fingerprint'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.biometricActionText}>
                {biometricEnabled ? 'Disable fingerprint login' : 'Enable fingerprint login'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {!biometricEnabled && biometricAvailable ? (
            <Text style={styles.biometricHint}>
              If enabling fails, log out and sign in again with email and password first.
            </Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? t('loading') : t('save_profile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
          <Text style={styles.secondaryButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
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
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#173457',
    borderRadius: 28,
    padding: 24,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  copy: {
    marginTop: 10,
    color: '#D4DDEC',
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 18,
    gap: 10,
  },
  label: {
    color: '#66707C',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 16,
    padding: 15,
    backgroundColor: '#FFFDF9',
    fontSize: 16,
  },
  meta: {
    marginTop: 4,
    color: '#66707C',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#1D2D45',
    fontSize: 18,
    fontWeight: '900',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#D9E0EA',
  },
  optionChipActive: {
    backgroundColor: '#264E86',
    borderColor: '#264E86',
  },
  optionText: {
    color: '#66707C',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  biometricIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#264E86',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  biometricCopy: {
    color: '#66707C',
    fontSize: 14,
    lineHeight: 21,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  biometricStatus: {
    flex: 1,
    color: '#1D2D45',
    fontSize: 14,
    fontWeight: '700',
  },
  biometricHint: {
    color: '#66707C',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  biometricActionButton: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#0F6E56',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  biometricActionButtonActive: {
    backgroundColor: '#8E3B2F',
  },
  biometricActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#264E86',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E0EA',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#C84A3C',
    fontSize: 16,
    fontWeight: '800',
  },
});

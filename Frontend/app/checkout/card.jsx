import { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';

export default function CardCheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(String(params.paymentMethod || 'mpesa'));
  const [form, setForm] = useState({
    phoneNumber: String(params.phoneNumber || ''),
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const bookingPayload = useMemo(
    () => ({
      attractionId: String(params.attractionId || ''),
      package: String(params.package || 'day-tour'),
      date: String(params.date || ''),
      participants: parseInt(String(params.participants || '1'), 10),
      phoneNumber: form.phoneNumber.trim(),
      totalAmount: parseInt(String(params.totalAmount || '0'), 10),
      paymentMethod,
    }),
    [form.phoneNumber, params, paymentMethod]
  );

  const totalLabel = String(params.totalLabel || params.totalAmount || '0');
  const attractionName = String(params.attractionName || t('map_destination_label'));

  const handlePayment = async () => {
    if (!form.phoneNumber.trim()) {
      Alert.alert(t('checkout_phone_required'), t('checkout_phone_required_copy'));
      return;
    }

    if (paymentMethod === 'card') {
      if (!form.cardholderName.trim() || !form.cardNumber.trim() || !form.expiryDate.trim() || !form.cvv.trim()) {
        Alert.alert(t('checkout_missing_details'), t('checkout_missing_card'));
        return;
      }

      if (form.cardNumber.replace(/\s/g, '').length < 12) {
        Alert.alert(t('checkout_invalid_card'), t('checkout_invalid_card_copy'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/bookings', bookingPayload);

      Alert.alert(
        paymentMethod === 'mpesa' ? t('checkout_mpesa_sent') : t('checkout_payment_success'),
        response.data?.message ||
          (paymentMethod === 'mpesa'
            ? t('checkout_check_phone')
            : t('checkout_card_success')),
        [{ text: t('bookings'), onPress: () => router.replace('/bookings') }]
      );
    } catch (error) {
      Alert.alert(t('checkout_payment_failed'), error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#264E86" />
          <Text style={styles.backText}>{t('checkout_back')}</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('checkout_title')}</Text>
          <Text style={styles.title}>{t('checkout_complete_booking')} {attractionName}.</Text>
          <Text style={styles.subtitle}>{t('checkout_subtitle')}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('checkout_summary_package')}</Text>
          <Text style={styles.summaryValue}>{String(params.package || 'day-tour')}</Text>
          <Text style={styles.summaryLabel}>{t('checkout_summary_date')}</Text>
          <Text style={styles.summaryValue}>{String(params.date || '')}</Text>
          <Text style={styles.summaryLabel}>{t('checkout_summary_participants')}</Text>
          <Text style={styles.summaryValue}>{String(params.participants || '1')}</Text>
          <Text style={styles.totalPrice}>KES {totalLabel}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('checkout_payment_method')}</Text>

          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'mpesa' && styles.methodCardActive]}
              onPress={() => setPaymentMethod('mpesa')}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={paymentMethod === 'mpesa' ? '#FFFFFF' : '#24654B'}
              />
              <View style={styles.methodCopy}>
                <Text style={[styles.methodTitle, paymentMethod === 'mpesa' && styles.methodTitleActive]}>
                  {t('checkout_method_mpesa')}
                </Text>
                <Text style={[styles.methodText, paymentMethod === 'mpesa' && styles.methodTextActive]}>
                  {t('checkout_method_mpesa_copy')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActiveBlue]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={paymentMethod === 'card' ? '#FFFFFF' : '#264E86'}
              />
              <View style={styles.methodCopy}>
                <Text style={[styles.methodTitle, paymentMethod === 'card' && styles.methodTitleActive]}>
                  {t('checkout_method_card')}
                </Text>
                <Text style={[styles.methodText, paymentMethod === 'card' && styles.methodTextActive]}>
                  {t('checkout_method_card_copy')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('checkout_phone_placeholder')}
            placeholderTextColor="#8B96A5"
            value={form.phoneNumber}
            onChangeText={(text) => setForm((current) => ({ ...current, phoneNumber: text }))}
            keyboardType="phone-pad"
          />

          {paymentMethod === 'mpesa' ? (
            <View style={styles.mpesaNotice}>
              <Text style={styles.mpesaNoticeTitle}>{t('checkout_mpesa_title')}</Text>
              <Text style={styles.mpesaNoticeText}>{t('checkout_mpesa_notice')}</Text>
            </View>
          ) : null}

          {paymentMethod === 'card' ? (
            <>
              <Text style={styles.sectionSubtitle}>{t('checkout_card_details')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('checkout_cardholder_name')}
                placeholderTextColor="#8B96A5"
                value={form.cardholderName}
                onChangeText={(text) => setForm((current) => ({ ...current, cardholderName: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder={t('checkout_card_number')}
                placeholderTextColor="#8B96A5"
                value={form.cardNumber}
                onChangeText={(text) => setForm((current) => ({ ...current, cardNumber: text }))}
                keyboardType="number-pad"
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.rowInput]}
                  placeholder={t('checkout_expiry')}
                  placeholderTextColor="#8B96A5"
                  value={form.expiryDate}
                  onChangeText={(text) => setForm((current) => ({ ...current, expiryDate: text }))}
                />

                <TextInput
                  style={[styles.input, styles.rowInput]}
                  placeholder={t('checkout_cvv')}
                  placeholderTextColor="#8B96A5"
                  value={form.cvv}
                  onChangeText={(text) => setForm((current) => ({ ...current, cvv: text }))}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>
            </>
          ) : null}

          <TouchableOpacity
            style={[
              styles.payBtn,
              paymentMethod === 'mpesa' ? styles.payBtnMpesa : styles.payBtnCard,
              submitting && styles.payBtnDisabled,
            ]}
            onPress={handlePayment}
            disabled={submitting}
          >
            <Ionicons
              name={paymentMethod === 'mpesa' ? 'phone-portrait-outline' : 'card-outline'}
              size={18}
              color="white"
            />
            <Text style={styles.payBtnText}>
              {submitting
                ? paymentMethod === 'mpesa'
                  ? t('checkout_sending_mpesa')
                  : t('checkout_processing_payment')
                : paymentMethod === 'mpesa'
                  ? t('checkout_pay_mpesa')
                  : t('checkout_pay_card')}
            </Text>
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
    paddingBottom: 28,
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#264E86',
    fontSize: 14,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#1D2D45',
    borderRadius: 28,
    padding: 22,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#D4DDEC',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EA',
    borderRadius: 24,
    padding: 18,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#66707C',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D2D45',
  },
  totalPrice: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '900',
    color: '#24654B',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EA',
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1D2D45',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D2D45',
    marginTop: 4,
  },
  methodRow: {
    gap: 10,
  },
  methodCard: {
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 18,
    backgroundColor: '#FFFDF9',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardActive: {
    backgroundColor: '#0F6E56',
    borderColor: '#0F6E56',
  },
  methodCardActiveBlue: {
    backgroundColor: '#264E86',
    borderColor: '#264E86',
  },
  methodCopy: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1D2D45',
  },
  methodTitleActive: {
    color: '#FFFFFF',
  },
  methodText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: '#66707C',
  },
  methodTextActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8DEE7',
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFDF9',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  mpesaNotice: {
    backgroundColor: '#EEF8F4',
    borderWidth: 1,
    borderColor: '#C7E6DA',
    borderRadius: 16,
    padding: 14,
  },
  mpesaNoticeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F6E56',
  },
  mpesaNoticeText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#355D52',
  },
  payBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  payBtnMpesa: {
    backgroundColor: '#0F6E56',
  },
  payBtnCard: {
    backgroundColor: '#264E86',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

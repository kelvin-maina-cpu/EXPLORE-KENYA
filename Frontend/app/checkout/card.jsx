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

export default function CardCheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
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
      phoneNumber: String(params.phoneNumber || ''),
      totalAmount: parseInt(String(params.totalAmount || '0'), 10),
      paymentMethod: 'card',
    }),
    [params]
  );

  const totalLabel = String(params.totalLabel || params.totalAmount || '0');
  const attractionName = String(params.attractionName || 'Destination');

  const handlePayment = async () => {
    if (!form.cardholderName.trim() || !form.cardNumber.trim() || !form.expiryDate.trim() || !form.cvv.trim()) {
      Alert.alert('Missing details', 'Please complete all card details.');
      return;
    }

    if (form.cardNumber.replace(/\s/g, '').length < 12) {
      Alert.alert('Invalid card', 'Please enter a valid card number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/bookings', bookingPayload);

      Alert.alert(
        'Payment Successful',
        response.data?.message || 'Your card payment and booking were completed.',
        [{ text: 'View bookings', onPress: () => router.replace('/bookings') }]
      );
    } catch (error) {
      Alert.alert('Payment failed', error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#264E86" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Card Checkout</Text>
          <Text style={styles.title}>Complete your booking for {attractionName}.</Text>
          <Text style={styles.subtitle}>
            This screen finalizes your reservation using the prototype card payment flow.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Package</Text>
          <Text style={styles.summaryValue}>{String(params.package || 'day-tour')}</Text>
          <Text style={styles.summaryLabel}>Travel date</Text>
          <Text style={styles.summaryValue}>{String(params.date || '')}</Text>
          <Text style={styles.summaryLabel}>Participants</Text>
          <Text style={styles.summaryValue}>{String(params.participants || '1')}</Text>
          <Text style={styles.totalPrice}>KES {totalLabel}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Cardholder name"
            value={form.cardholderName}
            onChangeText={(text) => setForm((current) => ({ ...current, cardholderName: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Card number"
            value={form.cardNumber}
            onChangeText={(text) => setForm((current) => ({ ...current, cardNumber: text }))}
            keyboardType="number-pad"
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="MM/YY"
              value={form.expiryDate}
              onChangeText={(text) => setForm((current) => ({ ...current, expiryDate: text }))}
            />

            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="CVV"
              value={form.cvv}
              onChangeText={(text) => setForm((current) => ({ ...current, cvv: text }))}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.payBtn, submitting && styles.payBtnDisabled]}
            onPress={handlePayment}
            disabled={submitting}
          >
            <Ionicons name="card-outline" size={18} color="white" />
            <Text style={styles.payBtnText}>{submitting ? 'Processing Payment...' : 'Pay by Card'}</Text>
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
  payBtn: {
    marginTop: 8,
    backgroundColor: '#264E86',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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

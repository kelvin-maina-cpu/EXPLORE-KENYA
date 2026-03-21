import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBooking, getAttraction } from '../../services/api';

export default function AttractionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [attraction, setAttraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [phone, setPhone] = useState('');
  const [participants, setParticipants] = useState('1');
  const [selectedPkg, setSelectedPkg] = useState('day-trip');

  const packages = [
    { id: 'day-trip', label: 'Day trip', price: 2500 },
    { id: 'weekend', label: 'Weekend', price: 8000 },
    { id: 'full-week', label: 'Full week', price: 25000 },
  ];

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const data = await getAttraction(id);
        setAttraction(data);
      } catch (error) {
        Alert.alert('Error', 'Could not load attraction');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchAttraction();
    }
  }, [id]);

  const parsedParticipants = useMemo(
    () => Math.max(1, Number.parseInt(participants || '1', 10) || 1),
    [participants]
  );
  const selectedPackage = packages.find((pkg) => pkg.id === selectedPkg);
  const total = selectedPackage ? selectedPackage.price * parsedParticipants : 0;

  const handleBook = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Please enter your M-Pesa phone number');
      return;
    }

    setBooking(true);
    try {
      await createBooking({
        attractionId: id,
        package: selectedPkg,
        date: new Date().toISOString(),
        participants: parsedParticipants,
        paymentMethod: 'mpesa',
        totalAmount: total,
        phoneNumber: phone.trim(),
      });

      Alert.alert('Booking confirmed!', 'Check your phone for the M-Pesa payment prompt.', [
        {
          text: 'View bookings',
          onPress: () => router.push('/(tabs)/bookings'),
        },
      ]);
    } catch (error) {
      Alert.alert('Booking failed', error.response?.data?.message || error.message || 'Please try again');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0F6E56" />
      </SafeAreaView>
    );
  }

  if (!attraction) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.notFound}>Not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>{'\u{1F33F}'}</Text>
          <Text style={styles.heroTitle}>{attraction.name}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{attraction.category || 'Wildlife'}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{attraction.description}</Text>

          <Text style={styles.sectionTitle}>Choose package</Text>
          <View style={styles.packages}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.pkg, selectedPkg === pkg.id && styles.pkgActive]}
                onPress={() => setSelectedPkg(pkg.id)}
              >
                <Text style={[styles.pkgLabel, selectedPkg === pkg.id && styles.pkgLabelActive]}>
                  {pkg.label}
                </Text>
                <Text style={[styles.pkgPrice, selectedPkg === pkg.id && styles.pkgPriceActive]}>
                  KES {pkg.price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsRow}>
            <TouchableOpacity
              style={styles.counter}
              onPress={() => setParticipants(String(Math.max(1, parsedParticipants - 1)))}
            >
              <Text style={styles.counterText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.participantNum}>{parsedParticipants}</Text>
            <TouchableOpacity style={styles.counter} onPress={() => setParticipants(String(parsedParticipants + 1))}>
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mpesaBox}>
            <View style={styles.mpesaHeader}>
              <Text style={styles.mpesaBadge}>M-Pesa</Text>
              <Text style={styles.mpesaTitle}>Pay with M-Pesa</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="07XX XXX XXX"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total amount</Text>
              <Text style={styles.totalAmount}>KES {total.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, booking && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={booking}
          >
            {booking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.bookBtnText}>Book now with M-Pesa</Text>}
          </TouchableOpacity>

          {/* Admin only — broadcast button */}
          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={() => router.push({
              pathname: `/broadcast/${id}`,
              params: { attractionName: attraction.name }
            })}
          >
            <Text style={styles.broadcastBtnText}>🔴 Start Live Camera</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  content: {
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFFE',
  },
  notFound: {
    textAlign: 'center',
    color: '#1A1A1A',
    fontSize: 16,
  },
  hero: {
    backgroundColor: '#0F6E56',
    padding: 24,
    paddingTop: 52,
    paddingBottom: 32,
    alignItems: 'center',
  },
  back: {
    position: 'absolute',
    top: 52,
    left: 20,
  },
  backText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  body: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
  },
  packages: {
    flexDirection: 'row',
    gap: 10,
  },
  pkg: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pkgActive: {
    borderColor: '#0F6E56',
    backgroundColor: '#E1F5EE',
  },
  pkgLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  pkgLabelActive: {
    color: '#0F6E56',
    fontWeight: '500',
  },
  pkgPrice: {
    fontSize: 12,
    color: '#999999',
  },
  pkgPriceActive: {
    color: '#0F6E56',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  counter: {
    backgroundColor: '#E1F5EE',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 20,
    color: '#0F6E56',
    fontWeight: '500',
  },
  participantNum: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 30,
    textAlign: 'center',
  },
  mpesaBox: {
    backgroundColor: '#E1F5EE',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  mpesaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mpesaBadge: {
    backgroundColor: '#0F6E56',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mpesaTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#085041',
  },
  phoneInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#B0DDD0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#085041',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F6E56',
  },
  bookBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  bookBtnDisabled: {
    backgroundColor: '#5DCAA5',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  broadcastBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#cc0000',
  },
  broadcastBtnText: { 
    color: '#cc0000', 
    fontSize: 15, 
    fontWeight: '600' 
  },
});

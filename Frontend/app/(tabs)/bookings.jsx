import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyBookings } from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';

export default function BookingsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    paid: { bg: theme.colors.tabActiveBackground, text: theme.colors.secondary },
    pending: { bg: '#FAEEDA', text: '#BA7517' },
    failed: { bg: '#FCEBEB', text: '#A32D2D' },
  };

  useEffect(() => {
    void fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Bookings load error:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const renderBooking = ({ item }) => {
    const status = item.paymentStatus || 'pending';
    const colors = statusColors[status] || statusColors.pending;
    const statusLabel =
      status === 'paid'
        ? t('status_paid')
        : status === 'failed'
          ? t('status_failed')
          : t('status_pending');

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.attractionId?.name || t('bookings_attraction')}</Text>
            <Text style={[styles.cardDate, { color: theme.colors.textMuted }]}>
              {new Date(item.date).toLocaleDateString('en-KE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.cardDetails}>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>{t('bookings_package')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.package}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>{t('bookings_visitors')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.participants}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>{t('bookings_total')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>KES {item.totalAmount?.toLocaleString()}</Text>
          </View>
        </View>

        {item.mpesaReceiptNumber ? (
          <View style={[styles.receipt, { backgroundColor: theme.colors.tabActiveBackground }]}>
            <Text style={[styles.receiptText, { color: theme.colors.secondary }]}>{t('bookings_receipt')}: {item.mpesaReceiptNumber}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.screenMuted }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.secondaryText }]}>{t('bookings_title')}</Text>
        <TouchableOpacity onPress={() => router.push('/attractions')}>
          <Text style={[styles.newBooking, { color: 'rgba(255,255,255,0.9)' }]}>{t('bookings_new')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.secondary} style={styles.loader} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{'\u{1F4CB}'}</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('bookings_none_title')}</Text>
          <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>{t('bookings_none_desc')}</Text>
          <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: theme.colors.secondary }]} onPress={() => router.push('/attractions')}>
            <Text style={[styles.exploreBtnText, { color: theme.colors.secondaryText }]}>{t('bookings_explore_cta')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          onRefresh={fetchBookings}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  header: {
    backgroundColor: '#0F6E56',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newBooking: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
  },
  loader: {
    marginTop: 60,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#666666',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  receipt: {
    backgroundColor: '#E1F5EE',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  receiptText: {
    fontSize: 12,
    color: '#0F6E56',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});

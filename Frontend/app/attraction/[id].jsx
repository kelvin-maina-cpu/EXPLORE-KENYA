import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAttraction, getCachedApiData } from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';

const CATEGORY_ICONS = {
  wildlife: 'paw-outline',
  culture: 'library-outline',
  cultural: 'library-outline',
  adventure: 'compass-outline',
  beach: 'sunny-outline',
  history: 'time-outline',
  historical: 'time-outline',
};

const formatCurrency = (amount) => `KES ${Number(amount || 0).toLocaleString('en-KE')}`;

export default function AttractionDetailsScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const [attraction, setAttraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weatherVisible, setWeatherVisible] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherNotice, setWeatherNotice] = useState('');

  useEffect(() => {
    const loadAttraction = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAttraction(id);
        setAttraction(data);
      } catch (loadError) {
        console.error('Attraction details error:', loadError);
        setError(loadError.response?.data?.message || loadError.message || t('attraction_unavailable'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void loadAttraction();
    } else {
      setError(t('attraction_unavailable'));
      setLoading(false);
    }
  }, [id, t]);

  const coordinates = attraction?.location?.coordinates;
  const latitude = coordinates?.length >= 2 ? coordinates[1] : null;
  const longitude = coordinates?.length >= 2 ? coordinates[0] : null;

  const residentFee = useMemo(() => attraction?.entryFee?.resident ?? 0, [attraction]);
  const nonResidentFee = useMemo(() => attraction?.entryFee?.nonResident ?? 0, [attraction]);
  const category = attraction?.category || 'wildlife';
  const categoryIcon = CATEGORY_ICONS[category.toLowerCase()] || 'leaf-outline';

  const loadDestinationWeather = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError('');
      setWeatherNotice('');

      const query = latitude !== null && longitude !== null
        ? `/weather/current?lat=${latitude}&lon=${longitude}`
        : `/weather/current?city=${encodeURIComponent(attraction?.county || attraction?.name || 'Nairobi')}`;

      const { data } = await getCachedApiData(query, {
        policy: 'network-first',
        ttlMs: 30 * 60 * 1000,
      });
      setWeather(data.weather || null);
      setWeatherNotice(data.message || '');
    } catch (loadError) {
      setWeatherError('Unable to load weather for this destination right now.');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const toggleWeather = async () => {
    if (!weatherVisible && !weather && !weatherLoading) {
      await loadDestinationWeather();
    }

    setWeatherVisible((current) => !current);
  };

  const openBooking = () => {
    router.push({
      pathname: '/checkout/card',
      params: {
        attractionId: String(attraction?._id || id || ''),
        attractionName: String(attraction?.name || t('map_destination_label')),
        package: 'day-tour',
        date: new Date().toISOString().split('T')[0],
        participants: '1',
        phoneNumber: '',
        totalAmount: String(nonResidentFee || residentFee || 0),
        totalLabel: String(nonResidentFee || residentFee || 0),
      },
    });
  };

  const openGps = () => {
    router.push({
      pathname: `/map/${attraction?._id || id}`,
      params: {
        latitude: latitude !== null ? String(latitude) : '',
        longitude: longitude !== null ? String(longitude) : '',
        name: attraction?.name || 'Destination',
        description: attraction?.description || '',
      },
    });
  };

  const openGoLive = () => {
    router.push({
      pathname: `/broadcast/${attraction?._id || id}`,
      params: {
        attractionName: attraction?.name || t('broadcast_park_camera'),
      },
    });
  };

  const openInAppPage = (url, title) => {
    if (!url) {
      return;
    }

    router.push({
      pathname: '/in-app-browser',
      params: {
        url,
        title,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={styles.loadingText}>{t('attraction_loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error || !attraction) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t('attraction_unavailable')}</Text>
          <Text style={styles.errorText}>{error || t('attraction_not_found')}</Text>
          <TouchableOpacity style={styles.backPrimary} onPress={() => router.back()}>
            <Text style={styles.backPrimaryText}>{t('attraction_back_to_list')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name={categoryIcon} size={18} color="#173457" />
            <Text style={styles.heroBadgeText}>{category}</Text>
          </View>
          <Text style={styles.heroTitle}>{attraction.name}</Text>
          <Text style={styles.heroCopy}>{attraction.description || t('attraction_discover_copy')}</Text>
        </View>

        <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('attraction_resident_fee')}</Text>
            <Text style={styles.statValue}>{formatCurrency(residentFee)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('attraction_nonresident_fee')}</Text>
            <Text style={styles.statValue}>{formatCurrency(nonResidentFee)}</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>{t('attraction_quick_actions')}</Text>

          <TouchableOpacity style={styles.primaryAction} onPress={openBooking}>
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <View style={styles.actionCopy}>
              <Text style={styles.primaryActionTitle}>{t('attraction_book_now')}</Text>
              <Text style={styles.primaryActionText}>{t('attraction_book_copy')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={openGoLive}>
            <Ionicons name="videocam-outline" size={20} color="#173457" />
            <View style={styles.actionCopy}>
              <Text style={styles.secondaryActionTitle}>{t('attraction_go_live')}</Text>
              <Text style={styles.secondaryActionText}>{t('attraction_go_live_copy')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryAction, (latitude === null || longitude === null) && styles.disabledAction]}
            onPress={openGps}
            disabled={latitude === null || longitude === null}
          >
            <Ionicons name="navigate-outline" size={20} color="#173457" />
            <View style={styles.actionCopy}>
              <Text style={styles.secondaryActionTitle}>{t('attraction_gps_navigation')}</Text>
              <Text style={styles.secondaryActionText}>
                {latitude === null || longitude === null
                  ? t('attraction_gps_missing')
                  : t('attraction_gps_copy')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={() => { void toggleWeather(); }}>
            <Ionicons name="partly-sunny-outline" size={20} color="#173457" />
            <View style={styles.actionCopy}>
              <Text style={styles.secondaryActionTitle}>Destination Weather</Text>
              <Text style={styles.secondaryActionText}>
                {weatherVisible
                  ? 'Hide the latest weather snapshot for this destination.'
                  : 'Show the current weather before you book or navigate.'}
              </Text>
            </View>
          </TouchableOpacity>

          {attraction.websiteUrl ? (
            <TouchableOpacity style={styles.secondaryAction} onPress={() => { openInAppPage(attraction.websiteUrl, `${attraction.name} Website`); }}>
              <Ionicons name="globe-outline" size={20} color="#173457" />
              <View style={styles.actionCopy}>
                <Text style={styles.secondaryActionTitle}>Visit Official Website</Text>
                <Text style={styles.secondaryActionText}>
                  Open the official destination website in your browser.
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {attraction.bookingUrl ? (
            <TouchableOpacity style={styles.secondaryAction} onPress={() => { openInAppPage(attraction.bookingUrl, `${attraction.name} Booking`); }}>
              <Ionicons name="open-outline" size={20} color="#173457" />
              <View style={styles.actionCopy}>
                <Text style={styles.secondaryActionTitle}>Book Online</Text>
                <Text style={styles.secondaryActionText}>
                  Continue to the official booking page for this attraction.
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {weatherVisible ? (
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <View>
                <Text style={styles.sectionTitle}>Current Weather</Text>
                <Text style={styles.weatherLocation}>{weather?.city || attraction.county || attraction.name}</Text>
              </View>
              <TouchableOpacity style={styles.weatherRefresh} onPress={() => { void loadDestinationWeather(); }}>
                <Ionicons name="refresh-outline" size={18} color="#0F6E56" />
              </TouchableOpacity>
            </View>

            {weatherLoading ? (
              <View style={styles.weatherLoadingRow}>
                <ActivityIndicator size="small" color="#0F6E56" />
                <Text style={styles.weatherLoadingText}>Loading latest destination weather...</Text>
              </View>
            ) : weatherError ? (
              <Text style={styles.weatherErrorText}>{weatherError}</Text>
            ) : weather ? (
              <>
                {weatherNotice ? <Text style={styles.weatherNotice}>{weatherNotice}</Text> : null}

                <View style={[styles.weatherTopRow, isCompact && styles.weatherTopRowCompact]}>
                  <View style={styles.weatherCopy}>
                    <Text style={styles.weatherTemperature}>{weather.temperature}°C</Text>
                    <Text style={styles.weatherDescription}>{weather.description}</Text>
                    <Text style={styles.weatherFeelsLike}>Feels like {weather.feelsLike}°C</Text>
                  </View>
                  <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
                </View>

                <View style={[styles.weatherStatsRow, isCompact && styles.weatherStatsRowCompact]}>
                  <View style={styles.weatherStat}>
                    <Text style={styles.weatherStatLabel}>Humidity</Text>
                    <Text style={styles.weatherStatValue}>{weather.humidity ?? 'N/A'}%</Text>
                  </View>
                  <View style={styles.weatherStat}>
                    <Text style={styles.weatherStatLabel}>Wind</Text>
                    <Text style={styles.weatherStatValue}>{weather.windSpeed ?? 'N/A'} m/s</Text>
                  </View>
                  <View style={styles.weatherStat}>
                    <Text style={styles.weatherStatLabel}>Visibility</Text>
                    <Text style={styles.weatherStatValue}>
                      {weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.weatherEmptyText}>No weather data available yet.</Text>
            )}
          </View>
        ) : null}

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t('attraction_location')}</Text>
          <Text style={styles.detailsText}>
            {latitude !== null && longitude !== null
              ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              : t('attraction_coords_missing')}
          </Text>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173457',
  },
  heroCard: {
    backgroundColor: '#173457',
    borderRadius: 28,
    padding: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F1E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#173457',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroCopy: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#D4DDEC',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsRowCompact: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#66707C',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    color: '#1D2D45',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D2D45',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F6E56',
    borderRadius: 18,
    padding: 16,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9E0EA',
  },
  disabledAction: {
    opacity: 0.55,
  },
  actionCopy: {
    flex: 1,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  primaryActionText: {
    marginTop: 4,
    color: '#D9F2EB',
    fontSize: 13,
    lineHeight: 19,
  },
  secondaryActionTitle: {
    color: '#173457',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryActionText: {
    marginTop: 4,
    color: '#66707C',
    fontSize: 13,
    lineHeight: 19,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 18,
  },
  detailsText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#66707C',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 18,
    gap: 14,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  weatherLocation: {
    marginTop: 4,
    fontSize: 13,
    color: '#66707C',
    fontWeight: '700',
  },
  weatherRefresh: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4F0',
  },
  weatherLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#66707C',
    fontWeight: '700',
  },
  weatherErrorText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#A0463A',
  },
  weatherNotice: {
    fontSize: 13,
    lineHeight: 19,
    color: '#0F6E56',
    backgroundColor: '#E8F4F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  weatherTopRowCompact: {
    alignItems: 'flex-start',
  },
  weatherCopy: {
    flex: 1,
  },
  weatherTemperature: {
    fontSize: 34,
    fontWeight: '900',
    color: '#173457',
  },
  weatherDescription: {
    marginTop: 4,
    fontSize: 15,
    color: '#1D2D45',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weatherFeelsLike: {
    marginTop: 6,
    fontSize: 13,
    color: '#66707C',
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  weatherStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weatherStatsRowCompact: {
    flexDirection: 'column',
  },
  weatherStat: {
    flex: 1,
    backgroundColor: '#FFF7EC',
    borderRadius: 16,
    padding: 12,
  },
  weatherStatLabel: {
    fontSize: 11,
    color: '#8A745B',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  weatherStatValue: {
    marginTop: 6,
    fontSize: 15,
    color: '#173457',
    fontWeight: '900',
  },
  weatherEmptyText: {
    fontSize: 14,
    color: '#66707C',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#173457',
    fontWeight: '700',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1D2D45',
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#66707C',
  },
  backPrimary: {
    marginTop: 18,
    backgroundColor: '#173457',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

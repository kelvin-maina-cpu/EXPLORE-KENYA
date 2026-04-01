import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const KENYA_AIRPORTS = [
  { label: 'Nairobi (NBO)', code: 'NBO' },
  { label: 'Mombasa (MBA)', code: 'MBA' },
  { label: 'Kisumu (KIS)', code: 'KIS' },
  { label: 'Eldoret (EDL)', code: 'EDL' },
];

const WEATHER_CITIES = ['Nairobi', 'Mombasa', 'Maasai Mara', 'Amboseli', 'Diani Beach', 'Nakuru', 'Lamu'];

const STATUS_COLORS = {
  active: '#0F6E56',
  landed: '#264E86',
  scheduled: '#C8A020',
  cancelled: '#CC3333',
  incident: '#CC3333',
  diverted: '#9C4400',
};

export default function TravelPlannerScreen() {
  const { t, language } = useLocale();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('weather');
  const [weatherData, setWeatherData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Nairobi');
  const [flights, setFlights] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState('NBO');
  const [destAirport, setDestAirport] = useState('');
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    void fetchKenyaWeather();
  }, []);

  useEffect(() => {
    if (activeTab === 'weather') {
      void fetchForecast(selectedCity);
    }
  }, [selectedCity, activeTab]);

  useEffect(() => {
    if (activeTab === 'flights') {
      void fetchFlights();
    }
  }, [selectedAirport, activeTab]);

  const fetchKenyaWeather = async () => {
    try {
      setLoadingWeather(true);
      setError(null);
      const { data } = await api.get('/weather/kenya');
      setWeatherData(data.destinations?.filter((destination) => !destination.error) || []);
    } catch {
      setError(t('travel_error_weather'));
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchForecast = async (city) => {
    try {
      setLoadingForecast(true);
      const { data } = await api.get(`/weather/forecast?city=${encodeURIComponent(city)}`);
      setForecastData(data.forecast || []);
    } catch {
      setForecastData([]);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchFlights = async () => {
    try {
      setLoadingFlights(true);
      setError(null);
      const url = destAirport
        ? `/flights/search?dep=${selectedAirport}&arr=${destAirport}`
        : `/flights/kenya?airport=${selectedAirport}`;
      const { data } = await api.get(url);
      setFlights(data.flights || []);
    } catch {
      setError(t('travel_error_flights'));
      setFlights([]);
    } finally {
      setLoadingFlights(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'weather') {
      await fetchKenyaWeather();
      await fetchForecast(selectedCity);
    } else {
      await fetchFlights();
    }
    setRefreshing(false);
  };

  const formatTime = (isoString) => {
    if (!isoString) {
      return 'N/A';
    }

    return new Date(isoString).toLocaleTimeString(language === 'sw' ? 'sw-KE' : 'en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }

    return new Date(dateString).toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedWeather = weatherData.find(
    (destination) => destination.name?.toLowerCase() === selectedCity.toLowerCase()
  );

  const renderWeatherTab = () => (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.secondary} />}
      >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {WEATHER_CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border },
              selectedCity === city && [styles.chipActive, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }],
            ]}
            onPress={() => setSelectedCity(city)}
          >
            <Text style={[styles.chipText, { color: theme.colors.textMuted }, selectedCity === city && [styles.chipTextActive, { color: theme.colors.secondaryText }]]}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingWeather ? (
        <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: 40 }} />
      ) : selectedWeather ? (
        <View style={[styles.currentWeatherCard, { backgroundColor: theme.colors.hero }]}>
          <View style={styles.weatherTop}>
            <View>
              <Text style={[styles.weatherCity, { color: theme.colors.heroText }]}>{selectedWeather.name}</Text>
              <Text style={[styles.weatherDesc, { color: theme.colors.heroMuted }]}>{selectedWeather.description}</Text>
            </View>
            <Image source={{ uri: selectedWeather.icon }} style={styles.weatherIcon} />
          </View>

          <Text style={[styles.weatherTemp, { color: theme.colors.heroText }]}>{selectedWeather.temperature}°C</Text>
          <Text style={[styles.weatherFeels, { color: theme.colors.heroMuted }]}>{t('travel_feels_like')} {selectedWeather.feelsLike}°C</Text>

          <View style={[styles.weatherStats, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatIcon}>💧</Text>
              <Text style={[styles.weatherStatValue, { color: theme.colors.heroText }]}>{selectedWeather.humidity}%</Text>
              <Text style={[styles.weatherStatLabel, { color: theme.colors.heroMuted }]}>{t('travel_humidity')}</Text>
            </View>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatIcon}>💨</Text>
              <Text style={[styles.weatherStatValue, { color: theme.colors.heroText }]}>{selectedWeather.windSpeed} m/s</Text>
              <Text style={[styles.weatherStatLabel, { color: theme.colors.heroMuted }]}>{t('travel_wind')}</Text>
            </View>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatIcon}>👁</Text>
              <Text style={[styles.weatherStatValue, { color: theme.colors.heroText }]}>
                {selectedWeather.visibility ? `${(selectedWeather.visibility / 1000).toFixed(1)}km` : 'N/A'}
              </Text>
              <Text style={[styles.weatherStatLabel, { color: theme.colors.heroMuted }]}>{t('travel_visibility')}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('travel_forecast_title')}</Text>
      </View>

      {loadingForecast ? (
        <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginTop: 16 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {forecastData.map((day, index) => (
            <View key={`${day.date}-${index}`} style={[styles.forecastCard, { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border }]}>
              <Text style={[styles.forecastDate, { color: theme.colors.textMuted }]}>{formatDate(day.date)}</Text>
              <Image source={{ uri: day.icon }} style={styles.forecastIcon} />
              <Text style={[styles.forecastDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {day.description}
              </Text>
              <Text style={[styles.forecastTemp, { color: theme.colors.text }]}>
                {day.maxTemp}° / {day.minTemp}°
              </Text>
              <Text style={[styles.forecastHumidity, { color: theme.colors.secondary }]}>💧{day.humidity}%</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('travel_all_destinations')}</Text>
      </View>

      {weatherData.map((destination, index) => (
        <TouchableOpacity
          key={`${destination.name}-${index}`}
          style={[styles.destWeatherCard, { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border }]}
          onPress={() => setSelectedCity(destination.name)}
        >
          <View style={styles.destWeatherLeft}>
            <Image source={{ uri: destination.icon }} style={styles.destWeatherIcon} />
            <View>
              <Text style={[styles.destWeatherName, { color: theme.colors.text }]}>{destination.name}</Text>
              <Text style={[styles.destWeatherDesc, { color: theme.colors.textMuted }]}>{destination.description}</Text>
            </View>
          </View>
          <Text style={[styles.destWeatherTemp, { color: theme.colors.secondary }]}>{destination.temperature}°C</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFlightsTab = () => (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.secondary} />}
      >
      <View style={[styles.searchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.searchLabel, { color: theme.colors.textMuted }]}>{t('travel_departure_airport')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {KENYA_AIRPORTS.map((airport) => (
            <TouchableOpacity
              key={airport.code}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border },
                selectedAirport === airport.code && [styles.chipActive, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }],
              ]}
              onPress={() => setSelectedAirport(airport.code)}
            >
              <Text style={[styles.chipText, { color: theme.colors.textMuted }, selectedAirport === airport.code && [styles.chipTextActive, { color: theme.colors.secondaryText }]]}>
                {airport.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.searchLabel, { color: theme.colors.textMuted }]}>{t('travel_destination_optional')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.colors.cardAlt, color: theme.colors.inputText, borderColor: theme.colors.borderSoft }]}
            placeholder={t('travel_search_airport_placeholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={destAirport}
            onChangeText={(text) => setDestAirport(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
          />
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.colors.secondary }]} onPress={() => void fetchFlights()}>
            <Text style={[styles.searchBtnText, { color: theme.colors.secondaryText }]}>{t('search')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loadingFlights ? (
        <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: 40 }} />
      ) : flights.length > 0 ? (
        <>
          <Text style={[styles.flightCount, { color: theme.colors.textMuted }]}>{flights.length} {t('travel_flights_found')}</Text>
          {flights.map((flight, index) => (
            <View key={`${flight.flightNumber || flight.airline}-${index}`} style={[styles.flightCard, { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border }]}>
              <View style={styles.flightHeader}>
                <Text style={[styles.flightNumber, { color: theme.colors.text }]}>{flight.flightNumber || flight.airline}</Text>
                <View
                  style={[
                    styles.flightStatus,
                    { backgroundColor: `${STATUS_COLORS[flight.status] || '#555'}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.flightStatusText,
                      { color: STATUS_COLORS[flight.status] || '#aaa' },
                    ]}
                  >
                    {flight.status?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.flightRoute}>
                <View style={styles.flightEndpoint}>
                  <Text style={[styles.flightIata, { color: theme.colors.heroText }]}>{flight.departure?.iata || selectedAirport}</Text>
                  <Text style={[styles.flightTime, { color: theme.colors.secondary }]}>{formatTime(flight.departure?.scheduled)}</Text>
                  <Text style={[styles.flightAirport, { color: theme.colors.placeholder }]} numberOfLines={1}>
                    {flight.departure?.airport || t('travel_departure_label')}
                  </Text>
                </View>

                <View style={styles.flightMiddle}>
                  <Text style={[styles.flightArrow, { color: theme.colors.secondary }]}>✈</Text>
                  <View style={[styles.flightLine, { backgroundColor: theme.colors.borderSoft }]} />
                </View>

                <View style={[styles.flightEndpoint, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.flightIata, { color: theme.colors.heroText }]}>{flight.arrival?.iata || flight.destinationIata || 'N/A'}</Text>
                  <Text style={[styles.flightTime, { color: theme.colors.secondary }]}>{formatTime(flight.arrival?.scheduled)}</Text>
                  <Text style={[styles.flightAirport, { color: theme.colors.placeholder }]} numberOfLines={1}>
                    {flight.arrival?.airport || flight.destination || t('travel_arrival_label')}
                  </Text>
                </View>
              </View>

              <View style={[styles.flightFooter, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.flightAirline, { color: theme.colors.textMuted }]}>{flight.airline}</Text>
                {flight.departure?.terminal && flight.departure.terminal !== 'N/A' ? (
                  <Text style={[styles.flightTerminal, { color: theme.colors.secondary }]}>{t('travel_terminal')} {flight.departure.terminal}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : (
        !loadingFlights && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('travel_no_flights_title')}</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>{t('travel_no_flights_desc')}</Text>
          </View>
        )
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.screenMuted }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.secondaryText }]}>{t('travel_title')}</Text>
          <Text style={[styles.headerSub, { color: theme.colors.heroEyebrow }]}>{t('travel_subtitle')}</Text>
        </View>
        <Text style={styles.headerEmoji}>🌍</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weather' && [styles.tabActive, { borderBottomColor: theme.colors.secondary }]]}
          onPress={() => setActiveTab('weather')}
        >
          <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'weather' && [styles.tabTextActive, { color: theme.colors.secondary }]]}>🌤 {t('travel_weather_tab')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'flights' && [styles.tabActive, { borderBottomColor: theme.colors.secondary }]]}
          onPress={() => setActiveTab('flights')}
        >
          <Text style={[styles.tabText, { color: theme.colors.textMuted }, activeTab === 'flights' && [styles.tabTextActive, { color: theme.colors.secondary }]]}>✈️ {t('travel_flights_tab')}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void onRefresh()}>
            <Text style={styles.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.content}>{activeTab === 'weather' ? renderWeatherTab() : renderFlightsTab()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303' },
  header: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerEmoji: { fontSize: 32 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#0F6E56' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#0F6E56' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  chipScroll: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2D2C28',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  chipActive: { backgroundColor: '#0F6E56', borderColor: '#0F6E56' },
  chipText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  currentWeatherCard: {
    backgroundColor: '#173457',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherCity: { fontSize: 22, fontWeight: '700', color: '#fff' },
  weatherDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },
  weatherIcon: { width: 64, height: 64 },
  weatherTemp: { fontSize: 52, fontWeight: '300', color: '#fff' },
  weatherFeels: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  weatherStat: { alignItems: 'center', gap: 4 },
  weatherStatIcon: { fontSize: 18 },
  weatherStatValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  weatherStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  sectionHeader: { marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F3F1EA' },
  forecastScroll: { marginBottom: 16 },
  forecastCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  forecastDate: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  forecastIcon: { width: 40, height: 40 },
  forecastDesc: { fontSize: 10, color: '#aaa', textAlign: 'center', textTransform: 'capitalize' },
  forecastTemp: { fontSize: 13, fontWeight: '700', color: '#F3F1EA', marginTop: 4 },
  forecastHumidity: { fontSize: 11, color: '#0FA37F', marginTop: 2 },
  destWeatherCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  destWeatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  destWeatherIcon: { width: 40, height: 40 },
  destWeatherName: { fontSize: 14, fontWeight: '600', color: '#F3F1EA' },
  destWeatherDesc: { fontSize: 12, color: '#aaa', textTransform: 'capitalize' },
  destWeatherTemp: { fontSize: 20, fontWeight: '700', color: '#0FA37F' },
  searchBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchLabel: { fontSize: 13, color: '#aaa', marginBottom: 8, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    letterSpacing: 2,
  },
  searchBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  flightCount: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  flightCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightNumber: { fontSize: 16, fontWeight: '700', color: '#F3F1EA' },
  flightStatus: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  flightStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightEndpoint: { flex: 1 },
  flightIata: { fontSize: 24, fontWeight: '800', color: '#fff' },
  flightTime: { fontSize: 14, fontWeight: '600', color: '#0FA37F', marginTop: 2 },
  flightAirport: { fontSize: 11, color: '#888', marginTop: 2 },
  flightMiddle: { alignItems: 'center', paddingHorizontal: 8 },
  flightArrow: { fontSize: 18, color: '#0F6E56', marginBottom: 4 },
  flightLine: { width: 40, height: 1, backgroundColor: '#444' },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#3A3936',
    paddingTop: 10,
  },
  flightAirline: { fontSize: 13, color: '#aaa' },
  flightTerminal: { fontSize: 13, color: '#0FA37F' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F3F1EA' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, width: width - 80 },
  errorBox: {
    backgroundColor: '#FCEBEB',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#A32D2D', fontSize: 13, flex: 1 },
  retryText: { color: '#A32D2D', fontWeight: '700', fontSize: 13 },
});

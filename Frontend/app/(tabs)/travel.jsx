import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

const KENYA_AIRPORTS = [
  { label: 'Nairobi (NBO)', icao: 'HKJK', iata: 'NBO' },
  { label: 'Mombasa (MBA)', icao: 'HKMO', iata: 'MBA' },
  { label: 'Kisumu (KIS)', icao: 'HKKI', iata: 'KIS' },
  { label: 'Eldoret (EDL)', icao: 'HKEL', iata: 'EDL' },
];

const WEATHER_CITIES = ['Nairobi', 'Mombasa', 'Maasai Mara', 'Amboseli', 'Diani Beach', 'Nakuru', 'Lamu'];

const STATUS_COLORS = {
  Scheduled: '#C8A020',
  Active: '#0F6E56',
  Landed: '#264E86',
  Cancelled: '#CC3333',
  Diverted: '#9C4400',
  Unknown: '#555',
};

export default function TravelPlannerScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const [activeTab, setActiveTab] = useState('weather');
  const [flightMode, setFlightMode] = useState('departures');
  const [weatherData, setWeatherData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Nairobi');
  const [flights, setFlights] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(KENYA_AIRPORTS[0]);
  const [flightSearch, setFlightSearch] = useState('');
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [flightNotice, setFlightNotice] = useState('');

  useEffect(() => {
    void fetchKenyaWeather();
  }, []);

  useEffect(() => {
    if (activeTab === 'weather') {
      void fetchForecast(selectedCity);
    }
  }, [activeTab, selectedCity]);

  useEffect(() => {
    if (activeTab === 'flights') {
      void fetchFlights();
    }
  }, [activeTab, flightMode, selectedAirport]);

  const fetchKenyaWeather = async () => {
    try {
      setLoadingWeather(true);
      setError(null);
      const { data } = await api.get('/weather/kenya');
      setWeatherData(data.destinations?.filter((destination) => !destination.error) || []);
    } catch {
      setError('Failed to load weather. Check your connection.');
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
      setFlightNotice('');
      const endpoint =
        flightMode === 'departures'
          ? `/flights/departures?icao=${selectedAirport.icao}`
          : `/flights/arrivals?icao=${selectedAirport.icao}`;
      const { data } = await api.get(endpoint);
      setFlights(data.flights || []);
      setFlightNotice(data.message || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load flights. Try again later.');
      setFlights([]);
    } finally {
      setLoadingFlights(false);
    }
  };

  const searchFlight = async () => {
    if (!flightSearch.trim()) {
      return;
    }

    try {
      setLoadingFlights(true);
      setError(null);
      setFlightNotice('');
      const { data } = await api.get(`/flights/search?flight=${flightSearch.trim()}`);
      setFlights(data.flights || []);
      setFlightNotice(data.message || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Flight ${flightSearch} not found.`);
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

    try {
      return new Date(isoString).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }

    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const selectedWeather = weatherData.find((destination) => destination.name?.toLowerCase() === selectedCity.toLowerCase());

  const renderWeatherTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F6E56" />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {WEATHER_CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={[styles.chip, selectedCity === city && styles.chipActive]}
            onPress={() => setSelectedCity(city)}
          >
            <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingWeather ? (
        <ActivityIndicator size="large" color="#0F6E56" style={styles.loaderSpacing} />
      ) : selectedWeather ? (
        <View style={styles.currentWeatherCard}>
          <View style={styles.weatherTop}>
            <View style={styles.flexOne}>
              <Text style={styles.weatherCity}>{selectedWeather.name}</Text>
              <Text style={styles.weatherDesc}>{selectedWeather.description}</Text>
            </View>
            <Image source={{ uri: selectedWeather.icon }} style={styles.weatherIcon} />
          </View>
          <Text style={styles.weatherTemp}>{selectedWeather.temperature}°C</Text>
          <Text style={styles.weatherFeels}>Feels like {selectedWeather.feelsLike}°C</Text>
          <View style={styles.weatherStats}>
            {[
              { icon: '💧', value: `${selectedWeather.humidity}%`, label: 'Humidity' },
              { icon: '🌬️', value: `${selectedWeather.windSpeed} m/s`, label: 'Wind' },
              {
                icon: '👁️',
                value: selectedWeather.visibility ? `${(selectedWeather.visibility / 1000).toFixed(1)}km` : 'N/A',
                label: 'Visibility',
              },
            ].map((stat) => (
              <View key={stat.label} style={styles.weatherStat}>
                <Text style={styles.weatherStatIcon}>{stat.icon}</Text>
                <Text style={styles.weatherStatValue}>{stat.value}</Text>
                <Text style={styles.weatherStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>7-Day Forecast</Text>
      {loadingForecast ? (
        <ActivityIndicator size="small" color="#0F6E56" style={styles.forecastLoader} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {forecastData.map((day, index) => (
            <View key={index} style={styles.forecastCard}>
              <Text style={styles.forecastDate}>{formatDate(day.date)}</Text>
              <Image source={{ uri: day.icon }} style={styles.forecastIcon} />
              <Text style={styles.forecastDesc} numberOfLines={1}>
                {day.description}
              </Text>
              <Text style={styles.forecastTemp}>
                {day.maxTemp}°/{day.minTemp}°
              </Text>
              <Text style={styles.forecastHumidity}>💧{day.humidity}%</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>All Destinations</Text>
      {weatherData.map((destination, index) => (
        <TouchableOpacity
          key={`${destination.name}-${index}`}
          style={styles.destWeatherCard}
          onPress={() => setSelectedCity(destination.name)}
        >
          <View style={styles.destWeatherLeft}>
            <Image source={{ uri: destination.icon }} style={styles.destWeatherIcon} />
            <View style={styles.flexOne}>
              <Text style={styles.destWeatherName}>{destination.name}</Text>
              <Text style={styles.destWeatherDesc}>{destination.description}</Text>
            </View>
          </View>
          <Text style={styles.destWeatherTemp}>{destination.temperature}°C</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFlightsTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F6E56" />}
    >
      {flightNotice ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{flightNotice}</Text>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Text style={styles.searchLabel}>Search by Flight Number</Text>
        <View style={[styles.inputRow, isCompact && styles.inputRowCompact]}>
          <TextInput
            style={[styles.searchInput, isCompact && styles.searchInputCompact]}
            placeholder="e.g. KQ101, ET316"
            placeholderTextColor="#666"
            value={flightSearch}
            onChangeText={(text) => setFlightSearch(text.toUpperCase())}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.searchBtn, isCompact && styles.searchBtnCompact]} onPress={searchFlight}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.searchLabel}>Kenya Airports</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {KENYA_AIRPORTS.map((airport) => (
          <TouchableOpacity
            key={airport.icao}
            style={[styles.chip, selectedAirport.icao === airport.icao && styles.chipActive]}
            onPress={() => setSelectedAirport(airport)}
          >
            <Text style={[styles.chipText, selectedAirport.icao === airport.icao && styles.chipTextActive]}>
              {airport.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.modeToggle}>
        {['departures', 'arrivals'].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeBtn, flightMode === mode && styles.modeBtnActive]}
            onPress={() => setFlightMode(mode)}
          >
            <Text style={[styles.modeBtnText, flightMode === mode && styles.modeBtnTextActive]}>
              {mode === 'departures' ? 'Departures' : 'Arrivals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingFlights ? (
        <ActivityIndicator size="large" color="#0F6E56" style={styles.loaderSpacing} />
      ) : flights.length > 0 ? (
        <>
          <Text style={styles.flightCount}>{flights.length} flights found</Text>
          {flights.map((flight, index) => {
            const statusColor = STATUS_COLORS[flight.status] || '#555';

            return (
              <View key={`${flight.flightNumber}-${index}`} style={styles.flightCard}>
                <View style={[styles.flightHeader, isCompact && styles.flightHeaderCompact]}>
                  <View>
                    <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                    <Text style={styles.flightAirline}>{flight.airline}</Text>
                  </View>
                  <View style={[styles.flightStatus, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.flightStatusText, { color: statusColor }]}>{flight.status}</Text>
                  </View>
                </View>

                <View style={[styles.flightRoute, isCompact && styles.flightRouteCompact]}>
                  <View style={[styles.flightEndpoint, isCompact && styles.flightEndpointCompact]}>
                    <Text style={styles.flightIata}>{selectedAirport.iata}</Text>
                    <Text style={styles.flightTime}>
                      {formatTime(flightMode === 'departures' ? flight.scheduledTime : flight.departure?.scheduledTime)}
                    </Text>
                    <Text style={styles.flightAirportName} numberOfLines={1}>
                      {selectedAirport.label}
                    </Text>
                  </View>

                  <View style={[styles.flightMiddle, isCompact && styles.flightMiddleCompact]}>
                    <Text style={styles.flightArrow}>{flightMode === 'departures' ? '✈' : '🛬'}</Text>
                    <View style={styles.flightLine} />
                  </View>

                  <View style={[styles.flightEndpoint, styles.flightEndpointRight, isCompact && styles.flightEndpointCompact]}>
                    <Text style={styles.flightIata}>
                      {flightMode === 'departures' ? flight.destinationIata || 'N/A' : flight.originIata || 'N/A'}
                    </Text>
                    <Text style={styles.flightTime}>
                      {formatTime(flightMode === 'departures' ? flight.arrival?.scheduledTime : flight.scheduledTime)}
                    </Text>
                    <Text style={styles.flightAirportName} numberOfLines={2}>
                      {flightMode === 'departures' ? flight.destination || 'N/A' : flight.origin || 'N/A'}
                    </Text>
                  </View>
                </View>

                {(flight.terminal !== 'N/A' || flight.gate !== 'N/A' || flight.aircraft !== 'N/A') ? (
                  <View style={styles.flightFooter}>
                    {flight.terminal !== 'N/A' ? <Text style={styles.flightDetail}>Terminal {flight.terminal}</Text> : null}
                    {flight.gate !== 'N/A' ? <Text style={styles.flightDetail}>Gate {flight.gate}</Text> : null}
                    {flight.aircraft !== 'N/A' ? <Text style={styles.flightDetail}>{flight.aircraft}</Text> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No flights found</Text>
          <Text style={styles.emptyDesc}>
            {flightNotice || 'Try searching by flight number or check another airport.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Travel Planner</Text>
          <Text style={styles.headerSub}>Flights & Weather for Kenya</Text>
        </View>
        <Text style={styles.headerEmoji}>🌍</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'weather', label: 'Weather' },
          { key: 'flights', label: 'Flights' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={[styles.errorBox, isCompact && styles.errorBoxCompact]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.content}>{activeTab === 'weather' ? renderWeatherTab() : renderFlightsTab()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303' },
  flexOne: { flex: 1 },
  loaderSpacing: { marginTop: 40 },
  forecastLoader: { marginTop: 12 },
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
  tabBar: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
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
  currentWeatherCard: { backgroundColor: '#173457', borderRadius: 20, padding: 20, marginBottom: 16 },
  weatherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F3F1EA', marginVertical: 12 },
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
    gap: 12,
  },
  destWeatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  destWeatherIcon: { width: 40, height: 40 },
  destWeatherName: { fontSize: 14, fontWeight: '600', color: '#F3F1EA' },
  destWeatherDesc: { fontSize: 12, color: '#aaa', textTransform: 'capitalize' },
  destWeatherTemp: { fontSize: 20, fontWeight: '700', color: '#0FA37F' },
  infoBox: {
    backgroundColor: 'rgba(15,110,86,0.14)',
    borderColor: 'rgba(15,110,86,0.32)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoText: { color: '#A9E2D4', fontSize: 13, lineHeight: 19 },
  searchBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchLabel: { fontSize: 13, color: '#aaa', marginBottom: 8, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputRowCompact: { flexDirection: 'column' },
  searchInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    letterSpacing: 1,
  },
  searchInputCompact: { width: '100%' },
  searchBtn: { backgroundColor: '#0F6E56', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  searchBtnCompact: { minHeight: 48, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#0F6E56' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  modeBtnTextActive: { color: '#fff' },
  flightCount: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  flightCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  flightHeaderCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  flightNumber: { fontSize: 18, fontWeight: '800', color: '#F3F1EA' },
  flightAirline: { fontSize: 12, color: '#aaa', marginTop: 2 },
  flightStatus: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  flightStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  flightRoute: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  flightRouteCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  flightEndpoint: { flex: 1 },
  flightEndpointCompact: { alignItems: 'flex-start' },
  flightEndpointRight: { alignItems: 'flex-end' },
  flightIata: { fontSize: 26, fontWeight: '800', color: '#fff' },
  flightTime: { fontSize: 14, fontWeight: '600', color: '#0FA37F', marginTop: 2 },
  flightAirportName: { fontSize: 11, color: '#888', marginTop: 2 },
  flightMiddle: { alignItems: 'center', paddingHorizontal: 8 },
  flightMiddleCompact: { paddingHorizontal: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flightArrow: { fontSize: 20, color: '#0F6E56', marginBottom: 4 },
  flightLine: { width: 40, height: 1, backgroundColor: '#444' },
  flightFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3936',
    paddingTop: 10,
  },
  flightDetail: {
    fontSize: 12,
    color: '#0FA37F',
    backgroundColor: 'rgba(15,163,127,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F3F1EA' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  errorBox: {
    backgroundColor: '#FCEBEB',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  errorBoxCompact: { alignItems: 'flex-start' },
  errorText: { color: '#A32D2D', fontSize: 13, flex: 1 },
  retryText: { color: '#A32D2D', fontWeight: '700', fontSize: 13 },
});

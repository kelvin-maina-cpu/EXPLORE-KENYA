import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLocale } from '../../context/LocalizationContext';

const isRecoverableLocationError = (error) => {
  const message = error?.message?.toLowerCase?.() || '';
  return (
    error?.code === 'E_LOCATION_SETTINGS_UNSATISFIED' ||
    message.includes('current location is unavailable') ||
    message.includes('location is unavailable') ||
    message.includes('location settings') ||
    message.includes('location request failed')
  );
};

const getLastKnownUserLocation = async () => {
  const lastKnownLocation = await Location.getLastKnownPositionAsync();
  if (!lastKnownLocation?.coords) {
    return null;
  }

  return {
    latitude: lastKnownLocation.coords.latitude,
    longitude: lastKnownLocation.coords.longitude,
  };
};

export default function NavigationScreen() {
  const { id, name, lat, lon } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const webViewRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const attractionLat = parseFloat(lat);
  const attractionLon = parseFloat(lon);

  useEffect(() => {
    startNavigation();
    return () => {
      try {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      } catch (e) {
        console.log('Cleanup error:', e);
      }
    };
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateETA = (distanceKm) => {
    const hours = distanceKm / 60;
    const minutes = Math.round(hours * 60);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  };

  const getMapHTML = () => {
    const userLat = userLocation?.latitude || attractionLat;
    const userLon = userLocation?.longitude || attractionLon;
    const safeName = (name || '').replace(/'/g, "\\'").replace(/"/g, '\\"');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; }
          #map { width: 100%; height: 100%; }
          .user-dot {
            background: #0F6E56;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            position: relative;
          }
          .user-pulse {
            background: rgba(15,110,86,0.25);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            position: absolute;
            top: -10px;
            left: -10px;
            animation: pulse 2s ease-out infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .dest-pin { font-size: 36px; line-height: 1; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          try {
            const map = L.map('map', { zoomControl: true, attributionControl: true });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }).addTo(map);

            const userIcon = L.divIcon({
              html: '<div style="position:relative;"><div class="user-pulse"></div><div class="user-dot"></div></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              className: '',
            });

            const destIcon = L.divIcon({
              html: '<div class="dest-pin">📍</div>',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
              className: '',
            });

            window.userMarker = L.marker(
              [${userLat}, ${userLon}],
              { icon: userIcon }
            ).addTo(map).bindPopup('<b>${String(t('navigation_you_are_here')).replace(/'/g, "\\'").replace(/"/g, '\\"')}</b>');

            L.marker(
              [${attractionLat}, ${attractionLon}],
              { icon: destIcon }
            ).addTo(map)
              .bindPopup('<b>${safeName}</b><br><small>${String(t('navigation_your_destination')).replace(/'/g, "\\'").replace(/"/g, '\\"')}</small>')
              .openPopup();

            window.routeLine = L.polyline(
              [[${userLat}, ${userLon}], [${attractionLat}, ${attractionLon}]],
              { color: '#0F6E56', weight: 5, opacity: 0.85, dashArray: '12, 6' }
            ).addTo(map);

            map.fitBounds(
              [[${userLat}, ${userLon}], [${attractionLat}, ${attractionLon}]],
              { padding: [70, 70] }
            );

            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('mapReady');
          } catch(e) {
            document.body.innerHTML = '<p style="color:red;padding:20px;">${String(t('navigation_map_error')).replace(/'/g, "\\'").replace(/"/g, '\\"')}: ' + e.message + '</p>';
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('mapError:' + e.message);
          }
        </script>
      </body>
      </html>
    `;
  };

  const startNavigation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('navigation_permission_denied'), t('navigation_permission_required'));
        router.back();
        return;
      }

      let currentUserLocation = null;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        currentUserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (locationError) {
        if (!isRecoverableLocationError(locationError)) {
          throw locationError;
        }

        currentUserLocation = await getLastKnownUserLocation();

        if (!currentUserLocation) {
          Alert.alert(t('error'), t('map_location_settings'));
          setLoading(false);
          return;
        }

        Alert.alert(t('map_unavailable'), `${t('map_location_settings')} ${t('map_using_last_known')}`);
      }

      const { latitude, longitude } = currentUserLocation;
      setUserLocation({ latitude, longitude });

      const dist = calculateDistance(latitude, longitude, attractionLat, attractionLon);
      setDistance(dist.toFixed(1));
      setEta(calculateETA(dist));

      setLoading(false);

      setTimeout(async () => {
        try {
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 20,
            },
            (newLocation) => {
              const { latitude: newLat, longitude: newLon } = newLocation.coords;
              setUserLocation({ latitude: newLat, longitude: newLon });

              const newDist = calculateDistance(newLat, newLon, attractionLat, attractionLon);
              setDistance(newDist.toFixed(1));
              setEta(calculateETA(newDist));
            }
          );
          setLocationSubscription(subscription);
        } catch (watchErr) {
          console.log('Watch position error (non-fatal):', watchErr);
        }
      }, 2000);

    } catch (err) {
      console.error('Navigation error:', err);
      Alert.alert(t('error'), t('navigation_error'));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={styles.loadingText}>{t('navigation_loading')}</Text>
      </View>
    );
  }

  const onWebViewMessage = (event) => {
    const msg = event.nativeEvent.data;
    if (msg === 'mapReady') {
      setMapReady(true);
    } else if (msg.startsWith('mapError:')) {
      console.log('Map JS error:', msg);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: getMapHTML() }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
        originWhitelist={['*']}
        onMessage={onWebViewMessage}
        onError={(e) => console.log('WebView error:', e.nativeEvent)}
        onHttpError={(e) => console.log('HTTP error:', e.nativeEvent)}
        scalesPageToFit={false}
      />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t('back')}</Text>
        </TouchableOpacity>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationName} numberOfLines={1}>{name}</Text>
          <Text style={styles.destinationSub}>{t('navigation_live')}</Text>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{distance} km</Text>
            <Text style={styles.statLabel}>{t('navigation_distance')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{eta}</Text>
            <Text style={styles.statLabel}>{t('map_eta')}</Text>
          </View>
        </View>

        <View style={styles.directionHint}>
          <Text style={styles.directionIcon}>🧭</Text>
          <Text style={styles.directionText}>
            {t('navigation_navigate_to')} {name}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fffe',
    gap: 16,
  },
  loadingText: { fontSize: 16, color: '#0F6E56', fontWeight: '500' },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 110, 86, 0.95)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  destinationInfo: { flex: 1 },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  destinationSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1F5EE',
    justifyContent: 'space-around',
  },
  statCard: { alignItems: 'center', gap: 4, flex: 1 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0F6E56' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E1F5EE',
  },
  directionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5EE',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  directionIcon: { fontSize: 24 },
  directionText: {
    flex: 1,
    fontSize: 14,
    color: '#085041',
    lineHeight: 20,
    fontWeight: '500',
  },
});


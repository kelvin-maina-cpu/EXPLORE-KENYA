import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useLocale } from '../../context/LocalizationContext';
import api from '../../services/api';

const DEFAULT_REGION = {
  latitude: -1.286389,
  longitude: 36.817223,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

const ARRIVAL_THRESHOLD_METERS = 80;
const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (pointA, pointB) => {
  if (!pointA || !pointB) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadius = 6371000;
  const latitudeDelta = toRadians(pointB.latitude - pointA.latitude);
  const longitudeDelta = toRadians(pointB.longitude - pointA.longitude);
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * arc;
};

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) {
    return '--';
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--';
  }

  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

const formatRoadName = (step) => {
  const roadName = step?.name?.trim();
  return roadName || '';
};

const buildInstruction = (step, t) => {
  const maneuver = step?.maneuver || {};
  const roadName = formatRoadName(step);

  if (maneuver.type === 'arrive') {
    return t('map_instruction_arrive');
  }

  if (maneuver.type === 'depart') {
    return t('map_instruction_start');
  }

  return roadName
    ? `${t('map_instruction_follow_road')} ${roadName}.`
    : t('map_instruction_follow_route');
};

const getStepPoint = (step) => {
  const coordinates = step?.maneuver?.location;
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
};

const isLocationSettingsError = (error) => {
  const message = error?.message?.toLowerCase?.() || '';
  return (
    error?.code === 'E_LOCATION_SETTINGS_UNSATISFIED' ||
    message.includes('unsatisfied device settings') ||
    message.includes('location settings') ||
    message.includes('location request failed') ||
    message.includes('current location is unavailable') ||
    message.includes('location is unavailable')
  );
};

const getLastKnownUserPosition = async () => {
  const lastKnownPosition = await Location.getLastKnownPositionAsync();
  if (!lastKnownPosition?.coords) {
    return null;
  }

  return {
    latitude: lastKnownPosition.coords.latitude,
    longitude: lastKnownPosition.coords.longitude,
  };
};

export default function AttractionMapScreen() {
  const { id, latitude, longitude, name, description } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const locationSubscriptionRef = useRef(null);
  const routeRefreshInFlightRef = useRef(false);
  const lastRouteRefreshRef = useRef(0);
  const [attraction, setAttraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);
  const [routeSummary, setRouteSummary] = useState({ distance: 0, duration: 0 });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationError, setNavigationError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    void loadMapData();
  }, [id]);

  useEffect(() => {
    return () => {
      locationSubscriptionRef.current?.remove();
    };
  }, []);

  const getInitialUserPosition = async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    if (!servicesEnabled && Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch (error) {
        if (!isLocationSettingsError(error)) {
          throw error;
        }
      }
    }

    try {
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
    } catch (error) {
      if (!isLocationSettingsError(error)) {
        throw error;
      }

      const lastKnownPosition = await getLastKnownUserPosition();
      if (!lastKnownPosition) {
        throw error;
      }

      setNavigationError(`${t('map_location_settings')} ${t('map_using_last_known')}`);
      return lastKnownPosition;
    }
  };

  const requestedDestination = useMemo(() => {
    const rawLatitude = Array.isArray(latitude) ? latitude[0] : latitude;
    const rawLongitude = Array.isArray(longitude) ? longitude[0] : longitude;

    if (rawLatitude === undefined || rawLatitude === '' || rawLongitude === undefined || rawLongitude === '') {
      return null;
    }

    const parsedLatitude = Number(rawLatitude);
    const parsedLongitude = Number(rawLongitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return null;
    }

    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };
  }, [latitude, longitude]);
  const hasRequestedDestination = Boolean(requestedDestination);

  const destination = useMemo(() => {
    if (requestedDestination) {
      return requestedDestination;
    }

    const coords = attraction?.location?.coordinates;
    if (!coords || coords.length < 2) {
      return null;
    }

    return {
      latitude: coords[1],
      longitude: coords[0],
    };
  }, [attraction, requestedDestination]);

  const destinationName = useMemo(() => {
    const routeName = Array.isArray(name) ? name[0] : name;
      return routeName || attraction?.name || t('map_destination_label');
  }, [attraction?.name, name]);

  const destinationDescription = useMemo(() => {
    const routeDescription = Array.isArray(description) ? description[0] : description;
    return routeDescription || attraction?.description || t('attraction_discover_copy');
  }, [attraction?.description, description]);

  const region = useMemo(() => {
    if (userLocation && destination) {
      return {
        latitude: (userLocation.latitude + destination.latitude) / 2,
        longitude: (userLocation.longitude + destination.longitude) / 2,
        latitudeDelta: Math.max(Math.abs(userLocation.latitude - destination.latitude) * 1.8, 0.08),
        longitudeDelta: Math.max(Math.abs(userLocation.longitude - destination.longitude) * 1.8, 0.08),
      };
    }

    if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.35,
        longitudeDelta: 0.35,
      };
    }

    return DEFAULT_REGION;
  }, [destination, userLocation]);

  const remainingDistance = useMemo(() => {
    if (!destination || !userLocation) {
      return Number.POSITIVE_INFINITY;
    }

    return calculateDistanceMeters(userLocation, destination);
  }, [destination, userLocation]);

  const nextStep = routeSteps[currentStepIndex] || null;

  const remainingRoute = useMemo(() => {
    if (!routeSteps.length) {
      return routeSummary;
    }

    return routeSteps.slice(currentStepIndex).reduce(
      (totals, step) => ({
        distance: totals.distance + (step.distance || 0),
        duration: totals.duration + (step.duration || 0),
      }),
      { distance: 0, duration: 0 }
    );
  }, [currentStepIndex, routeSteps, routeSummary]);

  useEffect(() => {
    if (!destination || !userLocation || routeCoordinates.length > 0 || routeLoading) {
      return;
    }

    void fetchRoute(userLocation, destination);
  }, [destination, routeCoordinates.length, routeLoading, userLocation]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (!routeSteps.length) {
      return;
    }

    setCurrentStepIndex((current) => {
      let bestIndex = current;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let index = current; index < routeSteps.length; index += 1) {
        const stepPoint = getStepPoint(routeSteps[index]);
        const distance = calculateDistanceMeters(userLocation, stepPoint);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }

      return bestIndex;
    });

    const now = Date.now();
    const isOffRoute =
      routeCoordinates.length > 0 &&
      routeCoordinates.every((point) => calculateDistanceMeters(point, userLocation) > 140);

    if (destination && isOffRoute && now - lastRouteRefreshRef.current > 15000) {
      void fetchRoute(userLocation, destination);
    }
  }, [destination, routeCoordinates, routeSteps, userLocation]);

  const loadMapData = async () => {
    try {
      let attractionResponse = null;

      if (!hasRequestedDestination) {
        attractionResponse = await api.get(`/attractions/${id}`);
        setAttraction(attractionResponse.data);
      } else {
        setAttraction((current) => current || {
          _id: String(Array.isArray(id) ? id[0] : id || ''),
          name: Array.isArray(name) ? name[0] : name || t('map_destination_label'),
          description: Array.isArray(description) ? description[0] : description || t('attraction_discover_copy'),
          location: {
            type: 'Point',
            coordinates: [requestedDestination.longitude, requestedDestination.latitude],
          },
        });
      }

      setLoading(false);

      const permissionResponse = await Location.requestForegroundPermissionsAsync();

      if (permissionResponse.status === 'granted') {
        try {
          const initialPosition = await getInitialUserPosition();
          setUserLocation(initialPosition);
          void startLocationTracking();

          const attractionCoordinates = requestedDestination
            ? [requestedDestination.longitude, requestedDestination.latitude]
            : attractionResponse?.data?.location?.coordinates;

          if (attractionCoordinates?.length >= 2) {
            void fetchRoute(initialPosition, {
              latitude: attractionCoordinates[1],
              longitude: attractionCoordinates[0],
            });
          }
        } catch (locationError) {
          if (isLocationSettingsError(locationError)) {
            const lastKnownPosition = await getLastKnownUserPosition();

            if (lastKnownPosition) {
              setUserLocation(lastKnownPosition);
              setNavigationError(`${t('map_location_settings')} ${t('map_using_last_known')}`);

              const attractionCoordinates = requestedDestination
                ? [requestedDestination.longitude, requestedDestination.latitude]
                : attractionResponse?.data?.location?.coordinates;

              if (attractionCoordinates?.length >= 2) {
                void fetchRoute(lastKnownPosition, {
                  latitude: attractionCoordinates[1],
                  longitude: attractionCoordinates[0],
                });
              }
            } else {
              setNavigationError(t('map_location_settings'));
            }
          } else {
            throw locationError;
          }
        }
      } else {
        setNavigationError(t('map_permission_required'));
      }
    } catch (error) {
      console.error('Map screen error:', error);
      Alert.alert(t('map_unavailable'), error.response?.data?.message || error.message || t('map_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (locationUpdate) => {
          setNavigationError((currentError) =>
            currentError.includes('last known position') ? '' : currentError
          );
          setUserLocation({
            latitude: locationUpdate.coords.latitude,
            longitude: locationUpdate.coords.longitude,
          });
        }
      );
    } catch (error) {
      if (isLocationSettingsError(error)) {
        setNavigationError(t('map_location_settings'));
        return;
      }

      throw error;
    }
  };

  const fetchRoute = async (origin, endPoint) => {
    if (!origin || !endPoint || routeRefreshInFlightRef.current) {
      return;
    }

    routeRefreshInFlightRef.current = true;
    setRouteLoading(true);
    setNavigationError('');
    lastRouteRefreshRef.current = Date.now();

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${endPoint.longitude},${endPoint.latitude}?overview=full&geometries=geojson&steps=true`
      );

      const data = await response.json();
      const route = data?.routes?.[0];
      const leg = route?.legs?.[0];

      if (!route || !leg?.steps?.length) {
        throw new Error(t('map_no_route'));
      }

      const points = route.geometry.coordinates.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      }));

      setRouteCoordinates(points);
      setRouteSteps(leg.steps);
      setRouteSummary({
        distance: route.distance || 0,
        duration: route.duration || 0,
      });
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Route fetch error:', error);
      setNavigationError(error.message || t('map_load_failed'));
    } finally {
      routeRefreshInFlightRef.current = false;
      setRouteLoading(false);
    }
  };

  const openExternalDirections = async () => {
    if (!destination) {
      Alert.alert(t('map_directions_unavailable'), t('map_no_coords'));
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert(t('map_directions_unavailable'), t('map_open_failed'));
      return;
    }

    await Linking.openURL(url);
  };

  const getMapHtml = () => {
    const center = userLocation || destination || DEFAULT_REGION;
    const routePoints = routeCoordinates.length
      ? routeCoordinates.map((point) => [point.latitude, point.longitude])
      : [];
    const fallbackLine =
      !routePoints.length && userLocation && destination
        ? [
            [userLocation.latitude, userLocation.longitude],
            [destination.latitude, destination.longitude],
          ]
        : [];

    const safeDestinationName = String(destinationName || 'Destination')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; }
          body { background: #eef3f8; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: true, attributionControl: true });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap'
          }).addTo(map);

          const destination = ${JSON.stringify(destination)};
          const userLocation = ${JSON.stringify(userLocation)};
          const routePoints = ${JSON.stringify(routePoints)};
          const fallbackLine = ${JSON.stringify(fallbackLine)};
          const bounds = [];

          if (destination) {
            L.marker([destination.latitude, destination.longitude])
              .addTo(map)
              .bindPopup('<b>${safeDestinationName}</b>');
            bounds.push([destination.latitude, destination.longitude]);
          }

          if (userLocation) {
            L.circleMarker([userLocation.latitude, userLocation.longitude], {
              radius: 8,
              color: '#24654B',
              fillColor: '#24654B',
              fillOpacity: 0.95,
              weight: 2
            }).addTo(map).bindPopup('${String(t('navigation_you_are_here')).replace(/'/g, "\\'").replace(/"/g, '\\"')}');
            bounds.push([userLocation.latitude, userLocation.longitude]);
          }

          if (routePoints.length) {
            L.polyline(routePoints, {
              color: '#264E86',
              weight: 5,
              opacity: 0.95
            }).addTo(map);
            routePoints.forEach((point) => bounds.push(point));
          } else if (fallbackLine.length) {
            L.polyline(fallbackLine, {
              color: '#264E86',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 8'
            }).addTo(map);
            fallbackLine.forEach((point) => bounds.push(point));
          }

          if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [35, 35] });
          } else {
            map.setView([${center.latitude}, ${center.longitude}], ${userLocation ? 13 : 9});
          }
        </script>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#264E86" />
          <Text style={styles.loadingTitle}>{t('map_loading_title')}</Text>
          <Text style={styles.loadingCopy}>{t('map_loading_copy')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{destinationName}</Text>
        <Text style={styles.headerSubtitle}>{t('map_header_subtitle')}</Text>
      </View>

      <View style={styles.mapWrap}>
        <WebView
          style={styles.map}
          source={{ html: getMapHtml() }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />
      </View>

      <View style={styles.infoPanel}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>{t('map_nav_title')}</Text>
          {routeLoading ? <ActivityIndicator size="small" color="#264E86" /> : null}
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('map_remaining')}</Text>
            <Text style={styles.statValue}>{formatDistance(remainingRoute.distance || remainingDistance)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('map_eta')}</Text>
            <Text style={styles.statValue}>{formatDuration(remainingRoute.duration || routeSummary.duration)}</Text>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionEyebrow}>{t('map_next_instruction')}</Text>
          <Text style={styles.instructionText}>
            {remainingDistance <= ARRIVAL_THRESHOLD_METERS
              ? t('map_arrived')
              : nextStep
                ? buildInstruction(nextStep, t)
                : t('map_route_appears')}
          </Text>
          {nextStep ? (
            <Text style={styles.instructionMeta}>
              {t('map_step_in')} {formatDistance(nextStep.distance)} | {formatDuration(nextStep.duration)}
            </Text>
          ) : null}
        </View>

        {navigationError ? <Text style={styles.errorText}>{navigationError}</Text> : null}

        <Text style={styles.infoText}>
          {destination
            ? `${t('map_destination_label')}: ${destination.latitude.toFixed(5)}, ${destination.longitude.toFixed(5)}`
            : t('map_coords_missing')}
        </Text>

        <TouchableOpacity
          style={[styles.directionsBtn, routeLoading && styles.directionsBtnDisabled]}
          onPress={() => fetchRoute(userLocation, destination)}
          disabled={routeLoading || !userLocation || !destination}
        >
          <Ionicons name="navigate-outline" size={18} color="white" />
          <Text style={styles.directionsText}>{t('map_refresh_route')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={openExternalDirections}>
          <Ionicons name="open-outline" size={18} color="#264E86" />
          <Text style={styles.secondaryBtnText}>{t('map_open_google')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  header: {
    backgroundColor: '#173457',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
  },
  backBtn: {
    position: 'absolute',
    top: 18,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#D4DDEC',
  },
  mapWrap: {
    flex: 1,
    margin: 18,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E0EA',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EA',
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1D2D45',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F7F1E8',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#66707C',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '900',
    color: '#1D2D45',
  },
  instructionCard: {
    backgroundColor: '#173457',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  instructionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#C8D7EC',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  instructionMeta: {
    fontSize: 13,
    color: '#D4DDEC',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#66707C',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#B24D34',
  },
  directionsBtn: {
    marginTop: 8,
    backgroundColor: '#264E86',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  directionsBtnDisabled: {
    opacity: 0.6,
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    backgroundColor: '#FFFDF9',
  },
  secondaryBtnText: {
    color: '#264E86',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '900',
    color: '#1D2D45',
  },
  loadingCopy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#66707C',
    textAlign: 'center',
  },
});

const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getSanitizedEnvValue = (key) => `${process.env[key] || ''}`.replace(/\0/g, '').trim();

const WEATHER_KEYS = [
  getSanitizedEnvValue('OPENWEATHER_API_KEY'),
  getSanitizedEnvValue('OPENWEATHER_API_KEY_SECONDARY'),
].filter(Boolean);
const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

const KENYA_DESTINATIONS = [
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219, weather: { temperature: 24, feelsLike: 25, humidity: 61, windSpeed: 3, description: 'partly cloudy' } },
  { name: 'Mombasa', lat: -4.0435, lon: 39.6682, weather: { temperature: 30, feelsLike: 34, humidity: 74, windSpeed: 5, description: 'humid and warm' } },
  { name: 'Maasai Mara', lat: -1.5, lon: 35.15, weather: { temperature: 23, feelsLike: 23, humidity: 63, windSpeed: 4, description: 'mild savannah weather' } },
  { name: 'Amboseli', lat: -2.6527, lon: 37.2606, weather: { temperature: 27, feelsLike: 28, humidity: 52, windSpeed: 4, description: 'clear and dry' } },
  { name: 'Diani Beach', lat: -4.3167, lon: 39.5667, weather: { temperature: 29, feelsLike: 32, humidity: 76, windSpeed: 5, description: 'coastal sunshine' } },
  { name: 'Tsavo', lat: -2.9833, lon: 38.5333, weather: { temperature: 28, feelsLike: 29, humidity: 49, windSpeed: 4, description: 'hot and dry' } },
  { name: 'Nakuru', lat: -0.3031, lon: 36.08, weather: { temperature: 22, feelsLike: 22, humidity: 65, windSpeed: 3, description: 'cool highland weather' } },
  { name: 'Kisumu', lat: -0.0917, lon: 34.7679, weather: { temperature: 26, feelsLike: 27, humidity: 68, windSpeed: 3, description: 'warm lakeside conditions' } },
  { name: 'Samburu', lat: 0.6, lon: 37.5333, weather: { temperature: 29, feelsLike: 31, humidity: 42, windSpeed: 4, description: 'sunny and semi-arid' } },
  { name: 'Lamu', lat: -2.2694, lon: 40.9022, weather: { temperature: 29, feelsLike: 33, humidity: 78, windSpeed: 5, description: 'breezy coastal weather' } },
];

const getWeatherIcon = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

const formatCurrent = (data) => ({
  city: data.name,
  country: data.sys?.country,
  temperature: Math.round(data.main?.temp),
  feelsLike: Math.round(data.main?.feels_like),
  humidity: data.main?.humidity,
  windSpeed: data.wind?.speed,
  description: data.weather?.[0]?.description,
  icon: getWeatherIcon(data.weather?.[0]?.icon || '01d'),
  sunrise: data.sys?.sunrise,
  sunset: data.sys?.sunset,
  visibility: data.visibility,
});

const formatForecast = (data) => {
  const days = {};

  (data.list || []).forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!days[date]) {
      days[date] = {
        date,
        temps: [],
        descriptions: [],
        icons: [],
        humidity: [],
        windSpeed: [],
      };
    }

    days[date].temps.push(Math.round(item.main?.temp));
    days[date].descriptions.push(item.weather?.[0]?.description);
    days[date].icons.push(item.weather?.[0]?.icon);
    days[date].humidity.push(item.main?.humidity);
    days[date].windSpeed.push(item.wind?.speed);
  });

  return Object.values(days)
    .slice(0, 7)
    .map((day) => ({
      date: day.date,
      minTemp: Math.min(...day.temps),
      maxTemp: Math.max(...day.temps),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)],
      icon: getWeatherIcon(day.icons[Math.floor(day.icons.length / 2)] || '01d'),
      humidity: Math.round(day.humidity.reduce((left, right) => left + right, 0) / day.humidity.length),
      windSpeed: Math.round(day.windSpeed.reduce((left, right) => left + right, 0) / day.windSpeed.length),
    }));
};

const buildFallbackWeather = ({ city = 'Destination', lat, lon }) => {
  const latitude = Number(lat);
  const longitude = Number(lon);

  const nearestDestination = KENYA_DESTINATIONS
    .map((destination) => ({
      ...destination,
      distance:
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? Math.abs(destination.lat - latitude) + Math.abs(destination.lon - longitude)
          : Number.MAX_SAFE_INTEGER,
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  const matchedDestination =
    nearestDestination && nearestDestination.distance < 3
      ? nearestDestination
      : KENYA_DESTINATIONS.find((destination) => destination.name.toLowerCase() === `${city}`.toLowerCase());

  const fallback = matchedDestination || KENYA_DESTINATIONS[0];

  return {
    city: matchedDestination?.name || city,
    country: 'KE',
    temperature: fallback.weather.temperature,
    feelsLike: fallback.weather.feelsLike,
    humidity: fallback.weather.humidity,
    windSpeed: fallback.weather.windSpeed,
    description: fallback.weather.description,
    icon: getWeatherIcon('02d'),
    visibility: 9000,
    fallback: true,
  };
};

const getWeatherParams = ({ city, lat, lon, includeForecastCount = false, apiKey }) => {
  const params = {
    appid: apiKey,
    units: 'metric',
  };

  if (includeForecastCount) {
    params.cnt = 40;
  }

  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  } else {
    params.q = `${city},KE`;
  }

  return params;
};

const fetchWeatherOrFallback = async ({ path, city = 'Nairobi', lat, lon, includeForecastCount = false }) => {
  if (!WEATHER_KEYS.length) {
    throw new Error('OpenWeather API key is not configured.');
  }

  let lastError = null;

  for (const apiKey of WEATHER_KEYS) {
    try {
      const response = await axios.get(`${WEATHER_BASE}/${path}`, {
        params: getWeatherParams({ city, lat, lon, includeForecastCount, apiKey }),
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Weather provider request failed.');
};

router.get('/current', asyncHandler(async (req, res) => {
  const { city = 'Nairobi', lat, lon } = req.query;

  try {
    const data = await fetchWeatherOrFallback({ path: 'weather', city, lat, lon });
    return res.json({ success: true, weather: formatCurrent(data) });
  } catch {
    return res.json({
      success: true,
      weather: buildFallbackWeather({ city, lat, lon }),
      message: 'Showing a fallback weather snapshot because live weather is temporarily unavailable.',
    });
  }
}));

router.get('/forecast', asyncHandler(async (req, res) => {
  const { city = 'Nairobi', lat, lon } = req.query;

  try {
    const data = await fetchWeatherOrFallback({ path: 'forecast', city, lat, lon, includeForecastCount: true });
    return res.json({
      success: true,
      city: data.city?.name || city,
      forecast: formatForecast(data),
    });
  } catch {
    return res.json({
      success: true,
      city,
      forecast: [],
      message: 'Forecast is temporarily unavailable.',
    });
  }
}));

router.get('/kenya', asyncHandler(async (req, res) => {
  const weatherPromises = KENYA_DESTINATIONS.map(async (destination) => {
    try {
      const data = await fetchWeatherOrFallback({
        path: 'weather',
        lat: destination.lat,
        lon: destination.lon,
      });

      return {
        ...formatCurrent(data),
        name: destination.name,
        lat: destination.lat,
        lon: destination.lon,
      };
    } catch {
      return {
        ...buildFallbackWeather({ city: destination.name, lat: destination.lat, lon: destination.lon }),
        name: destination.name,
        lat: destination.lat,
        lon: destination.lon,
      };
    }
  });

  const results = await Promise.all(weatherPromises);
  res.json({ success: true, destinations: results });
}));

module.exports = router;

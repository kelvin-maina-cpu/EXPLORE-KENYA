const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');

const WEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

const KENYA_DESTINATIONS = [
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { name: 'Mombasa', lat: -4.0435, lon: 39.6682 },
  { name: 'Maasai Mara', lat: -1.5, lon: 35.15 },
  { name: 'Amboseli', lat: -2.6527, lon: 37.2606 },
  { name: 'Diani Beach', lat: -4.3167, lon: 39.5667 },
  { name: 'Tsavo', lat: -2.9833, lon: 38.5333 },
  { name: 'Nakuru', lat: -0.3031, lon: 36.08 },
  { name: 'Kisumu', lat: -0.0917, lon: 34.7679 },
  { name: 'Samburu', lat: 0.6, lon: 37.5333 },
  { name: 'Lamu', lat: -2.2694, lon: 40.9022 },
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

router.get(
  '/current',
  asyncHandler(async (req, res) => {
    const { city = 'Nairobi', lat, lon } = req.query;

    const params = {
      appid: WEATHER_KEY,
      units: 'metric',
    };

    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else {
      params.q = `${city},KE`;
    }

    const response = await axios.get(`${WEATHER_BASE}/weather`, {
      params,
      timeout: 10000,
    });
    res.json({ success: true, weather: formatCurrent(response.data) });
  })
);

router.get(
  '/forecast',
  asyncHandler(async (req, res) => {
    const { city = 'Nairobi', lat, lon } = req.query;

    const params = {
      appid: WEATHER_KEY,
      units: 'metric',
      cnt: 40,
    };

    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else {
      params.q = `${city},KE`;
    }

    const response = await axios.get(`${WEATHER_BASE}/forecast`, {
      params,
      timeout: 10000,
    });
    res.json({
      success: true,
      city: response.data.city?.name || city,
      forecast: formatForecast(response.data),
    });
  })
);

router.get(
  '/kenya',
  asyncHandler(async (req, res) => {
    const weatherPromises = KENYA_DESTINATIONS.map(async (destination) => {
      try {
        const response = await axios.get(`${WEATHER_BASE}/weather`, {
          params: {
            lat: destination.lat,
            lon: destination.lon,
            appid: WEATHER_KEY,
            units: 'metric',
          },
          timeout: 8000,
        });

        return {
          ...formatCurrent(response.data),
          name: destination.name,
          lat: destination.lat,
          lon: destination.lon,
        };
      } catch {
        return {
          name: destination.name,
          lat: destination.lat,
          lon: destination.lon,
          error: true,
        };
      }
    });

    const results = await Promise.all(weatherPromises);
    res.json({ success: true, destinations: results });
  })
);

module.exports = router;

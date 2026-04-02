const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const AERODATABOX_HOST = 'aerodatabox.p.rapidapi.com';
const AERODATABOX_BASE = 'https://aerodatabox.p.rapidapi.com';

const headers = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': AERODATABOX_HOST,
};

// Kenya airports with ICAO codes (AeroDataBox uses ICAO)
const KENYA_AIRPORTS = [
  { name: 'Nairobi Jomo Kenyatta', iata: 'NBO', icao: 'HKJK' },
  { name: 'Mombasa Moi', iata: 'MBA', icao: 'HKMO' },
  { name: 'Kisumu', iata: 'KIS', icao: 'HKKI' },
  { name: 'Eldoret', iata: 'EDL', icao: 'HKEL' },
  { name: 'Wilson Airport', iata: 'WIL', icao: 'HKNW' },
];

// GET /api/flights/departures?icao=HKJK
router.get('/departures', asyncHandler(async (req, res) => {
  const { icao = 'HKJK' } = req.query;

  const now = new Date();
  const start = now.toISOString().slice(0, 16);
  const end = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const response = await axios.get(
    `${AERODATABOX_BASE}/flights/airports/icao/${icao}/${start}/${end}`,
    {
      headers,
      params: { withLeg: true, direction: 'Departure', withCancelled: false },
      timeout: 12000,
    }
  );

  const departures = response.data?.departures || [];

  const formatted = departures.map((f) => ({
    flightNumber: f.number || 'N/A',
    airline: f.airline?.name || 'Unknown',
    destination: f.movement?.airport?.name || 'N/A',
    destinationIata: f.movement?.airport?.iata || 'N/A',
    destinationIcao: f.movement?.airport?.icao || 'N/A',
    scheduledTime: f.movement?.scheduledTime?.local || f.movement?.scheduledTime?.utc,
    terminal: f.movement?.terminal || 'N/A',
    gate: f.movement?.gate || 'N/A',
    status: f.status || 'Scheduled',
    aircraft: f.aircraft?.model || 'N/A',
  }));

  res.json({
    success: true,
    airport: icao,
    total: formatted.length,
    flights: formatted,
  });
}));

// GET /api/flights/arrivals?icao=HKJK
router.get('/arrivals', asyncHandler(async (req, res) => {
  const { icao = 'HKJK' } = req.query;

  const now = new Date();
  const start = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const end = now.toISOString().slice(0, 16);

  const response = await axios.get(
    `${AERODATABOX_BASE}/flights/airports/icao/${icao}/${start}/${end}`,
    {
      headers,
      params: { withLeg: true, direction: 'Arrival', withCancelled: false },
      timeout: 12000,
    }
  );

  const arrivals = response.data?.arrivals || [];

  const formatted = arrivals.map((f) => ({
    flightNumber: f.number || 'N/A',
    airline: f.airline?.name || 'Unknown',
    origin: f.movement?.airport?.name || 'N/A',
    originIata: f.movement?.airport?.iata || 'N/A',
    scheduledTime: f.movement?.scheduledTime?.local || f.movement?.scheduledTime?.utc,
    terminal: f.movement?.terminal || 'N/A',
    gate: f.movement?.gate || 'N/A',
    status: f.status || 'Scheduled',
    aircraft: f.aircraft?.model || 'N/A',
  }));

  res.json({
    success: true,
    airport: icao,
    total: formatted.length,
    flights: formatted,
  });
}));

// GET /api/flights/search?flight=KQ101
router.get('/search', asyncHandler(async (req, res) => {
  const { flight } = req.query;

  if (!flight) {
    res.status(400);
    throw new Error('Flight number is required e.g. flight=KQ101');
  }

  const today = new Date().toISOString().split('T')[0];

  const response = await axios.get(
    `${AERODATABOX_BASE}/flights/number/${flight.toUpperCase()}/${today}`,
    { headers, timeout: 12000 }
  );

  const flights = Array.isArray(response.data) ? response.data : [response.data];

  const formatted = flights.map((f) => ({
    flightNumber: f.number || flight,
    airline: f.airline?.name || 'Unknown',
    departure: {
      airport: f.departure?.airport?.name || 'N/A',
      iata: f.departure?.airport?.iata || 'N/A',
      scheduledTime: f.departure?.scheduledTime?.local,
      terminal: f.departure?.terminal || 'N/A',
      gate: f.departure?.gate || 'N/A',
    },
    arrival: {
      airport: f.arrival?.airport?.name || 'N/A',
      iata: f.arrival?.airport?.iata || 'N/A',
      scheduledTime: f.arrival?.scheduledTime?.local,
      terminal: f.arrival?.terminal || 'N/A',
      gate: f.arrival?.gate || 'N/A',
    },
    status: f.status || 'Scheduled',
    aircraft: f.aircraft?.model || 'N/A',
    duration: f.greatCircleDistance?.km
      ? `${Math.round(f.greatCircleDistance.km)} km`
      : 'N/A',
  }));

  res.json({ success: true, flights: formatted });
}));

// GET /api/flights/airports
router.get('/airports', asyncHandler(async (req, res) => {
  res.json({ success: true, airports: KENYA_AIRPORTS });
}));

module.exports = router;


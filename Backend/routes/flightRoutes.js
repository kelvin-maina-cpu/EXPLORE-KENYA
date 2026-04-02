const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getSanitizedEnvValue = (key) => `${process.env[key] || ''}`.replace(/\0/g, '').trim();

const RAPIDAPI_KEY = getSanitizedEnvValue('RAPIDAPI_KEY');
const AVIATIONSTACK_API_KEY = getSanitizedEnvValue('AVIATIONSTACK_API_KEY');
const AERODATABOX_HOST = 'aerodatabox.p.rapidapi.com';
const AERODATABOX_BASE = 'https://aerodatabox.p.rapidapi.com';
const AVIATIONSTACK_BASE = 'http://api.aviationstack.com/v1';

const KENYA_AIRPORTS = [
  { name: 'Nairobi Jomo Kenyatta', iata: 'NBO', icao: 'HKJK' },
  { name: 'Mombasa Moi', iata: 'MBA', icao: 'HKMO' },
  { name: 'Kisumu', iata: 'KIS', icao: 'HKKI' },
  { name: 'Eldoret', iata: 'EDL', icao: 'HKEL' },
  { name: 'Wilson Airport', iata: 'WIL', icao: 'HKNW' },
];

const formatStatus = (status) => {
  if (!status) {
    return 'Scheduled';
  }

  return `${status}`
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const createProviderError = (provider, error) => {
  const details =
    error.response?.data?.message ||
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    error.message;

  return `${provider}: ${details}`;
};

const fetchAeroDataBoxAirportFlights = async (icao, direction) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('AeroDataBox API key is not configured.');
  }

  const now = new Date();
  const startDate =
    direction === 'Arrival'
      ? new Date(now.getTime() - 6 * 60 * 60 * 1000)
      : now;
  const endDate =
    direction === 'Arrival'
      ? now
      : new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const response = await axios.get(
    `${AERODATABOX_BASE}/flights/airports/icao/${icao}/${startDate.toISOString().slice(0, 16)}/${endDate.toISOString().slice(0, 16)}`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': AERODATABOX_HOST,
      },
      params: {
        withLeg: true,
        direction,
        withCancelled: false,
      },
      timeout: 12000,
    }
  );

  return direction === 'Arrival'
    ? response.data?.arrivals || []
    : response.data?.departures || [];
};

const fetchAeroDataBoxFlightSearch = async (flight) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('AeroDataBox API key is not configured.');
  }

  const today = new Date().toISOString().split('T')[0];
  const response = await axios.get(
    `${AERODATABOX_BASE}/flights/number/${flight.toUpperCase()}/${today}`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': AERODATABOX_HOST,
      },
      timeout: 12000,
    }
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data ? [response.data] : [];
};

const fetchAviationStackFlights = async (params) => {
  if (!AVIATIONSTACK_API_KEY) {
    throw new Error('AviationStack API key is not configured.');
  }

  const response = await axios.get(`${AVIATIONSTACK_BASE}/flights`, {
    params: {
      access_key: AVIATIONSTACK_API_KEY,
      limit: 50,
      ...params,
    },
    timeout: 12000,
  });

  if (response.data?.error) {
    throw new Error(response.data.error.message || 'AviationStack request failed.');
  }

  return Array.isArray(response.data?.data) ? response.data.data : [];
};

const mapAeroDataBoxDeparture = (flight) => ({
  flightNumber: flight.number || 'N/A',
  airline: flight.airline?.name || 'Unknown',
  destination: flight.movement?.airport?.name || 'N/A',
  destinationIata: flight.movement?.airport?.iata || 'N/A',
  destinationIcao: flight.movement?.airport?.icao || 'N/A',
  scheduledTime: flight.movement?.scheduledTime?.local || flight.movement?.scheduledTime?.utc || null,
  terminal: flight.movement?.terminal || 'N/A',
  gate: flight.movement?.gate || 'N/A',
  status: formatStatus(flight.status),
  aircraft: flight.aircraft?.model || 'N/A',
});

const mapAeroDataBoxArrival = (flight) => ({
  flightNumber: flight.number || 'N/A',
  airline: flight.airline?.name || 'Unknown',
  origin: flight.movement?.airport?.name || 'N/A',
  originIata: flight.movement?.airport?.iata || 'N/A',
  scheduledTime: flight.movement?.scheduledTime?.local || flight.movement?.scheduledTime?.utc || null,
  terminal: flight.movement?.terminal || 'N/A',
  gate: flight.movement?.gate || 'N/A',
  status: formatStatus(flight.status),
  aircraft: flight.aircraft?.model || 'N/A',
});

const mapAeroDataBoxSearchResult = (flight, fallbackFlightNumber) => ({
  flightNumber: flight.number || fallbackFlightNumber,
  airline: flight.airline?.name || 'Unknown',
  departure: {
    airport: flight.departure?.airport?.name || 'N/A',
    iata: flight.departure?.airport?.iata || 'N/A',
    scheduledTime: flight.departure?.scheduledTime?.local || flight.departure?.scheduledTime?.utc || null,
    terminal: flight.departure?.terminal || 'N/A',
    gate: flight.departure?.gate || 'N/A',
  },
  arrival: {
    airport: flight.arrival?.airport?.name || 'N/A',
    iata: flight.arrival?.airport?.iata || 'N/A',
    scheduledTime: flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc || null,
    terminal: flight.arrival?.terminal || 'N/A',
    gate: flight.arrival?.gate || 'N/A',
  },
  status: formatStatus(flight.status),
  aircraft: flight.aircraft?.model || 'N/A',
  duration: flight.greatCircleDistance?.km ? `${Math.round(flight.greatCircleDistance.km)} km` : 'N/A',
});

const mapAviationStackDeparture = (flight) => ({
  flightNumber: flight.flight?.iata || flight.flight?.icao || flight.flight_number || 'N/A',
  airline: flight.airline?.name || 'Unknown',
  destination: flight.arrival?.airport || 'N/A',
  destinationIata: flight.arrival?.iata || 'N/A',
  destinationIcao: flight.arrival?.icao || 'N/A',
  scheduledTime: flight.departure?.scheduled || flight.departure?.estimated || null,
  terminal: flight.departure?.terminal || 'N/A',
  gate: flight.departure?.gate || 'N/A',
  status: formatStatus(flight.flight_status),
  aircraft: flight.aircraft?.registration || flight.aircraft?.icao || 'N/A',
});

const mapAviationStackArrival = (flight) => ({
  flightNumber: flight.flight?.iata || flight.flight?.icao || flight.flight_number || 'N/A',
  airline: flight.airline?.name || 'Unknown',
  origin: flight.departure?.airport || 'N/A',
  originIata: flight.departure?.iata || 'N/A',
  scheduledTime: flight.arrival?.scheduled || flight.arrival?.estimated || null,
  terminal: flight.arrival?.terminal || 'N/A',
  gate: flight.arrival?.gate || 'N/A',
  status: formatStatus(flight.flight_status),
  aircraft: flight.aircraft?.registration || flight.aircraft?.icao || 'N/A',
});

const mapAviationStackSearchResult = (flight, fallbackFlightNumber) => ({
  flightNumber: flight.flight?.iata || flight.flight?.icao || fallbackFlightNumber,
  airline: flight.airline?.name || 'Unknown',
  departure: {
    airport: flight.departure?.airport || 'N/A',
    iata: flight.departure?.iata || 'N/A',
    scheduledTime: flight.departure?.scheduled || flight.departure?.estimated || null,
    terminal: flight.departure?.terminal || 'N/A',
    gate: flight.departure?.gate || 'N/A',
  },
  arrival: {
    airport: flight.arrival?.airport || 'N/A',
    iata: flight.arrival?.iata || 'N/A',
    scheduledTime: flight.arrival?.scheduled || flight.arrival?.estimated || null,
    terminal: flight.arrival?.terminal || 'N/A',
    gate: flight.arrival?.gate || 'N/A',
  },
  status: formatStatus(flight.flight_status),
  aircraft: flight.aircraft?.registration || flight.aircraft?.icao || 'N/A',
  duration: 'N/A',
});

const respondWithProviderFailure = (res, errors) => {
  res.status(502).json({
    success: false,
    message: 'Unable to load flight data from the configured providers.',
    providers: errors,
  });
};

router.get('/departures', asyncHandler(async (req, res) => {
  const { icao = 'HKJK' } = req.query;
  const providerErrors = [];

  try {
    const flights = await fetchAeroDataBoxAirportFlights(icao, 'Departure');
    return res.json({
      success: true,
      airport: icao,
      total: flights.length,
      flights: flights.map(mapAeroDataBoxDeparture),
      provider: 'AeroDataBox',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AeroDataBox', error));
  }

  try {
    const flights = await fetchAviationStackFlights({ dep_icao: icao });
    return res.json({
      success: true,
      airport: icao,
      total: flights.length,
      flights: flights.map(mapAviationStackDeparture),
      provider: 'AviationStack',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AviationStack', error));
  }

  return respondWithProviderFailure(res, providerErrors);
}));

router.get('/arrivals', asyncHandler(async (req, res) => {
  const { icao = 'HKJK' } = req.query;
  const providerErrors = [];

  try {
    const flights = await fetchAeroDataBoxAirportFlights(icao, 'Arrival');
    return res.json({
      success: true,
      airport: icao,
      total: flights.length,
      flights: flights.map(mapAeroDataBoxArrival),
      provider: 'AeroDataBox',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AeroDataBox', error));
  }

  try {
    const flights = await fetchAviationStackFlights({ arr_icao: icao });
    return res.json({
      success: true,
      airport: icao,
      total: flights.length,
      flights: flights.map(mapAviationStackArrival),
      provider: 'AviationStack',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AviationStack', error));
  }

  return respondWithProviderFailure(res, providerErrors);
}));

router.get('/search', asyncHandler(async (req, res) => {
  const { flight } = req.query;

  if (!flight) {
    res.status(400);
    throw new Error('Flight number is required e.g. flight=KQ101');
  }

  const query = `${flight}`.trim().toUpperCase();
  const providerErrors = [];

  try {
    const flights = await fetchAeroDataBoxFlightSearch(query);
    return res.json({
      success: true,
      total: flights.length,
      flights: flights.map((item) => mapAeroDataBoxSearchResult(item, query)),
      provider: 'AeroDataBox',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AeroDataBox', error));
  }

  try {
    const flights = await fetchAviationStackFlights({ flight_iata: query });
    return res.json({
      success: true,
      total: flights.length,
      flights: flights.map((item) => mapAviationStackSearchResult(item, query)),
      provider: 'AviationStack',
    });
  } catch (error) {
    providerErrors.push(createProviderError('AviationStack', error));
  }

  return respondWithProviderFailure(res, providerErrors);
}));

router.get('/airports', asyncHandler(async (req, res) => {
  res.json({ success: true, airports: KENYA_AIRPORTS });
}));

module.exports = router;

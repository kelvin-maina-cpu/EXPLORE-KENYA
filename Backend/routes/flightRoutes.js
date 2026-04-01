const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');

const AVIATION_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATION_BASE = 'http://api.aviationstack.com/v1';

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { dep, arr, limit = 10 } = req.query;

    if (!dep) {
      res.status(400);
      throw new Error('Departure airport code is required (e.g. dep=NBO)');
    }

    const params = {
      access_key: AVIATION_KEY,
      dep_iata: dep.toUpperCase(),
      limit,
    };

    if (arr) {
      params.arr_iata = arr.toUpperCase();
    }

    const response = await axios.get(`${AVIATION_BASE}/flights`, {
      params,
      timeout: 10000,
    });
    const flights = response.data?.data || [];

    const formatted = flights.map((flight) => ({
      flightNumber: flight.flight?.iata || flight.flight?.icao || 'N/A',
      airline: flight.airline?.name || 'Unknown Airline',
      airlineLogo: `https://logo.clearbit.com/${(flight.airline?.name || '')
        .toLowerCase()
        .replace(/\s/g, '')}.com`,
      departure: {
        airport: flight.departure?.airport || dep,
        iata: flight.departure?.iata || dep,
        scheduled: flight.departure?.scheduled,
        estimated: flight.departure?.estimated,
        terminal: flight.departure?.terminal || 'N/A',
        gate: flight.departure?.gate || 'N/A',
      },
      arrival: {
        airport: flight.arrival?.airport || arr || 'N/A',
        iata: flight.arrival?.iata || arr || 'N/A',
        scheduled: flight.arrival?.scheduled,
        estimated: flight.arrival?.estimated,
        terminal: flight.arrival?.terminal || 'N/A',
        gate: flight.arrival?.gate || 'N/A',
      },
      status: flight.flight_status || 'scheduled',
      aircraft: flight.aircraft?.registration || 'N/A',
    }));

    res.json({ success: true, total: formatted.length, flights: formatted });
  })
);

router.get(
  '/airports',
  asyncHandler(async (req, res) => {
    const { search } = req.query;

    const params = { access_key: AVIATION_KEY, limit: 10 };
    if (search) {
      params.search = search;
    }

    const response = await axios.get(`${AVIATION_BASE}/airports`, {
      params,
      timeout: 10000,
    });
    const airports = response.data?.data || [];

    const formatted = airports.map((airport) => ({
      name: airport.airport_name,
      iata: airport.iata_code,
      icao: airport.icao_code,
      city: airport.city_iata_code,
      country: airport.country_name,
      timezone: airport.timezone,
    }));

    res.json({ success: true, airports: formatted });
  })
);

router.get(
  '/kenya',
  asyncHandler(async (req, res) => {
    const kenyaAirports = ['NBO', 'MBA', 'KIS', 'EDL', 'LOK'];
    const { airport = 'NBO', limit = 10 } = req.query;

    const params = {
      access_key: AVIATION_KEY,
      dep_iata: airport.toUpperCase(),
      flight_status: 'active',
      limit,
    };

    const response = await axios.get(`${AVIATION_BASE}/flights`, {
      params,
      timeout: 10000,
    });
    const flights = response.data?.data || [];

    res.json({
      success: true,
      airport,
      availableAirports: kenyaAirports,
      total: flights.length,
      flights: flights.map((flight) => ({
        flightNumber: flight.flight?.iata || 'N/A',
        airline: flight.airline?.name || 'Unknown',
        destination: flight.arrival?.airport || 'N/A',
        destinationIata: flight.arrival?.iata || 'N/A',
        scheduledDeparture: flight.departure?.scheduled,
        status: flight.flight_status || 'scheduled',
      })),
    });
  })
);

module.exports = router;

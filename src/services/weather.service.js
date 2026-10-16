'use strict';

// Uses the free Open-Meteo APIs (no API key required).
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather interpretation codes -> human-readable text.
const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function describeCode(code) {
  return WEATHER_CODES[code] || `Unknown conditions (code ${code})`;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error('Weather service is unavailable. Please try again later.');
    err.status = 502;
    throw err;
  }
  return res.json();
}

/** Resolves a free-text place name to coordinates. Returns null if not found. */
async function geocode(location) {
  const params = new URLSearchParams({ name: location, count: '1', language: 'en', format: 'json' });
  const data = await getJson(`${GEOCODE_URL}?${params}`);
  if (!data.results || data.results.length === 0) return null;
  const place = data.results[0];
  return {
    name: place.name,
    country: place.country,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}

/** Looks up the current weather and today's forecast for a location name. */
async function getWeatherForLocation(location) {
  const place = await geocode(location);
  if (!place) {
    const err = new Error(`Could not find a location named "${location}".`);
    err.status = 404;
    throw err;
  }

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '1',
    timezone: place.timezone || 'auto',
  });
  const data = await getJson(`${FORECAST_URL}?${params}`);
  const { current, daily } = data;

  return {
    location: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    latitude: place.latitude,
    longitude: place.longitude,
    time: current.time,
    timezone: data.timezone,
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    conditions: describeCode(current.weather_code),
    todayMax: daily.temperature_2m_max[0],
    todayMin: daily.temperature_2m_min[0],
    precipitationChance: daily.precipitation_probability_max[0],
  };
}

module.exports = { getWeatherForLocation, describeCode };

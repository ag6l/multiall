const WEATHER_CACHE_KEY = 'searchall-weather';
const CACHE_AGE = 30 * 60 * 1000;

const descriptions = {
  es: {
    clear: 'Despejado', partly: 'Parcialmente nublado', fog: 'Niebla', drizzle: 'Llovizna',
    rain: 'Lluvia', snow: 'Nieve', showers: 'Chubascos', storm: 'Tormenta'
  },
  en: {
    clear: 'Clear', partly: 'Partly cloudy', fog: 'Fog', drizzle: 'Drizzle',
    rain: 'Rain', snow: 'Snow', showers: 'Showers', storm: 'Thunderstorm'
  }
};

function conditionFor(code, isDay) {
  if (code === 0) return ['clear', isDay ? '☀' : '🌙'];
  if (code <= 3) return ['partly', '⛅'];
  if (code <= 48) return ['fog', '🌫'];
  if (code <= 57) return ['drizzle', '🌦'];
  if (code <= 67) return ['rain', '🌧'];
  if (code <= 77) return ['snow', '🌨'];
  if (code <= 82) return ['showers', '🌦'];
  if (code <= 86) return ['snow', '🌨'];
  return ['storm', '⛈'];
}

function cacheId(location, language) {
  return `${location.trim().toLowerCase() || 'device'}:${language}`;
}

function cachedWeather(id) {
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) ?? 'null');
    return cached?.id === id && Date.now() - cached.savedAt < CACHE_AGE ? cached.weather : null;
  } catch {
    return null;
  }
}

function deviceCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation unavailable'));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, label: '' }),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: CACHE_AGE }
    );
  });
}

async function geocodeLocation(location, language) {
  const params = new URLSearchParams({ name: location, count: '1', language, format: 'json' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) throw new Error('Location request failed');
  const match = (await response.json()).results?.[0];
  if (!match) throw new Error('Location not found');
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    label: [match.name, match.admin1, match.country].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).join(', ')
  };
}

export function clearWeatherCache() {
  try { localStorage.removeItem(WEATHER_CACHE_KEY); } catch {}
}

function describeWeather(weather, language = 'en') {
  if (!weather) return null;
  const [condition, icon] = conditionFor(weather.code, weather.isDay);
  const copy = descriptions[language] ?? descriptions.es;
  return { ...weather, icon, description: copy[condition] };
}

export function describeForecast(forecast, language = 'en') {
  if (!forecast) return null;
  return {
    ...forecast,
    current: describeWeather(forecast.current, language),
    hourly: forecast.hourly.map((hour) => describeWeather(hour, language))
  };
}

/**
 * Resolves where to ask for weather. Without a saved location the only source
 * is the device, and asking for it triggers the browser permission prompt — so
 * that only happens when the caller explicitly opts in (`allowGeolocation`),
 * i.e. when the user actually consults the weather rather than on page load.
 */
async function resolvePlace(location, language, allowGeolocation) {
  if (location.trim()) return geocodeLocation(location.trim(), language);
  if (!allowGeolocation) {
    const error = new Error('A location is needed before asking for weather');
    error.code = 'NEEDS_LOCATION';
    throw error;
  }
  return deviceCoordinates();
}

export async function getCurrentWeather(location = '', language = 'en', { force = false, allowGeolocation = false } = {}) {
  const id = cacheId(location, language);
  if (!force) {
    const cached = cachedWeather(id);
    if (cached) return cached;
  }

  const place = await resolvePlace(location, language, allowGeolocation);
  const params = new URLSearchParams({
    latitude: Number(place.latitude).toFixed(4),
    longitude: Number(place.longitude).toFixed(4),
    current: 'temperature_2m,weather_code,is_day',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    forecast_hours: '24',
    timezone: 'auto'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error('Weather request failed');
  const data = await response.json();
  const unit = data.current_units?.temperature_2m ?? '°C';
  const weather = {
    location: place.label,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      unit,
      code: Number(data.current.weather_code),
      isDay: Boolean(data.current.is_day)
    },
    hourly: data.hourly.time.map((time, index) => ({
      time,
      temperature: Math.round(data.hourly.temperature_2m[index]),
      precipitation: data.hourly.precipitation_probability[index],
      unit,
      code: Number(data.hourly.weather_code[index]),
      isDay: Boolean(data.hourly.is_day[index])
    }))
  };
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ id, savedAt: Date.now(), weather })); } catch {}
  return weather;
}

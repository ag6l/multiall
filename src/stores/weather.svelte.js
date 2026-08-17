import { getCurrentWeather } from '../lib/weather.js';

let weatherData = $state(null);
let weatherLoading = $state(false);
// True when the only thing missing is permission/a saved location, so the UI
// can invite the user to consult the weather instead of reporting a failure.
let weatherNeedsLocation = $state(false);
let requestId = 0;

export function getWeatherData() {
  return weatherData;
}

export function getWeatherLoading() {
  return weatherLoading;
}

export function getWeatherNeedsLocation() {
  return weatherNeedsLocation;
}

/**
 * `allowGeolocation` gates the browser permission prompt: it stays false on
 * page load (a saved location or a warm cache can still resolve) and is only
 * set once the user asks for the weather.
 */
export async function loadWeather(location = '', language = 'en', { force = false, allowGeolocation = false } = {}) {
  const currentId = ++requestId;
  weatherLoading = true;
  try {
    const result = await getCurrentWeather(location, language, { force, allowGeolocation });
    if (currentId === requestId) {
      weatherData = result;
      weatherNeedsLocation = false;
    }
  } catch (error) {
    if (currentId === requestId) {
      weatherData = null;
      weatherNeedsLocation = error?.code === 'NEEDS_LOCATION';
    }
  } finally {
    if (currentId === requestId) weatherLoading = false;
  }
}

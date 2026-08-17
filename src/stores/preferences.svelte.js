import { getPreferencesBackup, savePreferencesBackup } from '../lib/backgroundDb.js';
import { applyTheme, readPreferences, savePreferences } from '../lib/preferences.js';
import { clearWeatherCache } from '../lib/weather.js';

let preferences = $state(readPreferences());
let backupTimer;

function persist() {
  savePreferences(preferences);
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    savePreferencesBackup(preferences).catch(() => {});
  }, 150);
}

export function getPreferences() {
  return preferences;
}

export function updatePreferences(nextPreferences, { availableServices = [], onLocationChange } = {}) {
  const previousLocation = preferences.location ?? '';
  const previousLanguage = preferences.language;

  preferences = {
    username: nextPreferences.username.trim().slice(0, 40),
    theme: nextPreferences.theme,
    language: nextPreferences.language,
    location: (nextPreferences.location ?? '').trim().slice(0, 80),
    defaultSearcher: availableServices.some((item) => item.name === nextPreferences.defaultSearcher && item.search)
      ? nextPreferences.defaultSearcher
      : 'Google',
    openResultsInNewTab: Boolean(nextPreferences.openResultsInNewTab),
    backgroundShade: nextPreferences.backgroundShade,
    savedAt: Date.now()
  };

  persist();
  applyTheme(preferences.theme);
  document.documentElement.lang = preferences.language;

  if (preferences.location !== previousLocation || preferences.language !== previousLanguage) {
    clearWeatherCache();
    onLocationChange?.();
  }
}

export async function syncPreferencesBackup() {
  try {
    const backup = await getPreferencesBackup();
    if (backup?.preferences && Number(backup.savedAt) > Number(preferences.savedAt)) {
      preferences = {
        ...backup.preferences,
        savedAt: Number(backup.preferences.savedAt) || Date.now()
      };
      persist();
      applyTheme(preferences.theme);
      document.documentElement.lang = preferences.language;
      return;
    }
  } catch {
    // localStorage remains available if IndexedDB is blocked.
  }

  preferences = { ...preferences, savedAt: Number(preferences.savedAt) || Date.now() };
  persist();
}

export function cleanupPreferences() {
  clearTimeout(backupTimer);
}

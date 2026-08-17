const STORAGE_KEY = 'searchall-preferences';
const LEGACY_COOKIE_NAMES = [
  'searchall-username', 'searchall-theme', 'searchall-language', 'searchall-location',
  'searchall-default-searcher', 'searchall-new-tab', 'searchall-background-shade'
];

const defaultPreferences = { username: '', theme: 'system', language: 'en', location: '', defaultSearcher: 'Google', openResultsInNewTab: false, backgroundShade: 45 };

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

/**
 * One-time migration away from cookies: preferences used to be duplicated
 * into cookies as a fallback store. Storage is now localStorage-only, so any
 * leftover cookie is read once (if localStorage has nothing yet) and then
 * expired immediately — nothing writes cookies going forward.
 */
function migrateLegacyCookies() {
  const migrated = {
    username: readCookie('searchall-username'),
    theme: readCookie('searchall-theme'),
    language: readCookie('searchall-language'),
    location: readCookie('searchall-location'),
    defaultSearcher: readCookie('searchall-default-searcher'),
    openResultsInNewTab: readCookie('searchall-new-tab'),
    backgroundShade: readCookie('searchall-background-shade')
  };
  for (const name of LEGACY_COOKIE_NAMES) {
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
  return migrated;
}

function readStoredPreferences() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

export function readPreferences() {
  const stored = readStoredPreferences();
  const legacy = Object.keys(stored).length ? {} : migrateLegacyCookies();
  const theme = stored.theme ?? legacy.theme;
  const language = stored.language ?? legacy.language;
  const rawShade = stored.backgroundShade ?? legacy.backgroundShade;
  const shade = rawShade === null || rawShade === undefined ? NaN : Number(rawShade);

  return {
    savedAt: Number(stored.savedAt) || 0,
    username: stored.username ?? legacy.username ?? defaultPreferences.username,
    theme: ['dark', 'light', 'system'].includes(theme) ? theme : defaultPreferences.theme,
    language: ['en', 'es'].includes(language) ? language : defaultPreferences.language,
    location: stored.location ?? legacy.location ?? defaultPreferences.location,
    defaultSearcher: stored.defaultSearcher ?? legacy.defaultSearcher ?? defaultPreferences.defaultSearcher,
    openResultsInNewTab: (stored.openResultsInNewTab ?? legacy.openResultsInNewTab) === true || (stored.openResultsInNewTab ?? legacy.openResultsInNewTab) === 'true',
    backgroundShade: Number.isFinite(shade) && shade >= 0 && shade <= 85 ? shade : defaultPreferences.backgroundShade
  };
}

export function savePreferences(preferences) {
  const safe = {
    username: preferences.username.trim().slice(0, 40),
    theme: preferences.theme,
    language: preferences.language,
    location: (preferences.location ?? '').trim().slice(0, 80),
    defaultSearcher: (preferences.defaultSearcher ?? defaultPreferences.defaultSearcher).trim().slice(0, 60),
    openResultsInNewTab: Boolean(preferences.openResultsInNewTab),
    backgroundShade: preferences.backgroundShade,
    savedAt: Number(preferences.savedAt) || Date.now()
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch { /* storage unavailable (e.g. private mode) */ }
}

function resolvedTheme(theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = resolvedTheme(theme);
}

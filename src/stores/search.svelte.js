import { applySearcherOptions } from '../lib/bang/options.js';
import { parseBangValue } from '../lib/bang/manager.js';
import { visitAutomatedService, visitService } from '../lib/search.js';

const QUERY_HISTORY_KEY = 'searchall-query-history';
const QUERY_HISTORY_LIMIT = 12;

/**
 * History keeps the value as typed, bang included, so an entry can be shown
 * with its destination icon and syntax highlighting and restored exactly.
 * A bare bang with no query is not worth remembering.
 */
function historyQuery(value) {
  const entry = value.trim();
  return /^![a-z0-9]+(?:\[[^\]]*\])?$/i.test(entry) ? '' : entry;
}

function readQueryHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(QUERY_HISTORY_KEY) ?? '[]');
    const cleaned = Array.isArray(saved)
      ? [...new Set(saved.filter((item) => typeof item === 'string').map(historyQuery).filter(Boolean))].slice(0, QUERY_HISTORY_LIMIT)
      : [];
    try { localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(cleaned)); } catch { /* cleaned history remains in memory */ }
    return cleaned;
  } catch {
    return [];
  }
}

let query = $state('');
let activeBang = $state('');
let queryHistory = $state(readQueryHistory());
let selectedCategory = $state('Todos');

export function getQuery() {
  return query;
}

export function setQuery(value) {
  query = value;
}

export function setActiveBang(value) {
  activeBang = value;
}

export function getQueryHistory() {
  return queryHistory;
}

export function getSelectedCategory() {
  return selectedCategory;
}

export function setSelectedCategory(value) {
  selectedCategory = value;
}

function saveQueryHistory(nextHistory) {
  queryHistory = nextHistory;
  try { localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(nextHistory)); } catch { /* history remains for this session */ }
}

export function recordQuery(value) {
  const entry = historyQuery(value);
  if (!entry) return;
  saveQueryHistory([entry, ...queryHistory.filter((item) => item !== entry)].slice(0, QUERY_HISTORY_LIMIT));
}

export function removeHistoryEntry(entry) {
  saveQueryHistory(queryHistory.filter((item) => item !== entry));
}

export function clearQueryHistory() {
  saveQueryHistory([]);
}

/**
 * Resolves the destination encoded in the current query.
 * `query` holds the full text (e.g. "!gt[es:en] hola"), so the bang is parsed
 * from it rather than tracked separately.
 */
export function bangRequest(allDestinations) {
  const state = parseBangValue(query, allDestinations);
  if (!state.service) return null;
  return {
    service: applySearcherOptions(state.service, state.bang, state.options ?? ''),
    query: state.query
  };
}

export function visitSelectedService(service, selectedQuery, { forceNewTab = false, openInNewTab = false, aiAutomation = false, attachments = [] } = {}) {
  const newTab = forceNewTab || openInNewTab;
  if (service.scope?.includes('AI') && aiAutomation && (selectedQuery.trim() || attachments.length)) {
    visitAutomatedService(service, selectedQuery, newTab, attachments);
    return;
  }
  visitService(service, selectedQuery, newTab);
}

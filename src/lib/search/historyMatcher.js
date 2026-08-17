/**
 * History matching and highlighting logic — pure functions for filtering
 * and visually highlighting query history entries against the current input.
 */

import { withoutBang } from '../bang/manager.js';

/**
 * Normalizes a string for fuzzy comparison: strips diacritics, lowercases,
 * removes the bang prefix, and collapses whitespace.
 * @param {string} input
 * @returns {string}
 */
export function fold(input) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Normalizes a query for history matching (removes bang, folds, collapses spaces).
 * @param {string} query
 * @returns {string}
 */
export function normalizeQuery(query) {
  return fold(withoutBang(query).trim()).replace(/\s+/g, ' ');
}

/**
 * Filters and ranks history entries that match the current query.
 *
 * @param {string[]} history - All history entries
 * @param {string} value - Current input value
 * @param {boolean} bangTyping - Whether user is typing a bang (skip matching if true)
 * @returns {string[]} - Top 8 matching entries, sorted by relevance
 */
export function matchHistory(history, value, bangTyping = false) {
  const needle = normalizeQuery(value);
  if (!needle || bangTyping) return [];

  const terms = needle.split(' ');

  return history
    .map((item, index) => {
      const candidate = normalizeQuery(item);
      const words = candidate.split(' ');
      const containsPhrase = candidate.includes(needle);
      const matchesTerms = terms.every((t) => words.some((w) => w.includes(t)));
      const score = candidate === needle ? 0
        : candidate.startsWith(needle) ? 1
        : containsPhrase ? 2
        : 3;
      return { item, index, matches: containsPhrase || matchesTerms, score };
    })
    .filter((e) => e.matches)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, 8)
    .map((e) => e.item);
}

/**
 * Computes highlighting segments for a history item relative to the typed query.
 * Returns { before, match, after } to render with a <mark> in the UI.
 *
 * @param {string} item - The history entry
 * @param {string} typedValue - Current input value
 * @returns {{ before: string, match: string, after: string }}
 */
export function highlightMatch(item, typedValue) {
  const typed = typedValue.trim();
  if (!typed) return { before: item, match: '', after: '' };

  let idx = fold(item).indexOf(fold(typed));
  let len = typed.length;

  if (idx < 0) {
    const prefix = item.match(/^![a-z0-9]+\s+/i)?.[0] ?? '';
    const needle = normalizeQuery(typedValue);
    idx = fold(item.slice(prefix.length)).indexOf(needle);
    if (idx >= 0) idx += prefix.length;
    len = needle.length;
  }

  if (idx < 0) return { before: item, match: '', after: '' };
  return { before: item.slice(0, idx), match: item.slice(idx, idx + len), after: item.slice(idx + len) };
}



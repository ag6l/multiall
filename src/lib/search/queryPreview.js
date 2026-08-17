/**
 * Turns a history entry into the same pieces the search bar renders, so a saved
 * query looks like the query it was: destination icon, syntax highlighting, and
 * the portion matching what is currently typed marked up.
 */

import { parseBangValue } from '../bang/manager.js';
import { tokenizeQuery } from '../tokenizers/highlighter.js';
import { highlightMatch } from './historyMatcher.js';

/**
 * @param {string} entry - history entry, bang included when it had one
 * @param {string} typed - current input value, for the match highlight
 * @param {object[]} services
 * @returns {{service: object|null, bang: string, pieces: Array<{type: string, kind?: string, text: string, marked: boolean}>}}
 */
export function previewQuery(entry, typed = '', services = []) {
  const state = parseBangValue(entry, services);
  // Only a committed bang gets an icon; a half-typed one stays plain text.
  const committed = state.prefixLen > 0;
  const query = committed ? state.query : entry;
  const service = committed ? state.service : null;

  const segments = tokenizeQuery(query, service);
  const { before, match } = highlightMatch(query, typed);
  const from = match ? before.length : -1;
  const to = match ? from + match.length : -1;

  const pieces = [];
  let cursor = 0;
  for (const segment of segments) {
    const start = cursor;
    const end = cursor + segment.text.length;
    cursor = end;

    // Split the segment on the match boundaries so the highlight can sit inside
    // a styled token without losing the styling.
    for (const [sliceStart, sliceEnd] of boundaries(start, end, from, to)) {
      if (sliceEnd <= sliceStart) continue;
      pieces.push({
        type: segment.type,
        kind: segment.kind,
        // Web-search operators classify by `tone` rather than `kind`.
        tone: segment.tone,
        text: segment.text.slice(sliceStart - start, sliceEnd - start),
        marked: from >= 0 && sliceStart >= from && sliceEnd <= to
      });
    }
  }
  return { service, bang: committed ? state.bang : '', pieces };
}

/** Splits [start,end) at the edges of the match range. */
function boundaries(start, end, from, to) {
  if (from < 0 || to <= start || from >= end) return [[start, end]];
  return [
    [start, Math.max(start, from)],
    [Math.max(start, from), Math.min(end, to)],
    [Math.min(end, to), end]
  ];
}

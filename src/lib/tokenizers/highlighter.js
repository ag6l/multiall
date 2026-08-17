/**
 * Query highlighter — picks a tokenizer based on the destination service.
 *
 *  - 'markdown'  → AI services (ChatGPT, Claude, …): markdown syntax
 *  - 'webSearch' → Google / DuckDuckGo: operators, +include, -exclude, "exact", OR
 *  - 'math'      → Wolfram|Alpha: Wolfram Language notation
 *  - 'plain'     → everything else: no decoration
 *
 * Bang parsing lives in lib/bang/manager.js; this module only sees the query.
 */

import { tokenizeMarkdown } from './markdown.js';
import { tokenizeWebSearchQuery } from './webSearchOperators.js';
import { tokenizeWolfram } from './wolframMath.js';

const WEB_SEARCH_SERVICES = ['Google', 'DuckDuckGo'];
const MATH_SERVICES = ['WolframAlpha'];

export function highlightStrategy(service) {
  if (service?.scope?.includes('AI')) return 'markdown';
  if (MATH_SERVICES.includes(service?.name)) return 'math';
  if (!service || WEB_SEARCH_SERVICES.includes(service.name)) return 'webSearch';
  return 'plain';
}

/**
 * @param {string} text - query text (bang prefix already removed)
 * @param {object|null} service
 * @returns {Array<{type:string, text:string}>}
 */
export function tokenizeQuery(text, service) {
  if (!text) return [];
  switch (highlightStrategy(service)) {
    case 'markdown':
      return tokenizeMarkdown(text);
    case 'math':
      return tokenizeWolfram(text);
    case 'webSearch':
      return withKeywords(tokenizeWebSearchQuery(text));
    default:
      return [{ type: 'text', text }];
  }
}

/** Splits plain-text segments so search keywords become their own segment. */
function withKeywords(segments) {
  const out = [];
  for (const segment of segments) {
    if (segment.type !== 'text') {
      out.push(segment);
      continue;
    }
    // Boolean keywords Google and DuckDuckGo both honour when uppercase.
    const pattern = /\b(?:OR|AND|NOT)\b/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(segment.text))) {
      if (match.index > cursor) out.push({ type: 'text', text: segment.text.slice(cursor, match.index) });
      out.push({ type: 'keyword', text: match[0] });
      cursor = match.index + match[0].length;
    }
    if (cursor === 0) out.push(segment);
    else if (cursor < segment.text.length) out.push({ type: 'text', text: segment.text.slice(cursor) });
  }
  return out;
}

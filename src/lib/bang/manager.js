/**
 * Bang model — single source of truth for how a raw editor string maps to
 * a bang + options + query, and how edits normalize that string.
 *
 * The editor value is ALWAYS the full plain text, e.g. "!gt[es:en] hola".
 * Nothing is stored outside it. Rendering is derived from `parseBangValue`.
 *
 * Lifecycle (what the user sees while typing):
 *   "!abc"        → phase 'typing'           → plain text, still editable
 *   "!abc "       → phase 'activated'        → service icon, query after it
 *   "!abc["       → phase 'options-typing'   → icon + editable "["
 *   "!abc[opt]"   → phase 'options-complete' → icon + "opt" chip
 *   "!abc[]"      → normalized to "!abc "    → icon only, no empty chip
 *
 * `prefixLen` is the number of leading characters represented by non-editable
 * decorations (icon / options chip). Everything after it is editable text, so
 * DOM text offset + prefixLen === value offset. That identity is what keeps the
 * caret from drifting.
 */

/**
 * @typedef {'none'|'typing'|'activated'|'options-typing'|'options-complete'} BangPhase
 * @typedef {{bang?: string|null, name?: string, icon?: {symbol?: string, raster?: boolean},
 *            tags?: string[], search?: string|null}} ServiceLike
 * @typedef {{phase: BangPhase, bang: string, service: ServiceLike|null,
 *            options: string|null, prefixLen: number, query: string}} BangState
 */

/** Extracts the bang prefix from a raw string, e.g. "!gt[es:en] hi" → "!gt[es:en]" */
function bangPrefixOf(input) {
  return input.trimStart().match(/^(![a-z0-9]+(?:\[[^\]]*\])?)(?:\s+|$)/i)?.[1] ?? '';
}

/** Strips the bang prefix, returning only the query portion. */
export function withoutBang(input) {
  const prefix = bangPrefixOf(input);
  return prefix ? input.trimStart().slice(prefix.length).trimStart() : input;
}

/**
 * @param {string} bang
 * @param {ServiceLike[]} services
 * @returns {ServiceLike|null}
 */
function findService(bang, services) {
  return services.find((s) => s.bang?.toLowerCase() === bang.toLowerCase()) ?? null;
}

/**
 * Parses the editor value into its bang state.
 *
 * @param {string} value
 * @param {ServiceLike[]} services
 * @returns {BangState}
 */
export function parseBangValue(value, services = []) {
  /** @type {BangState} */
  const none = { phase: 'none', bang: '', service: null, options: null, prefixLen: 0, query: value };
  const match = value.match(/^(![a-z0-9]+)/i);
  if (!match) return none;

  const bang = match[1];
  const service = findService(bang, services);
  if (!service) return none;

  const rest = value.slice(bang.length);

  // "!abc" — no delimiter yet, the user may still be typing the bang.
  if (rest === '') {
    return { phase: 'typing', bang, service, options: null, prefixLen: 0, query: value };
  }

  // "!abc[...]" — options.
  if (rest[0] === '[') {
    const close = rest.indexOf(']');
    if (close < 0) {
      // Unclosed: the "[..." stays editable text right after the icon.
      return { phase: 'options-typing', bang, service, options: null, prefixLen: bang.length, query: rest };
    }
    const options = rest.slice(1, close);
    const hasSpace = rest[close + 1] === ' ' ? 1 : 0;
    const prefixLen = bang.length + close + 1 + hasSpace;
    /** @type {BangPhase} */
    const phase = options ? 'options-complete' : 'activated';
    return { phase, bang, service, options: options || null, prefixLen, query: value.slice(prefixLen) };
  }

  // "!abc " — committed, icon shown.
  if (rest[0] === ' ') {
    const prefixLen = bang.length + 1;
    return { phase: 'activated', bang, service, options: null, prefixLen, query: value.slice(prefixLen) };
  }

  // "!abcX" — not a bang boundary.
  return none;
}

/**
 * Normalizes a value after an edit and maps the caret along with it.
 *
 * Rules:
 *  - no leading whitespace
 *  - "!abc[]" collapses to "!abc " (no empty chip)
 *  - newlines collapse to spaces unless multiline
 *
 * Deleting the "[" of "!abc[" leaves "!abc", which parses back to phase
 * 'typing' — the bang becomes editable text again. That is intentional: the
 * bracket is the only thing that kept it committed without a trailing space.
 *
 * @returns {{value:string, cursor:number}}
 */
export function normalizeValue(raw, cursor, services = [], { multiline = true } = {}) {
  let value = raw.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n');
  let caret = cursor;

  if (!multiline) value = value.replace(/\n/g, ' ');

  const lead = value.match(/^\s+/)?.[0].length ?? 0;
  if (lead) {
    value = value.slice(lead);
    caret -= lead;
  }

  // Empty options are meaningless: "!abc[] rest" → "!abc rest"
  const empty = value.match(/^(![a-z0-9]+)\[\]/i);
  if (empty && findService(empty[1], services)) {
    const bang = empty[1];
    const rest = value.slice(bang.length + 2).replace(/^\s+/, '');
    const removed = value.length - (bang.length + 1 + rest.length);
    value = `${bang} ${rest}`;
    if (caret > bang.length) caret = Math.max(bang.length + 1, caret - removed);
  }

  return { value, cursor: Math.max(0, Math.min(caret, value.length)) };
}

/**
 * Caret position after the editor DOM has been read back as the source of truth.
 *
 * Used when an IME/dead key committed text without telling us what it inserted
 * (`compositionend` with empty `data`): the DOM already holds the final text, so
 * the inserted length is whatever the value grew by over the replaced range.
 *
 * @param {string} previousValue - value before the composition
 * @param {string} nextValue - value read back from the DOM
 * @param {{start:number, end:number}} range - range the composition replaced
 * @returns {number}
 */
export function caretAfterDomSync(previousValue, nextValue, range) {
  const start = Math.max(0, Math.min(range.start, nextValue.length));
  const removed = Math.max(0, range.end - range.start);
  const inserted = nextValue.length - (previousValue.length - removed);
  return Math.max(start, Math.min(start + Math.max(0, inserted), nextValue.length));
}

/** Replaces [start, end) with `insert`, returning the new value and caret. */
export function spliceValue(value, start, end, insert = '') {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  return { value: value.slice(0, from) + insert + value.slice(to), cursor: from + insert.length };
}

const isSpace = (ch) => ch === undefined || /\s/.test(ch);

/** Start offset for a backwards deletion of the given granularity. */
export function deleteStart(value, pos, inputType = 'deleteContentBackward') {
  if (pos <= 0) return 0;
  if (inputType === 'deleteWordBackward') {
    let i = pos;
    while (i > 0 && isSpace(value[i - 1])) i--;
    while (i > 0 && !isSpace(value[i - 1])) i--;
    return i;
  }
  if (inputType === 'deleteSoftLineBackward' || inputType === 'deleteHardLineBackward') {
    const nl = value.lastIndexOf('\n', pos - 1);
    return nl < 0 ? 0 : nl + 1;
  }
  // Keep surrogate pairs (emoji) intact.
  const code = value.charCodeAt(pos - 1);
  const isLowSurrogate = code >= 0xdc00 && code <= 0xdfff;
  return pos - (isLowSurrogate && pos >= 2 ? 2 : 1);
}

/** End offset for a forwards deletion of the given granularity. */
export function deleteEnd(value, pos, inputType = 'deleteContentForward') {
  if (pos >= value.length) return value.length;
  if (inputType === 'deleteWordForward') {
    let i = pos;
    while (i < value.length && isSpace(value[i])) i++;
    while (i < value.length && !isSpace(value[i])) i++;
    return i;
  }
  if (inputType === 'deleteSoftLineForward' || inputType === 'deleteHardLineForward') {
    const nl = value.indexOf('\n', pos);
    return nl < 0 ? value.length : nl;
  }
  const code = value.charCodeAt(pos);
  const isHighSurrogate = code >= 0xd800 && code <= 0xdbff;
  return pos + (isHighSurrogate && pos + 2 <= value.length ? 2 : 1);
}

/**
 * Computes the next bang when cycling with Tab over a partially typed token.
 * @returns {{prefix:string, index:number, value:string}|null}
 */
export function cycleBang(state, currentToken, bangs, reverse = false, step = 1) {
  const prefix = state.active ? state.prefix : currentToken;
  const matches = bangs.filter((b) => b?.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!matches.length) return null;

  let index;
  if (!state.active) {
    const exact = matches.findIndex((b) => b.toLowerCase() === currentToken.toLowerCase());
    index = reverse ? (exact > 0 ? exact - 1 : matches.length - 1) : (exact >= 0 ? exact : 0);
  } else {
    // `step` is the grid's column count when moving by rows, so it can exceed
    // the list length; the double modulo keeps the result positive either way.
    const delta = reverse ? -step : step;
    index = ((state.index + delta) % matches.length + matches.length) % matches.length;
  }
  return { prefix, index, value: matches[index] };
}

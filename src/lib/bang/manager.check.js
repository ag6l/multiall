/**
 * Self-check for the bang model. Run: node src/lib/bang/manager.check.js
 * Fails loudly if the typing lifecycle or normalization rules regress.
 */

import assert from 'node:assert/strict';
import { parseBangValue, normalizeValue, spliceValue, deleteStart, caretAfterDomSync } from './manager.js';
import { tokenizeQuery } from '../tokenizers/highlighter.js';
import { tokenizeMarkdown } from '../tokenizers/markdown.js';
import { previewQuery } from '../search/queryPreview.js';
import { services as allServices } from '../../data/services.js';

const services = [
  { name: 'Google', bang: '!g' },
  { name: 'Google Traductor', bang: '!gt' }
];
const norm = (value, cursor, opts) => normalizeValue(value, cursor, services, opts);

// --- Lifecycle phases -------------------------------------------------------

assert.equal(parseBangValue('', services).phase, 'none');
assert.equal(parseBangValue('hello', services).phase, 'none');
assert.equal(parseBangValue('!nope', services).phase, 'none', 'unknown bang is plain text');

// "!abc" renders as text, not as an icon
const typing = parseBangValue('!g', services);
assert.equal(typing.phase, 'typing');
assert.equal(typing.prefixLen, 0, 'typing phase keeps the bang editable');
assert.equal(typing.query, '!g');

// "!abc " commits the bang: icon + query
const activated = parseBangValue('!g test', services);
assert.equal(activated.phase, 'activated');
assert.equal(activated.prefixLen, 3);
assert.equal(activated.query, 'test');
assert.equal(activated.service.name, 'Google');

// "!abc[" shows the icon and leaves "[" editable
const optTyping = parseBangValue('!gt[es', services);
assert.equal(optTyping.phase, 'options-typing');
assert.equal(optTyping.prefixLen, 3);
assert.equal(optTyping.query, '[es');

// "!abc[opt]" shows the icon plus an options chip
const optDone = parseBangValue('!gt[es:en] hola', services);
assert.equal(optDone.phase, 'options-complete');
assert.equal(optDone.options, 'es:en');
assert.equal(optDone.prefixLen, 11);
assert.equal(optDone.query, 'hola');

// Options with no trailing space still map correctly
const optNoSpace = parseBangValue('!gt[es:en]hola', services);
assert.equal(optNoSpace.prefixLen, 10);
assert.equal(optNoSpace.query, 'hola');

// The prefix is exactly the non-editable part: prefix + query === value
for (const value of ['!g test', '!gt[es:en] hola', '!gt[es:en]hola', '!gt[es', '!g', 'plain']) {
  const state = parseBangValue(value, services);
  assert.equal(value.slice(0, state.prefixLen) + state.query, value, `prefix/query split for "${value}"`);
}

// --- Normalization ----------------------------------------------------------

// Empty options collapse to a committed bang, never an empty chip
assert.deepEqual(norm('!gt[]', 5), { value: '!gt ', cursor: 4 });
assert.equal(norm('!gt[] hola', 5).value, '!gt hola');
assert.equal(parseBangValue(norm('!gt[]', 5).value, services).phase, 'activated');

// No leading whitespace, and the caret follows the removal
assert.deepEqual(norm('   hi', 5), { value: 'hi', cursor: 2 });
assert.deepEqual(norm(' ', 1), { value: '', cursor: 0 });

// Deleting the "[" un-commits the bang: the icon goes away and "!gt" is text again
const afterBracketDelete = spliceValue('!gt[', deleteStart('!gt[', 4), 4, '');
assert.equal(afterBracketDelete.value, '!gt');
assert.equal(norm(afterBracketDelete.value, afterBracketDelete.cursor).value, '!gt');
assert.equal(parseBangValue('!gt', services).phase, 'typing', 'bracket deletion returns to typing');

// Backspacing the committed space also un-commits it, so the bang stays editable
const afterSpaceDelete = spliceValue('!gt ', deleteStart('!gt ', 4), 4, '');
assert.equal(norm(afterSpaceDelete.value, afterSpaceDelete.cursor).value, '!gt');

// Single-line mode flattens newlines
assert.equal(norm('a\nb', 3, { multiline: false }).value, 'a b');
assert.equal(norm('a\nb', 3, { multiline: true }).value, 'a\nb');

// --- Editing primitives -----------------------------------------------------

assert.deepEqual(spliceValue('abcd', 1, 3, 'X'), { value: 'aXd', cursor: 2 });
assert.equal(deleteStart('abc', 3), 2);
assert.equal(deleteStart('a bc', 4, 'deleteWordBackward'), 2);
assert.equal(deleteStart('abc', 0), 0);

// --- Composition fallback caret ---------------------------------------------
// When an IME/dead key commits without reporting what it inserted, the DOM is
// read back and the caret has to land after the composed text.

// "caf" + dead key ´ + e  →  DOM reads "café", caret sits after the "é"
assert.equal(caretAfterDomSync('caf', 'café', { start: 3, end: 3 }), 4);
// Composition that replaced a selection: "abc" selected, committed as "é"
assert.equal(caretAfterDomSync('abc', 'é', { start: 0, end: 3 }), 1);
// Behind a bang prefix the offsets are value-space, so the caret keeps the prefix
assert.equal(caretAfterDomSync('!g caf', '!g café', { start: 6, end: 6 }), 7);
// A composition that committed nothing must not move the caret backwards
assert.equal(caretAfterDomSync('caf', 'caf', { start: 3, end: 3 }), 3);
// Multi-character commit (IME word) still lands at the end of the insertion
assert.equal(caretAfterDomSync('', 'ñandú', { start: 0, end: 0 }), 5);
// Never points outside the new value
assert.equal(caretAfterDomSync('abc', 'a', { start: 3, end: 3 }), 1);

// --- Tokenizer round-trip ---------------------------------------------------
// The caret maps DOM text offsets onto value offsets, so the rendered segments
// must reproduce the query verbatim. A tokenizer that drops or duplicates a
// character would make the caret drift.

const google = { name: 'Google', bang: '!g' };
const ai = { name: 'ChatGPT', bang: '!c', tags: ['AI'] };
const plain = { name: 'Wikipedia', bang: '!w' };
const math = { name: 'WolframAlpha', bang: '!wa' };

for (const [service, label] of [[google, 'webSearch'], [ai, 'markdown'], [plain, 'plain'], [math, 'math'], [null, 'default']]) {
  for (const query of [
    'site:github.com project -test',
    'a OR b',
    'ORchestra ORDER OR x',
    '"exact phrase" +must -not site:"a b.com"',
    'filetype:pdf before:2024 intitle:hello',
    '**bold** `code` # head\n- item [l](http://x)',
    'Integrate[x^2, x] + Pi',
    'Limit[Sin[x]/x, x -> 0]',
    '2^2',
    'x^(a+b) + 1/x',
    'trailing spaces   ',
    '   ',
    'ünïcode ñ 😀 emoji',
    ''
  ]) {
    const rebuilt = tokenizeQuery(query, service).map((s) => s.text).join('');
    assert.equal(rebuilt, query, `${label} tokenizer must round-trip: ${JSON.stringify(query)}`);
  }
}

// OR is only a keyword when standalone
const orSegments = tokenizeQuery('ORchestra OR ORDER', google);
assert.equal(orSegments.filter((s) => s.type === 'keyword').length, 1, 'only the standalone OR is a keyword');

// --- Wolfram notation -------------------------------------------------------

const mathKinds = Object.fromEntries(
  tokenizeQuery('Integrate[x^2, x] + Pi', math)
    .filter((s) => s.type === 'math')
    .map((s) => [s.text, s.kind])
);
assert.equal(mathKinds.Integrate, 'function');
assert.equal(mathKinds.Pi, 'constant');
assert.equal(mathKinds['['], 'bracket');
assert.equal(mathKinds.x, 'symbol');
// In "x^2" the 2 is an exponent, and "^" is its own kind so it can be dimmed.
assert.equal(mathKinds['2'], 'exponent');
assert.equal(mathKinds['^'], 'power');
assert.equal(tokenizeQuery('42', math)[0].kind, 'number', 'a bare number is not an exponent');

// Multi-character operators stay whole: "->" is not "-" followed by ">"
const arrow = tokenizeQuery('Limit[Sin[x]/x, x -> 0]', math).filter((s) => s.kind === 'operator');
assert.ok(arrow.some((s) => s.text === '->'), 'the rule arrow is one operator');

// "2^2" renders as 2²: the caret is its own kind and the operand is raised
const power = tokenizeQuery('2^2', math);
assert.deepEqual(power.map((s) => s.kind), ['number', 'power', 'exponent']);
// A raised operand is only the token right after "^", never the rest of the line
const afterExponent = tokenizeQuery('2^2 + 3', math);
assert.equal(afterExponent.find((s) => s.text === '3').kind, 'number', 'the exponent run ends at the operand');

// --- Bang uniqueness --------------------------------------------------------
// Two services sharing a bang would make one of them unreachable, and the
// resolver would silently pick whichever comes first.

const allBangs = allServices
  .filter((item) => item.bang)
  .map((item) => [item.name, item.bang.toLowerCase()]);

const owners = new Map();
for (const [name, bang] of allBangs) {
  const previous = owners.get(bang);
  assert.ok(!previous, `bang ${bang} is claimed by both ${previous} and ${name}`);
  owners.set(bang, name);
}
assert.equal(owners.get('!wa'), 'WolframAlpha');
assert.equal(owners.get('!wsp'), 'WhatsApp');

// Every service must be reachable by a search URL or a home page.
for (const item of allServices) {
  assert.ok(item.search || item.home, `${item.name} has no destination`);
}

// --- Markdown marker split --------------------------------------------------
// The editor dims syntax markers instead of hiding them, because caret offsets
// assume every character of the value is a real character in the DOM. So the
// open/content/close split has to rejoin to exactly the original token.

for (const input of [
  '**bold**', '__b__', '*i*', '_i_', '~~s~~', '`code`', '```blk```', '[t](http://u)',
  '# h', '> q', '- l', '1. l', '***x***', '`a` `b`',
  'mix **a** and `b` plus [l](u) end', 'a\n**b**\n> c'
]) {
  const segments = tokenizeMarkdown(input);
  const rejoined = segments
    .map((s) => (s.type === 'markdown' ? s.open + s.content + s.close : s.text))
    .join('');
  assert.equal(rejoined, input, `markdown marker split lost characters in ${JSON.stringify(input)}`);
  assert.equal(segments.map((s) => s.text).join(''), input, 'segment text must rejoin to the input');
}

// --- History preview -------------------------------------------------------
// A saved entry is redrawn as icon + highlighted, styled query. Splitting the
// tokenizer's segments on the match boundaries must not drop or duplicate text.

for (const [entry, typed] of [
  ['!g hello world', 'hello'],
  ['!yt lofi **beats**', 'beats'],
  ['!gt[es:en] hola mundo', 'hola'],
  ['site:mdn.io fetch', 'fetch'],
  ['!c explain `code` please', 'code'],
  ['plain query no bang', 'query'],
  ['!unknownbang text', 'text'],
  ['', '']
]) {
  const preview = previewQuery(entry, typed, allServices);
  const prefix = preview.bang ? entry.slice(0, entry.length - preview.pieces.reduce((n, p) => n + p.text.length, 0)) : '';
  assert.equal(
    prefix + preview.pieces.map((piece) => piece.text).join(''),
    entry,
    `history preview lost characters in ${JSON.stringify(entry)}`
  );
  if (typed) {
    assert.ok(
      preview.pieces.some((piece) => piece.marked),
      `history preview failed to mark the match in ${JSON.stringify(entry)}`
    );
  }
}

assert.equal(previewQuery('!g hi', '', allServices).service?.name, 'Google', 'a committed bang resolves its icon');
assert.equal(previewQuery('!nope hi', '', allServices).service, null, 'an unknown bang stays plain text');

console.log('bang manager + tokenizers: all checks passed');

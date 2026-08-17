/**
 * Safe arithmetic evaluator for the search bar's quick answer.
 *
 * No eval / new Function: a small recursive-descent parser over a fixed
 * grammar, so arbitrary input can never execute code.
 *
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | '%' | '×' | '÷') unary)*
 *   unary   := ('+' | '-') unary | power
 *   power   := primary ('^' unary)?          // right associative
 *   primary := number | constant | name '(' expr ')' | '(' expr ')'
 *
 * Returns null for anything that is not a complete, finite expression, which
 * is also how the UI decides whether to show a result at all.
 */

const FUNCTIONS = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sign: Math.sign,
  round: Math.round, floor: Math.floor, ceil: Math.ceil, trunc: Math.trunc,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  ln: Math.log, log: Math.log10, log2: Math.log2, log10: Math.log10,
  exp: Math.exp
};

const CONSTANTS = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

const MAX_INPUT = 200;

/** Characters the grammar can possibly consume. Anything else disqualifies the input. */
const ALLOWED = /^[\d\s+\-*/%^().,a-z×÷π]+$/i;

/** An expression must actually compute something, not just echo a number. */
const HAS_OPERATION = /[+\-*/%^×÷]|\b(?:sqrt|cbrt|abs|sign|round|floor|ceil|trunc|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|log2|log10|exp)\s*\(/i;

/**
 * @param {string} input
 * @returns {{value:number, expression:string}|null}
 */
export function evaluateExpression(input) {
  const source = String(input ?? '').trim();
  if (!source || source.length > MAX_INPUT) return null;
  if (!ALLOWED.test(source)) return null;
  if (!HAS_OPERATION.test(source)) return null;

  const tokens = tokenize(source);
  if (!tokens) return null;

  const state = { tokens, index: 0 };
  let value;
  try {
    value = parseExpression(state);
  } catch {
    return null;
  }
  // Trailing junk means the input was not a single complete expression.
  if (state.index !== tokens.length) return null;
  if (!Number.isFinite(value)) return null;

  return { value, expression: source };
}

/** Formats a result for display using the user's locale. */
export function formatNumber(value, language = 'en') {
  const locale = language === 'en' ? 'en-US' : 'es-ES';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e15)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(value);
}

// --- Lexer ----------------------------------------------------------------

function tokenize(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (/\s/.test(ch)) { i++; continue; }

    if (/[\d.]/.test(ch)) {
      const match = source.slice(i).match(/^\d*\.?\d+(?:[eE][+-]?\d+)?|^\d+\.?/);
      if (!match) return null;
      tokens.push({ type: 'number', value: Number(match[0]) });
      if (!Number.isFinite(tokens[tokens.length - 1].value)) return null;
      i += match[0].length;
      continue;
    }

    if (/[a-z]/i.test(ch)) {
      // Digits belong to the name so log10 / log2 lex as one token.
      const match = source.slice(i).match(/^[a-z][a-z0-9]*/i);
      tokens.push({ type: 'name', value: match[0].toLowerCase() });
      i += match[0].length;
      continue;
    }

    if (ch === 'π') { tokens.push({ type: 'name', value: 'pi' }); i++; continue; }
    if (ch === '×') { tokens.push({ type: 'op', value: '*' }); i++; continue; }
    if (ch === '÷') { tokens.push({ type: 'op', value: '/' }); i++; continue; }

    if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: ch === '(' || ch === ')' ? ch : 'op', value: ch });
      i++;
      continue;
    }

    // Thousands separator / decimal comma: treat "," as a decimal point only
    // between digits, otherwise the input is not a plain expression.
    if (ch === ',') return null;

    return null;
  }

  return tokens.length ? tokens : null;
}

// --- Parser ---------------------------------------------------------------

const peek = (state) => state.tokens[state.index];

function eat(state, type, value) {
  const token = peek(state);
  if (!token || token.type !== type || (value !== undefined && token.value !== value)) return null;
  state.index++;
  return token;
}

function parseExpression(state) {
  let left = parseTerm(state);
  for (;;) {
    const token = peek(state);
    if (token?.type !== 'op' || (token.value !== '+' && token.value !== '-')) return left;
    state.index++;
    const right = parseTerm(state);
    left = token.value === '+' ? left + right : left - right;
  }
}

function parseTerm(state) {
  let left = parseUnary(state);
  for (;;) {
    const token = peek(state);
    if (token?.type !== 'op' || !'*/%'.includes(token.value)) return left;
    state.index++;
    const right = parseUnary(state);
    if (token.value === '*') left *= right;
    else if (token.value === '/') left /= right;
    else left %= right;
  }
}

function parseUnary(state) {
  const token = peek(state);
  if (token?.type === 'op' && (token.value === '+' || token.value === '-')) {
    state.index++;
    const value = parseUnary(state);
    return token.value === '-' ? -value : value;
  }
  return parsePower(state);
}

function parsePower(state) {
  const base = parsePrimary(state);
  const token = peek(state);
  if (token?.type === 'op' && token.value === '^') {
    state.index++;
    return base ** parseUnary(state); // right associative
  }
  return base;
}

function parsePrimary(state) {
  const token = peek(state);
  if (!token) throw new Error('unexpected end');

  if (token.type === 'number') {
    state.index++;
    return token.value;
  }

  if (token.type === '(') {
    state.index++;
    const value = parseExpression(state);
    if (!eat(state, ')')) throw new Error('missing )');
    return value;
  }

  if (token.type === 'name') {
    state.index++;
    if (token.value in CONSTANTS) return CONSTANTS[token.value];
    const fn = FUNCTIONS[token.value];
    if (!fn) throw new Error(`unknown name ${token.value}`);
    if (!eat(state, '(')) throw new Error('missing (');
    const argument = parseExpression(state);
    if (!eat(state, ')')) throw new Error('missing )');
    return fn(argument);
  }

  throw new Error('unexpected token');
}

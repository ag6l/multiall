/**
 * Self-check for the quick-answer calculator. Run: node src/lib/calculator.check.js
 * The parser must never execute input, and must stay silent unless the whole
 * string is a finite expression worth showing.
 */

import assert from 'node:assert/strict';
import { evaluateExpression, formatNumber } from './calculator.js';

const value = (input) => evaluateExpression(input)?.value;

// --- Precedence and associativity -------------------------------------------

assert.equal(value('2 + 3 * 4'), 14);
assert.equal(value('(2 + 3) * 4'), 20);
assert.equal(value('2 ^ 3 ^ 2'), 512, 'exponentiation is right associative');
assert.equal(value('-4 + 10'), 6);
assert.equal(value('10 - -3'), 13);
assert.equal(value('10 % 3'), 1);
assert.equal(value('1 + 2 - 3 + 4'), 4, 'left associative additions');
assert.equal(value('100 / 5 / 2'), 10, 'left associative divisions');
assert.equal(value('-2 ^ 2'), -4, 'unary minus applies to the power');

// --- Functions and constants ------------------------------------------------

assert.equal(value('sqrt(16)'), 4);
assert.equal(value('log10(1000)'), 3, 'digits belong to the function name');
assert.equal(value('log2(8)'), 3);
assert.equal(value('abs(0 - 7)'), 7);
assert.equal(value('round(2.5)'), 3);
assert.ok(Math.abs(value('2 * pi') - Math.PI * 2) < 1e-12);
assert.ok(Math.abs(value('sin(0) + cos(0)') - 1) < 1e-12);
assert.equal(value('2 × 3'), 6, 'typographic multiplication sign');
assert.equal(value('6 ÷ 3'), 2, 'typographic division sign');

// --- Silence: nothing worth answering ---------------------------------------

assert.equal(evaluateExpression(''), null);
assert.equal(evaluateExpression('   '), null);
assert.equal(evaluateExpression('hola mundo'), null);
assert.equal(evaluateExpression('42'), null, 'a bare number computes nothing');
assert.equal(evaluateExpression('3.14'), null);
assert.equal(evaluateExpression('site:github.com'), null, 'search operators are not math');

// --- Malformed input is rejected, never thrown ------------------------------

for (const bad of [
  '2 +', '+', '(2 + 3', '2 + 3)', '()', '2 3', 'sqrt', 'sqrt(', 'sqrt()',
  'nope(2)', '2 ** 3', '1,5 + 2', 'x + 1', '2 + * 3'
]) {
  assert.equal(evaluateExpression(bad), null, `must reject ${JSON.stringify(bad)}`);
}

// Non-finite results are not answers
assert.equal(evaluateExpression('1 / 0'), null);
assert.equal(evaluateExpression('0 / 0'), null);
assert.equal(evaluateExpression('9 ^ 9 ^ 9'), null, 'overflow is dropped');

// Oversized input is refused before parsing
assert.equal(evaluateExpression(`1 + ${'1 + '.repeat(200)}1`), null);

// No code execution paths
for (const attack of [
  'process.exit(1)', 'constructor(1)', 'eval(1)', 'globalThis(1)',
  '__proto__(1)', 'alert(1)', 'require(1)', 'this(1)'
]) {
  assert.equal(evaluateExpression(attack), null, `must reject ${JSON.stringify(attack)}`);
}

// --- Formatting -------------------------------------------------------------

assert.equal(formatNumber(1234.5, 'en'), '1,234.5');
assert.equal(typeof formatNumber(1 / 3, 'es'), 'string');
assert.ok(formatNumber(1e20, 'en').includes('e'), 'huge numbers use exponential form');
assert.ok(formatNumber(1e-9, 'en').includes('e'), 'tiny numbers use exponential form');

console.log('calculator: all checks passed');

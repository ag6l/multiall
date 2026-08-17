/**
 * Wolfram Language / Wolfram|Alpha math tokenizer.
 *
 * Highlights the notation Wolfram|Alpha accepts so a formula reads like a
 * formula while it is being typed: named functions, constants, operators,
 * brackets and numbers each get their own segment kind.
 *
 * Segments: { type: 'math', kind, text } plus plain { type: 'text', text }.
 */

const FUNCTIONS = new Set([
  // calculus
  'Integrate', 'D', 'Dt', 'DSolve', 'NDSolve', 'Limit', 'Series', 'Sum', 'Product', 'NIntegrate',
  // algebra
  'Solve', 'NSolve', 'Reduce', 'Simplify', 'FullSimplify', 'Expand', 'Factor', 'Apart', 'Together',
  'Collect', 'Coefficient', 'PolynomialQuotient', 'Roots', 'Eliminate',
  // arithmetic / number theory
  'Sqrt', 'Cbrt', 'Abs', 'Sign', 'Round', 'Floor', 'Ceiling', 'Mod', 'Quotient', 'GCD', 'LCM',
  'Prime', 'PrimeQ', 'Factorial', 'Binomial', 'Divisors', 'FactorInteger', 'N',
  // trig / exp / log
  'Sin', 'Cos', 'Tan', 'Cot', 'Sec', 'Csc', 'ArcSin', 'ArcCos', 'ArcTan', 'Sinh', 'Cosh', 'Tanh',
  'Exp', 'Log', 'Log2', 'Log10',
  // linear algebra
  'Det', 'Inverse', 'Transpose', 'Eigenvalues', 'Eigenvectors', 'Dot', 'Cross', 'Norm',
  'MatrixForm', 'IdentityMatrix', 'LinearSolve', 'RowReduce',
  // statistics
  'Mean', 'Median', 'Variance', 'StandardDeviation', 'Total', 'Max', 'Min', 'Sort', 'Length',
  // plotting / structure
  'Plot', 'Plot3D', 'ListPlot', 'ParametricPlot', 'ContourPlot', 'Table', 'Range', 'Map', 'Apply',
  'Function', 'Set', 'Evaluate', 'Convert', 'UnitConvert', 'Quantity'
]);

const CONSTANTS = new Set([
  'Pi', 'E', 'I', 'Infinity', 'ComplexInfinity', 'Indeterminate', 'Degree',
  'GoldenRatio', 'EulerGamma', 'Catalan', 'True', 'False'
]);

// Longest operators first so "->" is not split into "-" and ">".
const OPERATORS = [
  '===', '=!=', '<->', '->', ':>', ':=', '/.', '//', '^=', '+=', '-=', '*=', '/=',
  '==', '!=', '<=', '>=', '&&', '||', '@@', '++', '--',
  '+', '-', '*', '/', '^', '=', '<', '>', '!', '&', '|', '@', '~', '?', '.', ',', ';', ':', "'", '%'
];

const BRACKETS = new Set(['(', ')', '[', ']', '{', '}']);

const NUMBER = /^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|^\.\d+/;
const NAME = /^[A-Za-z\u00c0-\u024f][A-Za-z0-9\u00c0-\u024f]*/;
const SPACE = /^\s+/;

/**
 * @param {string} input
 * @returns {Array<{type:string, kind?:string, text:string}>}
 */
export function tokenizeWolfram(input = '') {
  const segments = [];
  let rest = input;
  // Set right after a "^" so the operand that follows renders raised.
  let exponentNext = false;

  const push = (type, text, kind) => {
    const last = segments[segments.length - 1];
    // Merge consecutive plain text so the DOM stays small.
    if (type === 'text' && last?.type === 'text') last.text += text;
    else segments.push(kind ? { type, kind, text } : { type, text });
  };

  while (rest) {
    const space = rest.match(SPACE);
    if (space) {
      push('text', space[0]);
      rest = rest.slice(space[0].length);
      continue;
    }

    const number = rest.match(NUMBER);
    if (number) {
      push('math', number[0], exponentNext ? 'exponent' : 'number');
      exponentNext = false;
      rest = rest.slice(number[0].length);
      continue;
    }

    const name = rest.match(NAME);
    if (name) {
      const word = name[0];
      const kind = exponentNext ? 'exponent'
        : FUNCTIONS.has(word) ? 'function'
        : CONSTANTS.has(word) ? 'constant'
        : 'symbol';
      push('math', word, kind);
      exponentNext = false;
      rest = rest.slice(word.length);
      continue;
    }

    if (BRACKETS.has(rest[0])) {
      push('math', rest[0], 'bracket');
      exponentNext = false;
      rest = rest.slice(1);
      continue;
    }

    const operator = OPERATORS.find((op) => rest.startsWith(op));
    if (operator) {
      push('math', operator, operator === '^' ? 'power' : 'operator');
      // ponytail: only the single token after "^" is raised, so "x^(a+b)" and
      // "2^10^3" raise just the first operand. Upgrade path: track bracket
      // depth here and close the exponent run on the matching ")".
      exponentNext = operator === '^';
      rest = rest.slice(operator.length);
      continue;
    }

    push('text', rest[0]);
    exponentNext = false;
    rest = rest.slice(1);
  }

  return segments.length ? segments : [{ type: 'text', text: input }];
}

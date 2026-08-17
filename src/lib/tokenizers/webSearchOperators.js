const webSearchOperatorPattern = String.raw`(?:site|intitle|allintitle|inurl|allinurl|filetype|ext|intext|allintext|related|cache|before|after):(?:"[^"]*"|[^\s,;]*)|[+-](?:"[^"]*"|[^\s,;]+)|"[^"]*"`;

const operatorIcons = {
  site: '\uf0ac',
  intitle: '\uf034',
  allintitle: '\uf034',
  inurl: '\uf0c1',
  allinurl: '\uf0c1',
  filetype: '\uf15b',
  ext: '\uf15b',
  intext: '\uf036',
  allintext: '\uf036',
  related: '\uf0c1',
  cache: '\uf1da',
  before: '\uf073',
  after: '\uf073'
};

function operatorTone(text) {
  if (text.startsWith('+')) return 'include';
  if (text.startsWith('-')) return 'exclude';
  if (text.startsWith('"')) return 'exact';
  return 'filter';
}

function operatorParts(text, tone) {
  if (tone === 'exact') return { prefix: '', value: text };
  if (tone !== 'filter') return { prefix: text[0], value: text.slice(1) };
  const separator = text.indexOf(':');
  return {
    prefix: separator >= 0 ? text.slice(0, separator + 1) : text,
    value: separator >= 0 ? text.slice(separator + 1) : ''
  };
}

export function tokenizeWebSearchQuery(input = '') {
  const pattern = new RegExp(`(^|\\s)(${webSearchOperatorPattern})(?=\\s|$)`, 'gim');
  const segments = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(input))) {
    const start = match.index + match[1].length;
    if (start > cursor) segments.push({ type: 'text', text: input.slice(cursor, start) });
    const tone = operatorTone(match[2]);
    const parts = operatorParts(match[2], tone);
    const operator = tone === 'filter' ? parts.prefix.slice(0, -1).toLowerCase() : '';
    segments.push({ type: 'operator', text: match[2], tone, icon: operatorIcons[operator] ?? '', ...parts });
    cursor = start + match[2].length;
  }

  if (cursor < input.length) segments.push({ type: 'text', text: input.slice(cursor) });
  return segments.length ? segments : [{ type: 'text', text: input }];
}

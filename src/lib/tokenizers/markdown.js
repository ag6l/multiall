const markdownPattern = /(```[\s\S]*?```|`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|~~[^~\n]+~~|\[[^\]\n]+\]\([^\s)]+\)|^#{1,6}(?=\s)|^>\s?|^(?:[-*+] |\d+\. ))/gm;

function markdownType(token) {
  if (token.startsWith('```') || token.startsWith('`')) return 'code';
  if (token.startsWith('**') || token.startsWith('__')) return 'strong';
  if (token.startsWith('*') || token.startsWith('_')) return 'emphasis';
  if (token.startsWith('~~')) return 'strike';
  if (token.startsWith('[')) return 'link';
  if (token.startsWith('#')) return 'heading';
  if (token.startsWith('>')) return 'quote';
  return 'list';
}

/**
 * Splits a token into its syntax markers and the content between them, so the
 * markers can be rendered dimmed while the content carries the actual styling.
 *
 * Every character ends up in exactly one part and the parts re-join to the
 * original token — nothing is dropped. That matters: the editor's caret math
 * assumes each character of the value is a real character in the DOM.
 */
function splitMarkers(token, kind) {
  if (kind === 'link') {
    const separator = token.indexOf('](');
    return { open: '[', content: token.slice(1, separator), close: token.slice(separator) };
  }
  const wrap = {
    code: token.startsWith('```') ? '```' : '`',
    strong: token.slice(0, 2),
    emphasis: token.slice(0, 1),
    strike: '~~'
  }[kind];
  // Heading / quote / list markers have no closing half: the token is all marker.
  if (!wrap) return { open: token, content: '', close: '' };
  return { open: wrap, content: token.slice(wrap.length, token.length - wrap.length), close: wrap };
}

export function tokenizeMarkdown(input = '') {
  const segments = [];
  let cursor = 0;
  let match;
  markdownPattern.lastIndex = 0;

  while ((match = markdownPattern.exec(input))) {
    if (match.index > cursor) segments.push({ type: 'text', text: input.slice(cursor, match.index) });
    const kind = markdownType(match[0]);
    segments.push({ type: 'markdown', kind, text: match[0], ...splitMarkers(match[0], kind) });
    cursor = match.index + match[0].length;
  }

  if (cursor < input.length) segments.push({ type: 'text', text: input.slice(cursor) });
  return segments.length ? segments : [{ type: 'text', text: input }];
}

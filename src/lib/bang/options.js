export const googleTranslateLanguageCodes = [
  'ab', 'ace', 'ach', 'af', 'sq', 'alz', 'am', 'ar', 'hy', 'as', 'awa', 'ay', 'az', 'ban', 'bm', 'ba',
  'eu', 'btx', 'bts', 'bbc', 'be', 'bem', 'bn', 'bew', 'bho', 'bik', 'bs', 'br', 'bg', 'bua', 'yue',
  'ca', 'ceb', 'ny', 'zh-CN', 'zh-TW', 'cv', 'co', 'crh', 'hr', 'cs', 'da', 'din', 'dv', 'doi', 'dov',
  'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fj', 'fil', 'fi', 'fr', 'fr-FR', 'fr-CA', 'fy', 'ff', 'gaa',
  'gl', 'lg', 'ka', 'de', 'el', 'gn', 'gu', 'ht', 'cnh', 'ha', 'haw', 'he', 'hil', 'hi', 'hmn', 'hu',
  'hrx', 'is', 'ig', 'ilo', 'id', 'ga', 'it', 'ja', 'jv', 'kn', 'pam', 'kk', 'km', 'cgg', 'rw', 'ktu',
  'gom', 'ko', 'kri', 'ku', 'ckb', 'ky', 'lo', 'ltg', 'la', 'lv', 'lij', 'li', 'ln', 'lt', 'lmo', 'luo',
  'lb', 'mk', 'mai', 'mak', 'mg', 'ms', 'ms-Arab', 'ml', 'mt', 'mi', 'mr', 'chm', 'mni-Mtei', 'min',
  'lus', 'mn', 'my', 'nr', 'new', 'ne', 'nso', 'no', 'nus', 'oc', 'or', 'om', 'pag', 'pap', 'ps', 'fa',
  'pl', 'pt', 'pt-PT', 'pt-BR', 'pa', 'pa-Arab', 'qu', 'rom', 'ro', 'rn', 'ru', 'sm', 'sg', 'sa', 'gd',
  'sr', 'st', 'crs', 'shn', 'sn', 'scn', 'szl', 'sd', 'si', 'sk', 'sl', 'so', 'es', 'su', 'sw', 'ss',
  'sv', 'tg', 'ta', 'tt', 'te', 'tet', 'th', 'ti', 'ts', 'tn', 'tr', 'tk', 'ak', 'uk', 'ur', 'ug', 'uz',
  'vi', 'cy', 'xh', 'yi', 'yo', 'yua', 'zu'
];

const googleLanguageCodes = new Map(googleTranslateLanguageCodes.map((code) => [code.toLowerCase(), code]));

function parseGoogleTranslateOptions(value) {
  const match = value.match(/^([^:]+):([^:]+)$/);
  if (!match) return null;
  const source = match[1];
  const target = match[2];
  if (source.toLowerCase() !== 'auto' && !googleLanguageCodes.has(source.toLowerCase())) return null;
  if (!googleLanguageCodes.has(target.toLowerCase())) return null;
  return {
    source: source.toLowerCase() === 'auto' ? 'auto' : googleLanguageCodes.get(source.toLowerCase()),
    target: googleLanguageCodes.get(target.toLowerCase())
  };
}

export const searcherOptionHandlers = {
  '!gt': {
    parse: parseGoogleTranslateOptions,
    apply(service, options) {
      const pair = parseGoogleTranslateOptions(options);
      if (!pair) return service;
      return {
        ...service,
        search: `https://translate.google.com/?sl=${encodeURIComponent(pair.source)}&tl=${encodeURIComponent(pair.target)}&text=`,
        searchSuffix: '&op=translate'
      };
    }
  }
};

export function splitBangToken(token = '') {
  const match = token.match(/^\s*(![a-z0-9]+)(?:\[([^\]]*)\])?\s*$/i);
  return match ? { base: match[1], options: match[2] ?? null } : { base: '', options: null };
}

export function parseSearcherOptions(bang, options) {
  return searcherOptionHandlers[bang.toLowerCase()]?.parse?.(options) ?? null;
}

export function applySearcherOptions(service, bang, options) {
  return searcherOptionHandlers[bang.toLowerCase()]?.apply?.(service, options) ?? service;
}

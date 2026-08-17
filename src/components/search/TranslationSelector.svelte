<script>
  import { googleTranslateLanguageCodes } from '../../lib/bang/options.js';

  let { translationOptions, activeBang, language = 'en', onchange } = $props();

  const translatedLanguages = $derived.by(() => {
    let dn;
    try { dn = new Intl.DisplayNames([language], { type: 'language' }); } catch { dn = null; }
    return googleTranslateLanguageCodes
      .map((code) => ({ code, name: dn?.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, language));
  });

  function changeLanguage(part, nextValue) {
    const source = part === 'source' ? nextValue : translationOptions.source;
    const target = part === 'target' ? nextValue : translationOptions.target;
    onchange(`!gt[${source}:${target}]`);
  }
</script>

<span class="active-bang-options translation-options" title={activeBang}>
  <select
    aria-label={language === 'es' ? 'Idioma de origen' : 'Source language'}
    value={translationOptions.source}
    onchange={(e) => changeLanguage('source', e.currentTarget.value)}
  >
    <option value="auto">{language === 'es' ? 'Detectar idioma' : 'Detect language'} (auto)</option>
    {#each translatedLanguages as item (item.code)}
      <option value={item.code}>{item.name} ({item.code})</option>
    {/each}
  </select>
  <span aria-hidden="true">→</span>
  <select
    aria-label={language === 'es' ? 'Idioma de destino' : 'Target language'}
    value={translationOptions.target}
    onchange={(e) => changeLanguage('target', e.currentTarget.value)}
  >
    {#each translatedLanguages as item (item.code)}
      <option value={item.code}>{item.name} ({item.code})</option>
    {/each}
  </select>
</span>

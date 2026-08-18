<script>
  import { iconHref, iconIsRaster, iconTone } from '../../lib/icon.js';
  let { service, query, text, bangSelected = false, showBangHint = false, onclick } = $props();
  // The grid decides when bangs are being picked; it is the only place that
  // knows about an in-place edit, which the query text alone cannot show.
  const showShortcut = $derived(Boolean(service.bang) && showBangHint);
  const tone = $derived(iconTone(service.icon));
</script>

<button
  class="service-card"
  class:shortcut-mode={showShortcut}
  class:bang-selected={bangSelected}
  data-bang={service.bang}
  type="button"
  onclick={() => onclick(service, false)}
  onauxclick={(event) => {
    if (event.button !== 1) return;
    event.preventDefault();
    onclick(service, true);
  }}
  aria-label={service.bang
    ? `${text.useBang} ${service.name} (${service.bang})`
    : (query.trim() ? `${text.searchIn} “${query.trim()}” — ${service.name}` : `${text.open} ${service.name}`)}
  title={service.bang ? text.middleClickOpen : undefined}
>
  <span class="icon-shell">
    <svg class="service-icon" class:raster-icon={iconIsRaster(service.icon)} class:icon-tone-dark={tone === 'dark'} class:icon-tone-light={tone === 'light'} aria-hidden="true" viewBox="0 0 24 24">
      <use href={iconHref(service.icon)}></use>
    </svg>
  </span>
  <span class="service-name">{service.name}</span>
  {#if showShortcut}<kbd class="bang-hint" aria-hidden="true">{service.bang}</kbd>{/if}
  {#if service.requiresUserscript}<span class="userscript-tag" title="Userscript required">ujs</span>{/if}
  <span class="arrow" aria-hidden="true">↗</span>
</button>

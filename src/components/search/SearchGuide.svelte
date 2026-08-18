<script>
  import { iconHref, iconIsRaster, iconTone } from '../../lib/icon.js';
  let { activeService, activeSearchGuide } = $props();
  const tone = $derived(iconTone(activeService.icon));
</script>

{#key activeService.name}
  <aside class="active-search-guide" aria-label={`${activeService.name}: ${activeSearchGuide.syntaxLabel}`}>
    <span class="guide-icon" aria-hidden="true">
      <svg class:raster-icon={iconIsRaster(activeService.icon)} class:icon-tone-dark={tone === 'dark'} class:icon-tone-light={tone === 'light'} viewBox="0 0 24 24"><use href={iconHref(activeService.icon)}></use></svg>
    </span>
    <div class="guide-content">
      <div class="guide-summary">
        <strong>{activeService.name}</strong>
        <span>{activeSearchGuide.summary}</span>
        {#if activeSearchGuide.history}<span class="guide-history">{activeSearchGuide.history}</span>{/if}
        {#if activeSearchGuide.focus}<span class="guide-focus">{activeSearchGuide.focus}</span>{/if}
      </div>
      <div class="guide-details">
        <span class="guide-shortcut"><small>{activeSearchGuide.shortcutLabel}</small><code>{activeService.bang}</code></span>
        <div class="guide-syntax-list">
          <small>{activeSearchGuide.syntaxLabel}</small>
          {#if activeSearchGuide.syntaxes.length}
            {#each activeSearchGuide.syntaxes as syntax}<span class="guide-syntax"><code>{syntax[0]}</code><span>{syntax[1]}</span></span>{/each}
          {:else}<span class="guide-no-options">{activeSearchGuide.noOptions}</span>{/if}
        </div>
      </div>
    </div>
  </aside>
{/key}

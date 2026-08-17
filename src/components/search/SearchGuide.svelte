<script>
  import { iconTone } from '../../lib/iconTone.js';
  let { activeService, activeSearchGuide, activeServiceInitials } = $props();
</script>

{#key activeService.name}
  <aside class="active-search-guide" aria-label={`${activeService.name}: ${activeSearchGuide.syntaxLabel}`}>
    <span class="guide-icon" aria-hidden="true">
      {#if activeService.icon?.symbol}
        <svg class:raster-icon={activeService.icon.raster} class:icon-tone-dark={iconTone(activeService.icon) === 'dark'} class:icon-tone-light={iconTone(activeService.icon) === 'light'} viewBox="0 0 24 24"><use href={`./assets/icons.svg#${activeService.icon.symbol}`}></use></svg>
      {:else}<span>{activeServiceInitials}</span>{/if}
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

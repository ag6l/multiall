<script>
  import { iconHref, iconIsRaster, iconTone } from '../../lib/icon.js';
  import { previewQuery } from '../../lib/search/queryPreview.js';

  let { entry, typed = '', services = [] } = $props();

  const preview = $derived(previewQuery(entry, typed, services));
  const tone = $derived(iconTone(preview.service?.icon));

  // The editor draws operators as full cards; in a compact history row the flat
  // colour variants read better while keeping the same palette.
  const operatorClass = (tone) => ({
    include: 'hl-include', exclude: 'hl-exclude', exact: 'hl-exact', filter: 'hl-filter'
  }[tone] ?? 'hl-operator');
</script>

<span class="query-preview">
  {#if preview.service}
    <span class="bang-chip" title={preview.bang} aria-label={preview.service.name}>
      <svg class="bang-chip-icon" class:raster-icon={iconIsRaster(preview.service.icon)} class:icon-tone-dark={tone === 'dark'} class:icon-tone-light={tone === 'light'} viewBox="0 0 24 24" aria-hidden="true"><use href={iconHref(preview.service.icon)}></use></svg>
    </span>
  {/if}<span class="query-preview-text">{#each preview.pieces as piece, index (index)}{#if piece.type === 'operator'}<span class={operatorClass(piece.tone)} class:marked={piece.marked}>{piece.text}</span>{:else if piece.type === 'keyword'}<span class="search-keyword" class:marked={piece.marked}>{piece.text}</span>{:else if piece.type === 'markdown'}<span class="hl-md hl-md-{piece.kind}" class:marked={piece.marked}>{piece.text}</span>{:else if piece.type === 'math'}<span class="hl-math hl-math-{piece.kind}" class:marked={piece.marked}>{piece.text}</span>{:else}<span class:marked={piece.marked}>{piece.text}</span>{/if}{/each}</span>
</span>

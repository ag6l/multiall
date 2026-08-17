<script>
  import ServiceCard from './ServiceCard.svelte';
  import { categoryLabels } from '../../lib/i18n.js';
  import { fitToViewport } from '../../lib/fitToViewport.js';
  let {
    services, query, text, language, onselect,
    showFilters = false,
    selectedCategory = $bindable('Todos'),
    // Bang being typed or edited in the search bar. `bangToken` is the prefix
    // that defines the candidate set and `bangCurrent` is the one selected
    // within it — they differ while Tab cycles, which is what keeps the whole
    // set on screen instead of narrowing to the completed bang. Both take
    // precedence over reading the token out of `query`, which can only see the
    // case where the whole value is a bare token.
    bangToken = '',
    bangCurrent = '',
    // True only while Tab/arrows are walking the candidates, which is the only
    // time the highlighted card should be scrolled into view.
    bangCycling = false,
    oncolumns
  } = $props();
  const primaryTags = ['Search', 'Questions', 'AI'];
  // A service is filterable by any of its scopes ("Search", "AI", …) or by its
  // category ("Video", "Social", …); scopes lead the list as primary filters.
  const tagsOf = (item) => [...item.scope, item.category];
  const categories = $derived.by(() => {
    const available = new Set(services.flatMap(tagsOf));
    const primary = primaryTags.filter((tag) => available.has(tag));
    const details = [...available].filter((tag) => !primaryTags.includes(tag));
    return ['Todos', ...primary, ...details];
  });
  const categoryServices = $derived(selectedCategory === 'Todos'
    ? services
    : services.filter((item) => tagsOf(item).includes(selectedCategory))
  );
  const bangPrefix = $derived(
    (bangToken || query.trimStart().match(/^![a-z0-9]*$/i)?.[0] || '').toLowerCase()
  );
  // Candidates come from the category-filtered set, so an active filter narrows
  // the bang list too instead of highlighting cards that are not on screen.
  const bangCandidates = $derived(bangPrefix
    ? categoryServices.filter((item) => item.bang?.toLowerCase().startsWith(bangPrefix))
    : []
  );
  const highlighted = $derived((bangCurrent || bangPrefix).toLowerCase());
  const selectedBang = $derived(
    bangCandidates.find((item) => item.bang?.toLowerCase() === highlighted)?.bang
      ?? bangCandidates[0]?.bang
      ?? ''
  );
  const visibleServices = $derived(bangPrefix
    ? categoryServices.filter((item) => item.bang)
    : categoryServices
  );
  const label = (category) => category === 'Todos' ? text.all : (categoryLabels[language]?.[category] ?? category);

  let gridEl = $state();

  // The grid is `auto-fill`, so the column count is only knowable from the
  // resolved layout. It is reported upward so the search bar can move the bang
  // selection by a whole row when the vertical arrows are used.
  $effect(() => {
    if (!gridEl) return;
    const report = () => {
      const tracks = getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length;
      oncolumns?.(Math.max(1, tracks));
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(gridEl);
    return () => observer.disconnect();
  });

  // Cycling bangs with Tab or the arrows walks a list that is taller than the
  // panel, so the highlighted card is scrolled back into view. `nearest` keeps
  // it from jumping when the card is already visible, and the scroll is confined
  // to the panel rather than moving the page.
  //
  // Gated on `bangCycling`: merely typing "!" already highlights the first
  // candidate, and scrolling to it there would throw away wherever the user had
  // scrolled to before.
  $effect(() => {
    if (!bangCycling || !selectedBang || !gridEl) return;
    const card = gridEl.querySelector(`[data-bang="${CSS.escape(selectedBang)}"]`);
    card?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
</script>
{#if showFilters}
  <div class="filters" aria-label={text.filterServices}>
    {#each categories as category}<button type="button" class:active={selectedCategory === category} onclick={() => (selectedCategory = category)}>{label(category)}</button>{/each}
  </div>
{/if}
<div class="service-grid" bind:this={gridEl} use:fitToViewport={{ minHeight: 180 }}>
  {#each visibleServices as service (service.name)}<ServiceCard {service} {query} {text} showBangHint={Boolean(bangPrefix)} bangSelected={service.bang === selectedBang} onclick={onselect} />{/each}
</div>

<script>
  import QueryPreview from './QueryPreview.svelte';

  let { items = [], text, typed = '', services = [], highlighted = -1, onreuse, onremove, onhighlight } = $props();
</script>

<div id="query-suggestions" class="query-history" aria-label={text.recentQueries} role="listbox">
  {#each items as item, index (item)}
    <div
      class="history-item"
      class:highlighted={index === highlighted}
      role="option"
      aria-selected={index === highlighted}
      aria-label={item}
      onpointerenter={() => onhighlight?.(index)}
    >
      <span class="history-icon" aria-hidden="true">↶</span>
      <button class="history-query" type="button" title={item} onmousedown={(e) => e.preventDefault()} onclick={() => onreuse(item)}>
        <QueryPreview entry={item} {typed} {services} />
      </button>
      <button class="history-remove" type="button" aria-label={`${text.removeQuery}: ${item}`} onmousedown={(e) => e.preventDefault()} onclick={() => onremove(item)}>×</button>
    </div>
  {/each}
</div>

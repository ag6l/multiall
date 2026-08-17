<script>
  import QueryPreview from './QueryPreview.svelte';

  let { items = [], text, typed = '', services = [], onreuse, onremove } = $props();
</script>

<div id="query-suggestions" class="query-history" aria-label={text.recentQueries} role="listbox">
  {#each items as item (item)}
    <div class="history-item" role="option" aria-selected="false" aria-label={item}>
      <span class="history-icon" aria-hidden="true">↶</span>
      <button class="history-query" type="button" title={item} onmousedown={(e) => e.preventDefault()} onclick={() => onreuse(item)}>
        <QueryPreview entry={item} {typed} {services} />
      </button>
      <button class="history-remove" type="button" aria-label={`${text.removeQuery}: ${item}`} onmousedown={(e) => e.preventDefault()} onclick={() => onremove(item)}>×</button>
    </div>
  {/each}
</div>

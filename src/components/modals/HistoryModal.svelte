<script>
  import QueryPreview from '../search/QueryPreview.svelte';

  let { open, items = [], text, services = [], onreuse, onremove, onclear, onclose } = $props();
  let dialog = $state();
  let listEl = $state();
  let selected = $state(0);

  $effect(() => {
    if (open && dialog && !dialog.open) {
      selected = 0;
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  });

  // Removing entries shortens the list, so keep the cursor in range.
  $effect(() => {
    if (selected > items.length - 1) selected = Math.max(0, items.length - 1);
  });

  function cancel(event) {
    event.preventDefault();
    onclose();
  }

  function reuse(entry) {
    onreuse(entry);
    onclose();
  }

  /** Keeps the highlighted row inside the scrolling list. */
  function revealSelected() {
    listEl?.children[selected]?.scrollIntoView({ block: 'nearest' });
  }

  function move(delta) {
    if (!items.length) return;
    selected = (selected + delta + items.length) % items.length;
    revealSelected();
  }

  /**
   * Arrow keys drive the list. Handled on the dialog rather than per-row so it
   * works no matter what has focus inside it, and the default is prevented so
   * the browser does not also scroll the panel or hop between the buttons.
   */
  function handleKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selected = event.key === 'Home' ? 0 : items.length - 1;
      revealSelected();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (items[selected]) reuse(items[selected]);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (items[selected]) onremove(items[selected]);
    }
  }
</script>

<dialog
  class="history-dialog"
  bind:this={dialog}
  onclose={onclose}
  oncancel={cancel}
  onkeydown={handleKeydown}
  onclick={(event) => event.target === dialog && onclose()}
>
  <section class="history-panel">
    <header>
      <div>
        <p class="section-kicker">{text.recentQueries}</p>
        <h2>{items.length} {items.length === 1 ? text.queryOne : text.queryMany}</h2>
      </div>
      <button class="close-button" type="button" aria-label={text.closeHistory} onclick={onclose}>×</button>
    </header>

    {#if items.length}
      <ul class="history-list" bind:this={listEl} role="listbox" aria-label={text.recentQueries}>
        {#each items as entry, index (entry)}
          <li class:selected={index === selected} role="option" aria-selected={index === selected}>
            <button class="history-entry" type="button" title={entry} onmouseenter={() => (selected = index)} onclick={() => reuse(entry)}>
              <QueryPreview {entry} {services} />
            </button>
            <button class="history-remove" type="button" aria-label={text.removeQuery} onclick={() => onremove(entry)}>×</button>
          </li>
        {/each}
      </ul>
      <footer>
        <small>{text.historyKeys}</small>
        <button class="secondary-button" type="button" onclick={onclear}>{text.clearHistory}</button>
      </footer>
    {:else}
      <p class="history-empty">{text.emptyHistory}</p>
    {/if}
  </section>
</dialog>

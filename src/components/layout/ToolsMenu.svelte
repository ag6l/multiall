<script>
  let { links, text } = $props(); let menu = $state();
  function closeOnOutsideClick(event) { if (menu?.open && !menu.contains(event.target)) menu.open = false; }
  function closeOnEscape(event) { if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary')?.focus(); } }
</script>
<svelte:window onclick={closeOnOutsideClick} onkeydown={closeOnEscape} />
<details class="tools-menu" bind:this={menu}>
  <summary aria-label={text.tools}><span aria-hidden="true">☰</span>{text.tools}</summary>
  <div class="tools-panel"><p>{text.usefulShortcuts}</p>{#each links as link}<a href={link.url}>{link.name}<span aria-hidden="true">↗</span></a>{/each}</div>
</details>

<script>
  let {
    open,
    preferences,
    searchers = [],
    hasBackground,
    onsave,
    onclose,
    onbackgroundchange,
    onbackgroundremove,
    text
  } = $props();

  let dialog = $state();
  let username = $state('');
  let theme = $state('system');
  let language = $state('es');
  let location = $state('');
  let defaultSearcher = $state('Google');
  let openResultsInNewTab = $state(false);
  let backgroundShade = $state(45);
  let message = $state('');
  let busy = $state(false);
  const usesLightTheme = $derived(theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches));

  $effect(() => {
    if (open && dialog && !dialog.open) {
      username = preferences.username;
      theme = preferences.theme;
      language = preferences.language;
      location = preferences.location ?? '';
      defaultSearcher = searchers.some((item) => item.name === preferences.defaultSearcher) ? preferences.defaultSearcher : 'Google';
      openResultsInNewTab = preferences.openResultsInNewTab ?? false;
      backgroundShade = preferences.backgroundShade;
      message = '';
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  });

  function applyImmediately(overrides = {}) {
    onsave({ username, theme, language, location, defaultSearcher, openResultsInNewTab, backgroundShade: Number(backgroundShade), ...overrides });
  }

  function submit(event) {
    event.preventDefault();
    applyImmediately();
    onclose();
  }

  async function chooseBackground(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message = text.invalidImage;
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      message = text.largeImage;
      return;
    }

    busy = true;
    message = '';
    try {
      await onbackgroundchange(file);
      message = text.backgroundSaved;
    } catch {
      message = text.backgroundSaveError;
    } finally {
      busy = false;
    }
  }

  async function clearBackground() {
    busy = true;
    message = '';
    try {
      await onbackgroundremove();
      message = text.backgroundRemoved;
    } catch {
      message = text.backgroundRemoveError;
    } finally {
      busy = false;
    }
  }
</script>

<dialog
  class="settings-dialog"
  bind:this={dialog}
  onclose={onclose}
  onclick={(event) => event.target === dialog && onclose()}
>
  <form class="settings-form" onsubmit={submit}>
    <header>
      <div>
        <p class="section-kicker">{text.personalization}</p>
        <h2>{text.settings}</h2>
      </div>
      <button class="close-button" type="button" aria-label={text.closeSettings} onclick={onclose}>×</button>
    </header>

    <label>
      <span>{text.yourName}</span>
      <input bind:value={username} maxlength="40" autocomplete="name" placeholder={text.user} oninput={(event) => applyImmediately({ username: event.currentTarget.value })} />
      <small>{text.nameHelp}</small>
    </label>

    <label>
      <span>{text.language}</span>
      <select bind:value={language} onchange={(event) => applyImmediately({ language: event.currentTarget.value })}>
        <option value="es">{text.spanish}</option>
        <option value="en">{text.english}</option>
      </select>
    </label>

    <label>
      <span>{text.weatherLocation}</span>
      <input
        bind:value={location}
        maxlength="80"
        autocomplete="address-level2"
        placeholder={text.weatherLocationPlaceholder}
        onchange={(event) => applyImmediately({ location: event.currentTarget.value })}
      />
      <small>{text.weatherLocationHelp}</small>
    </label>

    <label>
      <span>{text.theme}</span>
      <select bind:value={theme} onchange={(event) => applyImmediately({ theme: event.currentTarget.value })}>
        <option value="system">{text.systemTheme}</option>
        <option value="dark">{text.dark}</option>
        <option value="light">{text.light}</option>
      </select>
    </label>

    <label>
      <span>{text.defaultSearcher}</span>
      <select bind:value={defaultSearcher} onchange={(event) => applyImmediately({ defaultSearcher: event.currentTarget.value })}>
        {#each searchers as searcher (searcher.name)}
          <option value={searcher.name}>{searcher.name} · {searcher.bang}</option>
        {/each}
      </select>
      <small>{text.defaultSearcherHelp}</small>
    </label>

    <label class="checkbox-setting">
      <input
        type="checkbox"
        bind:checked={openResultsInNewTab}
        onchange={(event) => applyImmediately({ openResultsInNewTab: event.currentTarget.checked })}
      />
      <span>{text.openResultsNewTab}</span>
    </label>

    <label>
      <span>{usesLightTheme ? text.brighten : text.shade}: {backgroundShade}%</span>
      <input class="shade-range" type="range" min="0" max="85" step="5" bind:value={backgroundShade} oninput={(event) => applyImmediately({ backgroundShade: Number(event.currentTarget.value) })} />
    </label>

    <fieldset>
      <legend>{text.background}</legend>
      <div class="background-actions">
        <label class="file-button" class:disabled={busy}>
          {busy ? text.saving : hasBackground ? text.changeImage : text.chooseImage}
          <input type="file" accept="image/*" onchange={chooseBackground} disabled={busy} />
        </label>
        {#if hasBackground}
          <button class="secondary-button" type="button" onclick={clearBackground} disabled={busy}>{text.removeBackground}</button>
        {/if}
      </div>
      <small>{text.backgroundHelp}</small>
      {#if message}<p class="settings-message" aria-live="polite">{message}</p>{/if}
    </fieldset>

    <button class="save-button" type="submit">{text.save}</button>
  </form>
</dialog>

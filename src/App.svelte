<script>
  import { onMount, tick } from 'svelte';
  import AppHeader from './components/layout/AppHeader.svelte';
  import CalendarModal from './components/modals/CalendarModal.svelte';
  import HistoryModal from './components/modals/HistoryModal.svelte';
  import SearchBar from './components/search/SearchBar.svelte';
  import ServiceGrid from './components/services/ServiceGrid.svelte';
  import ServiceCard from './components/services/ServiceCard.svelte';
  import SettingsPanel from './components/settings/SettingsPanel.svelte';
  import ToolsMenu from './components/layout/ToolsMenu.svelte';
  import WeatherModal from './components/modals/WeatherModal.svelte';
  import { services, toolLinks } from './data/services.js';
  import { copyFor } from './lib/i18n.js';
  import { formatLocalDateTime, timeGreeting } from './lib/search.js';
  import { describeForecast } from './lib/weather.js';
  import { applyTheme } from './lib/preferences.js';

  // Stores
  import {
    getQuery, setQuery, setActiveBang,
    getQueryHistory, getSelectedCategory, setSelectedCategory,
    recordQuery, removeHistoryEntry, clearQueryHistory, bangRequest, visitSelectedService
  } from './stores/search.svelte.js';
  import { getWeatherData, getWeatherLoading, getWeatherNeedsLocation, loadWeather } from './stores/weather.svelte.js';
  import {
    getSettingsOpen, openSettings, closeSettings,
    getHistoryModalOpen, openHistoryModal, closeHistoryModal,
    getCalendarModalOpen, openCalendarModal, closeCalendarModal,
    getWeatherModalOpen, openWeatherModal, closeWeatherModal,
    getBackgroundUrl, getHasBackground,
    loadSavedBackground, changeBackground, clearBackground,
    getAiAutomation, setAiAutomation, initAiAutomation,
    getNow, startClock, cleanupUi
  } from './stores/ui.svelte.js';
  import {
    getPreferences, updatePreferences, syncPreferencesBackup, cleanupPreferences
  } from './stores/preferences.svelte.js';

  // --- Computed service lists (static) ---

  // Userscript-only destinations sort last: they cannot take a query by URL.
  function mergeDestinations() {
    return services
      .filter((item) => !item.scope.includes('Utilidades'))
      .sort((a, b) =>
        Number(Boolean(a.requiresUserscript)) - Number(Boolean(b.requiresUserscript))
          || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
  }

  const displayedServices = mergeDestinations();
  const utilityServices = services.filter((item) => item.scope.includes('Utilidades'));
  const defaultSearchers = services.filter((item) => item.search).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const allDestinations = [...displayedServices, ...utilityServices];

  // --- Reactive proxies from stores ---
  // We use getter-based $derived to keep template reactive while stores own the state.

  const preferences = $derived(getPreferences());
  const text = $derived(copyFor(preferences.language));
  const time = $derived(timeGreeting(preferences.language));
  const clock = $derived(formatLocalDateTime(getNow(), preferences.language));
  const weatherForecast = $derived(describeForecast(getWeatherData(), preferences.language));
  const weather = $derived(weatherForecast?.current ?? null);
  const queryHistory = $derived(getQueryHistory());
  const settingsOpen = $derived(getSettingsOpen());
  const historyModalOpen = $derived(getHistoryModalOpen());
  const calendarModalOpen = $derived(getCalendarModalOpen());
  const weatherModalOpen = $derived(getWeatherModalOpen());
  const backgroundUrl = $derived(getBackgroundUrl());
  const hasBackground = $derived(getHasBackground());
  const aiAutomation = $derived(getAiAutomation());
  const weatherLoading = $derived(getWeatherLoading());
  const weatherNeedsLocation = $derived(getWeatherNeedsLocation());

  /** Consulting the weather is the moment geolocation may be requested. */
  function consultWeather() {
    loadWeather(preferences.location ?? '', preferences.language, { force: true, allowGeolocation: true });
  }

  function openWeather() {
    openWeatherModal();
    if (!weather) consultWeather();
  }

  // SearchBar uses $bindable() and reports bang changes.
  let query = $state(getQuery());
  let activeBang = $state('');
  let activeServiceFromBang = $state(null);
  // Files encoded by the search bar just before submit, forwarded to the
  // userscript through the URL fragment.
  let attachmentPayload = $state([]);
  // Bang being typed or edited, so the grid can show its candidates.
  let bangDraft = $state({ prefix: '', current: '' });
  let selectedCategory = $state(getSelectedCategory());

  $effect(() => { setQuery(query); });
  $effect(() => { setActiveBang(activeBang); });
  $effect(() => { setSelectedCategory(selectedCategory); });

  // The active service is determined by the bang in the search input
  const activeService = $derived(activeServiceFromBang);

  // --- Lifecycle ---

  onMount(() => {
    applyTheme(preferences.theme);
    document.documentElement.lang = preferences.language;
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)');
    const syncSystemTheme = () => preferences.theme === 'system' && applyTheme('system');
    colorScheme.addEventListener('change', syncSystemTheme);

    syncPreferencesBackup();
    loadSavedBackground();
    initAiAutomation();
    startClock();
    // No `allowGeolocation` here: on load this only resolves from a saved
    // location or a warm cache, so the page never prompts for permission.
    loadWeather(preferences.location ?? '', preferences.language);

    return () => {
      cleanupPreferences();
      cleanupUi();
      colorScheme.removeEventListener('change', syncSystemTheme);
    };
  });

  // --- Actions ---

  async function focusSearch() {
    await tick();
    document.querySelector('#search-editor')?.focus();
  }

  function handleVimKey(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const isTyping = target instanceof HTMLElement
      && (target.matches('input, textarea, select') || target.isContentEditable);

    if (event.key === 'Escape') {
      if (isTyping) target.blur();
      return;
    }

    if (isTyping || settingsOpen) return;
    if (event.key.toLowerCase() === 'i') {
      event.preventDefault();
      focusSearch();
    } else if (event.key === ':') {
      // Commands live in the search bar now: seed it with ":" and focus.
      event.preventDefault();
      query = ':';
      focusSearch();
    }
  }

  function executeCommand(command) {
    if (command === 'cal') openCalendarModal();
    else if (command === 'weather') openWeather();
    else if (command === 'history') openHistoryModal();
  }

  function handleUpdatePreferences(nextPreferences) {
    updatePreferences(nextPreferences, {
      availableServices: displayedServices,
      // A typed location geocodes without a prompt; clearing it just falls back
      // to the "consult weather" invitation rather than asking for permission.
      onLocationChange: () => loadWeather(getPreferences().location ?? '', getPreferences().language, { force: true })
    });
  }

  function selectService(service, forceNewTab = false) {
    const request = bangRequest(allDestinations);
    recordQuery(query);
    visitSelectedService(request?.service ?? service, request?.query ?? query, {
      forceNewTab,
      openInNewTab: preferences.openResultsInNewTab,
      aiAutomation,
      attachments: attachmentPayload
    });
  }

  function searchDefault() {
    const request = bangRequest(allDestinations);
    // Submitting with no search terms must do nothing: pressing Enter (or the
    // submit button) on an empty field should not open a service home page.
    // Opening a home page stays available by clicking a service card.
    if (!(request ? request.query : query).trim()) return;

    recordQuery(query);
    if (request) {
      visitSelectedService(request.service, request.query, {
        openInNewTab: preferences.openResultsInNewTab,
        aiAutomation,
        attachments: attachmentPayload
      });
      return;
    }

    const defaultService = allDestinations.find((item) => item.name === preferences.defaultSearcher && item.search)
      ?? allDestinations.find((item) => item.name === 'Google');
    visitSelectedService(defaultService, query, {
      openInNewTab: preferences.openResultsInNewTab,
      aiAutomation,
      attachments: attachmentPayload
    });
  }
</script>

<svelte:window onkeydown={handleVimKey} />

<svelte:head>
  <title>MultiALL</title>
  <meta
    name="description"
    content={preferences.language === 'es'
      ? 'Busca en la web, comunidades e inteligencias artificiales desde un solo lugar.'
      : 'Search the web, communities, and AI tools from one place.'}
  />
  <meta name="theme-color" content={preferences.theme === 'light' ? '#eef6f0' : '#07110d'} />
</svelte:head>

{#if backgroundUrl}
  <div class="custom-background" style:background-image={`url("${backgroundUrl}")`}></div>
  <div class="background-shade" style:opacity={preferences.backgroundShade / 100}></div>
{/if}

<svg class="svg-filters" aria-hidden="true" width="0" height="0">
  <defs>
    <filter id="remove-white-background" color-interpolation-filters="sRGB">
      <feColorMatrix
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3"
      />
    </filter>
  </defs>
</svg>

<div class="page-glow glow-one"></div>
<div class="page-glow glow-two"></div>
<div class="page-glow glow-three"></div>

<aside class="settings-controls">
  <button class="settings-trigger" type="button" onclick={openSettings}>
    <span aria-hidden="true">⚙</span>
    {text.settings}
  </button>
  <div class="automation-panel">
    <label class="automation-toggle">
      <input
        type="checkbox"
        checked={aiAutomation}
        onchange={(event) => setAiAutomation(event.currentTarget.checked)}
      />
      <span>{text.autoAsk}</span>
    </label>
    <a class="userscript-install" href="./userscripts/aiforall.user.js" target="_blank" rel="noreferrer">
      <span>{text.installUserscript.split(' ')[0]}</span>
      <span>{text.installUserscript.split(' ').slice(1).join(' ')} ↗</span>
    </a>
    <small>{text.autoAskHelp}</small>
  </div>
</aside>

<SettingsPanel
  open={settingsOpen}
  {preferences}
  searchers={defaultSearchers}
  {hasBackground}
  onsave={handleUpdatePreferences}
  onclose={closeSettings}
  onbackgroundchange={changeBackground}
  onbackgroundremove={clearBackground}
  {text}
/>

<main>
  <AppHeader
    greeting={time.greeting}
    timeNote={time.note}
    {text}
    username={preferences.username}
    {clock}
    {weather}
    {weatherLoading}
    {weatherNeedsLocation}
    onweatherretry={consultWeather}
    onweatheropen={openWeather}
    oncalendaropen={openCalendarModal}
  />

  <section class="search-area" aria-label={text.search}>
    <SearchBar
      bind:value={query}
      history={queryHistory}
      allServices={allDestinations}
      language={preferences.language}
      onbangchange={(bang, service) => { activeBang = bang; activeServiceFromBang = service; }}
      onhistoryremove={removeHistoryEntry}
      onsubmit={searchDefault}
      oncommand={executeCommand}
      onattachments={(files) => (attachmentPayload = files)}
      onbangdraft={(draft) => (bangDraft = draft)}
      multiline {text}
    />
  </section>

  {#if !activeService}
  <section class="services" aria-labelledby="services-title">
    <div class="section-heading">
      <div>
        <p class="section-kicker">{text.explore}</p>
        <h2 id="services-title">{text.chooseDestination}</h2>
      </div>
      <span>{displayedServices.length} {text.services}</span>
    </div>

    <ServiceGrid
      services={displayedServices}
      {query}
      {text}
      language={preferences.language}
      onselect={selectService}
      bangToken={bangDraft.prefix}
      bangCurrent={bangDraft.current}
      bind:selectedCategory
      showFilters
    />
  </section>
  {/if}

  {#if !activeService}
    <section class="utilities" aria-labelledby="utilities-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{text.shortcuts}</p>
          <h2 id="utilities-title">{text.otherServices}</h2>
        </div>
      </div>
      <div class="utility-grid">
        {#each utilityServices as service (service.name)}
          <ServiceCard {service} query="" {text} onclick={selectService} />
        {/each}
      </div>
    </section>

    <ToolsMenu links={toolLinks} {text} />
  {/if}

  <footer>{text.footer}</footer>
</main>

<HistoryModal
  open={historyModalOpen}
  items={queryHistory}
  {text}
  services={allDestinations}
  onreuse={(entry) => { query = entry; focusSearch(); }}
  onremove={removeHistoryEntry}
  onclear={clearQueryHistory}
  onclose={closeHistoryModal}
/>
<CalendarModal
  open={calendarModalOpen}
  language={preferences.language}
  {text}
  onclose={closeCalendarModal}
/>
<WeatherModal
  open={weatherModalOpen}
  forecast={weatherForecast}
  loading={weatherLoading}
  needsLocation={weatherNeedsLocation}
  {text}
  onretry={consultWeather}
  onclose={closeWeatherModal}
/>

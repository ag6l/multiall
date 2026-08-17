<script>
  let { greeting, timeNote, username, text, clock, weather, weatherLoading, weatherNeedsLocation, onweatherretry, onweatheropen, oncalendaropen } = $props();
</script>

<header class="hero">
  <p class="eyebrow">{text.tagline}</p>
  <h1>Multi<span>ALL</span></h1>
  <p class="welcome">{greeting}{username ? `, ${username}` : ''}. {timeNote}</p>
  <div class="ambient-info">
    <button class="datetime-button" type="button" title={text.calendar} onclick={oncalendaropen}><time>{clock}</time></button>
    <span class="ambient-separator" aria-hidden="true">•</span>
    {#if weatherLoading}
      <span>{text.weatherLoading}</span>
    {:else if weather}
      <button type="button" title={text.openHourlyWeather} onclick={onweatheropen}>
        <span class="ambient-weather-icon" aria-hidden="true">{weather.icon}</span>
        {weather.temperature}{weather.unit} · {weather.description}
      </button>
    {:else if weatherNeedsLocation}
      <button type="button" onclick={onweatherretry}>{text.checkWeather}</button>
    {:else}
      <button type="button" onclick={onweatherretry}>{text.weatherUnavailable} · {text.retryWeather}</button>
    {/if}
  </div>
</header>

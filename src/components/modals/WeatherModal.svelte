<script>
  let { open, forecast, loading, needsLocation, text, onclose, onretry } = $props();
  let dialog = $state();

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
  });

  function hourLabel(value) {
    return value?.slice(11, 16) ?? '';
  }

  function cancel(event) {
    event.preventDefault();
    onclose();
  }
</script>

<dialog
  class="weather-dialog"
  bind:this={dialog}
  onclose={onclose}
  oncancel={cancel}
  onclick={(event) => event.target === dialog && onclose()}
>
  <section class="weather-panel">
    <header>
      <div>
        <p class="section-kicker">{text.hourlyForecast}</p>
        <h2>{forecast?.location || text.currentLocation}</h2>
      </div>
      <button class="close-button" type="button" aria-label={text.closeWeather} onclick={onclose}>×</button>
    </header>

    {#if loading}
      <p class="weather-state">{text.weatherLoading}</p>
    {:else if forecast}
      <div class="hourly-weather">
        {#each forecast.hourly as hour (hour.time)}
          <article class="hour-weather">
            <time datetime={hour.time}>{hourLabel(hour.time)}</time>
            <span class="forecast-icon" aria-hidden="true">{hour.icon}</span>
            <strong>{hour.temperature}{hour.unit}</strong>
            <span>{hour.description}</span>
            <small>☂ {hour.precipitation ?? 0}%</small>
          </article>
        {/each}
      </div>
      <footer class="weather-attribution">
        <button type="button" onclick={onretry}>{text.refreshWeather}</button>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">{text.weatherSource} ↗</a>
      </footer>
    {:else}
      <div class="weather-state">
        <p>{needsLocation ? text.weatherLocationHelp : text.weatherUnavailable}</p>
        <button class="secondary-button" type="button" onclick={onretry}>{needsLocation ? text.checkWeather : text.retryWeather}</button>
      </div>
    {/if}
  </section>
</dialog>

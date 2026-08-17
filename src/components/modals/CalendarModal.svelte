<script>
  let { open, language, text, onclose } = $props();
  let dialog = $state();
  let viewDate = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  function buildCalendar(date, language) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const formatter = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' });
    const weekdayFormatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
    const weekdays = Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(2024, 0, index + 1)));
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const day = index - offset + 1;
      const cellDate = new Date(year, month, day);
      cells.push({ date: cellDate, day: cellDate.getDate(), inMonth: day > 0 && day <= days, today: cellDate.toDateString() === today.toDateString() });
    }
    return { label: formatter.format(first), weekdays, cells };
  }

  const calendar = $derived(buildCalendar(viewDate, language));

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
  });

  function moveMonth(delta) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
  }
  function cancel(event) {
    event.preventDefault();
    onclose();
  }
</script>

<dialog
  class="calendar-dialog"
  bind:this={dialog}
  onclose={onclose}
  oncancel={cancel}
  onclick={(event) => event.target === dialog && onclose()}
>
  <section class="calendar-panel">
    <header>
      <div>
        <p class="section-kicker">{text.calendar}</p>
        <h2>{calendar.label}</h2>
      </div>
      <nav aria-label={text.calendarNavigation}>
        <button type="button" aria-label={text.previousMonth} onclick={() => moveMonth(-1)}>←</button>
        <button type="button" onclick={() => (viewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>{text.today}</button>
        <button type="button" aria-label={text.nextMonth} onclick={() => moveMonth(1)}>→</button>
      </nav>
      <button class="close-button" type="button" aria-label={text.closeCalendar} onclick={onclose}>×</button>
    </header>
    <div class="calendar-weekdays">
      {#each calendar.weekdays as weekday}<span>{weekday}</span>{/each}
    </div>
    <div class="calendar-days">
      {#each calendar.cells as cell (cell.date.toISOString())}
        <span class:outside={!cell.inMonth} class:today={cell.today}>{cell.day}</span>
      {/each}
    </div>
  </section>
</dialog>

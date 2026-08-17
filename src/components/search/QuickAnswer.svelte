<script>
  import { evaluateExpression, formatNumber } from '../../lib/calculator.js';

  let { query = '', language = 'en', text } = $props();

  let copied = $state(false);
  let copyTimer;

  const result = $derived(evaluateExpression(query));
  const formatted = $derived(result ? formatNumber(result.value, language) : '');

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(String(result.value));
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1400);
    } catch {
      // Clipboard permission denied: the value stays selectable on screen.
    }
  }
</script>

{#if result}
  <aside class="quick-answer" aria-label={text.quickAnswer}>
    <span class="quick-answer-kind">{text.quickAnswer}</span>
    <output class="quick-answer-value">{formatted}</output>
    <button type="button" class="quick-answer-copy" onclick={copyResult}>
      {copied ? text.copied : text.copyResult}
    </button>
  </aside>
{/if}

/**
 * Svelte action: caps an element's height so its bottom edge lands at the
 * bottom of the viewport, making it scroll internally instead of pushing the
 * page down.
 *
 * A fixed `vh`/`dvh` value cannot do this, because the space above the element
 * varies with the header, the search bar, wrapped text and the language. So the
 * element's own page offset is measured instead.
 *
 * The offset is measured relative to the *document* (rect.top + scrollY), not
 * the viewport, so scrolling does not change the result — otherwise the panel
 * would resize under the user as they scroll.
 *
 * On phones `visualViewport` is what actually shrinks when the URL bar or the
 * on-screen keyboard appears, and it fires no `resize` on `window`, so it is
 * observed separately.
 */
export function fitToViewport(node, options = {}) {
  const { minHeight = 200, gap = 16 } = options;
  let frame = 0;

  function apply() {
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const pageTop = node.getBoundingClientRect().top + window.scrollY;
    const available = viewport - (pageTop - window.scrollY) - gap;
    node.style.maxHeight = `${Math.max(minHeight, Math.round(available))}px`;
  }

  // Coalesce bursts of layout changes (fonts loading, orientation flips) into
  // one measurement per frame.
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(apply);
  }

  schedule();

  // Anything above the panel changing size changes what is left for it.
  const observer = new ResizeObserver(schedule);
  observer.observe(document.documentElement);
  if (node.parentElement) observer.observe(node.parentElement);

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);

  return {
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    }
  };
}

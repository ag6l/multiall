<script>
  import { tick, onDestroy } from 'svelte';
  import { parseSearcherOptions } from '../../lib/bang/options.js';
  import {
    parseBangValue, normalizeValue, spliceValue,
    deleteStart, deleteEnd, cycleBang, caretAfterDomSync
  } from '../../lib/bang/manager.js';
  import { iconTone } from '../../lib/iconTone.js';
  import { tokenizeQuery } from '../../lib/tokenizers/highlighter.js';
  import { matchHistory } from '../../lib/search/historyMatcher.js';
  import { encodeAttachment, MAX_ATTACHMENT_PAYLOAD } from '../../lib/search.js';
  import { searchGuideFor } from '../../data/searchGuides.js';
  import SearchGuide from './SearchGuide.svelte';
  import QueryHistory from './QueryHistory.svelte';
  import QuickAnswer from './QuickAnswer.svelte';
  import TranslationSelector from './TranslationSelector.svelte';

  let {
    value = $bindable(),
    history = [],
    allServices = [],
    onbangchange,
    onhistoryremove,
    onsubmit,
    oncommand,
    onattachments,
    onbangdraft,
    language = 'es',
    multiline = false,
    text
  } = $props();

  let editorEl = $state();
  // The control row and the chip group: selections can reach into these, so the
  // offset mapping and the copy handler have to see them too.
  let controlEl = $state();
  let leadEl = $state();
  let searchFocused = $state(false);
  let historyIndex = $state(-1);
  let historyDraft = $state('');
  // Reactive: the reported bang draft reads `prefix` to keep the grid's
  // candidate list stable while Tab walks through it.
  let bangCycle = $state({ prefix: '', index: -1, active: false });
  let closeSuggestionsTimer;
  let composing = false;
  // Range the IME will replace, captured from `beforeinput` while the DOM is
  // still pre-mutation. `compositionstart` is too late: Chromium can fire it
  // after it has already inserted provisional text, which shifts the offsets.
  let compositionRange = null;
  let compositionFallback = null;
  // Latest composed text seen on `compositionupdate`, used when `compositionend`
  // arrives with empty `data` (happens with ibus / some dead-key layouts).
  let compositionData = '';
  let pendingCaret = null;
  // Bumped to force the editor's children to be rebuilt from the model, which
  // discards any DOM the browser inserted natively while composing.
  let renderNonce = $state(0);
  const undoStack = [];
  const redoStack = [];

  onDestroy(() => {
    clearTimeout(closeSuggestionsTimer);
    // A drag interrupted by unmounting would otherwise leave window listeners.
    stopDragTracking();
  });

  // --- Derived model ---

  const bangState = $derived(parseBangValue(value, allServices));
  const service = $derived(bangState.service);
  const bangCommitted = $derived(
    bangState.phase === 'activated' ||
    bangState.phase === 'options-typing' ||
    bangState.phase === 'options-complete'
  );

  // Editing mode for the bang: the chip becomes the plain text it stands for
  // ("!g ") so it can be typed into. While editing, the editor owns the whole
  // value and the prefix contributes no decorations — `prefixLen` is 0 and the
  // query is the entire value.
  //
  // Driven by caret position in `syncCaretOffset`, not derived from the value:
  // mid-edit the value passes through states that do not parse as a bang
  // ("! hello"), and deriving from that would snap the chip back over the text
  // being typed. Kept as state so those intermediate values are harmless.
  let bangEditing = $state(false);
  const showBangChip = $derived(bangCommitted && !bangEditing);
  const prefixLen = $derived(showBangChip ? bangState.prefixLen : 0);
  const queryText = $derived(showBangChip ? bangState.query : value);

  $effect(() => { if (bangEditing && !value.startsWith('!')) bangEditing = false; });

  // Selecting the chip is tracked here rather than in the DOM selection.
  // Browsers clamp a selection whose ends straddle a contenteditable boundary —
  // which is exactly where the chip sits — so neither a drag nor
  // `setBaseAndExtent` can span it. Keeping it as state means the highlight and
  // copy/cut behave as if the bang were still inline text.
  let chipSelected = $state(false);
  // Text each decoration stands for, so copying a chip yields its source text.
  const bangChipText = $derived(bangState.options ? bangState.bang : value.slice(0, prefixLen));
  const optionsChipText = $derived(bangState.options ? value.slice(bangState.bang.length, prefixLen) : '');
  // The bang token being typed or edited right now, reported upward so the
  // service grid can filter to the candidates, highlight the current one and
  // show each card's shortcut — during an in-place edit as well as while the
  // whole value is still just a token.
  const bangDraftCurrent = $derived.by(() => {
    const whole = value.match(/^(![a-z0-9]*)$/i)?.[1];
    if (whole) return whole;
    return bangEditing ? value.match(/^(![a-z0-9]*)/i)?.[1] ?? '' : '';
  });
  // While Tab-cycling, the candidate set is the one the *typed* prefix matched.
  // Filtering by the completed token instead would shrink the grid to the single
  // card that was just selected, so there would be nothing left to cycle over.
  const bangDraftPrefix = $derived(
    bangCycle.active && bangDraftCurrent ? bangCycle.prefix : bangDraftCurrent
  );
  $effect(() => { onbangdraft?.({ prefix: bangDraftPrefix, current: bangDraftCurrent }); });

  const querySegments = $derived(tokenizeQuery(queryText, service));
  // Segment ranges in query space, so a segment can tell whether the caret is
  // inside it. Segments concatenate back to the query, so a running total is
  // all it takes.
  const positionedSegments = $derived.by(() => {
    let offset = 0;
    return querySegments.map((segment) => {
      const start = offset;
      offset += segment.text.length;
      return { ...segment, start, end: offset };
    });
  });
  // Caret position in query space, or -1 when it is not in the editor. Markdown
  // markers are dimmed unless the caret sits inside their token, which is what
  // brings the raw characters back while editing or deleting them.
  let caretOffset = $state(-1);
  let attachments = $state([]);
  let attachNotice = $state('');
  const markerRevealed = (segment) =>
    searchFocused && caretOffset >= segment.start && caretOffset <= segment.end;
  // Positions with no real text node of their own: right after the decorated
  // prefix when the query is empty, and the new line after a trailing newline.
  const needsCaretHost = $derived(
    queryText.endsWith('\n') || (showBangChip && !querySegments.length)
  );
  const translationOptions = $derived(
    bangState.phase === 'options-complete' && bangState.bang.toLowerCase() === '!gt'
      ? parseSearcherOptions('!gt', bangState.options)
      : null
  );

  // --- Commands (":cal", ":weather") -----------------------------------------
  // Typed straight into the search bar rather than a separate palette: the
  // leading ":" switches the bar into command mode and the suggestion list
  // below it replaces the history list.

  const commandMode = $derived(value.startsWith(':'));
  const commandToken = $derived(commandMode ? value.slice(1).trim().toLowerCase() : '');
  const commands = $derived([
    { name: 'cal', description: text.commandCal },
    { name: 'weather', description: text.commandWeather },
    { name: 'history', description: text.commandHistoryLabel }
  ]);
  // While Tab-completing, matches are filtered by the prefix that was typed
  // *before* completion started. Filtering by the live token instead would
  // collapse the list to the completed name and make a second Tab a no-op.
  let commandPrefix = $state(null);
  const commandFilter = $derived(commandPrefix ?? commandToken);
  const commandMatches = $derived(commandMode ? commands.filter((item) => item.name.startsWith(commandFilter)) : []);
  let commandIndex = $state(0);
  const showCommands = $derived(searchFocused && commandMatches.length > 0);

  $effect(() => { if (commandIndex >= commandMatches.length) commandIndex = 0; });

  /** Fills the bar with the next matching command, cycling on repeat presses. */
  function completeCommand(reverse) {
    const matches = commandMatches;
    if (!matches.length) return false;

    if (commandPrefix === null) {
      commandPrefix = commandToken;
      // An exact hit stays put on the first Tab so it can be run straight away.
      const exact = matches.findIndex((item) => item.name === commandToken);
      commandIndex = exact >= 0 ? exact : 0;
    } else {
      commandIndex = (commandIndex + (reverse ? -1 : 1) + matches.length) % matches.length;
    }

    const completed = `:${matches[commandIndex].name}`;
    commit({ value: completed, cursor: completed.length }, { record: false, resetCycle: false });
    return true;
  }

  const queryForHistory = $derived(showBangChip ? queryText : value);
  const matchingHistory = $derived(matchHistory(history, queryForHistory, bangState.phase === 'typing'));
  const showHistory = $derived(searchFocused && !commandMode && matchingHistory.length > 0);
  const placeholder = $derived(multiline ? text.unifiedPlaceholder : text.searchPlaceholder);
  const activeSearchGuide = $derived(searchGuideFor(service, language));
  const serviceInitials = $derived(
    service?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? ''
  );
  const tone = $derived(iconTone(service?.icon));

  // Report the committed bang upward (empty while the bang is still being typed).
  $effect(() => {
    const committed = showBangChip ? (bangState.options ? `${bangState.bang}[${bangState.options}]` : bangState.bang) : '';
    onbangchange?.(committed, showBangChip ? service : null);
  });

  // --- Plain text <-> DOM offset mapping -------------------------------------
  // Decorations carry [data-deco] and contribute zero characters to the DOM text.
  // Therefore: valueOffset === prefixLen + domTextOffset.

  function plainFromFragment(fragment) {
    const holder = document.createElement('div');
    holder.appendChild(fragment);
    for (const deco of holder.querySelectorAll('[data-deco]')) deco.remove();
    return holder.textContent.replace(/\u00a0/g, ' ');
  }

  function domOffsetOf(container, offset) {
    const range = document.createRange();
    range.selectNodeContents(editorEl);
    try { range.setEnd(container, offset); } catch { return 0; }
    return plainFromFragment(range.cloneContents()).length;
  }

  /** Collapsed range at a DOM point, or null when the point is not addressable. */
  function pointRange(container, offset) {
    try {
      const range = document.createRange();
      range.setStart(container, offset);
      range.collapse(true);
      return range;
    } catch {
      return null;
    }
  }

  /** Collapsed range immediately before or after a node. */
  function edgeRange(node, after) {
    const range = document.createRange();
    if (after) range.setStartAfter(node);
    else range.setStartBefore(node);
    range.collapse(true);
    return range;
  }

  /**
   * Maps a DOM point to a value-space offset.
   *
   * Inside the editor this is the plain identity `prefixLen + domTextOffset`,
   * since the editor's text is exactly the query. Points *outside* it still
   * matter: the bang and options chips sit at the input's leading edge, so a
   * selection covering them lands on DOM positions in the control row. Those
   * resolve to the two ends of the prefix, which is what makes the chip behave
   * like the selectable text it used to be when it was inline.
   */
  function valueOffsetOf(container, offset) {
    if (!editorEl) return 0;
    if (editorEl.contains(container)) return prefixLen + domOffsetOf(container, offset);

    const point = pointRange(container, offset);
    if (!point) return 0;

    if (leadEl?.parentNode) {
      if (point.compareBoundaryPoints(Range.START_TO_START, edgeRange(leadEl, false)) <= 0) return 0;
      if (point.compareBoundaryPoints(Range.START_TO_START, edgeRange(leadEl, true)) <= 0) return prefixLen;
    }
    // Anywhere past the editor (the shell padding on the right) clamps to the end.
    return point.compareBoundaryPoints(Range.START_TO_START, edgeRange(editorEl, true)) >= 0
      ? value.length
      : prefixLen;
  }

  /** The region a selection has to touch to count as ours: chips included. */
  function selectionScope() {
    return controlEl ?? editorEl;
  }

  /**
   * Current selection in value-space, or null when it misses the input entirely.
   * A drag that starts on the shell padding (before the bang icon) or ends past
   * the editor is clamped to the value bounds, so such a selection still covers
   * the decorated prefix instead of being discarded.
   */
  function selectionOffsets() {
    const selection = window.getSelection();
    const scope = selectionScope();
    if (!selection?.rangeCount || !scope) return null;
    const range = selection.getRangeAt(0);
    const startsInside = scope.contains(range.startContainer);
    const endsInside = scope.contains(range.endContainer);
    if (!startsInside && !endsInside) return null;
    return {
      start: startsInside ? valueOffsetOf(range.startContainer, range.startOffset) : 0,
      end: endsInside ? valueOffsetOf(range.endContainer, range.endOffset) : value.length
    };
  }

  /**
   * Same as `selectionOffsets`, but preserving which end is the anchor (where
   * the selection started) and which is the focus (where the caret currently
   * sits) — needed to extend a selection with Shift+Arrow instead of always
   * treating the leftmost end as fixed.
   */
  function anchorFocusOffsets() {
    const selection = window.getSelection();
    const scope = selectionScope();
    if (!selection?.rangeCount || !scope) return null;
    const anchorInside = scope.contains(selection.anchorNode);
    const focusInside = scope.contains(selection.focusNode);
    if (!anchorInside && !focusInside) return null;
    return {
      anchor: anchorInside ? valueOffsetOf(selection.anchorNode, selection.anchorOffset) : 0,
      focus: focusInside ? valueOffsetOf(selection.focusNode, selection.focusOffset) : value.length
    };
  }

  /**
   * The exact range an input event is about to replace, in value-space.
   * `beforeinput` fires before the DOM changes, so these offsets are the only
   * trustworthy ones for a composition.
   */
  function targetRangeOffsets(event) {
    const [range] = event.getTargetRanges?.() ?? [];
    if (!range || !editorEl) return null;
    if (!editorEl.contains(range.startContainer) || !editorEl.contains(range.endContainer)) return null;
    return {
      start: valueOffsetOf(range.startContainer, range.startOffset),
      end: valueOffsetOf(range.endContainer, range.endOffset)
    };
  }

  /**
   * The whole editor as plain text, decorations resolved back to their source
   * text. Used as the fallback source of truth after a composition, since the
   * DOM already holds whatever the IME committed.
   */
  function editorPlainText() {
    if (!editorEl) return value;
    const holder = editorEl.cloneNode(true);
    for (const deco of holder.querySelectorAll('[data-deco]')) {
      deco.replaceWith(document.createTextNode(deco.dataset.text ?? ''));
    }
    // The editor only holds the query; the bang prefix lives in the chips
    // outside it, so it has to be put back to rebuild the whole value.
    return value.slice(0, prefixLen) + holder.textContent.replace(/\u00a0/g, ' ');
  }

  function caretNow() {
    return selectionOffsets()?.start ?? value.length;
  }

  /**
   * The zero-width text node the template renders wherever the caret has no
   * real text position of its own — see `[data-caret-host]` in the markup.
   * It is `[data-deco]`, so it contributes zero characters to the value.
   */
  function caretHostNode() {
    const host = editorEl?.querySelector('[data-caret-host]')?.firstChild;
    return host?.nodeType === Node.TEXT_NODE ? host : null;
  }

  function domPointForValueOffset(valueOffset) {
    // Offsets inside the bang prefix resolve to the position just before the
    // chips, so a selection extended there covers them — the same reach the
    // prefix had when it was inline text inside the editor.
    if (valueOffset < prefixLen && leadEl?.parentNode) {
      const parent = leadEl.parentNode;
      return { node: parent, offset: [...parent.childNodes].indexOf(leadEl) };
    }
    const target = Math.max(0, valueOffset - prefixLen);

    // A caret at the very end of a query that ends in "\n" belongs on the new,
    // still-empty line. Placed inside the text node that offset is ambiguous:
    // engines paint it at the end of the *previous* line. `pre-wrap` does honour
    // the newline itself, so no <br> is needed — adding one produced a second
    // break and put the caret two lines down. The zero-width caret host after it
    // is enough: it gives the new line a line box and a real caret position.
    if (target >= queryText.length && queryText.endsWith('\n')) {
      const host = caretHostNode();
      if (host) return { node: host, offset: host.textContent.length };
    }

    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest('[data-deco]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    let seen = 0;
    let node;
    while ((node = walker.nextNode())) {
      const len = node.textContent.length;
      if (seen + len >= target) return { node, offset: target - seen };
      seen += len;
    }
    // No editable text node holds the target: the query is empty and only
    // decorations (bang chip / options chip) remain. A caret cannot be
    // reliably painted at a bare element boundary between/after
    // `contenteditable="false"` islands, so fall back to the caret host.
    const host = caretHostNode();
    if (host) return { node: host, offset: host.textContent.length };
    return { node: editorEl, offset: editorEl.childNodes.length };
  }

  function setCaret(valueOffset) {
    if (!editorEl) return;
    const selection = window.getSelection();
    if (!selection) return;
    const { node, offset } = domPointForValueOffset(valueOffset);
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Sets an explicit anchor/focus selection in value-space. Used for
   * Shift+Arrow selection, so the anchor end stays put while the focus end
   * moves — including across a bang chip or operator icon, which
   * `Selection.modify`/native arrow-key extension refuses to cross since
   * they are `contenteditable="false"` islands.
   */
  function setSelectionRange(anchorValueOffset, focusValueOffset) {
    if (!editorEl) return;
    const selection = window.getSelection();
    if (!selection) return;
    const anchor = domPointForValueOffset(anchorValueOffset);
    const focus = domPointForValueOffset(focusValueOffset);
    selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
  }

  function syncCaretOffset() {
    const offsets = selectionOffsets();
    if (!offsets) {
      caretOffset = -1;
      return;
    }
    // Editing ends as soon as the caret reaches the end of the prefix, since
    // that is the bang's boundary — anything from there on is the query.
    // Entering is not handled here: a freshly typed "!g " leaves the caret on
    // exactly that boundary and must show the icon straight away, so the only
    // way in is navigating back into the bang (see the ArrowLeft handler).
    //
    // `bangCommitted` is what keeps this from firing mid-edit: the value passes
    // through states that do not parse ("! hello" after a Backspace), where
    // `prefixLen` is 0 and the comparison below would otherwise be trivially
    // true and snap the icon back over the text being typed.
    if (bangEditing && bangCommitted && offsets.start === offsets.end
      && offsets.start >= bangState.prefixLen) {
      bangEditing = false;
      // Swapping the prefix text for the chip replaces the text nodes the
      // selection lived in, so the caret has to be put back or the browser
      // drops it at the end of the editor.
      pendingCaret = offsets.start;
      tick().then(flushCaret);
      return;
    }
    caretOffset = offsets.start - prefixLen;
  }

  function flushCaret() {
    if (pendingCaret === null) return;
    setCaret(pendingCaret);
    pendingCaret = null;
    syncCaretOffset();
  }

  // --- Model commit ---------------------------------------------------------

  function commit(next, { record = true, resetCycle = true } = {}) {
    const normalized = normalizeValue(next.value, next.cursor, allServices, { multiline });

    if (record && normalized.value !== value) {
      undoStack.push({ value, cursor: caretNow() });
      if (undoStack.length > 80) undoStack.shift();
      redoStack.length = 0;
    }

    value = normalized.value;
    historyIndex = -1;
    historyDraft = '';
    if (resetCycle) {
      bangCycle = { prefix: '', index: -1, active: false };
      commandPrefix = null;
    }
    pendingCaret = normalized.cursor;
    tick().then(flushCaret);
    return normalized.cursor;
  }

  function replaceSelection(insert, inputType = null, explicitRange = null) {
    const selection = explicitRange ?? selectionOffsets();
    if (!selection) return false;
    let { start, end } = selection;
    if (start === end && inputType?.startsWith('delete')) {
      if (inputType.includes('Forward')) end = deleteEnd(value, start, inputType);
      else start = deleteStart(value, start, inputType);
      if (start === end) return true; // nothing to delete
    }
    commit(spliceValue(value, start, end, insert));
    return true;
  }

  // --- Editing (beforeinput keeps the DOM under our control) ----------------

  function handleBeforeInput(event) {
    const type = event.inputType;
    const isCompositionInput = type === 'insertCompositionText' || type === 'deleteCompositionText';

    // Composition (dead keys ´ ` ¨ ^ ~ and IMEs) always runs natively: these
    // input types are not reliably cancelable, and cancelling them is what
    // swallowed accented characters. The DOM is still pre-mutation here, so this
    // is the one moment the replaced range can be read accurately. Any DOM the
    // IME leaves behind is discarded by the renderNonce rebuild on compositionend.
    if (isCompositionInput || event.isComposing) {
      compositionRange ??= targetRangeOffsets(event) ?? selectionOffsets();
      if (event.data) compositionData = event.data;
      return;
    }

    if (composing) return;

    if (type === 'historyUndo') { event.preventDefault(); undo(); return; }
    if (type === 'historyRedo') { event.preventDefault(); redo(); return; }

    let insert = null;
    if (type === 'insertText' || type === 'insertReplacementText') insert = event.data ?? '';
    else if (type === 'insertFromPaste' || type === 'insertFromDrop') insert = event.dataTransfer?.getData('text/plain') ?? '';
    else if (type === 'insertParagraph' || type === 'insertLineBreak') insert = multiline ? '\n' : '';
    else if (type.startsWith('delete')) insert = '';
    else if (event.data != null) insert = event.data;

    if (insert === null) { event.preventDefault(); return; }

    event.preventDefault();

    // A selected chip is part of what is being replaced, even though the DOM
    // selection could not include it. Typing over it or deleting it takes the
    // bang with it, exactly as when the prefix was inline text.
    if (chipSelected) {
      const selection = selectionOffsets();
      const end = Math.max(bangState.prefixLen, selection?.end ?? 0);
      chipSelected = false;
      commit(spliceValue(value, 0, end, insert));
      return;
    }
    // Autocorrect / accent replacement targets a word range rather than the
    // caret, so honour the range the browser reports when it gives one.
    const explicitRange = type === 'insertReplacementText' ? targetRangeOffsets(event) : null;
    replaceSelection(insert, type, explicitRange);

  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text/plain') ?? '';
    replaceSelection(pasted);
  }

  function handleCompositionStart() {
    composing = true;
    compositionData = '';
    // Fallback only. The authoritative range comes from `beforeinput`, which for
    // some layouts has already fired by the time this runs.
    compositionFallback = selectionOffsets();
  }

  function handleCompositionUpdate(event) {
    if (event.data) compositionData = event.data;
  }

  /**
   * Every node Svelte renders inside the editor (chip, options chip, each
   * segment) is a `<span>` — never a bare text node directly under the editor
   * div. So a bare text-node child is always native residue: composition
   * landing where there is no adjacent Svelte-owned node to type into (e.g. an
   * empty query) makes the browser insert one straight into the div itself.
   * `renderNonce` only rebuilds nodes Svelte itself created, so it never
   * touches these — they must be removed by hand or they sit there forever,
   * invisible to the model and immune to backspace.
   */
  function stripStrayText() {
    if (!editorEl) return;
    for (const node of editorEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    }
  }

  /**
   * Dead keys (´ ` ¨ ^ ~) and IMEs mutate the DOM directly, and that text can
   * land inside a decoration's own text node — where reading it back would drop
   * it. So the DOM is not read at all: `event.data` holds the finished character
   * and it is spliced into the model at the recorded composition range, then the
   * children are rebuilt (renderNonce) so the native edit leaves no residue.
   */
  function handleCompositionEnd(event) {
    const range = compositionRange ?? compositionFallback ?? selectionOffsets() ?? { start: value.length, end: value.length };
    const composed = event.data || compositionData;
    const previous = value;

    composing = false;
    compositionRange = null;
    compositionFallback = null;
    compositionData = '';

    // With a known composed string the model stays authoritative. Without one
    // (`data` is empty on some ibus / dead-key paths) the character only exists
    // in the DOM, so read it back before it gets stripped.
    let next;
    if (composed) {
      stripStrayText();
      next = spliceValue(previous, range.start, range.end, composed);
    } else {
      const text = editorPlainText();
      next = { value: text, cursor: caretAfterDomSync(previous, text, range) };
      stripStrayText();
    }

    renderNonce++;
    const caret = commit(next);

    // A late native insert can still land after this handler returns, so rebuild
    // once more on the next tick to drop residue, then restore the caret. Input is
    // never gated on this: the next keystroke must go through immediately.
    tick().then(() => {
      stripStrayText();
      renderNonce++;
      pendingCaret = caret;
      tick().then(flushCaret);
    });
  }

  /**
   * Mirrors the native selection onto decorations. `::selection` does not paint
   * contenteditable=false nodes, so a selected bang icon or options chip would
   * copy its text while looking unselected.
   */
  function syncDecorationSelection() {
    if (!editorEl) return;
    syncCaretOffset();
    const selection = window.getSelection();
    const range = selection?.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    // Only the decorations inside the editor are driven from the DOM range. The
    // bang and options chips bind `is-selected` to `chipSelected` in the markup
    // instead: they are outside the range's reach, and a class set imperatively
    // here would be wiped whenever Svelte re-rendered them.
    for (const deco of editorEl.querySelectorAll('[data-deco]')) {
      let selected = false;
      try { selected = !!range && range.intersectsNode(deco); } catch { selected = false; }
      deco.classList.toggle('is-selected', selected);
    }
  }

  $effect(() => {
    document.addEventListener('selectionchange', syncDecorationSelection);
    return () => document.removeEventListener('selectionchange', syncDecorationSelection);
  });

  function undo() {
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push({ value, cursor: caretNow() });
    commit(previous, { record: false });
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push({ value, cursor: caretNow() });
    commit(next, { record: false });
  }

  // --- Keyboard ------------------------------------------------------------

  function handleKeydown(event) {
    const mod = event.ctrlKey || event.metaKey;
    // `event.isComposing` covers the keystroke that resolves a dead key, which
    // fires before compositionend and must reach the IME untouched.
    const midComposition = composing || event.isComposing;

    // Moving the caret abandons a chip selection. Typing and deleting keep it,
    // so `beforeinput` can fold the bang into the edit.
    if (chipSelected && !event.shiftKey && NAVIGATION_KEYS.has(event.key)) chipSelected = false;

    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
      return;
    }
    if (mod && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }

    if (midComposition) return;

    // Command mode owns the arrow keys, Tab and Enter while ":" is leading.
    if (commandMode && commandMatches.length && !mod && !event.altKey) {
      // Tab completes the text; arrows only move the highlight.
      if (event.key === 'Tab') {
        event.preventDefault();
        completeCommand(event.shiftKey);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        commandIndex = (commandIndex + 1) % commandMatches.length;
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        commandIndex = (commandIndex - 1 + commandMatches.length) % commandMatches.length;
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        runCommand(commandMatches[commandIndex]?.name);
        return;
      }
    }

    if (event.key === 'Tab' && !mod && !event.altKey) {
      if (tryBangCycle(event.shiftKey)) event.preventDefault();
      return;
    }

    // Arrows steer the bang candidate list, sharing Tab's cursor so the grid
    // highlight moves consistently whichever key is used. When the value is
    // nothing but a bang token all four are free. When a bang is being edited in
    // front of a query only the vertical pair is, since Left/Right still have to
    // move the caret through the bang text.
    const arrowStep = BANG_ARROW_STEP[event.key];
    if (arrowStep !== undefined && !event.shiftKey && !mod && !event.altKey) {
      const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      if (tryBangCycle(arrowStep < 0, !vertical)) {
        event.preventDefault();
        return;
      }
    }

    if (event.key === 'Enter' && !mod && !event.altKey) {
      event.preventDefault();
      if (multiline && event.shiftKey) replaceSelection('\n');
      else submit();
      return;
    }

    // Stepping left off the start of the query moves into the bang, turning the
    // chip back into the raw "!g " text so it can be typed into. Native arrow
    // keys cannot get there: the chip lives outside the editor, so the query
    // start is already the leftmost position the caret can reach.
    if (event.key === 'ArrowLeft' && !event.shiftKey && !mod && !event.altKey
      && bangCommitted && !bangEditing && caretNow() <= bangState.prefixLen) {
      event.preventDefault();
      bangEditing = true;
      pendingCaret = Math.max(0, bangState.prefixLen - 1);
      tick().then(flushCaret);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const caret = caretNow();
      if (event.key === 'ArrowUp' && (historyIndex >= 0 || caret <= prefixLen) && history.length) {
        event.preventDefault();
        restoreHistory(historyIndex < 0 ? 0 : historyIndex + 1);
        return;
      } else if (event.key === 'ArrowDown' && historyIndex >= 0 && caret >= value.length) {
        event.preventDefault();
        restoreHistory(historyIndex - 1);
        return;
      }
    }

    // Shift+Arrow/Home/End are driven here rather than natively whenever an
    // inline decoration is present: native selection extension refuses to cross
    // a `contenteditable="false"` island (the nerd icon inside an operator
    // card), which would make text past it unreachable by keyboard. Plain text
    // keeps the browser's own behaviour.
    if (event.shiftKey && !mod && !event.altKey && (prefixLen > 0 || hasInlineDecoration())) {
      const extended = extendSelection(event.key);
      if (extended) event.preventDefault();
    }
  }

  /** Inline `contenteditable="false"` islands the caret has to step over. */
  function hasInlineDecoration() {
    return Boolean(editorEl?.querySelector('[data-deco]:not([data-caret-host])'));
  }

  /** @returns {boolean} whether the key was handled */
  function extendSelection(key) {
    const current = anchorFocusOffsets();
    if (!current) return false;
    const { anchor, focus } = current;
    const queryStart = prefixLen;

    // The prefix has no interior positions — it is one atomic chip — so moving
    // left off the start of the query jumps straight past it in a single step,
    // the way arrow keys treat any `contenteditable="false"` island.
    // Extending past the start of the query takes in the bang, which is tracked
    // separately because the DOM selection cannot cross out of the editor.
    let nextFocus;
    if (key === 'ArrowLeft') nextFocus = focus - 1;
    else if (key === 'ArrowRight') nextFocus = Math.min(value.length, focus + 1);
    else if (key === 'Home') nextFocus = 0;
    else if (key === 'End') nextFocus = value.length;
    else return false;

    if (nextFocus < queryStart) chipSelected = true;
    else if (key !== 'End') chipSelected = false;

    setSelectionRange(anchor, Math.max(queryStart, nextFocus));
    return true;
  }

  /** Arrow keys that walk the bang candidate list, and which way they go. */
  const BANG_ARROW_STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

  /** Keys that only move the caret, and so end a chip selection. */
  const NAVIGATION_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'Tab'
  ]);

  /**
   * @param {boolean} reverse
   * @param {boolean} tokenOnly - restrict to a value that is nothing but a bang
   *   token. The arrows pass this: while a bang is being edited with a query
   *   after it, the arrows have to keep moving the caret through that text.
   */
  function tryBangCycle(reverse, tokenOnly = false) {
    // Two cases cycle: the whole value is a bang token still being typed ("!g"),
    // or a committed bang is open for editing, where only the leading token is
    // cycled and the query after it is preserved.
    const whole = value.match(/^(![a-z0-9]*)$/i)?.[1];
    const leading = bangEditing && !tokenOnly ? value.match(/^(![a-z0-9]*)/i)?.[1] : null;
    const token = whole ?? leading;
    if (!token) {
      bangCycle = { prefix: '', index: -1, active: false };
      return false;
    }

    const available = allServices.map((item) => item.bang).filter(Boolean);
    const result = cycleBang(bangCycle, token, available, reverse);
    if (!result) return false;

    const rest = value.slice(token.length);
    bangCycle = { prefix: result.prefix, index: result.index, active: true };
    commit({ value: result.value + rest, cursor: result.value.length }, { resetCycle: false });
    return true;
  }

  // --- Clipboard (decorations resolve back to their source text) ------------

  function selectionPlainText() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return '';
    const holder = document.createElement('div');
    holder.appendChild(selection.getRangeAt(0).cloneContents());
    for (const deco of holder.querySelectorAll('[data-deco]')) {
      deco.replaceWith(document.createTextNode(deco.dataset.text ?? ''));
    }
    return holder.textContent.replace(/\u00a0/g, ' ');
  }

  function handleCopy(event) {
    // The chip is not part of the DOM selection, so its source text is prepended
    // when it is selected — copying "!g foo" yields the bang like it used to.
    const prefix = chipSelected ? value.slice(0, bangState.prefixLen) : '';
    const copied = prefix + selectionPlainText();
    if (!copied) return;
    event.preventDefault();
    event.clipboardData?.setData('text/plain', copied);
  }

  function handleCut(event) {
    handleCopy(event);
    if (!chipSelected) {
      replaceSelection('');
      return;
    }
    // Cutting a selected chip removes the prefix along with whatever text was
    // selected after it, in one edit so undo treats it as one step.
    const selection = selectionOffsets();
    const end = Math.max(bangState.prefixLen, selection?.end ?? 0);
    chipSelected = false;
    commit(spliceValue(value, 0, end, ''));
  }

  // --- History -------------------------------------------------------------

  function withQuery(nextQuery) {
    const prefix = value.slice(0, prefixLen);
    return { value: prefix + nextQuery, cursor: prefix.length + nextQuery.length };
  }

  function restoreHistory(nextIndex) {
    if (!history.length) return;
    if (historyIndex < 0) historyDraft = queryText;

    if (nextIndex < 0) {
      const draft = historyDraft;
      commit(withQuery(draft), { record: false });
      historyIndex = -1;
      historyDraft = draft;
      return;
    }

    const index = Math.min(nextIndex, history.length - 1);
    const draft = historyDraft;
    commit(withQuery(history[index]), { record: false });
    historyIndex = index;
    historyDraft = draft;
  }

  /**
   * History entries keep their own bang, so an entry that carries one is
   * restored whole; a bare query keeps whatever bang is active right now.
   */
  function reuseQuery(item) {
    const restored = parseBangValue(item, allServices).prefixLen > 0
      ? { value: item, cursor: item.length }
      : withQuery(item);
    commit(restored);
    editorEl?.focus();
  }

  // --- Translation options -------------------------------------------------

  function handleTranslationChange(nextBang) {
    const query = queryText;
    const next = query ? `${nextBang} ${query}` : `${nextBang} `;
    commit({ value: next, cursor: next.length });
    editorEl?.focus();
  }

  // --- Focus / submit ------------------------------------------------------

  // --- Pointer selection ----------------------------------------------------
  // Browsers will not extend a selection from a non-editable region into a
  // contenteditable one, so a drag that starts on the bang chip or on the bar's
  // padding selects nothing. Those drags are therefore tracked here and mapped
  // to value offsets by hand. Drags that start inside the editor are left alone:
  // native selection already handles them, and better.

  let dragAnchor = null;
  let dragNative = false;
  let dragFromChip = false;

  function caretPointFromCoords(x, y) {
    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(x, y);
      return position ? { node: position.offsetNode, offset: position.offset } : null;
    }
    const range = document.caretRangeFromPoint?.(x, y);
    return range ? { node: range.startContainer, offset: range.startOffset } : null;
  }

  /**
   * Viewport coordinates to a value offset, never below the start of the query.
   * The DOM selection has to stay wholly inside the editor — a selection whose
   * ends straddle the contenteditable boundary gets clamped by the browser — so
   * the prefix is represented by `chipSelected` instead of by an offset.
   */
  function offsetFromPoint(x, y) {
    const queryStart = bangState.prefixLen;
    if (!editorEl) return queryStart;
    const box = editorEl.getBoundingClientRect();
    if (y < box.top || (x < box.left && y < box.bottom)) return queryStart;
    if (y > box.bottom || (x > box.right && y > box.top)) return value.length;
    const point = caretPointFromCoords(x, y);
    if (!point) return value.length;
    return Math.max(queryStart, valueOffsetOf(point.node, point.offset));
  }

  /** True when the point sits at or left of the chip group. */
  function pointReachesChip(x) {
    if (!leadEl) return false;
    return x <= leadEl.getBoundingClientRect().right;
  }

  function isPointInEditor(x, y) {
    if (!editorEl) return false;
    const box = editorEl.getBoundingClientRect();
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }

  /**
   * A drag beginning inside the editor is left to the browser while it stays in
   * bounds — native selection handles word snapping and such far better. The
   * moment it leaves the editor's box the browser stops extending, so tracking
   * takes over from there. A drag beginning outside (on the chip, or on the
   * bar's padding) is driven from the start, since the browser will not carry a
   * selection across the contenteditable boundary at all.
   *
   * Listeners go on `window` rather than using pointer capture: capturing would
   * starve the editor of the very move events native selection needs.
   */
  function handlePointerDown(event) {
    if (event.button !== 0 || !editorEl) return;
    if (event.target.closest('button, label, select, a, input')) return;

    const insideEditor = editorEl.contains(event.target);
    dragNative = insideEditor;
    // A plain click on the chip grabs the whole bang, the way `user-select: all`
    // did when it was inline text.
    dragFromChip = !insideEditor && Boolean(event.target.closest('.bang-lead'));
    chipSelected = dragFromChip;
    dragAnchor = insideEditor ? null : offsetFromPoint(event.clientX, event.clientY);

    if (!insideEditor) {
      event.preventDefault();
      editorEl.focus();
      setCaret(dragAnchor);
    }

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', endPointerDrag);
    window.addEventListener('pointercancel', endPointerDrag);
  }

  function handleDragMove(event) {
    if (dragNative && dragAnchor === null && isPointInEditor(event.clientX, event.clientY)) return;

    // Taking over mid-drag: adopt whatever end the browser had anchored, then
    // keep driving even if the pointer comes back in bounds, so the selection
    // does not flip between the two owners.
    if (dragAnchor === null) {
      dragAnchor = anchorFocusOffsets()?.anchor ?? bangState.prefixLen;
      // Once the pointer is over page content (the search guide sits right
      // below the bar), the browser starts extending its own selection into
      // that text and drops ours. Making everything outside the editor
      // unselectable for the rest of the drag leaves nothing for it to grab.
      document.body.classList.add('bar-drag-select');
    }
    // Tracks in both directions, so dragging back off the chip releases it —
    // unless the drag started on the chip, which keeps it selected throughout.
    chipSelected = dragFromChip || pointReachesChip(event.clientX);
    setSelectionRange(dragAnchor, offsetFromPoint(event.clientX, event.clientY));
  }

  function endPointerDrag() {
    stopDragTracking();
    document.body.classList.remove('bar-drag-select');
    dragAnchor = null;
    dragNative = false;
    dragFromChip = false;
    syncCaretOffset();
  }

  function stopDragTracking() {
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', endPointerDrag);
    window.removeEventListener('pointercancel', endPointerDrag);
    document.body.classList.remove('bar-drag-select');
  }

  // --- Attachments -----------------------------------------------------------

  function addFiles(event) {
    const picked = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = '';
    if (picked.length) attachments = [...attachments, ...picked].slice(0, 4);
  }

  function removeAttachment(file) {
    attachments = attachments.filter((item) => item !== file);
    if (!attachments.length) attachNotice = '';
  }

  /**
   * A file cannot ride along in a URL and there is no backend to upload it to,
   * so the clipboard is the one route that works against every destination:
   * copy the image, then open the service so it can be pasted straight into the
   * chat composer or the reverse-image-search box.
   *
   * `ClipboardItem` only accepts a limited set of image types (PNG is the one
   * every engine supports), so this reports back whether the copy succeeded
   * rather than pretending it always does.
   */
  async function copyAttachmentToClipboard() {
    const image = attachments.find((file) => file.type.startsWith('image/'));
    if (!image || !navigator.clipboard?.write) return false;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [image.type]: image })]);
      return true;
    } catch {
      return false;
    }
  }

  /** Runs a ":" command and clears the bar, so it never reaches the searchers. */
  function runCommand(name) {
    if (!name) return;
    commandIndex = 0;
    commit({ value: '', cursor: 0 }, { record: false });
    oncommand?.(name);
  }

  async function submit(event) {
    event?.preventDefault();
    if (commandMode) {
      runCommand(commandMatches[commandIndex]?.name);
      return;
    }
    historyIndex = -1;
    bangCycle = { prefix: '', index: -1, active: false };
    // Both awaited so they land before navigation takes the page: the encoded
    // files ride the URL fragment for the userscript to upload, and the
    // clipboard copy is the manual fallback when it is not installed.
    if (attachments.length) {
      const encoded = await Promise.all(attachments.map(encodeAttachment));
      const weight = encoded.reduce((total, file) => total + file.data.length, 0);
      if (weight > MAX_ATTACHMENT_PAYLOAD) {
        // The fragment cannot carry this much, so the userscript would receive
        // the prompt alone. Say so instead of dropping the files silently.
        onattachments?.([]);
        attachNotice = text.attachmentTooLarge;
      } else {
        onattachments?.(encoded);
        attachNotice = (await copyAttachmentToClipboard()) ? text.attachmentCopied : text.attachmentCopyFailed;
      }
    }
    onsubmit();
  }

  function openSuggestions() { clearTimeout(closeSuggestionsTimer); searchFocused = true; }
  function closeSuggestions() {
    clearTimeout(closeSuggestionsTimer);
    // Bang editing is a transient state; leaving the field puts the chip back
    // rather than stranding raw "!g " text in the bar.
    bangEditing = false;
    chipSelected = false;
    closeSuggestionsTimer = setTimeout(() => (searchFocused = false), 120);
  }
</script>

{#snippet segmentNode(segment)}{#if segment.type === 'operator'}{#if segment.tone === 'filter'}<span class="inline-search-operator filter"><span class="operator-card"><span class="operator-card-label">{#if segment.icon}<span class="nerd-icon" contenteditable="false" data-deco="1" data-text="" aria-hidden="true">{segment.icon}</span>{/if}{segment.prefix}</span><span class="operator-card-value">{segment.value}</span></span></span>{:else}<span class="inline-search-operator {segment.tone}">{segment.text}</span>{/if}{:else if segment.type === 'keyword'}<span class="search-keyword">{segment.text}</span>{:else if segment.type === 'markdown'}<span class="hl-md hl-md-{segment.kind}" class:markers-revealed={markerRevealed(segment)}>{#if segment.open}<span class="md-mark">{segment.open}</span>{/if}{segment.content}{#if segment.close}<span class="md-mark">{segment.close}</span>{/if}</span>{:else if segment.type === 'math'}<span class="hl-math hl-math-{segment.kind}">{segment.text}</span>{:else}<span class="hl-text">{segment.text}</span>{/if}{/snippet}

{#snippet bangChip()}<span class="bang-chip" class:is-selected={chipSelected} contenteditable="false" data-deco="1" data-text={bangChipText} title={bangState.bang}>{#if service?.icon?.symbol}<svg class="bang-chip-icon" class:raster-icon={service.icon.raster} class:icon-tone-dark={tone === 'dark'} class:icon-tone-light={tone === 'light'} viewBox="0 0 24 24"><use href={`./assets/icons.svg#${service.icon.symbol}`}></use></svg>{:else}<span class="bang-chip-initials">{serviceInitials}</span>{/if}</span>{/snippet}

{#snippet optionsChip()}{#if translationOptions}<span class="bang-deco" class:is-selected={chipSelected} contenteditable="false" data-deco="1" data-text={optionsChipText}><TranslationSelector {translationOptions} activeBang={`${bangState.bang}[${bangState.options}]`} {language} onchange={handleTranslationChange} /></span>{:else}<span class="bang-options-chip" class:is-selected={chipSelected} contenteditable="false" data-deco="1" data-text={optionsChipText} title={bangState.options}>{bangState.options}</span>{/if}{/snippet}

<div class="search-shell">
  <form class="search" class:multiline aria-label={text.search} onsubmit={submit}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- Copy/cut sit here rather than on the editor so a selection covering the
         bang chip (which lives outside the editor) is still captured, and the
         pointer handlers make that chip and the bar's padding drag-selectable.
         Everything here has a keyboard equivalent in `handleKeydown`. -->
    <div
      class="search-control"
      bind:this={controlEl}
      oncopy={handleCopy}
      oncut={handleCut}
      onpointerdown={handlePointerDown}
    >
      {#if showBangChip}
        <span class="bang-lead" bind:this={leadEl}>{@render bangChip()}{#if bangState.options}{@render optionsChip()}{/if}</span>
      {:else}
        <svg class="search-magnifier" aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      {/if}
      <label class="sr-only" for="search-editor">{text.searchLabel}</label>
      <div
        id="search-editor"
        class="query-editor"
        class:is-empty={!value}
        class:single-line={!multiline}
        bind:this={editorEl}
        contenteditable="true"
        role="textbox"
        tabindex="0"
        aria-multiline={multiline}
        aria-autocomplete="list"
        aria-controls="query-suggestions"
        data-placeholder={placeholder}
        spellcheck="false"
        autocorrect="off"
        autocapitalize="off"
        onbeforeinput={handleBeforeInput}
        onkeydown={handleKeydown}
        onfocus={openSuggestions}
        onblur={closeSuggestions}
        onpaste={handlePaste}
        oncompositionstart={handleCompositionStart}
        oncompositionupdate={handleCompositionUpdate}
        oncompositionend={handleCompositionEnd}
      >{#key renderNonce}{#each positionedSegments as segment, index (index)}{@render segmentNode(segment)}{/each}{#if needsCaretHost}<span data-deco="1" data-caret-host="1" data-text="">&#8203;</span>{/if}{/key}</div>
    </div>
    <label class="attach-button" title={text.attachFiles}>
      <span aria-hidden="true">＋</span>
      <span class="sr-only">{text.attachFiles}</span>
      <input type="file" accept="image/*,.pdf,.txt,.md,.csv,.json,.docx" multiple onchange={addFiles} />
    </label>
    <button class="search-submit" type="submit" data-deco="1" data-text="" aria-label={text.searchGoogle}><span aria-hidden="true">↗</span></button>
  </form>

  {#if attachments.length}
    <div class="attachments" aria-label={text.attachFiles}>
      {#each attachments as file (file.name + file.lastModified)}
        <span class="attachment-chip">
          <span class="attachment-name">{file.name}</span>
          <button type="button" aria-label={text.removeAttachment} onclick={() => removeAttachment(file)}>×</button>
        </span>
      {/each}
      <small>{attachNotice || text.attachmentHelp}</small>
    </div>
  {/if}

  <QuickAnswer query={queryText} {language} {text} />

  {#if service && showBangChip && activeSearchGuide}
    <SearchGuide activeService={service} {activeSearchGuide} activeServiceInitials={serviceInitials} />
  {/if}

  {#if showCommands}
    <div class="command-suggestions" role="listbox" aria-label={text.availableCommands}>
      {#each commandMatches as item, index (item.name)}
        <button
          type="button"
          class:selected={index === commandIndex}
          role="option"
          aria-selected={index === commandIndex}
          onmousedown={(event) => event.preventDefault()}
          onclick={() => runCommand(item.name)}
        >
          <span class="command-name">:{#if commandToken && item.name.startsWith(commandToken)}<mark>{item.name.slice(0, commandToken.length)}</mark>{/if}{item.name.slice(commandToken && item.name.startsWith(commandToken) ? commandToken.length : 0)}</span>
          <span>{item.description}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if showHistory}
    <QueryHistory items={matchingHistory} {text} typed={queryForHistory} services={allServices} onreuse={reuseQuery} onremove={onhistoryremove} />
  {/if}
</div>

<p class="search-help">
  {#if commandMode}{text.commandHelp}{:else if value.trimStart().startsWith('!')}{text.bangHelp}{:else}{text.press} <kbd>Enter</kbd> {text.sendHelp} · <kbd>Shift</kbd> + <kbd>Enter</kbd> {text.newLineHelp}{/if}
</p>

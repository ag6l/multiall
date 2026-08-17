// ==UserScript==
// @name         AIforALL — Open and ask
// @namespace    https://aiforall.local/
// @version      2.0.0
// @description  Receives a prompt (and optional file attachments) from MultiALL, inserts them into a supported AI chat, and submits.
// @author       AIforALL
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://gemini.google.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://grok.com/*
// @match        https://chat.deepseek.com/*
// @match        https://chat.mistral.ai/*
// @match        https://poe.com/*
// @match        https://huggingface.co/chat*
// @match        https://www.perplexity.ai/*
// @match        https://perplexity.ai/*
// @match        https://kagi.com/assistant*
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const MARKER = 'aiforall=';
  // v2 envelope: base64url JSON of { prompt, files: [{ name, type, data }] }.
  // The v1 marker (a bare base64url prompt) is still accepted so an older app
  // build keeps working against this script.
  const MARKER_V2 = 'aiforall2=';
  const EDITOR_TIMEOUT = 45_000;
  const SUBMIT_TIMEOUT = 15_000;
  const ATTACH_TIMEOUT = 20_000;
  // Uploads are asynchronous on every service: the composer stays disabled
  // until the file finishes processing, so submitting too early sends an empty
  // or partial message.
  const UPLOAD_SETTLE = 2_500;

  const adapters = [
    {
      hosts: ['chatgpt.com'],
      attach: ['input[type="file"][multiple]', 'input[type="file"]'],
      editors: ['#prompt-textarea', 'textarea[data-testid="prompt-textarea"]', 'div[contenteditable="true"][data-testid="prompt-textarea"]'],
      send: ['button[data-testid="send-button"]', 'button[aria-label*="Send prompt" i]', 'button[aria-label*="Enviar" i]']
    },
    {
      hosts: ['claude.ai'],
      attach: ['input[data-testid="file-upload"]', 'input[type="file"]'],
      editors: ['div.ProseMirror[contenteditable="true"]', '[contenteditable="true"][data-testid*="composer"]'],
      send: ['button[aria-label="Send Message"]', 'button[data-testid="send-button"]', 'button[aria-label*="Send" i]']
    },
    {
      hosts: ['gemini.google.com'],
      attach: ['input[type="file"][name="Filedata"]', 'input[type="file"]'],
      strategy: 'gemini',
      editors: ['rich-textarea .ql-editor[contenteditable="true"]', '.ql-editor[contenteditable="true"]', 'rich-textarea [contenteditable="true"]'],
      send: ['button.send-button:not([disabled])', 'button[aria-label*="Send message" i]', 'button[aria-label*="Enviar mensaje" i]', 'button[data-test-id*="send" i]']
    },
    {
      hosts: ['copilot.microsoft.com'],
      attach: ['input[type="file"]'],
      editors: ['textarea#userInput', 'textarea[data-testid*="chat-input"]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[data-testid="submit-button"]', 'button[aria-label*="Submit" i]', 'button[aria-label*="Send" i]', 'button[aria-label*="Enviar" i]']
    },
    {
      hosts: ['grok.com'],
      attach: ['input[type="file"]'],
      editors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[aria-label*="Submit" i]', 'button[aria-label*="Send" i]', 'button[type="submit"]']
    },
    {
      hosts: ['chat.deepseek.com'],
      attach: ['input[type="file"]'],
      editors: ['textarea#chat-input', 'textarea[placeholder]', 'textarea'],
      send: ['button[aria-label*="Send" i]', 'button[aria-label*="发送" i]', 'button[class*="send"]']
    },
    {
      hosts: ['chat.mistral.ai'],
      attach: ['input[type="file"]'],
      editors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[aria-label*="Send" i]', 'button[aria-label*="Envoyer" i]', 'button[type="submit"]']
    },
    {
      hosts: ['poe.com'],
      attach: ['input[type="file"]'],
      editors: ['textarea[class*="GrowingTextArea"]', 'textarea[placeholder]', 'textarea'],
      send: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]', 'button[type="submit"]']
    },
    {
      hosts: ['huggingface.co'],
      attach: ['input[type="file"]'],
      editors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[aria-label*="Send" i]', 'button[type="submit"]']
    },
    {
      hosts: ['perplexity.ai', 'www.perplexity.ai'],
      attach: ['input[type="file"]'],
      editors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[aria-label*="Submit" i]', 'button[aria-label*="Send" i]', 'button[type="submit"]']
    },
    {
      hosts: ['kagi.com'],
      attach: ['input[type="file"]'],
      editors: ['textarea[name="prompt"]', 'textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
      send: ['button[type="submit"]', 'button[aria-label*="Send" i]']
    }
  ];

  function decodeBase64Url(value) {
    const encoded = value.replaceAll('-', '+').replaceAll('_', '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return atob(padded);
  }

  /** @returns {{prompt: string, files: File[]}|null} */
  function readPayload() {
    const rawHash = location.hash.slice(1);
    const isV2 = rawHash.startsWith(MARKER_V2);
    if (!isV2 && !rawHash.startsWith(MARKER)) return null;

    try {
      const binary = decodeBase64Url(rawHash.slice((isV2 ? MARKER_V2 : MARKER).length));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const decoded = new TextDecoder().decode(bytes);

      if (!isV2) return { prompt: decoded.replace(/\r\n?/g, '\n'), files: [] };

      const envelope = JSON.parse(decoded);
      return {
        prompt: String(envelope.prompt ?? '').replace(/\r\n?/g, '\n'),
        files: (envelope.files ?? []).map(toFile).filter(Boolean)
      };
    } catch (error) {
      console.error('[AIforALL] Invalid payload.', error);
      notify('AIforALL', 'The prompt could not be decoded. / No se pudo decodificar el prompt.');
      return null;
    }
  }

  function toFile({ name, type, data }) {
    try {
      const binary = decodeBase64Url(data);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new File([bytes], name || 'attachment', { type: type || 'application/octet-stream' });
    } catch (error) {
      console.error('[AIforALL] Could not rebuild an attachment.', error);
      return null;
    }
  }

  function removePromptFromAddress() {
    history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  }

  function notify(title, message) {
    if (typeof GM_notification === 'function') {
      GM_notification({ title, text: message, timeout: 7000 });
    } else {
      console.info(`[${title}] ${message}`);
    }
  }

  function allRoots() {
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      for (const element of roots[index].querySelectorAll('*')) {
        if (element.shadowRoot) roots.push(element.shadowRoot);
      }
    }
    return roots;
  }

  function deepQuery(selectors) {
    for (const root of allRoots()) {
      for (const selector of selectors) {
        for (const element of root.querySelectorAll(selector)) {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          if (style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0) {
            return element;
          }
        }
      }
    }
    return null;
  }

  function waitFor(selectors, timeout) {
    const started = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const element = deepQuery(selectors);
        if (element) return resolve(element);
        if (Date.now() - started >= timeout) return resolve(null);
        setTimeout(check, 250);
      };
      check();
    });
  }

  function setNativeValue(element, value) {
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  function normalizedText(value) {
    return value.replace(/\r\n?/g, '\n');
  }

  function contentEditableValue(editor) {
    return normalizedText(editor.innerText ?? editor.textContent ?? '');
  }

  function selectEditorContents(editor) {
    editor.focus();
    const root = editor.getRootNode();
    const selection = (typeof root.getSelection === 'function' ? root.getSelection() : null) ?? getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function promptHtml(prompt) {
    return prompt.split('\n').map((line) => {
      const container = document.createElement('div');
      container.textContent = line;
      return container.innerHTML;
    }).join('<br>');
  }

  function replaceContentEditable(editor, prompt) {
    editor.replaceChildren();
    const lines = prompt.split('\n');

    lines.forEach((line, index) => {
      if (index > 0) editor.append(document.createElement('br'));
      editor.append(document.createTextNode(line));
    });

    editor.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  function findQuillEditor(editor) {
    try {
      const pageWindow = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
      return editor.__quill
        ?? editor.closest('rich-textarea')?.__quill
        ?? pageWindow.Quill?.find?.(editor)
        ?? null;
    } catch {
      return null;
    }
  }

  async function fillGeminiEditor(editor, prompt) {
    const quill = findQuillEditor(editor);
    if (quill?.setText) {
      quill.setText(prompt, 'user');
      quill.setSelection?.(prompt.length, 0, 'silent');
      await new Promise((resolve) => setTimeout(resolve, 180));
      return true;
    }

    const selection = selectEditorContents(editor);
    document.execCommand('delete', false);
    let inserted = true;
    const lines = prompt.split('\n');

    for (let index = 0; index < lines.length; index += 1) {
      if (index > 0) inserted = document.execCommand('insertParagraph', false) && inserted;
      if (lines[index]) inserted = document.execCommand('insertText', false, lines[index]) && inserted;
    }

    selection.removeAllRanges();
    editor.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await new Promise((resolve) => setTimeout(resolve, 180));
    return inserted || contentEditableValue(editor).length > 0;
  }

  async function fillEditor(editor, prompt, adapter) {
    const preservedPrompt = normalizedText(prompt);
    editor.focus();

    if (adapter.strategy === 'gemini') return fillGeminiEditor(editor, preservedPrompt);

    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
      setNativeValue(editor, preservedPrompt);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return normalizedText(editor.value) === preservedPrompt;
    }

    const selection = selectEditorContents(editor);
    document.execCommand('delete', false);
    const inserted = document.execCommand('insertHTML', false, promptHtml(preservedPrompt));

    if (!inserted) replaceContentEditable(editor, preservedPrompt);
    else editor.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    selection.removeAllRanges();
    editor.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await new Promise((resolve) => setTimeout(resolve, 180));
    return contentEditableValue(editor).length > 0;
  }
  /**
   * File inputs are deliberately hidden on every one of these services (the
   * visible control is a styled button), so this deliberately skips the
   * visibility filter `deepQuery` applies.
   */
  function deepQueryHidden(selectors) {
    for (const root of allRoots()) {
      for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element) return element;
      }
    }
    return null;
  }

  function waitForHidden(selectors, timeout) {
    const started = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const element = deepQueryHidden(selectors);
        if (element) return resolve(element);
        if (Date.now() - started >= timeout) return resolve(null);
        setTimeout(check, 250);
      };
      check();
    });
  }

  function filesToDataTransfer(files) {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    return transfer;
  }

  /**
   * Uploads the attachments. Two routes, because no single one works everywhere:
   *
   *  1. Assign to the hidden `input[type=file]` and fire `change`. This is what
   *     the site's own picker does, so its handlers run normally. A single-file
   *     input only ever receives the first file.
   *  2. Synthesise a `paste` carrying the files. Every one of these composers
   *     accepts pasted images, which covers services that upload straight from
   *     a drop/paste handler without a reachable input.
   */
  async function attachFiles(editor, files, adapter) {
    const selectors = adapter.attach ?? ['input[type="file"]'];
    const input = await waitForHidden(selectors, ATTACH_TIMEOUT);

    if (input) {
      const accepted = input.multiple ? files : files.slice(0, 1);
      input.files = filesToDataTransfer(accepted).files;
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      if (accepted.length < files.length) {
        notify('AIforALL', `Only 1 of ${files.length} files could be attached here. / Solo se pudo adjuntar 1 de ${files.length} archivos.`);
      }
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_SETTLE));
      return true;
    }

    try {
      editor.focus();
      const pasted = editor.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true, cancelable: true, composed: true, clipboardData: filesToDataTransfer(files)
      }));
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_SETTLE));
      return pasted;
    } catch (error) {
      console.error('[AIforALL] Attachment paste failed.', error);
      return false;
    }
  }

  async function submitPrompt(editor, selectors) {
    const started = Date.now();
    while (Date.now() - started < SUBMIT_TIMEOUT) {
      const button = deepQuery(selectors);
      if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') {
        button.click();
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const form = editor.closest('form');
    if (form?.requestSubmit) {
      form.requestSubmit();
      return true;
    }

    const eventOptions = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true };
    editor.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
    editor.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
    editor.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
    return true;
  }

  async function run() {
    const payload = readPayload();
    if (!payload) return;
    const { prompt, files } = payload;
    if (!prompt && !files.length) return;
    removePromptFromAddress();

    const adapter = adapters.find(({ hosts }) => hosts.includes(location.hostname));
    if (!adapter) return;

    const editor = await waitFor(adapter.editors, EDITOR_TIMEOUT);
    if (!editor) {
      notify('AIforALL', 'Editor not found. Are you logged in? / No se encontró el editor. ¿Iniciaste sesión?');
      return;
    }

    // Files first: the composer disables its send button while an upload is in
    // flight, and some services clear the draft when an attachment lands.
    if (files.length && !await attachFiles(editor, files, adapter)) {
      notify('AIforALL', 'Files could not be attached; sending the text only. / No se pudieron adjuntar los archivos; se envía solo el texto.');
    }

    if (prompt && !await fillEditor(editor, prompt, adapter)) {
      notify('AIforALL', 'The prompt could not be inserted. / No se pudo insertar el prompt.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    await submitPrompt(editor, adapter.send);
  }

  run().catch((error) => {
    console.error('[AIforALL] Automation failed.', error);
    notify('AIforALL', 'Automation failed. Check the browser console. / La automatización falló.');
  });
})();

import { getBackground, removeBackground, saveBackground } from '../lib/backgroundDb.js';

let settingsOpen = $state(false);
let historyModalOpen = $state(false);
let calendarModalOpen = $state(false);
let weatherModalOpen = $state(false);
let backgroundUrl = $state('');
let hasBackground = $state(false);
let aiAutomation = $state(false);
let now = $state(new Date());
let clockTimer;

// --- Settings ---

export function getSettingsOpen() {
  return settingsOpen;
}

export function openSettings() {
  settingsOpen = true;
}

export function closeSettings() {
  settingsOpen = false;
}

// --- History ---

export function getHistoryModalOpen() {
  return historyModalOpen;
}

export function openHistoryModal() {
  historyModalOpen = true;
}

export function closeHistoryModal() {
  historyModalOpen = false;
}

// --- Calendar ---

export function getCalendarModalOpen() {
  return calendarModalOpen;
}

export function openCalendarModal() {
  calendarModalOpen = true;
}

export function closeCalendarModal() {
  calendarModalOpen = false;
}

// --- Weather Modal ---

export function getWeatherModalOpen() {
  return weatherModalOpen;
}

export function openWeatherModal() {
  weatherModalOpen = true;
}

export function closeWeatherModal() {
  weatherModalOpen = false;
}

// --- Background ---

export function getBackgroundUrl() {
  return backgroundUrl;
}

export function getHasBackground() {
  return hasBackground;
}

function setBackgroundUrl(blob) {
  if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
  backgroundUrl = URL.createObjectURL(blob);
  hasBackground = true;
}

export async function loadSavedBackground() {
  try {
    const record = await getBackground();
    if (record?.blob) setBackgroundUrl(record.blob);
  } catch {
    hasBackground = false;
  }
}

export async function changeBackground(file) {
  await saveBackground(file);
  setBackgroundUrl(file);
}

export async function clearBackground() {
  await removeBackground();
  if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
  backgroundUrl = '';
  hasBackground = false;
}

// --- AI Automation ---

export function getAiAutomation() {
  return aiAutomation;
}

export function setAiAutomation(enabled) {
  aiAutomation = enabled;
  localStorage.setItem('aiforall-automation', String(enabled));
}

export function initAiAutomation() {
  aiAutomation = localStorage.getItem('aiforall-automation') === 'true';
}

// --- Clock ---

export function getNow() {
  return now;
}

export function startClock() {
  clockTimer = setInterval(() => (now = new Date()), 1000);
}

function stopClock() {
  clearInterval(clockTimer);
}

// --- Cleanup ---

export function cleanupUi() {
  stopClock();
  if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
}

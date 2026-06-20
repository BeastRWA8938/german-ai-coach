import { INITIAL_TOPICS } from '../data/topics.js';

export const SETTINGS_STORAGE_KEY = 'projektdeutsch_settings';
export const TOPICS_STORAGE_KEY = 'projektdeutsch_topics_v2';
export const LAST_DECAY_STORAGE_KEY = 'projektdeutsch_last_decay';

export const DEFAULT_SETTINGS = {
  apiKey: '',
  selectedModel: 'gemini-2.5-flash',
  syncEnabled: false,
};

const allowedModels = new Set(['gemini-2.5-flash', 'gemini-2.5-pro']);

function getBrowserStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function readJsonStorage(key, fallback, storage = getBrowserStorage()) {
  if (!storage) return fallback;

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Resetting invalid stored value for ${key}.`, error);
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures; the fallback keeps the app usable.
    }
    return fallback;
  }
}

export function writeJsonStorage(key, value, storage = getBrowserStorage()) {
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not persist ${key}.`, error);
    return false;
  }
}

export function readStringStorage(key, fallback = '', storage = getBrowserStorage()) {
  if (!storage) return fallback;

  try {
    return storage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function writeStringStorage(key, value, storage = getBrowserStorage()) {
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Could not persist ${key}.`, error);
    return false;
  }
}

export function normalizeSettings(storedSettings) {
  if (!storedSettings || typeof storedSettings !== 'object' || Array.isArray(storedSettings)) {
    return DEFAULT_SETTINGS;
  }

  return {
    apiKey: typeof storedSettings.apiKey === 'string' ? storedSettings.apiKey : '',
    selectedModel: allowedModels.has(storedSettings.selectedModel)
      ? storedSettings.selectedModel
      : DEFAULT_SETTINGS.selectedModel,
    syncEnabled: false,
  };
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function normalizeAttempts(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function normalizeLastPracticed(value) {
  if (value === null || typeof value === 'undefined') return null;
  if (typeof value !== 'string') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function normalizeSubskills(defaultSubskills, storedSubskills) {
  const safeStored = storedSubskills && typeof storedSubskills === 'object' && !Array.isArray(storedSubskills)
    ? storedSubskills
    : {};

  return Object.fromEntries(
    Object.keys(defaultSubskills).map((subskill) => [
      subskill,
      normalizeNumber(safeStored[subskill]),
    ])
  );
}

function normalizeTopic(defaultTopic, storedTopic) {
  const safeStored = storedTopic && typeof storedTopic === 'object' && !Array.isArray(storedTopic)
    ? storedTopic
    : {};

  const accuracy = normalizeNumber(safeStored.accuracy);
  const confidence = normalizeNumber(safeStored.confidence);

  return {
    ...defaultTopic,
    accuracy,
    confidence,
    attempts: normalizeAttempts(safeStored.attempts),
    lastPracticed: normalizeLastPracticed(safeStored.lastPracticed),
    masteryScore: normalizeNumber(safeStored.masteryScore ?? (accuracy * confidence) / 100),
    subskills: normalizeSubskills(defaultTopic.subskills, safeStored.subskills),
  };
}

export function normalizeTopics(storedTopics) {
  const safeStored = storedTopics && typeof storedTopics === 'object' && !Array.isArray(storedTopics)
    ? storedTopics
    : {};

  return Object.fromEntries(
    Object.entries(INITIAL_TOPICS).map(([level, defaultTopics]) => {
      const storedLevelTopics = Array.isArray(safeStored[level]) ? safeStored[level] : [];

      return [
        level,
        defaultTopics.map((defaultTopic) => {
          const storedTopic = storedLevelTopics.find((topic) => topic?.id === defaultTopic.id);
          return normalizeTopic(defaultTopic, storedTopic);
        }),
      ];
    })
  );
}

export function loadSettings(storage = getBrowserStorage()) {
  return normalizeSettings(readJsonStorage(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS, storage));
}

export function loadTopics(storage = getBrowserStorage()) {
  return normalizeTopics(readJsonStorage(TOPICS_STORAGE_KEY, INITIAL_TOPICS, storage));
}

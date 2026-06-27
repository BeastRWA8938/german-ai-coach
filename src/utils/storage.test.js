import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS, loadSettings, loadTopics, normalizeSettings, normalizeTopics, readJsonStorage } from './storage.js';

function createMemoryStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    has(key) {
      return values.has(key);
    },
  };
}

test('readJsonStorage falls back and removes invalid JSON', () => {
  const storage = createMemoryStorage({ broken: '{not-json' });
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const result = readJsonStorage('broken', { ok: true }, storage);

    assert.deepEqual(result, { ok: true });
    assert.equal(storage.has('broken'), false);
  } finally {
    console.warn = originalWarn;
  }
});

test('normalizeSettings preserves valid BYOK settings and disables unfinished sync', () => {
  const result = normalizeSettings({
    apiKey: 'gemini-key',
    selectedModel: 'gemini-2.5-flash',
    syncEnabled: true,
  });

  assert.deepEqual(result, {
    apiKey: 'gemini-key',
    selectedModel: 'gemini-2.5-flash',
    syncEnabled: false,
  });
});

test('normalizeSettings upgrades legacy Gemini model aliases', () => {
  const result = normalizeSettings({
    apiKey: 'gemini-key',
    selectedModel: 'gemini-3.1-pro-preview',
  });

  assert.equal(result.selectedModel, 'gemini-3.5-flash');
});

test('loadSettings falls back for malformed settings', () => {
  const storage = createMemoryStorage({ projektdeutsch_settings: '"bad-shape"' });

  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
});

test('normalizeTopics keeps the known catalog and sanitizes saved metrics', () => {
  const result = normalizeTopics({
    A1: [
      {
        id: 'family',
        accuracy: 110,
        confidence: -5,
        attempts: 2.6,
        lastPracticed: 'not-a-date',
        subskills: {
          vocabulary: 88.7,
        },
      },
    ],
  });

  const family = result.A1.find((topic) => topic.id === 'family');

  assert.equal(result.A1.length > 1, true);
  assert.equal(family.accuracy, 100);
  assert.equal(family.confidence, 0);
  assert.equal(family.attempts, 3);
  assert.equal(family.lastPracticed, null);
  assert.equal(family.subskills.vocabulary, 89);
  assert.equal(family.subskills.relationships, 0);
});

test('loadTopics falls back to the initial topic catalog on corrupt storage', () => {
  const storage = createMemoryStorage({ projektdeutsch_topics_v2: '{bad' });
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const result = loadTopics(storage);

    assert.equal(Array.isArray(result.A1), true);
    assert.equal(result.A1[0].id, 'family');
  } finally {
    console.warn = originalWarn;
  }
});

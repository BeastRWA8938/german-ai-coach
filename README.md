# ProjektDeutsch AI

ProjektDeutsch AI is an AI-powered German learning coach for self-learners. It focuses on CEFR-aligned practice, instant answer feedback, local progress tracking, confidence decay, weak-area detection, and adaptive Smart Practice.

The app is currently a local-first React/Vite application. Gemini exercise generation uses a bring-your-own-key model: the API key is stored in the user's browser and sent directly from the browser to Google Gemini. Offline mock questions remain available when no key is configured.

## Requirements

- Node.js `24.17.0` or newer
- npm `11.17.0` or newer

The expected Node version is recorded in `.nvmrc`.

## Setup

```bash
npm install
npm run dev
```

Vite serves the app locally, usually at `http://localhost:5173`.

## Checks

```bash
npm run test
npm run build
```

`npm run check` runs lint, tests, and build together. If ESLint hangs in your environment, use `npm run test` and `npm run build` while investigating the local ESLint install.

## Production Build

```bash
npm run build
npm run preview
```

The static production assets are written to `dist/`.

## Docker

```bash
docker compose up --build
```

The container serves the built app through Nginx on `http://localhost:8080`.

## Data And Privacy

- Learning progress is stored locally in browser storage.
- Stored data is normalized on load so invalid or older saved data falls back safely.
- Storage health checks alert the user in the UI if local storage is full, disabled, or in private mode.
- Google Drive sync is intentionally still marked as coming soon.
- BYOK Gemini usage means users control their own API key. To protect key storage:
  - The app dynamically detects if served over insecure HTTP and warns the user in the Settings modal.
  - A strict Nginx Content Security Policy (CSP) is implemented to restrict network requests (`connect-src`) to `https://generativelanguage.googleapis.com` and the host origin, blocking potential script injection data exfiltration.

## Product Direction

The project vision is described in `Project-Idea/V4.md`. The current focus is the stable MVP foundation: practice flows, deterministic answer checking, local progress, and production-ready app hygiene. The deeper learning analytics layer will be expanded separately.

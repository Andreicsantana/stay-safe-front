# Stay Safe Web

Frontend application for **Stay Safe**, an emergency alert system designed for elderly dependents and their family carers. Built as an installable PWA with a high-contrast, accessible interface tailored for low vision, tremors, and low tech familiarity.

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (fixed high-contrast light theme via `@theme`)
- **UI Primitives**: Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`)
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Typography**: `@fontsource/atkinson-hyperlegible-next` & `@fontsource-variable/fraunces` (self-hosted)
- **PWA**: `vite-plugin-pwa` (installable standalone app, app shell caching)
- **Testing & Lint**: Vitest, React Testing Library, ESLint

## Key Features

### Elderly Dependent Experience
- **Single-action screen**: Large `AJUDA` button (~60% viewport height), no clutter, no logout button, no technical IDs.
- **Accidental tap protection**: 3-second countdown (`Enviando em 3… 2… 1…`) with a large cancel strip (`72px+` touch target) — no hold-to-trigger required.
- **Full-screen alert states**: Distinct high-contrast colors, `96px` icons, and short messages for waiting (`amber`), carer on the way (`pine green`), and escalated (`red`).
- **On-screen PinPad**: Custom `72px` numeric keypad that avoids triggering the system keyboard.
- **Multisensory feedback**: Vibration (`navigator.vibrate`), Web Audio API tones, and `pt-BR` speech synthesis (`speechSynthesis`).
- **Resilience**: Persistent `localStorage` session, automatic WebSocket reconnection with backoff, offline connection banner, and Screen Wake Lock during active alerts.

### Carer Experience
- **Bottom navigation**: `Alertas` (with active count badge), `Histórico`, and `Dependentes`.
- **Real-time alerts**: Persistent top alert banner, live elapsed timer, address and Google Maps link, `"Estou indo"` and `"Encerrar"` actions.
- **Dependent management**: Edit name/PIN, copy profile UUID, remote device disconnect (`force-logout`), and PWA install instructions.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables (optional for local dev)

Create a `.env` file if pointing to a remote API:

```env
VITE_API_BASE=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
```

### 3. Run locally

```bash
npm run dev
```

### 4. Lint, Test & Build

```bash
npm run lint
npm test
npm run build
```

## Deployment

Configured for **Netlify** (`netlify.toml`) with SPA fallback routing (`/* -> /index.html`). Set `VITE_API_BASE` and `VITE_WS_URL` in your Netlify environment variables before building.

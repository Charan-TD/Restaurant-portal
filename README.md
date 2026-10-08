# Train Dhaba Restaurant Vendor Portal — Next.js migration

This project migrates the existing React/Vite/JavaScript portal. It does not recreate its UI from a new template. The original MUI theme, screen markup, class names and responsive stylesheet are retained; the stylesheet is byte-for-byte unchanged.

## Run on Windows

Install Node.js 20.9 or newer. Extract the ZIP and open a terminal in its `restaurant-portal` folder (the folder containing `package.json`).

```cmd
npm install
npm run dev
```

Open http://localhost:3000. The dev script binds to localhost explicitly and uses Next.js's default port 3000. Keep the terminal running. Stop it with Ctrl+C. If port 3000 is occupied, stop the other application first.

## Verify and run production

```cmd
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

`build` uses Next.js's webpack compiler. `dev` uses Next.js's default Turbopack compiler. No Vite command or config is used.

## Stack

Next.js 16.3.8 App Router, React 19.2, TypeScript, MUI 9.4, MUI Icons, Emotion, React Hook Form, Zod, Axios. Exact versions and the lockfile are included.

## Flow

Restaurant Details → Restaurant Location → Business Documents → Bank Account → Restaurant Profile → Operating Hours → Review & Submit → Under Review → Approved / Rejected → Login → Dashboard after approval.

The latest requested flow takes precedence over the older prototype: Profile now precedes Operating Hours. The previous menu editor remains within Profile, so no extra onboarding step is added.

Routes: `/` redirects to `/register`; `/register`, `/status`, `/login`, `/dashboard` render their migrated screens. Route pages and the root layout remain server components. Interactive forms, state providers, and ViewModel hooks are client components. The shared provider retains in-memory onboarding data during client-side navigation.

## Architecture

- `features/*/models`: domain types and Zod validation.
- `features/*/views`: migrated screen rendering.
- `features/*/viewmodels`: forms, step navigation, submission, approval and order logic.
- `features/*/services`: Axios communication and explicit demo adapters.
- `features/*/components`: feature-specific form steps and order rows.
- `shared/components`: common fields, selects, uploads, checkboxes, buttons, cards, dialog and shell.
- `core/theme/theme.ts`: the original global MUI theme.
- `core/providers/AppProviders.tsx`: MUI App Router cache provider, Emotion/theme integration and application state provider.
- `core/api/axios.ts`: central Axios instance.
- `core/constants/onboarding.ts`: typed common field definitions and exact step order.

See `MIGRATION.md` for the complete folder structure and conversion/removal lists.

## Explicit demo mode

The original portal's demo is preserved so the whole flow can be inspected without a backend. The header labels it **Frontend demo**. `NEXT_PUBLIC_DEMO_MODE` defaults to `true`. There is no fake backend server, local database, or persistence.

Complete the seven steps. On the status screen, use the labeled preview controls for Under review / Approved / Rejected. Approved leads to login; use your entered email and any nonempty demo password. The dashboard contains the original sample orders. Accept, Reject and Mark ready work in memory. Full page reload resets demo values, uploaded-file selections and the demo session. Passwords are not persisted.

## API mode and remaining TODOs

Copy `.env.example` to `.env.local`:

```cmd
copy .env.example .env.local
```

Set `NEXT_PUBLIC_DEMO_MODE=false`, supply the real API base URL and confirmed endpoint paths, and restart the server. No guessed endpoint paths are supplied, and API mode does not silently fall back to demo results. The services clearly report a configuration error when paths are missing.

Integration work still required:

1. Confirm endpoint paths, request/response DTOs and multipart upload names; adapt the typed feature services to the actual backend. Registration currently sends JSON under `registration` and individual files under their field names.
2. Confirm authentication. Axios currently uses cookie sessions (`withCredentials: true`). Adapt to the actual backend, restore sessions/application data on reload, and enforce approval/authorization on the server. The client route guard is only a UI guard.
3. Connect real admin decisions, document storage and live orders. The status refresh and order methods are already separated into services.
4. Supply the actual Partner Agreement/commission wording. The checkbox text is inherited from the prototype.
5. Add map/geocoding integration only if required; the existing editable location form remains intact.

Never put private secrets in `NEXT_PUBLIC_*` variables. These settings only contain public API URLs, paths and the demo-mode flag.

## Migration verification

TypeScript, ESLint, Zod tests and production build were run. The browser flow, client-side navigation, file selectors, menu creation and order actions were checked. Desktop design was compared with the original; the responsive CSS is retained, but a separate mobile-device browser run was not performed.

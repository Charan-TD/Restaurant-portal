# TrainDhaba Restaurant Portal: Frontend Developer Guide

> **Status of this document.** Every fact below was read from the repository (`package.json`, `src/`, `netlify.toml`, `.github/workflows/ci.yml`, `tests/`). Anything the repository does not answer is marked **To Be Confirmed (TBC)**. Nothing project-specific has been assumed.
> Companion: `AGENTS.md` warns that this Next.js version has breaking changes. Read the matching guide in `node_modules/next/dist/docs/` before changing routing, config or data-fetching code.

## Contents
1. [Project overview](#1-project-overview)
2. [Development environment setup](#2-development-environment-setup)
3. [Frontend architecture](#3-frontend-architecture)
4. [Design implementation](#4-design-implementation)
5. [Page and screen documentation](#5-page-and-screen-documentation)
6. [Component documentation](#6-component-documentation)
7. [API integration](#7-api-integration)
8. [State management](#8-state-management)
9. [Routing and navigation](#9-routing-and-navigation)
10. [Form handling](#10-form-handling)
11. [Responsive design](#11-responsive-design)
12. [Performance optimization](#12-performance-optimization)
13. [Testing](#13-testing)
14. [Deployment](#14-deployment)
15. [Developer handover](#15-developer-handover)

---

## 1. Project Overview

### 1.1 Introduction
`traindhaba-restaurant-portal` (v1.0.0, private) is the web portal for restaurant partners of **TrainDhaba**, a service that delivers food to passengers on trains. Restaurants register, get approved, then run their business from the portal: live orders, group orders, menu, riders, customers' feedback, payments, offers and profile.

### 1.2 Objectives
- Let a restaurant register itself in steps and track its approval.
- Let an approved restaurant take orders, move them through their stages and hand them to riders.
- Let it manage its menu (categories, dishes, quantities, add-ons, stock).
- Let it see customers, feedback, sales insights and profile data, and request changes to sensitive details.

### 1.3 Technology stack and exact versions (from `package.json`)

| Area | Library | Version |
|---|---|---|
| Framework | next (App Router) | 16.3.8 |
| UI runtime | react / react-dom | 19.2.0 |
| Language | typescript | 6.0.3 (`strict: true`) |
| UI kit | @mui/material, @mui/icons-material, @mui/material-nextjs | 9.4.0 |
| Styling | @emotion/react, @emotion/styled, @emotion/cache | 11.14.0 / 11.14.1 / 11.14.0 |
| State and data | @reduxjs/toolkit (RTK Query), react-redux | 2.13.0, 9.3.0 |
| HTTP | native fetch via RTK Query `fetchBaseQuery` | n/a |
| Forms | react-hook-form, @hookform/resolvers | 7.89.0, 5.9.1 |
| Validation | zod | 3.25.76 |
| Maps | maplibre-gl | 6.13.0 |
| Lint | eslint, eslint-config-next | 9.39.5, 16.3.8 |
| Node (engines) | node | >= 20.9.0 (CI and Netlify use 22) |

### 1.4 Browser compatibility
No `browserslist` entry and no compatibility matrix exist in the repository. The TypeScript target is ES2017. **TBC:** the officially supported browser list.

### 1.5 Backend integration overview
- Single REST backend, default `https://train-dhaba-backend-dev.up.railway.app` (override with `NEXT_PUBLIC_API_BASE_URL`).
- Auth is by **bearer JWT** stored in `localStorage`; no cookies, no credentials (`src/core/api/session.ts`).
- Endpoint paths are fixed in `src/core/constants/config.ts` (`API_PATHS`), not in environment variables.
- One extra server-side route in the Next app proxies Geoapify address search so the key never reaches the browser (`src/app/api/locations`).
- A **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`) replaces API calls with in-memory data. CI builds in demo mode.
- No written API specification is in the repository. Response shapes are read defensively. **TBC:** link to backend/OpenAPI docs.

---

## 2. Development Environment Setup

### 2.1 Required tools
- Node.js >= 20.9 (22 recommended, matching CI and Netlify) and npm (a `package-lock.json` is committed; CI runs `npm ci`).
- Git. **TBC:** recommended editor and extensions (none are specified in the repository).

### 2.2 Installation
```bash
git clone <repository-url>      # TBC: repository URL
cd restaurant-portal
npm ci
cp .env.example .env            # then edit values
npm run dev                     # http://localhost:3000 (binds 0.0.0.0)
```

### 2.3 Environment variables (`.env.example`)

| Variable | Scope | Purpose | Default |
|---|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | browser | `true` runs the in-memory demo instead of the API | unset = real API |
| `NEXT_PUBLIC_API_BASE_URL` | browser | API server base URL, trailing `/` stripped | `https://train-dhaba-backend-dev.up.railway.app` |
| `NEXT_PUBLIC_MENU_IMAGE_BASE_URL` | browser | Public URL prepended to menu picture storage paths (e.g. a Supabase `.../menu_item_images` bucket) | empty: pictures show a placeholder |
| `GEOAPIFY_API_KEY` | **server only** | Address autocomplete, used by `/api/locations` | none; route returns 503 if missing |

Never commit real keys. `.env` exists locally and is git-ignored. Old `NEXT_PUBLIC_*_PATH` variables are obsolete; the paths now live in `config.ts`.

### 2.4 Commands (`package.json` scripts)

| Command | What it does |
|---|---|
| `npm run dev` | Copies the MapLibre worker (`predev`), then `next dev --hostname 0.0.0.0` |
| `npm run build` | Copies the worker (`prebuild`), then `next build --webpack` |
| `npm start` | `next start` (serve the production build) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm test` | `node --test tests/*.test.mjs` |

Dev server accepts private-network origins (`192.168.*.*`, `10.*.*.*`, `172.*.*.*`) so phones on the same Wi-Fi can open it.

### 2.4.1 Environments
Development (`npm run dev`, dev API by default) and production (Netlify build, `NEXT_PUBLIC_API_BASE_URL` set in the Netlify dashboard). **TBC:** the production API URL and whether a separate staging environment exists.

---

## 3. Frontend Architecture

### 3.1 Style of architecture
Feature-sliced **MVVM**. Every feature folder uses the same layers:

```
models/      types, zod schemas, mappers (API row <-> app type). No React.
services/    RTK Query endpoints (fetch via a shared base query).
viewmodels/  hooks holding screen logic and state; return what the view needs.
views/       screens (JSX only, composed from components).
components/  UI pieces used by that feature's views.
```
Rule of thumb from the git history ("Move form logic from views into viewmodels"): **views render, viewmodels decide, services talk to the API, models define shapes.**

### 3.2 Folder structure
```
restaurant-portal/
├─ .github/workflows/ci.yml      lint, typecheck, test, build
├─ docs/                         this guide
├─ public/                       logo.jpg, login-bg.jpg, maplibre-gl-worker.mjs (generated)
├─ scripts/copy-maplibre-worker.mjs
├─ tests/                        menuItem.test.mjs, validation.test.mjs
├─ netlify.toml  next.config.ts  tsconfig.json  eslint.config.mjs
└─ src/
   ├─ app/                       routes only (thin pages) + api/locations
   │  ├─ (auth)/    login, forgot-password, reset-password  → AuthShell
   │  ├─ (onboarding)/ register, review, status             → PortalShell
   │  ├─ (portal)/  dashboard, orders, menu, ...            → AppShell (guarded)
   │  ├─ terms/  privacy/  not-found.tsx  page.tsx  layout.tsx  globals.css
   │  └─ api/locations/{route.ts, reverse/route.ts, geoapify.ts}
   ├─ core/
   │  ├─ api/        session.ts (tokens), baseApi.ts (RTK Query base, flow())
   │  ├─ constants/  config.ts, navigation.ts, onboarding.ts
   │  ├─ providers/  AppProviders, PortalProvider, ToastProvider
   │  ├─ store/      store.ts, StoreProvider.tsx
   │  └─ theme/      theme.ts (MUI), tokens.ts (design tokens)
   ├─ features/      approval, auth, customers, dashboard, groupOrders, insights,
   │                 legal, menu, notifications, offers, onboarding, orders,
   │                 payments, portal, profile, riders
   └─ shared/
      ├─ components/ actions, feedback, form, layout, navigation
      ├─ hooks/      useDebouncedValue.ts
      ├─ types/      api.ts
      └─ utils/      errors.ts, format.ts, workflows/
```
Path alias: `@/*` → `./src/*`.

### 3.3 Layouts and providers
`src/app/layout.tsx` wraps everything in `AppProviders`:
```tsx
<AppRouterCacheProvider>
  <ThemeProvider theme={theme}><CssBaseline />
    <StoreProvider>            {/* Redux store, new per mount */}
      <ToastProvider>
        <PortalProvider>{children}</PortalProvider>   {/* session + registration form */}
```
Each route group adds its shell: `(auth)` → `AuthShell`, `(onboarding)` → `PortalShell`, `(portal)` → `AppShell` (sidebar, top bar, auth guard, `portalTheme` with compact inputs).

### 3.4 Reusable code
- `src/shared/components/*`: generic UI (see §6).
- `src/shared/utils/errors.ts`: `errorMessage(error)` turns any RTK or thrown error into text.
- `src/shared/utils/format.ts`: `formatRupees`.
- `src/shared/hooks/useDebouncedValue.ts`: debounce for search boxes.

### 3.5 Routing architecture
File-based App Router. See §9.

---

## 4. Design Implementation

### 4.1 Figma integration
No Figma file link, plugin, or token export is in the repository. The tokens file says it holds "the TrainDhaba Partner design tokens used by the redesigned screens". The last commit is "Redesign the portal to the TrainDhaba Partner screens". **TBC:** Figma file URL and who owns it.

### 4.2 Design system: two layers
1. **MUI theme** (`src/core/theme/theme.ts`): legacy base, used by sign-in, onboarding and the base of every screen.
2. **Design tokens** (`src/core/theme/tokens.ts`): the TrainDhaba Partner redesign. Screens use `tokens`, `cardSx`, `cardHeaderSx`, `searchFieldSx` and `tokenScopeSx`.

> Known inconsistency: `theme.ts` primary is `#f26a2e`; `tokens.color.primary` is `#c94a00`. Redesigned screens use the token. See §15.

### 4.3 Colour variables (`tokens.color`)

| Token | Value | Use |
|---|---|---|
| primary / primaryHover | `#c94a00` / `#a63d00` | Buttons, active nav, accents |
| primarySubtle / primarySubtleBorder | `#fff4ec` / `#f6c9ab` | Selected row, focus tint |
| text / textMuted / textSubtle | `#1c1c1c` / `#666666` / `#8a8a8a` | Body, secondary, helper text |
| link / info | `#1a56b0` | Blue links, info |
| page / card / muted / sunken | `#f5f5f5` / `#fff` / `#f2f2f2` / `#f7f8fa` | Backgrounds |
| border / borderSubtle / borderInput / borderStrong / dashed | `#e6e6e6` / `#f0f0f0` / `#d6d6d6` / `#1c1c1c` / `#b8b8b8` | Lines |
| success / successBg | `#1b7f4b` / `#edf7f1` | In stock, switches on |
| error / errorBg | `#b3261e` / `#fdecea` | Errors |
| infoBg | `#e8f0fe` | Info panels |

Radii: badge 6, button 10, input 12, card 16 px. Card shadow: `0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)`.

### 4.4 Typography
MUI theme: `fontFamily: "Roboto, Arial, sans-serif"`, base `fontSize: 13`, h4 800/24px, h5 and h6 700, buttons `textTransform: none`, weight 600. Card titles: 18px bold; subtitles 14px muted. **TBC:** how the font is loaded (no font import found) and whether the design specifies a different face (the redesign screenshots look like Inter).

### 4.5 Spacing and component dimensions
MUI `sx` spacing (8px unit). Dimensions set by `tokenScopeSx`: inputs 48px high, 12px radius, 1.5px border (dark on focus); primary button 48px; outlined button 40px; text button 48px grey. Switch (`ToggleSwitch`): 44 × 26, 20px knob, green when on. Sidebar width: `SIDEBAR_WIDTH` in `AppSidebar.tsx`.

### 4.6 CSS architecture
Mostly **MUI `sx` props + Emotion**. `src/app/globals.css` holds legacy class-based styles for the older shell (`.portal-header`, `.shell`, `.centered-page`, `.card`, etc.). New work should use tokens and `sx`, not new global classes.

### 4.7 Theme management
`theme` (MUI, light only) is applied app-wide; `portalTheme` extends it inside `AppShell` with `size="small"` text fields and 38px buttons. Wrap a screen in `tokenScopeSx` (`<Drawer slotProps={{paper:{sx:{...tokenScopeSx}}}}>`) to apply token styling to its inputs and buttons. No dark mode.

---

## 5. Page and Screen Documentation

Routes below come from `src/app`. Unless noted, "Loading / Empty / Error / Success" describe what the code shows; where a screen's states were not inspected they are marked TBC.

### 5.1 Route map

| Route | Screen | Group / guard |
|---|---|---|
| `/` | Redirects to `/login` | public |
| `/login` | Sign in / start registration (OTP) | (auth) public |
| `/forgot-password`, `/reset-password` | Password recovery | (auth) public |
| `/register` | Registration steps | (onboarding) |
| `/review` | Review and submit (step disabled) | (onboarding) |
| `/status` | Approval status | (onboarding) |
| `/dashboard` | Live orders and overview | (portal) guarded |
| `/orders`, `/orders/all` | Manage orders, all orders | guarded |
| `/group-orders`, `/group-orders/all` | Group orders | guarded |
| `/riders` | Riders (own-rider restaurants) | guarded |
| `/menu/items`, `/menu/add`, `/menu/items/[id]` | Menu, new item, edit item | guarded |
| `/customers/list`, `/customers/feedback` | Customers, feedback | guarded |
| `/insights`, `/payments`, `/offers`, `/notifications` | Reports | guarded |
| `/profile`, `/settings/password`, `/settings/working-hours` | Profile, settings | guarded |
| `/[section]/[page]` | Generic section page from `navigation.ts` | guarded; `notFound()` if unknown |
| `/terms`, `/privacy` | Legal text | public |

### 5.2 Login (`/login`)
- **Purpose:** sign in, or start registration, with mobile number + OTP.
- **Files:** `features/auth/views/LoginView.tsx`, `viewmodels/useLoginViewModel.ts`, `components/OtpInput.tsx`, `services/authApi.ts`.
- **Layout:** `AuthShell` (brand panel + form card).
- **Interactions:** type a 10-digit number, request OTP, enter 6-digit code (`OTP_LENGTH = 6`), resend after 30 s (`RESEND_AFTER`). Account exists → `/dashboard`; new number → registration. Links to Partner terms and Privacy policy open in the same tab.
- **API:** send OTP, verify OTP (`API_PATHS.sendOtp`, `verifyOtp`), profile (`restaurantMe`).
- **Fields and validation:** phone `^[6-9]\d{9}$`, digits only, max 10; OTP 6 digits.
- **States:** busy/sending flags; phone and general error text; resend countdown; test backends may echo the OTP, shown on screen.

### 5.3 Forgot / reset password
`ForgotPasswordView`, `ResetPasswordView` with matching viewmodels. APIs: `forgotPassword`, `resetPassword`. **TBC:** field-level rules and copy.

### 5.4 Registration (`/register`)
- **Purpose:** collect the restaurant's data in steps; the backend saves one step at a time (step 1 creates the registration and returns its id).
- **Files:** `onboarding/views/OnboardingView.tsx`, `viewmodels/useOnboardingViewModel.ts`, `models/validation.ts` (zod), `core/constants/onboarding.ts` (steps), `services/registrationApi.ts`.
- **Active steps:** Restaurant details → Location → Documents → Bank account → Operating hours (submit). Menu and Review steps exist but `enabled: false`.
- **Components:** `LocationSearch` (Geoapify), `LocationMap` (MapLibre), `CuisineField`, `FoodServedField`, `RiderOwnerField`, `RegistrationField`, `RegistrationUpload`, `DocumentsStep`, `HoursStep`, `PasswordChecklist`, `SubmissionSummary`.
- **Fields:** restaurant name, owner, mobile, email, password + confirm, type (Restaurant / Cloud kitchen), cuisines, customer phone, food served (Veg/Egg/Non-veg), delivery by (TrainDhaba / restaurant); address, building, landmark, city, state, PIN, lat/long; GST, PAN, FSSAI + expiry, identity, business proof, bank proof, cover photo, logo; account holder, account number (twice), IFSC, bank name; hours per day with shifts.
- **Validation:** zod. Required strings `"This field is required."`; files up to **2 MB**, documents PDF/JPG/PNG/WEBP, pictures JPG/PNG/WEBP. Details in `validation.ts`.
- **Persistence:** registration id and extras are remembered in the browser (`registrationApi`, `registrationExtras`, `useRestoreRegistration`).

### 5.5 Approval status (`/status`)
Reads the approval for the remembered registration id. No id → `/login`. HTTP 409 (never submitted) → `/register`. Has refresh, error text and per-status views (`ApprovalView`).

### 5.6 Dashboard (`/dashboard`) and Manage Orders (`/orders`)
- **Purpose:** live work queue. A tab per stage: New, Preparing, Ready, Out for delivery, Delivered, Rejected; list left, open order right.
- **Files:** `dashboard/views/DashboardView.tsx`, `components/{LiveOrders,OrderCard,OrderDetailsDialog,RevenueChart,TodayOverview}.tsx`, `orders/views/OrdersView.tsx`, `orders/components/{OrderList,OrderDetail}.tsx`.
- **Status flow:** `New → Preparing → Ready → HandedOver → Delivered`; `Rejected` = cancelled. With TrainDhaba riders the restaurant stops at Ready.
- **Interactions:** accept/reject, mark ready, "Handed to the rider" (own riders), print kitchen ticket (opens a print window), search, live countdown timers.
- **API:** `orders`, `updateOrder` (`{id}` placeholder), RTK polling every 30 s (orders) and 60 s (all orders, insights).
- **Setup state:** an approved but not-live restaurant sees the "go live" setup checklist here.

### 5.7 Group orders (`/group-orders`, `/group-orders/all`)
Orders assigned by the admin. Accept/reject via `respondGroupOrder` (`{ decision }`), then status updates via `updateGroupOrder`. Polls for new orders and rider updates.

### 5.8 Riders (`/riders`)
Shown only when the restaurant uses its own riders (`useRidersOwner`, saved as `td.ridersOwner`). List, add rider (`AddRiderDialog` / `AddRiderPanel`, multipart), assign rider to an order (`AssignRiderDialog`), delivery status.

### 5.9 Menu items (`/menu/items`, `/menu/add`, `/menu/items/[id]`)
- **Purpose:** manage categories and dishes.
- **Files:** `menu/views/MenuItemsView.tsx`, `MenuItemFormView.tsx`; `components/{CategoryRail,EditCategoryDrawer,MenuItemRow,MenuItemThumb,MenuItemStatus,RecommendedMenu,AddOnsPanel,InfoCell}.tsx`; `viewmodels/{useMenuItemsViewModel,useMenuItemFormViewModel,menuErrors}.ts`; `services/{menuItemApi,addOnApi,categoryMemory,categoryStatus}.ts`; `models/{menuItem,menuGroups}.ts`.
- **Layout:** a two-column grid, categories rail (280 px) and dish list; the new/edit form opens in a right-hand `Drawer` (520 px) driven by the route.
- **Interactions:** search; "Show out of stock only"; Recommended dropdown (add TrainDhaba's suggested categories); Add category / sub-category; Edit category drawer (rename, switch sub-categories on/off, add); Category on/off switch; in-stock toggle per dish (optimistic update with rollback); Edit dish; Delete (button in the edit drawer footer, confirm dialog); Add-ons tab.
- **Form fields (`MenuItemForm`):** photo (JPG/WEBP, ≤ 2 MB, one image), name (required, ≤ 255), description (≤ 500), price (required, whole rupees, > 0), discount, category (required), sub-category, food type (Veg, Non-veg, Egg), prep time (5-minute steps, 5–240), available now, quantities, add-ons.
- **Validation:** `menuItemFormSchema` in `models/menuItem.ts`, covered by `tests/menuItem.test.mjs`.
- **Quantities:** any number of rows, each a quantity name (from `GET /menu-items/qty-types`, new names are created first with `POST /restaurant-qty-types`) and its own price. Saved as `qty_types: [{ qty_type, price }]` (JSON body, or a JSON string in multipart); `[]` clears them on an edit. The dish list shows the price range and the names. Dishes saved with the old single `qty_type` show it as one row at the dish price.
- **Import from Excel:** the "Import Excel" button opens `MenuImportDialog`, which uses the server: `GET /menu-items/excel-template` (download), `POST /menu-items/excel-preview` (checks the file, saves nothing) and `POST /menu-items/excel-import` (all rows checked first, saved in one transaction). Limits: `.xlsx`, 5 MB, 500 rows, columns exactly as in the template. A workbook with any bad row imports nothing; the server returns the row errors (HTTP 400, shown in the dialog). New categories, sub-categories and quantity types are created by the import. Code: `useMenuImportViewModel.ts`, `menuItemApi.ts`.
- **Import from your own file:** the same dialog's "Upload my own file" tab takes any `.xlsx`, `.xls` or `.csv`. It is read in the browser (SheetJS, loaded on demand), columns are matched by heading or by cell values (the vendor confirms them when unclear), Half/Full columns become sizes, and the vendor fixes missing prep time / category / price on screen. The checked dishes are then written into the server's template (headings read from the live `GET /menu-items/excel-template`, last known layout as fallback) and sent through the same `excel-preview` and `excel-import` calls, so the server still validates every row and saves all or none. Pure logic: `src/features/menu/import/`; state: `useOwnFileImportViewModel.ts`; UI: `OwnFileImportPane.tsx`. Ported from the standalone `bulk-menu` prototype, which is excluded from `tsconfig.json`.
- **States:** loading spinner, empty ("No menu items yet"), filter-empty text, API error messages via `menuErrorMessage`, success toast on save.

### 5.10 Customers (`/customers/list`, `/customers/feedback`)
Customer list with stats, and customer reviews (`reviews`, `ratingSummary`), with filters and footer paging components. **TBC:** exact filters.

### 5.11 Insights, Payments, Offers, Notifications
- **Insights:** sales and trends derived from orders (`useInsightsViewModel`, demo-mode aware).
- **Payments:** `PaymentsView` reads from an API; demo-mode aware. **TBC:** endpoint.
- **Offers:** `OffersView` + `models/offer.ts`; no API service exists. **TBC:** backend.
- **Notifications:** `NotificationsView`, `notificationApi`; `API_PATHS.notifications` is `undefined` (backend has no endpoint yet).

### 5.12 Profile and settings
`/profile` (details, location, documents, bank, working hours panes), `/settings/password` (change password), `/settings/working-hours`. Sensitive changes are requests (`profileChangeRequests`) with a status. Online/Offline lives in the top bar.

### 5.13 Terms and Privacy (`/terms`, `/privacy`)
`legal/views/LegalView.tsx` renders `LegalDocument` content (`termsContent.ts`, `privacyContent.ts`): a grey breadcrumb bar ("‹ Register / <title>", back link in blue `#1a56b0`), numbered sections, justified text, emails auto-linked, scroll-to-top. Static, no API.

---

## 6. Component Documentation

Only components whose props were read are fully specified. Others are listed with their location; **TBC** props.

### 6.1 `CommonTextField` — `shared/components/form/CommonTextField.tsx`
Wraps MUI `TextField` (full width, outlined). Handles browser autofill so the label does not overlap.
| Prop | Type | Default | Notes |
|---|---|---|---|
| …`TextFieldProps` | MUI | | All MUI props, `prefix` omitted |
| `inputPrefix` | `ReactNode` | none | Shown before the input when focused/filled (e.g. `+91`) |
```tsx
<CommonTextField placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)}
  inputPrefix={<SearchOutlined fontSize="small" />} />
```

### 6.2 `CommonButton` — `shared/components/actions/CommonButton.tsx`
MUI `Button` with `type="button"` by default (prevents accidental form submits). Pass `type="submit"` explicitly.

### 6.3 `ToggleSwitch` — `shared/components/form/ToggleSwitch.tsx`
MUI `Switch` (`SwitchProps`), 44×26, green when checked. Use `slotProps={{ input: { "aria-label": "…" } }}` for accessibility.

### 6.4 `BackButton` — `shared/components/actions/BackButton.tsx`
| Prop | Type | Default |
|---|---|---|
| `fallbackHref` | `string` | `"/dashboard"` |
| …`CommonButtonProps` (minus `onClick`, `children`) | | |
Goes back in history, else to `fallbackHref`. Hidden on `/`, `/login`, `/dashboard` and redesigned paths (`redesignedPaths.ts`).

### 6.5 `LegalView` — `features/legal/views/LegalView.tsx`
| Prop | Type |
|---|---|
| `document` | `LegalDocument` (`title`, `updated?`, `intro?`, `sections[{heading, body[]}]`) |
Block = string paragraph or `{ list: (string | {lead, text})[] }`.

### 6.6 Menu components
| Component | Props (read from code) |
|---|---|
| `CategoryRail` | `categories: CategoryNode[]`, `selected: string \| null`, `selectedSub`, `onSelect(name)`, `onSelectSub(name \| null)`, `saving`, `onAdd(category, subcategories?) => Promise<boolean>`, `addOnsCount`, `addOnsActive`, `onOpenAddOns()` |
| `RecommendedMenu` | `categories: {id, name, added}[]`, `busy: boolean`, `onAdd({id,name}) => Promise<boolean>`; returns `null` when the list is empty |
| `EditCategoryDrawer` | `category: CategoryNode`, `onClose()`, `onSave({rename?, subRenames, switches, added}) => Promise<boolean>` |
| `MenuItemRow` | `item: MenuItem`, `saving: boolean`, `onAvailable(boolean)`; Edit links to `/menu/items/{id}` |
| `MenuItemFormView` | `id?: string` (edit when set), `onDelete?(item: {id, name})` |

### 6.7 Other shared components (props TBC)
`AppSidebar` (`items`, `pathname`, `badges`, `onNavigate`), `AuthShell`, `PortalShell`, `PortalHeader`, `PageHeader`, `CommonCard`, `MetricCard`, `StatTile`, `ScreenSurface`, `CountTabs`, `NavDropdown`, `UniversalSearch`, `FoodTypeMark`, `BlinkBadge`, `Hint`, `ItemsSummary`, `CommonSelect`, `CommonCheckbox(Group)`, `CommonRadioGroup`, `CommonUpload`, `DocumentUpload`, `PasswordField`, `TimeField`, `FormField (FieldLabel)`.

---

## 7. API Integration

### 7.1 Base URL and paths
`src/core/constants/config.ts`:
```ts
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://train-dhaba-backend-dev.up.railway.app").replace(/\/+$/, "");
export const API_PATHS = {
  menuItems: "/api/v1/menu-items",
  addons: "/api/v1/addons",
  qtyTypes: "/api/v1/restaurant-qty-types",
  login: "/api/v1/auth/restaurant/login",
  sendOtp: "/api/v1/auth/restaurant/send-otp",
  verifyOtp: "/api/v1/auth/restaurant/verify-otp",
  orders: "/api/v1/restaurant/orders",
  updateOrder: "/api/v1/restaurant/orders/{id}/status",
  reviews: "/api/v1/restaurant/reviews",
  riders: "/api/v1/restaurant/riders",
  groupOrders: "/api/v1/restaurant/orders/group-orders",
  restaurantMe: "/api/v1/restaurant/profile",
  /* … full list in config.ts … */
  notifications: undefined as string | undefined, // no backend endpoint yet
} as const;
```
Menu sub-routes used in code: `/menu-items/search`, `/menu-items/categories`, `/menu-items/categories/admin`, `/menu-items/categories/admin/{id}/select`, `/menu-items/qty-types`.

### 7.2 Service structure
One RTK Query API (`baseApi`, `reducerPath: "api"`); each feature calls `baseApi.injectEndpoints`. Tag types: `Orders, Customers, Reviews, GroupOrders, Riders, MenuItems, AddOns, Categories, QtyTypes, Profile, Hours, ChangeRequests`.

All requests go through one `fetchBaseQuery`-based base query (`apiBaseQuery` in `src/core/api/baseApi.ts`): `API_BASE_URL`, a 15 s timeout, and the bearer token added from `getAccessToken()` on every request. Failures are mapped to `{ status?, message, data? }`. File downloads use `downloadBlob(path)` from the same file.

### 7.3 The `flow()` helper
For endpoints needing several requests, demo data or reshaping, write plain async code against `send`; a thrown error becomes the endpoint error:
```ts
listQtyTypes: build.query<string[], void>({
  queryFn: flow((_: void, send: Send) => listQtyTypes(send)),
  providesTags: ["QtyTypes"],
}),
deleteMenuItem: build.mutation<void, string>({
  queryFn: flow(deleteMenuItem),
  invalidatesTags: ["MenuItems"],
}),
```

### 7.4 Request/response handling
Responses are mostly `{ success, message, data }`. Mappers read loosely (e.g. `itemRows()` accepts `data.items`, `data.menu_items` or a plain array). Failures become `ApiError { status?, message, data? }`; `errorMessage()` picks `response.data.message` first.

### 7.5 Authentication and tokens
Tokens in `localStorage`: `td.accessToken`, `td.refreshToken`; plus `td.ridersOwner`. All storage access is try/catch guarded. `claimsOf(token)` decodes JWT claims client-side (not verified). On page load `PortalProvider` restores the session if the token exists and is unexpired; a `401` from the profile call clears tokens. **No automatic refresh-token flow is implemented**; the refresh token is stored but unused. **TBC:** whether one is intended.

### 7.6 HTTP methods in use
GET (lists, search), POST (create, OTP, select recommended), PATCH (menu item updates, category changes), DELETE (menu item, add-on deactivation). PUT: none found.

### 7.7 Error handling and loading
Errors surface as flash toasts (`useToast`), inline `helperText`, or `Alert`. Loading uses `CircularProgress`, `isLoading` flags and disabled buttons ("Saving…"). 15 s request timeout.

### 7.8 Pagination
Orders: `GET /orders?page=N&status=…`. Menu items: read page by page up to `MAX_ITEM_PAGES = 50`, stopping at `data.pagination.totalPages`:
```ts
for (let page = 1; page <= MAX_ITEM_PAGES; page++) {
  const data = await send({ url: endpoint(API_PATHS.menuItems), params: { page } });
  rows.push(...itemRows(data));
  if (page >= (Number(data?.data?.pagination?.totalPages) || 1)) break;
}
```

### 7.9 File uploads
`multipart/form-data` through `FormData`. Menu item pictures: field `img_id`, **one picture per request**, replacing the item's set; fields are sent as JSON first, picture in a second PATCH. Add-on picture: `img_id`. Limits: 2 MB.
```ts
function multipart(fields, files) {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => { if (v != null)
    body.append(k, typeof v === "object" ? JSON.stringify(v) : String(v)); });
  files.slice(0, 1).forEach((f) => body.append("img_id", f));
  return body;
}
```

### 7.10 API validation
Client-side zod mirrors backend validators (the menu schema comment cites `validators/menu-item.validator.js`). **TBC:** the backend validator rules beyond those mirrored.

### 7.11 Known contract gaps
- **Backend bug (database types):** on the latest backend, migration `20261106_menu_item_qty_type_prices.sql` created `qty_type_id` as `uuid` in `restaurant_menu_item_qty_types`, `cart_items` and `order_items`, but `food_qty_type.qty_type_id` is `varchar` (`QTY001`). Listing menu items then fails with `operator does not exist: character varying = uuid`. Fix on the backend: make those columns `varchar` and the cart code compare as text.
- **Registration step 1 edit:** needs `PUT /registration/{id}/restaurant-details`, which the backend does not have yet; a ready patch is in `docs/backend-patches/registration-restaurant-details-put.patch`.
- Notifications and Offers have no endpoint.

---

## 8. State Management

| Kind | Tool | Where |
|---|---|---|
| Server data and caching | RTK Query (`baseApi`) | `core/api`, each `features/*/services` |
| Global UI/session state | React Context (`PortalProvider`) | `core/providers/PortalProvider.tsx` |
| Toasts | Context (`ToastProvider`) | `core/providers` |
| Forms | react-hook-form | per view/viewmodel; the registration form is global in `PortalProvider` |
| Local UI | `useState` | components |

- **Redux store** (`core/store/store.ts`) only holds the RTK Query reducer; a fresh store per `StoreProvider` mount. File arguments are excluded from serializable checks.
- **`PortalProvider`** holds: registration form, step progress, `registrationId`, `approval`, `authenticated`, `restoring`, `profile` (`SessionProfile`), `online`, `orders`.
- **Caching:** RTK tags (invalidate on mutations); `pollingInterval` on orders, group orders and insights; optimistic update with `patch.undo()` for the in-stock switch.
- **Persistence:** tokens, registration id/extras, riders choice, remembered category names (`categoryMemory.ts`), saved reopen time (`offline.ts`) in browser storage.
- **Session:** signing out calls `baseApi.util.resetApiState()` so nothing from that account remains.

---

## 9. Routing and Navigation

- **Definitions:** folders under `src/app`; nav data in `core/constants/navigation.ts` (`sidebarSections`, `railItems`, `navbarMenus`, helpers `railItemFor`, `pageTitleFor`, `findNavPage`).
- **Public:** `/login`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`; `/` redirects to `/login`.
- **Protected:** everything in `(portal)`. The guard is client-side in `AppShell`/`usePortalShellViewModel`:
```ts
useEffect(() => {
  if (!restoring && !authenticated) router.replace("/login");
}, [restoring, authenticated, router]);
```
and `AppShell` renders `null` while unauthenticated. There is **no `middleware`/`proxy` file**, so the server does not block these routes.
- **Role-based navigation:** no roles. One conditional: the **Riders** item is hidden unless the restaurant uses its own riders (`railItems.filter((i) => i.id !== "riders")`).
- **Dynamic routes:** `/menu/items/[id]`, `/[section]/[page]` (validated by `findNavPage`, else `notFound()`).
- **Guards and redirects:** approval (`409` → `/register`, no id → `/login`); going online before setup is complete sends the user to `/dashboard`.
- **404:** `src/app/not-found.tsx` ("Page not found", link to `/login`).
- **Back navigation:** `BackButton` (history, else fallback).

---

## 10. Form Handling

- **Stack:** react-hook-form + zod via `zodResolver`, `mode: "onTouched"`.
- **Required fields and messages:** defined in zod schemas (`onboarding/models/validation.ts`, `menu/models/menuItem.ts`), e.g. `"Enter the item name."`, `"Enter a price above ₹0."`, `"The offer price must be lower than the price."`.
- **Numeric inputs:** `NumberInput` cleans typing to digits (one decimal where allowed) with a `clean()` helper:
```ts
const clean = (raw: string, decimal?: boolean) =>
  decimal ? raw.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*)\..*$/, "$1")
          : raw.replace(/\D/g, "");
```
- **Submission:** `form.handleSubmit` in viewmodels; success → toast + `router.push`; failure → toast with `menuErrorMessage`/`errorMessage`.
- **Edits send only changes** (`changedMenuItemPayload`), plus pricing fields the server always checks.
- **Uploads:** type and size are checked client-side (2 MB); the zod `custom` validators accept `File | null`.
- **Reset:** the item form resets to `emptyMenuItemForm()` after create; edit forms reset from the loaded item.
- **Discount rule:** typed percent or flat ₹ becomes an offer price; sent as `discount_type: "flat"`, `flat_amount = price − offer`.

---

## 11. Responsive Design

- **Breakpoints:** MUI defaults (`xs` 0, `sm` 600, `md` 900, `lg` 1200, `xl` 1536). `globals.css` uses `max-width: 900px` and `640px` media queries.
- **Desktop (≥ md):** permanent sidebar (`SIDEBAR_WIDTH`), two-column menu grid `280px minmax(0,1fr)`.
- **Mobile/tablet (< md):** sidebar becomes a temporary `Drawer` toggled from the top bar; menu grid becomes one column; drawers go full width (`xs: "100%"`).
- **Viewport:** fixed `initialScale: 1`; layout adapts instead of zooming. Inputs are 16px on small screens (commit "16px inputs on small screens").
- **Browser compatibility:** TBC (see §1.4).
- The README states a separate mobile-device browser run was not performed.

---

## 12. Performance Optimization

| Topic | Current state |
|---|---|
| Code splitting | Automatic per route (App Router). No `next/dynamic` or `React.lazy` used. |
| Lazy loading | None explicit. |
| Images | `next/image` used in `AuthShell` and `BrandLogo` only; menu pictures are CSS backgrounds / signed URLs. |
| Caching | RTK Query cache, tags, polling (30–60 s). In-flight request sharing for categories (`categoriesInFlight`). |
| Rendering | Memoisation with `useMemo` in list views; debounced search (`useDebouncedValue`). |
| Bundle | Build uses `--webpack`. **TBC:** reason and bundle size budgets. |
| Maps | MapLibre worker is copied to `public/` by a script before dev/build. |

---

## 13. Testing

### 13.1 What exists
Node's built-in runner over **pure models**, run with `npm test`:
- `tests/menuItem.test.mjs`: menu item schema, payload field names, discount maths, read-back, edit diffing (33 tests across both files passing at last run).
- `tests/validation.test.mjs`: registration validation.
The tests compile the model file on its own with the TypeScript API, so **models must stay free of app imports**.

### 13.2 Not present
Component tests, integration tests and end-to-end tests: **none in the repo**. **TBC:** the intended framework (e.g. React Testing Library, Playwright).

### 13.3 Suggested manual test cases (expected results)

| Case | Steps | Expected |
|---|---|---|
| Sign in | Enter a registered number, request OTP, enter code | Lands on `/dashboard` |
| New number | Enter an unregistered number and code | Goes to registration |
| Guard | Clear `td.accessToken`, open `/menu/items` | Redirects to `/login` |
| Item create | Fill required fields, "Add to menu" | Toast, list shows item |
| Discount | Price 299, discount 10% | Offer price ₹269, summary "flat ₹30 off" |
| Discount too big | Discount 100% | Red message, no offer price |
| Stock switch | Toggle a dish off, fail the API | Switch rolls back |
| Back button | Open Terms from login, press "Register" | Returns to previous page |

### 13.4 CI
`.github/workflows/ci.yml`, on push to `main` and every pull request: `npm ci` → `lint` → `typecheck` → `test` → `build` (with `NEXT_PUBLIC_DEMO_MODE=true`).

---

## 14. Deployment

- **Build:** `npm run build` (`next build --webpack`, after `prebuild` copies the MapLibre worker).
- **Hosting:** Netlify (`netlify.toml`: `command = "npm run build"`, `NODE_VERSION = "22"`). The production site URL is **TBC**.
- **Environment configuration:** set `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MENU_IMAGE_BASE_URL`, `GEOAPIFY_API_KEY` in the Netlify dashboard. `NEXT_PUBLIC_*` values are public by design; `SECRETS_SCAN_OMIT_KEYS` stops Netlify's secrets scan failing the build on them. Obsolete `NEXT_PUBLIC_*_PATH` keys remain in that list until they are deleted from the dashboard.
- **CI/CD:** GitHub Actions verifies; Netlify builds and deploys. Whether Netlify deploys from `main` automatically is **TBC**.
- **Rollback:** not documented. Netlify keeps previous deploys, so publishing an earlier deploy is the likely route. **TBC:** the team's procedure.

---

## 15. Developer Handover

### 15.1 Completed modules
Authentication (OTP, password recovery); multi-step registration with documents, bank, map location and hours; approval status; dashboard and order management with kitchen ticket printing; group orders; riders; menu (categories, sub-categories, recommended categories, dishes, add-ons, stock, discount); customers and feedback; profile, change requests, working hours and password; online/offline status; legal pages; CI and Netlify configuration.

### 15.2 Pending or partial
- Menu: the backend database bug in §7.11 must be fixed before the item list works with quantity options.
- Registration: editing the saved restaurant details (step 1) works in the portal and needs the backend route in §7.11.
- Menu step and Review step of onboarding are disabled.
- Offers: UI/model only. Notifications: no backend endpoint. Payments: endpoint TBC.
- Out-of-stock "Back at <time>" messaging (design shows it) is not wired.
- Component, integration and E2E tests.

### 15.3 Known issues and inconsistencies
- Primary colour differs between `theme.ts` (`#f26a2e`) and `tokens.ts` (`#c94a00`).
- Auth guard is client-side only; no server middleware.
- Refresh token stored but never used; expiry is only checked on load.
- Legacy `globals.css` classes coexist with token styling.
- Registration validation mixes schemas for a disabled menu step.
- The legal back link reads "Register" regardless of where the user came from.

### 15.4 API dependencies
Backend base URL, OTP and login endpoints, registration step endpoints, menu/category/add-on/qty-type endpoints, orders and group-order status endpoints, riders, reviews, profile and change requests, Geoapify (via `/api/locations`), and Supabase-style public image storage.

### 15.5 Technical limitations
2 MB upload cap; one menu picture per request; `localStorage`-based tokens; `MAX_ITEM_PAGES = 50`; response shapes are undocumented; the app depends on Next.js 16 behaviour that differs from older versions.

### 15.6 Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Blank page after login | Token expired or malformed; clear `td.*` keys in `localStorage` |
| Location search says "not configured" | `GEOAPIFY_API_KEY` missing (route returns 503) |
| Map fails to load | Run `node scripts/copy-maplibre-worker.mjs`; check `public/maplibre-gl-worker.mjs` |
| Menu pictures show a placeholder | `NEXT_PUBLIC_MENU_IMAGE_BASE_URL` unset (for non-signed paths) |
| Everything is fake data | `NEXT_PUBLIC_DEMO_MODE=true` is set |
| Netlify build fails on secrets scan | Add the key to `SECRETS_SCAN_OMIT_KEYS` only if it is a public `NEXT_PUBLIC_*` value |
| Calls hit the wrong route | Endpoint paths come from `config.ts`, not the dashboard |
| "Orders API refused" | Session expired vs account not accepted; see `orderApi.ts` diagnosis |

### 15.7 Future improvements
Unify theme and tokens; server-side route protection; refresh-token flow; component and E2E test suites; documented API contract (OpenAPI); lazy-load heavy screens (maps, charts); explicit browser support list; font loading with `next/font`; finish the quantities, offers and notifications backends.

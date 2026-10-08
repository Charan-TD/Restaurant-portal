# Migration details

**Instruction followed:** migrate the existing project, do not rebuild the UI from scratch.

Source: TrainDhaba_Restaurant_Portal(1).zip, which matched the previously supplied portal.

## Changed folder structure

```text
src/
  app/
    dashboard/
      page.tsx
    login/
      page.tsx
    register/
      page.tsx
    status/
      page.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx
  core/
    api/
      axios.ts
    constants/
      config.ts
      onboarding.ts
    providers/
      AppProviders.tsx
      PortalProvider.tsx
    theme/
      theme.ts
  features/
    approval/
      models/
        approval.ts
      services/
        approvalService.ts
      viewmodels/
        useApprovalViewModel.ts
      views/
        ApprovalView.tsx
    auth/
      models/
        auth.ts
      services/
        authService.ts
      viewmodels/
        useLoginViewModel.ts
      views/
        LoginView.tsx
    dashboard/
      components/
        OrderCard.tsx
      models/
        order.ts
      services/
        orderService.ts
      viewmodels/
        useDashboardViewModel.ts
      views/
        DashboardView.tsx
    onboarding/
      components/
        HoursStep.tsx
        ProfileStep.tsx
        RegistrationField.tsx
        RegistrationUpload.tsx
        ReviewStep.tsx
      models/
        registration.ts
        validation.ts
      services/
        registrationService.ts
      viewmodels/
        useHoursViewModel.ts
        useOnboardingViewModel.ts
        useProfileViewModel.ts
      views/
        OnboardingView.tsx
  shared/
    components/
      actions/
        CommonButton.tsx
      form/
        CommonCheckbox.tsx
        CommonSelect.tsx
        CommonTextField.tsx
        CommonUpload.tsx
      layout/
        CommonCard.tsx
        CommonDialog.tsx
        PortalHeader.tsx
        PortalShell.tsx
        SetupSidebar.tsx
    types/
      api.ts
    utils/
      errors.ts
```

Root configuration: `package.json`, `package-lock.json`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`.

Validation regression tests: `tests/validation.test.mjs`.

## Converted and relocated files

| Original file | Migrated destinations |
| --- | --- |
| `src/main.jsx` | `src/app/layout.tsx`, `src/app/page.tsx`, `src/core/providers/AppProviders.tsx` |
| `src/App.jsx` | `features/onboarding/views/OnboardingView.tsx`, `features/auth/views/LoginView.tsx`, `features/approval/views/ApprovalView.tsx`, `features/dashboard/views/DashboardView.tsx`; App Router route pages; typed feature ViewModels, models and services |
| Theme object in `src/App.jsx` | `src/core/theme/theme.ts` |
| Shared state in `src/App.jsx` | `src/core/providers/PortalProvider.tsx` |
| `src/components/CommonFields.jsx` | `shared/components/form/CommonTextField.tsx`, `CommonSelect.tsx`, `CommonUpload.tsx`; feature-specific `RegistrationField.tsx` and `RegistrationUpload.tsx` |
| `src/config/fields.js` | `src/core/constants/onboarding.ts` and typed registration/domain models |
| `src/styles.css` | `src/app/globals.css`, unchanged bytes |

Original stylesheet SHA256: `39fb5e82036aed04dd9641a800afe45900fa03b8884bbe1d703cb91b09a20644`.

All application source is TypeScript/TSX (plus the preserved CSS). No `.jsx` or `.js` application files remain. ESLint configuration and the Node validation tests use `.mjs`.

## Removed Vite/runtime files

- `vite.config.mjs`
- `index.html`
- `src/main.jsx` (replaced by App Router layout/pages)
- `src/App.jsx` (split into typed screens/features)
- `src/components/CommonFields.jsx` (converted and separated)
- `src/config/fields.js` (converted)
- `worker/index.js`, `scripts/prepare-sites-build.mjs`, `tests/sites-worker.test.mjs`: old Vite/Sites static hosting adapter, unnecessary for Next.js.
- Old generated `dist/` output and prototype QA/sample-upload files are not part of the migrated source.

Removed packages: `vite`, `@vitejs/plugin-react`. `react-router-dom` was not present; the original prototype used component state for screens, which is now replaced by App Router routes.

## Flow adjustment explicitly requested

The older prototype used Operating Hours → Menu Setup (including Profile). This migration uses Restaurant Profile → Operating Hours. The same profile and menu controls are retained within Profile. Review lists all six setup sections in the requested order.

## MVVM separation

Views render the original UI. ViewModels own React Hook Form state, validation/navigation, submissions and order transitions. Models define typed DTOs and schemas. Services contain HTTP requests. Common components preserve MUI styles instead of duplicating them in every feature.

Route pages, root layout and static shell components have no `use client` directive. Interactive features and providers use it where needed. Form controls are composed under those client boundaries.

## Remaining TODOs

Backend paths/contracts, real authentication/session restoration, server authorization, upload persistence, real admin status and order integration remain to be confirmed. API mode has separate Axios services and deliberately unconfigured endpoint paths. The existing demo is labeled and gated by `NEXT_PUBLIC_DEMO_MODE`; it never substitutes fake responses for API-mode failures.

See README.md for exact Windows commands and API setup.

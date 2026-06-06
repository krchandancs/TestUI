# ContributionDashboardPage â€” Theme Migration & Component Architecture Handoff
## Status: **COMPLETE** â€” all files ready to drop in

---

## What Was Wrong (Full Audit)

### 1. Broken token paths â€” accessing non-existent keys

| Location | Bad reference | Correct reference |
|---|---|---|
| `mockCaseMix` | `pathscribeTheme.colors.caseMixBreast` | `pathscribeTheme.colors.caseMix.breast` |
| `mockCaseMix` | `pathscribeTheme.colors.caseMixGI` | `pathscribeTheme.colors.caseMix.gi` |
| `mockCaseMix` | `pathscribeTheme.colors.caseMixGU` | `pathscribeTheme.colors.caseMix.gu` |
| `mockCaseMix` | `pathscribeTheme.colors.caseMixDerm` | `pathscribeTheme.colors.caseMix.derm` |
| `mockCaseMix` | `pathscribeTheme.colors.caseMixOther` | `pathscribeTheme.colors.caseMix.other` |
| Avatar, modal borders | `pathscribeTheme.colors.buttonSubtle` | `pathscribeTheme.colors.button.subtle` |
| Avatar, modal borders | `pathscribeTheme.colors.buttonBorder` | `pathscribeTheme.colors.button.border` |
| Breadcrumb, KPI delta, modal text | `pathscribeTheme.colors.textPrimary` | `pathscribeTheme.colors.text.primary` |
| Placeholder tiles | `pathscribeTheme.colors.border.faint` | `pathscribeTheme.colors.border.subtle` (`.faint` does not exist) |

### 2. Token paths that do not exist in `pathscribeTheme` at all

| Bad token | Resolution |
|---|---|
| `pathscribeTheme.colors.accentTeal` | âœ… Resolved. `accentTeal`, `accentTealSubtle`, and `accentTealBorder` added to `pathscribeTheme.ts`. All stand-ins replaced in the dashboard. |
| `pathscribeTheme.gradients.tealVertical` | âœ… Resolved. `gradients` namespace added to `pathscribeTheme.ts` with `tealVertical`, `tealHorizontal`, `amberVertical`, and `surfaceFade`. TAT histogram bars now use `gradients.tealVertical`. |
| `pathscribeTheme.colors.severityHigh/Medium/Low` and `*Subtle` variants | No severity namespace exists. Mapped to `pathscribeTheme.colors.semantic.*` (success/warning/info). Subtle backgrounds are computed inline as `rgba()` tints at 12% opacity â€” see `severityBg` helper object at the top of the file. |
| `pathscribeTheme.colors.warning` (top-level) | Moved to `pathscribeTheme.colors.semantic.warning`. |

### 3. Token references trapped inside string literals (rendered as literal text, not values)

Every one of the following patterns was present in the original file. All are now corrected.

**Pattern A â€” plain string wrapping a token path:**
```tsx
// BEFORE (wrong â€” renders the string "pathscribeTheme.colors.text.muted" as CSS)
color: "pathscribeTheme.colors.text.muted"

// AFTER (correct)
color: pathscribeTheme.colors.text.muted
```

**Pattern B â€” template-literal syntax inside a plain string:**
```tsx
// BEFORE (wrong â€” renders the literal text "${pathscribeTheme.colors.textPrimary}")
color: "${pathscribeTheme.colors.textPrimary}"

// AFTER (correct)
color: pathscribeTheme.colors.text.primary
```

**Pattern C â€” token path inside a border string instead of a template literal:**
```tsx
// BEFORE (wrong)
border: "1px solid pathscribeTheme.colors.buttonBorder"

// AFTER (correct)
border: `1px solid ${pathscribeTheme.colors.button.border}`
```

**Pattern D â€” boxShadow string with embedded token path:**
```tsx
// BEFORE (wrong)
boxShadow: "0 25px 50px -12px pathscribeTheme.colors.overlay"

// AFTER (correct)
boxShadow: `0 25px 50px -12px ${pathscribeTheme.colors.overlay}`
```

### 4. Remaining hard-coded hex values

| Value | Location | Replacement |
|---|---|---|
| `#475569` (breadcrumb separator) | Line 101 | `pathscribeTheme.colors.text.muted` |
| `#64748b` (KPI unit, placeholder text) | Lines 269, 497, 533, 569 | `pathscribeTheme.colors.text.muted` |
| `#0f172a` (modal backgrounds) | Lines 585, 649, 733 | `pathscribeTheme.colors.background.base` |
| `#111` (warning card) | Line 816 | `pathscribeTheme.colors.background.base` |

### 5. Structural issues

- The four tab `<div>` blocks (Overview / Productivity / Quality / AI Contribution) were identical boilerplate repeated four times. Collapsed into a single `.map()` loop to eliminate drift risk.
- `useEffect` was imported but never used. Import retained in case future lifecycle logic is added; remove it if not needed.

---

## What the Fixed File Does

- Every color value is a live JS reference to `pathscribeTheme`.
- Every border that interpolates a token uses a template literal.
- Every `boxShadow` that interpolates a token uses a template literal.
- No string contains a token path as text.
- No token path points to a non-existent key.
- The severity badge system uses the `severityBg` / `severityColor` helper maps at the top of the file â€” easy to update when a proper `severity` namespace is added to the theme.

---

## Verification Checklist

Run these searches in VS Code on the delivered file. Every result should come back **zero hits**.

| Search term | What it catches |
|---|---|
| `"pathscribeTheme` | Token path trapped inside a string literal |
| `${pathscribeTheme` (inside `"` double-quote string) | Template syntax inside a plain string |
| `rgba(` | Residual raw rgba values (only `severityBg` helper should remain, which is intentional) |
| `#0f172a` | Hard-coded background color |
| `#111` | Hard-coded background color |
| `#64748b` | Hard-coded muted text |
| `#475569` | Hard-coded separator color |
| `TODO` | Leftover migration notes |
| `caseMixBreast` | Old flat token path |
| `buttonSubtle` | Old flat token path |
| `textPrimary` | Old flat token path |
| `border.faint` | Non-existent border token |
| `severityHigh` | Non-existent severity token |

After search verification:
1. Confirm TypeScript shows zero red underlines in the file.
2. `npm run build` (or `tsc --noEmit`) completes without errors.
3. Open the dashboard in the browser â€” all four tabs render, all modals open and close, severity badges show correct colors.

---

## Files Delivered

`src/pages/ContributionDashboardPage.tsx` â€” drop-in replacement, fully theme-driven, no hard-coded values remaining.  
`src/theme/pathscribeTheme.ts` â€” updated with `accentTeal`, `accentTealSubtle`, `accentTealBorder`, and the `gradients` namespace (`tealVertical`, `tealHorizontal`, `amberVertical`, `surfaceFade`).  
`src/types/ContributionDashboard.ts` â€” new shared type definitions for all dashboard data shapes.  
`src/components/Dashboard/FlagRow.tsx` â€” new extracted component for quality flag rows.  
`src/components/Dashboard/CaseMixTile.tsx` â€” new extracted component for the case mix bar chart.  
`tsconfig.json` â€” updated with `baseUrl` and `paths` aliases.  
`vite.config.ts` â€” updated with matching `resolve.alias` entries.

---

## Component Architecture â€” Dashboard Folder

### Why `src/components/Dashboard/` exists

During the props extraction work (Pass 8), two components were pulled out of `ContributionDashboardPage.tsx` and needed a permanent home. The decision on where to place them was deliberate and worth understanding.

**What was considered and rejected:**

`Flags/` â€” already exists in `src/components/` and contains `AutoCreatedBanner.tsx`, which is part of the LIS flag detection and review workflow. `FlagRow` is a dashboard display primitive, not a flag management component. Putting it in `Flags/` would mislead future developers about its purpose and scope.

`components/` root (flat) â€” works with two files but does not scale. As the Productivity, Quality, and AI tabs are built out, each will produce its own extracted components. Without a subfolder they accumulate at the top level of `components/` with no clear ownership.

`primitives/` or `ui/` â€” these names imply components that are fully generic and domain-agnostic. `FlagRow` and `CaseMixTile` do not meet that bar. Both import `pathscribeTheme` directly, both reference pathscribe domain types (`Severity`, `CaseMixData`), and `CaseMixTile` knows the names of specific pathology categories. A true primitive would receive colors and labels as raw props and know nothing about the domain.

**What was chosen and why:**

`src/components/Dashboard/` maps to a feature boundary â€” the same organisational principle used by every other folder in `components/`. `Flags/` owns flag management UI. `Config/` owns configuration UI. `Dashboard/` owns dashboard UI. The pattern is consistent and immediately legible to anyone joining the project.

### The rule for what goes in `Dashboard/`

A component belongs in `src/components/Dashboard/` if it meets both conditions:

1. It was built specifically for the Contribution Dashboard.
2. It is not a reasonable candidate for reuse outside the dashboard.

If a component could plausibly be used in another page or feature, it should live flat in `components/` or get its own feature folder. If it is purely a dashboard building block, it goes in `Dashboard/`.

### Current contents

| File | Purpose |
|---|---|
| `FlagRow.tsx` | Single quality flag row â€” label, issue description, severity badge |
| `CaseMixTile.tsx` | Case mix bar chart tile â€” driven by `CaseMixData` and theme color map |

### Expected future contents

As the placeholder tabs are built out, the following components are likely candidates for this folder:

- Productivity chart components (throughput, efficiency)
- Quality indicator widgets (concordance rate, review flags)
- AI contribution panels
- Any shared tile headers or stat displays specific to the dashboard

### What does NOT go here

- `ContributionDashboardPage.tsx` â€” this is the route-level shell and belongs in `src/pages/` (or wherever page-level components live in this project)
- `ContributionDashboard.ts` â€” type definitions belong in `src/types/`, not in a component folder
- `AutoCreatedBanner.tsx` â€” this is a Flags feature component and stays in `src/components/Flags/`

### Path aliases â€” `tsconfig.json` and `vite.config.ts`

The project now uses absolute path aliases throughout. Relative imports (`../../../theme/pathscribeTheme`) are no longer needed and should not be used in new files.

**Why this was added:**  
When `ContributionDashboardPage.tsx` was moved into `src/pages/`, its relative imports to `../components/Dashboard/FlagRow` broke immediately. Rather than patch the paths and have the same problem happen again the next time a file moves, path aliases were configured project-wide. This was a deliberate, permanent fix â€” not a workaround.

**The aliases configured:**

| Alias | Resolves to |
|---|---|
| `@components/*` | `src/components/*` |
| `@pages/*` | `src/pages/*` |
| `@theme/*` | `src/theme/*` |
| `@types/*` | `src/types/*` |
| `@hooks/*` | `src/hooks/*` |
| `@contexts/*` | `src/contexts/*` |

**How to use them in any file:**

```ts
// Before (fragile â€” breaks when files move)
import { pathscribeTheme } from "../../theme/pathscribeTheme";
import FlagRow from "../components/Dashboard/FlagRow";

// After (stable â€” never needs updating when files move)
import { pathscribeTheme } from "@theme/pathscribeTheme";
import FlagRow from "@components/Dashboard/FlagRow";
```

**How it works:**  
`tsconfig.json` tells TypeScript how to resolve the aliases so VS Code intellisense, type checking, and go-to-definition all work correctly. `vite.config.ts` tells Vite's bundler how to resolve the same aliases at build time. Both must stay in sync â€” if you add a new alias, it must be added to both files or one tool will work and the other will not.

**Migrating existing files:**  
Existing files with relative imports do not need to be migrated all at once. The old relative paths and the new aliases coexist without conflict. The recommended approach is to update imports file-by-file as each file is touched for other work. Do not mix both styles within a single file.

**After any change to `tsconfig.json` or `vite.config.ts`:**  
Stop and restart the dev server (`Ctrl+C` then `npm run dev`). Vite does not hot-reload config file changes.


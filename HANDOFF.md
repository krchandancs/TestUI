# pathscribe AI â€” Developer Handoff
**Version:** March 2026 Â· Synoptic Template Editor sprint  
**Prepared for:** Dev / QA team  
**Contact:** [your name / email]

---

## Quick Start

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

Login with any credentials (auth is mocked). Navigate to **Configuration â†’ Synoptic Library**.

---

## What Was Built This Sprint

The Synoptic Template Editor â€” a full lifecycle management system for pathology reporting templates. Admins can build, review, approve, and publish structured synoptic reporting checklists aligned to governing bodies (CAP, RCPath, ICCR, Custom).

### Key features delivered
- **Template builder** (`SynopticEditor.tsx`) â€” drag-and-drop sections/fields, SNOMED/ICD coding, conditional visibility (branching logic), version management, navigation guard for unsaved changes
- **Review workflow** (`TemplateRenderer.tsx`) â€” lifecycle transitions with source-aware terminology (CAP uses Accept/Release, RCPath uses Ratify/Publish, etc.)
- **Review queue** (`ReviewQueueSection.tsx`) â€” grouped by category, status badges, click-to-navigate
- **localStorage persistence bridge** â€” all lifecycle transitions survive page reloads during mock phase (see Architecture below)
- **Audit log** â€” every transition, field edit, and reset is logged to `ps_audit_log_v1` including reviewer notes
- **Governing bodies config** (`GoverningBodiesSection.tsx`) â€” super-admin configuration

---

## Files Changed This Sprint

All changed files are in `src/`. Deploy paths below are relative to project root.

### Core protocol UI
| File | Deploy path | Notes |
|------|-------------|-------|
| `protocolShared.tsx` | `src/components/Config/Protocols/protocolShared.tsx` | PROTOCOL_REGISTRY, useProtocols hook, localStorage bridge functions |
| `index.tsx` (Protocols) | `src/components/Config/Protocols/index.tsx` | Reads `?section=` from URL â€” do not overwrite with old version |
| `ActiveProtocolsSection.tsx` | `src/components/Config/Protocols/ActiveProtocolsSection.tsx` | |
| `ReviewQueueSection.tsx` | `src/components/Config/Protocols/ReviewQueueSection.tsx` | Click navigates to renderer, no inline expand |
| `AllProtocolsSection.tsx` | `src/components/Config/Protocols/AllProtocolsSection.tsx` | |
| `SynopticEditor.tsx` | `src/components/Config/Protocols/SynopticEditor.tsx` | Full template builder |

### Review / renderer
| File | Deploy path | Notes |
|------|-------------|-------|
| `TemplateRenderer.tsx` | `src/components/Config/Templates/TemplateRenderer.tsx` | Loads from registry, source-aware terminology, wired to templateService |

### Services
| File | Deploy path | Notes |
|------|-------------|-------|
| `templateService.ts` | `src/services/templates/templateService.ts` | Mock-first service, mutates PROTOCOL_REGISTRY, saves to localStorage |

### Pages
| File | Deploy path | Notes |
|------|-------------|-------|
| `ConfigurationPage.tsx` | `src/pages/ConfigurationPage.tsx` | `handleTabChange` now calls `navigate()` â€” critical for URL-based section routing |

### Communications
| File | Deploy path | Notes |
|------|-------------|-------|
| `src/services/communications/` | (whole folder) | Email notification infrastructure â€” not yet wired to backend |

### System config
| File | Deploy path | Notes |
|------|-------------|-------|
| `GoverningBodiesSection.tsx` | `src/components/Config/System/GoverningBodiesSection.tsx` | |
| `index.tsx` (System) | `src/components/Config/System/index.tsx` | Adds Governing Bodies to System sidebar |

### Types / hooks
| File | Deploy path | Notes |
|------|-------------|-------|
| `SynopticAuditEvents.ts` | `src/types/SynopticAuditEvents.ts` | |
| `useSynopticAudit.ts` | `src/hooks/useSynopticAudit.ts` | |

---

## Architecture Notes

### Single source of truth
`PROTOCOL_REGISTRY` in `protocolShared.tsx` is the only data store for protocol metadata. `templateService.ts` imports and mutates it directly. Components read from it via the `useProtocols()` hook which subscribes to change notifications.

```
templateService.upsertRegistry()
  â†’ mutates PROTOCOL_REGISTRY
  â†’ saves patch to localStorage (ps_registry_overrides_v1)
  â†’ calls notifyRegistryChanged()
  â†’ useProtocols() listeners re-render components
```

### localStorage bridge (mock phase only)
On module load, `protocolShared.tsx` reads `ps_registry_overrides_v1` and merges saved overrides into the mock array. This means lifecycle transitions survive page reloads without a backend.

**Remove this when the backend API is wired:**
1. Delete the hydration block in `protocolShared.tsx` (clearly marked with a TODO comment)
2. Remove the `saveRegistryOverride()` call in `templateService.upsertRegistry()`
3. Replace with `GET /api/templates` on mount

### URL-driven navigation
Section state lives in the URL, not in React state:
- `/configuration?tab=protocols&section=review` â†’ Review Queue
- `/configuration?tab=protocols&section=active` â†’ Active Protocols
- `/configuration?tab=protocols&section=all` â†’ All Protocols

`ConfigurationPage.handleTabChange` **must** call `navigate()` not `setActiveTab()` â€” this was the root cause of several back-navigation bugs this sprint.

### Source-aware terminology
`TemplateRenderer` derives button labels from `template.source` at runtime via `getTerms()` and `getTransitionActions()`. No hardcoded "Approve"/"Publish" strings in JSX â€” all flow through these functions.

---

## Known Issues / Not Yet Wired

| Area | Status | Notes |
|------|--------|-------|
| Backend API | Mock only | All `templateService` functions have `// â”€â”€ REAL â”€â”€` stubs ready to swap in |
| Auth context | Placeholder | `reviewedBy` hardcoded as `'Dr. Reviewer'` â€” replace with `useAuth().user.name` |
| Email notifications | Infrastructure ready | `synopticNotificationService.ts` built, needs `POST /api/notifications/email` endpoint |
| Governing bodies save | UI only | Needs `POST /api/config/governing-bodies` wired |
| Template content persistence | Mock DCIS template | `TemplateRenderer` uses `mockDcisTemplate` for section/question content â€” needs backend |
| TemplateRenderer audit | Partial | `logEvent()` calls in place, `useSynopticAudit` hook built but not yet swapped in |

---

## Backend Endpoints Needed

```
POST   /api/notifications/email
GET    /api/users?roles=admin,clinical_lead
GET    /api/templates/:id/owner
POST   /api/templates                        (upsert draft)
GET    /api/templates                        (list, optional ?status= filter)
GET    /api/templates/:id                    (full detail)
POST   /api/templates/:id/submit
POST   /api/templates/:id/approve
POST   /api/templates/:id/publish
POST   /api/templates/:id/request-changes
POST   /api/templates/:id/resubmit
DELETE /api/templates/:id                    (drafts only)
GET    /api/config/governing-bodies
POST   /api/config/governing-bodies
```

---

## Files to be Aware Of (Not Changed, But Related)

- `src/Legacy/` â€” superseded components, kept for reference only, not imported anywhere in current app
- `src/types/App.tsx` â€” appears misplaced (a `.tsx` in `/types`), not imported anywhere, safe to remove
- `src/components/Config/Templates/TemplatesTab.tsx` and `AdminTemplateList.tsx` â€” legacy template review UI, superseded by the Protocols workflow but still wired in `App.tsx` at `/template-review` route

---

## Fresh Test State

Before testing, clear localStorage in DevTools â†’ Application â†’ Local Storage:

```javascript
// Paste in DevTools Console to reset everything
localStorage.removeItem('ps_registry_overrides_v1');
localStorage.removeItem('ps_audit_log_v1');
location.reload();
```

Expected Review Queue after reset:
- **2 In Review:** Liver Biopsy â€” Medical (Native), Placenta â€” Term Delivery
- **1 Needs Changes:** Lung â€” Small Cell Carcinoma
- **0 Approved**
- **5 Active Protocols:** Breast DCIS, Breast Invasive, Colon Resection, Prostatectomy, Lung Adenocarcinoma

See `pathscribe_TesterGuide_v3.docx` for full test plans.

---

## Project Structure (src/ only)

```
src/
â”œâ”€â”€ App.tsx                        # Routes
â”œâ”€â”€ pages/
â”‚   â””â”€â”€ ConfigurationPage.tsx      # Tab routing â€” must use navigate() not setActiveTab()
â”œâ”€â”€ components/Config/
â”‚   â”œâ”€â”€ Protocols/                 # â† Main sprint deliverable
â”‚   â”‚   â”œâ”€â”€ index.tsx              # Orchestrator, reads ?section= from URL
â”‚   â”‚   â”œâ”€â”€ protocolShared.tsx     # Registry, types, hooks, modals
â”‚   â”‚   â”œâ”€â”€ ActiveProtocolsSection.tsx
â”‚   â”‚   â”œâ”€â”€ ReviewQueueSection.tsx
â”‚   â”‚   â”œâ”€â”€ AllProtocolsSection.tsx
â”‚   â”‚   â””â”€â”€ SynopticEditor.tsx     # Template builder
â”‚   â”œâ”€â”€ Templates/
â”‚   â”‚   â””â”€â”€ TemplateRenderer.tsx   # Review/lifecycle UI
â”‚   â””â”€â”€ System/
â”‚       â”œâ”€â”€ index.tsx
â”‚       â””â”€â”€ GoverningBodiesSection.tsx
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ templates/
â”‚   â”‚   â””â”€â”€ templateService.ts     # Mock-first, swap for API when ready
â”‚   â””â”€â”€ communications/            # Email notification infrastructure
â”œâ”€â”€ types/
â”‚   â”œâ”€â”€ AuditEvent.ts
â”‚   â””â”€â”€ SynopticAuditEvents.ts
â””â”€â”€ hooks/
    â””â”€â”€ useSynopticAudit.ts
```


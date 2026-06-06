# pathscribe CSS Refactor â€” Migration Guide

## What's been delivered

### New CSS files
| File | Purpose |
|------|---------|
| `src/index.css` | Global reset, Inter font, CSS tokens (:root variables), scrollbars, animations |
| `src/pathscribe.css` | Shared component classes for all repeating patterns |

### Fully refactored (inline styles â†’ CSS classes)
| File | Before | After |
|------|--------|-------|
| `NavBar.tsx` | 21 | ~4 |
| `AppShell.tsx` | 84 | ~35 |
| `CasePanel.tsx` | 28 | ~12 |
| `CasePreviewDrawer.tsx` | 29 | ~25 |
| `FlagManagerModal.tsx` | 88 | ~65 |
| `WorklistPage.tsx` | 46 | ~34 |
| `Home.tsx` | 64 | ~56 |

### CSS import added (ready for class migration)
All 74 TSX files now import `pathscribe.css`. The import is a no-op until 
className attributes are added â€” no visual regressions.

---

## How to continue the migration

### Step 1 â€” Replace page shells
Any component with this pattern:
```tsx
<div style={{ position: 'relative', width: '100vw', height: '100vh', 
  backgroundColor: '#0b1120', display: 'flex', flexDirection: 'column' }}>
```
Becomes:
```tsx
<div className="ps-page">
```

### Step 2 â€” Replace modal overlays
```tsx
// Before
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
  backdropFilter: 'blur(10px)', zIndex: 9000, display: 'flex', 
  alignItems: 'center', justifyContent: 'center' }}>

// After
<div className="ps-overlay" style={{ zIndex: 9000 }}>
```

### Step 3 â€” Replace action modal shells
```tsx
// Before
<div style={{ background: 'white', borderRadius: '20px', 
  border: '1px solid #e2e8f0', boxShadow: '0 25px 50px...' }}>

// After
<div className="ps-modal ps-modal-lg">
```

### Step 4 â€” Replace research panels
```tsx
// Before
<div style={{ background: '#0b1120', borderRadius: '18px', 
  border: '1px solid rgba(148,163,184,0.4)', ... }}>

// After
<div className="ps-research-modal" style={{ width: '960px' }}>
```

### Step 5 â€” Replace buttons
```tsx
// Primary
<button className="ps-btn-primary">Save</button>

// Secondary / Cancel
<button className="ps-btn-secondary">Cancel</button>

// Destructive
<button className="ps-btn-danger">Delete</button>

// Ghost teal (research mode)
<button className="ps-btn-ghost-teal">Refine Search</button>

// Filter tab
<button className={`ps-filter-tab${active ? ' active' : ''}`}>All Cases</button>
```

### Step 6 â€” Replace badges
```tsx
<span className="ps-badge ps-badge-teal">Draft Ready</span>
<span className="ps-badge ps-badge-red">Urgent</span>
<span className="ps-badge ps-badge-amber">Pending</span>
<span className="ps-badge ps-badge-green">Finalized</span>
```

### Step 7 â€” Replace config tables
```tsx
<table className="config-table">
  <thead><tr><th>Name</th><th>Status</th></tr></thead>
  <tbody>
    <tr>
      <td>Client Name</td>
      <td>
        <button className="config-row-action edit">Edit</button>
        <button className="config-row-action delete">Delete</button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## CSS tokens available (use in remaining inline styles)
```css
var(--ps-teal)           /* #0891B2 */
var(--ps-teal-light)     /* #1ab8e0 */
var(--ps-navy-base)      /* #0b1120 */
var(--ps-navy-left)      /* #0d1829 */
var(--ps-navy-right)     /* #0a1628 */
var(--ps-text-primary)   /* #f1f5f9 */
var(--ps-text-secondary) /* #94a3b8 */
var(--ps-text-muted)     /* #6b7f99 */
var(--ps-border-dark)    /* rgba(51,65,85,0.9) */
var(--ps-border-bright)  /* rgba(82,102,128,0.9) */
var(--ps-grad-header)    /* top-left sky blue radial */
var(--ps-grad-left)      /* deep blue radial */
var(--ps-grad-right)     /* dark teal radial */
var(--ps-radius-lg)      /* 18px */
var(--ps-radius-xl)      /* 20px */
var(--ps-shadow-modal)   /* action mode modal shadow */
var(--ps-shadow-research)/* research mode shadow */
```

---

## Files requiring full refactor (Phase 2)
These files have high inline density and dynamic styles that need 
manual review before class extraction:

| File | Inline count | Notes |
|------|-------------|-------|
| `SynopticReportPage.tsx` | 503 | Largest file â€” dedicated sprint |
| `SynopticEditor.tsx` | 181 | Protocol editor |
| `SearchPage.tsx` | 149 | Search results |
| `SubspecialtiesSection.tsx` | 91 | Admin config |
| `ClientDictionary.tsx` | 72 | Already has CSS import |
| `ContributionDashboardPage.tsx` | 78 | Dashboard charts |
| `AuditLogPage.tsx` | 77 | Audit tables |
| `Users/index.tsx` | 69 | User management |
| `RoleDictionary.tsx` | 67 | Role config |

**Note:** Dynamic styles (computed widths, conditional colours based on 
runtime values like confidence scores or similarity percentages) should 
STAY inline â€” they cannot be extracted to static CSS classes.


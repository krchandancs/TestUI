# pathscribe AI â€” Documentation

> **Start here.** This file is the index for all pathscribe documentation.
> If you're new to the project, read the docs in the order listed under Reference.

---

## Folder Structure

```
docs/
â”œâ”€â”€ README.md                                â† you are here
â”‚
â”œâ”€â”€ reference/                               â† master docs, always current
â”‚   â”œâ”€â”€ PS-01_Master_Architecture.docx
â”‚   â”œâ”€â”€ PS-02_Admin_Configuration_Guide.docx
â”‚   â”œâ”€â”€ PS-03_Module_Glossary_ERD.docx
â”‚   â””â”€â”€ PS-04_Product_Roadmap.docx
â”‚
â”œâ”€â”€ modules/                                 â† per-feature docs
â”‚   â””â”€â”€ search/
â”‚       â”œâ”€â”€ SearchPage_EndUser_Guide.docx
â”‚       â”œâ”€â”€ SearchPage_Testing_Guide.docx
â”‚       â””â”€â”€ SearchPage_Developer_Reference.docx
â”‚
â””â”€â”€ specs/                                   â† engineering design specs
    â”œâ”€â”€ synoptic_library_datamodel.docx
    â”œâ”€â”€ synoptic_library_erd.mermaid
    â”œâ”€â”€ lis_integration_spec.docx
    â”œâ”€â”€ qc_module_spec.docx
    â”œâ”€â”€ use_permission_spec.docx
    â”œâ”€â”€ architecture_reservation.docx
    â””â”€â”€ qc_module_prototype.html
```

---

## Reference Docs

These four documents are the authoritative source of truth for pathscribe.
They are always kept current. If anything in here is outdated, it gets updated â€” not supplemented.

| # | Document | Audience | What it covers |
|---|----------|----------|----------------|
| PS-01 | [Master Architecture & System Overview](reference/PS-01_Master_Architecture.docx) | Engineering | Repository structure, service layer pattern, all 17 service domains, path aliases, SystemConfig fields, terminology architecture, role/permission model, deployment modes, design conventions |
| PS-02 | [System Administration Guide](reference/PS-02_Admin_Configuration_Guide.docx) | Lab Administrators | Staff vs physicians, roles, every Configuration tab, LIS settings, jurisdiction, identifier formats, flags, specimen dictionary, client dictionary, audit log, full action ID reference |
| PS-03 | [Module Glossary & Entity Reference](reference/PS-03_Module_Glossary_ERD.docx) | Engineering / Onboarding | Every core entity with key fields and design rationale, every module with its primary files, key patterns glossary (prewired, session restore, physician snapshot, Big Four, etc.) |
| PS-04 | [Product Roadmap & Feature Status](reference/PS-04_Product_Roadmap.docx) | Product & Engineering | Phase gates (ðŸŸ¢ðŸ”µðŸŸ£â¸ðŸ”’), Phase 1 Co-Pilot scope, QC module status, prewired architecture, regulatory holds with CLIA/FDA citations, Phase 2 prerequisites, outstanding engineering items |

---

## Module Docs

Per-feature documentation. Each module has three docs: end user, testing, and developer reference.
New modules get their own subfolder under `modules/`.

### Case Search

| Document | Audience | What it covers |
|----------|----------|----------------|
| [End User Guide](modules/search/SearchPage_EndUser_Guide.docx) | Pathologists, residents, lab staff | Every filter, smart identifier box, saving searches, configuring identifier formats |
| [Testing Guide](modules/search/SearchPage_Testing_Guide.docx) | QA | 10 test plans, mock data setup, regression checklist, known mock limitations |
| [Developer Reference](modules/search/SearchPage_Developer_Reference.docx) | Engineering | File map, FilterState, smart identifier detection, session persistence, modal architecture, troubleshooting |

---

## Engineering Specs

Design and specification documents. These may be drafts â€” they are inputs to building,
not final delivered truth. The reference docs above reflect what was actually built.

| File | Status | What it covers |
|------|--------|----------------|
| [synoptic_library_datamodel.docx](specs/synoptic_library_datamodel.docx) | ðŸŸ¢ Build Now | Complete relational data model for the Synoptic Library â€” all entities, fields, relationships, AI confidence schema, validation rules, immutable versioning |
| [synoptic_library_erd.mermaid](specs/synoptic_library_erd.mermaid) | ðŸŸ¢ Build Now | Entity-relationship diagram for the Synoptic Library â€” render with any Mermaid viewer |
| [lis_integration_spec.docx](specs/lis_integration_spec.docx) | ðŸŸ¢ Build Now | LIS Integration Layer engineering spec â€” adapter pattern, HL7/FHIR protocols, event bus, Clinisys/CoPath Phase 1 priority |
| [qc_module_spec.docx](specs/qc_module_spec.docx) | ðŸ”µ Spec Complete | QC Module UI specification â€” dashboard, worklists, peer review, CAP/CLIA compliance reporting |
| [qc_module_prototype.html](specs/qc_module_prototype.html) | ðŸ”µ Spec Complete | Interactive HTML prototype of the QC Module UI |
| [use_permission_spec.docx](specs/use_permission_spec.docx) | ðŸŸ¢ Next Sprint | usePermission hook engineering spec â€” role + deployment_mode + module gating, SSO resolution |
| [architecture_reservation.docx](specs/architecture_reservation.docx) | ðŸŸ£ Prewired | Prewiring commitments for Standalone LIS and Cytology QC â€” what stubs exist and what must not be built yet |

---

## Retired Documents

The following documents have been superseded and should not be used as reference.
Their content has been absorbed into the documents above.

| Retired file | Superseded by | Reason |
|---|---|---|
| `pathscribe-Admin-Guide.docx` | PS-02 | Reorganised and updated â€” role model, config sections, action IDs all revised |
| `pathscribe-Terminology-Architecture.docx` | PS-01 Â§6 | Terminology architecture absorbed into Master Architecture |
| `revised_roadmap.docx` | PS-04 | Replaced by current roadmap with up-to-date phase status |
| `SearchPage_UserGuide.docx` | modules/search/EndUser Guide | Earlier version â€” identifier box and SNOMED modal redesigned since |
| `SearchPage_TestPlan.docx` | modules/search/Testing Guide | Earlier version â€” mock data setup and new test plans not included |
| `HANDOFF.md` | PS-01, PS-03 | Session handoff content â€” theme token migration and Dashboard folder architecture absorbed |
| `HANDOFF_2026-02-27.txt` | PS-01, PS-02, PS-04 | Session handoff content â€” shortcuts, fonts, protocol merge, import fixes absorbed |
| `DEPLOYMENT_MANIFEST.txt` | PS-01 Â§3 | File manifest replaced by structured service layer table in Master Architecture |
| `product_mode_definition.docx` | PS-01 Â§1, PS-04 | Deployment mode decision absorbed into Master Architecture and Roadmap |
| `lient-dictionary-integration_md.ts` | `src/context/useClientDictionary.ts` | This is source code, not a doc â€” place in the codebase if not already there |
| `System Changes Summary for Developm...` | PS-01â€“04 | âš ï¸ Not reviewed â€” verify content before retiring. If it's a recent session changelog, content should be in PS-04 Â§6 (Outstanding Items) |

---

## Rules for Keeping This Current

1. **Reference docs are always current.** When something changes in the codebase, the relevant PS-0x doc gets updated in the same PR or sprint.
2. **Module docs follow the feature.** When a module is significantly changed, all three of its docs (end user, testing, developer) are updated together.
3. **Specs stay in specs/.** A spec is never edited to reflect what was actually built â€” that's what the reference docs are for.
4. **New modules get a folder.** `modules/worklist/`, `modules/synoptic/`, `modules/qc/` etc. â€” each with the same three-doc pattern.
5. **Retire explicitly.** Don't delete old docs â€” move them to a `retired/` folder and add a row to the table above.
6. **This README is the index.** If a doc exists but isn't listed here, it doesn't officially exist.


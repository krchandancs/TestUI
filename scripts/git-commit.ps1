# ─────────────────────────────────────────────────────────────────────────────
# PathScribe AI — Git Commit & Push Script  (Session 6)
# Save to: C:\Users\nimmo\Documents\pathscribe-ai\git-commit.ps1
# Run from repo root AFTER git-stage.ps1: .\git-commit.ps1
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[PathScribe] Committing Session 6...`n" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Not in a git repository." -ForegroundColor Red
    exit 1
}

git commit -m "feat: template system fixes, countersign workflow, demo reset (Session 6)

TEMPLATE SYSTEM - Bug fixes and new CAP templates
- Fixed skin_melanoma_bx.json: converted from CAP protocol-wrapper format
  {protocol:{sections:{SPECIMEN:[...]}}} to standard {sections:[{id,title,fields:[]}]}
  which caused 'Cannot read properties of undefined (reading length)' crash on MEL case
- Added prostate_resection.json: built from CAP v4.3.0.0 Word doc (Sep 2023),
  AJCC 8th Ed, 7 sections, 29 fields - correct template for Tuthill RP cases
- Added lung_resection.json: built from CAP v5.1.0.0 Word doc (Sep 2025),
  AJCC 9th Ed with pN2a/pN2b split and pM1c1/pM1c2, 7 sections, 31 fields
- Fixed all missing options:[] on text/numeric fields (caused options.forEach crash)
- Added all three templates to PROTOCOL_REGISTRY in protocolShared.tsx
- Added editorStore fallback in getTemplate() for templates not in registry

TEMPLATE ID FIXES - mockCaseService cross-reference audit
- Fixed 4 cases using wrong templateIds: colorectal_resection, lung_resection,
  prostate_radical, skin_invasive_melanoma_biopsy - all now resolve correctly
- All 12 templateIds verified against PROTOCOL_REGISTRY and editorStore

AI SUGGESTION FIELD ID FIXES - Tuthill cases
- Tuthill prostate RP (MPA26-1003): removed orphaned gleason_primary,
  gleason_secondary, surgical_margins; fixed grade_group value to 'gg2_3_4_7';
  fixed seminal_vesicle_invasion to 'sv_not_identified'; added full staging
  suggestions including pT3a, pN0, margin_status, margins_involved, ln_number_examined
- Tuthill lung (HFHS26-1004): replaced lymphovascular_invasion with stas;
  fixed ln_examined to ln_number_examined (numeric); fixed tumor_size to
  tumor_size_invasive_cm to match lung_resection template field IDs

COUNTERSIGN WORKFLOW - Full end-to-end implementation
- SynopticReportPage: handleFinalizeConfirm detects requiresCountersign flag;
  sets case/synoptic to 'pending-countersign' via setCaseData, sends in-app
  notification to attending via messageService.send() with optimistic setMessages()
  update so message badge increments immediately
- Amber banner shown when requiresCountersign and status === 'pending-countersign'
- Countersign modal: legal attestation warning, password entry (21 CFR Part 11),
  calls countersignSynoptic(), records countersignedBy and countersignedAt
- useMessaging() wired correctly via MessagingContext; messageService from @/services
- WorklistPage: Countersign filter now correctly shows only pending-countersign cases
- mockCaseService: MFT26-8802 seeded as pending-countersign for immediate demo

DEMO RESET - Config page integration
- New DemoResetTab at Config > Demo Reset
- Two-step confirmation prevents accidental wipes
- Clears 20+ localStorage keys: cases, messages, action registry, AI behavior,
  protocol overrides, AI feedback, delegations, claims, biometric session,
  routing config, participation types, worklist sort, per-case comments
- Does NOT clear: login credentials, biometric enrolment, theme preference
- Auto-reloads after reset so mock services reseed from MOCK_CASES

FILES CHANGED
src/data/templates/CAP/skin_melanoma_bx.json          (rebuilt - format fix)
src/data/templates/CAP/prostate_resection.json         (new - CAP v4.3.0.0)
src/data/templates/CAP/lung_resection.json             (new - CAP v5.1.0.0)
src/components/Config/Protocols/protocolShared.tsx     (registry entries added)
src/components/Config/System/DemoResetTab.tsx          (new component)
src/services/templates/templateService.ts              (imports, seeds, fallback)
src/services/cases/mockCaseService.ts                  (template IDs, AI suggestions)
src/pages/SynopticReportPage/SynopticReportPage.tsx    (countersign workflow)
src/pages/WorklistPage.tsx                             (countersign filter fix)
src/pages/ConfigurationPage.tsx                        (demo reset tab wired)"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Commit failed. Check git status." -ForegroundColor Red
    exit 1
}

Write-Host "`n[PathScribe] Pushing to origin...`n" -ForegroundColor Cyan
git push origin HEAD

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[PathScribe] Session 6 pushed successfully.`n" -ForegroundColor Green
} else {
    Write-Host "`nERROR: Push failed. Check your remote and credentials." -ForegroundColor Red
}

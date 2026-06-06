# ─────────────────────────────────────────────────────────────────────────────
# PathScribe AI — Git Stage Script  (Session 6)
# Save to: C:\Users\nimmo\Documents\pathscribe-ai\git-stage.ps1
# Run from repo root: .\git-stage.ps1
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[PathScribe] Staging Session 6 changes...`n" -ForegroundColor Cyan

# Verify we are in the right place
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Not in a git repository. cd to your repo root first." -ForegroundColor Red
    exit 1
}

# CAP Template JSON files
git add "src/data/templates/CAP/skin_melanoma_bx.json"
git add "src/data/templates/CAP/prostate_resection.json"
git add "src/data/templates/CAP/lung_resection.json"
Write-Host "  + CAP templates (melanoma rebuild, prostate RP v4.3, lung v5.1)" -ForegroundColor Green

# Protocol registry and template service
git add "src/components/Config/Protocols/protocolShared.tsx"
git add "src/services/templates/templateService.ts"
Write-Host "  + Protocol registry + template service" -ForegroundColor Green

# Mock case service
git add "src/services/cases/mockCaseService.ts"
Write-Host "  + mockCaseService (template IDs, AI suggestion field IDs)" -ForegroundColor Green

# Countersign workflow
git add "src/pages/SynopticReportPage/SynopticReportPage.tsx"
git add "src/pages/WorklistPage.tsx"
Write-Host "  + Countersign workflow" -ForegroundColor Green

# Demo reset
git add "src/components/Config/System/DemoResetTab.tsx"
git add "src/pages/ConfigurationPage.tsx"
Write-Host "  + Demo reset tab" -ForegroundColor Green

Write-Host ""
git status
Write-Host "`n[PathScribe] Review above, then run: .\git-commit.ps1`n" -ForegroundColor Cyan

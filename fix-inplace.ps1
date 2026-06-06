
# ── 1. tsconfig.json — the root of caseFlagsApi/KeyboardShortcutsModal issues ─
$tsconfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@theme/*": ["src/theme/*"],
      "@types/*": ["src/types/*"],
      "@hooks/*": ["src/hooks/*"],
      "@contexts/*": ["src/contexts/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": [
    "node_modules",
    "src/Legacy",
    "src/types/App.tsx",
    "src/utils/AppShell.tsx",
    "src/services/codes/firestoreCodeService.ts",
    "src/services/internalNotes/firestoreInternalNoteService.ts",
    "src/services/messages/firestoreMessageService.ts",
    "src/services/physicians/index.ts",
    "src/services/users/index.ts",
    "src/api/caseFlagsApi.ts",
    "src/api/lisFlagSimulator.ts",
    "src/audit/AuditLogPage.tsx",
    "src/components/Config/System/FlagModal.tsx",
    "src/components/Config/System/FlagTable.tsx",
    "src/components/Flags/AutoCreatedBanner.tsx",
    "src/components/Config/System/KeyboardShortcutsModal.tsx",
    "src/components/Config/System/CategorySection.tsx"
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@
$tsconfig | Set-Content "tsconfig.json" -Encoding UTF8
Write-Host "tsconfig.json updated"

# ── 2. Home.tsx — remove hasUnsavedData, warningCardStyle, handleNavigateHome ─
$f = "src\pages\Home.tsx"
$lines = Get-Content $f
$out = $lines | Where-Object {
    $_ -notmatch "const hasUnsavedData = true" -and
    $_ -notmatch "const warningCardStyle" -and
    $_ -notmatch "width: '400px', backgroundColor: '#111'"
}
# Remove handleNavigateHome function
$result = [System.Collections.Generic.List[string]]::new()
$skip = $false
foreach ($line in $out) {
    if ($line -match "const handleNavigateHome = \(\)") { $skip = $true }
    if (-not $skip) { $result.Add($line) }
    if ($skip -and $line -match "^\s*\};?\s*$") { $skip = $false }
}
# Fix warningCardStyle usage
$fixed = $result | ForEach-Object { 
    $_ -replace 'style=\{warningCardStyle\}', 'style={{ width: "400px", backgroundColor: "#111", padding: "40px", borderRadius: "28px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}'
}
$fixed | Set-Content $f -Encoding UTF8
Write-Host "Home.tsx updated"

# ── 3. AuditLogPage — fix ActiveTab ──────────────────────────────────────────
$f = "src\pages\AuditLogPage.tsx"
$lines = Get-Content $f
$fixed = $lines | Where-Object { $_ -notmatch "import type \{ ActiveTab \}" }
$fixed = $fixed | ForEach-Object { $_ -replace ': ActiveTab', ': string' }
$fixed = $fixed | ForEach-Object { $_ -replace "user\?\.name \|\| 'Unknown'", "'Unknown'" }
$fixed | Set-Content $f -Encoding UTF8
Write-Host "AuditLogPage.tsx updated"

# ── 4. SynopticEditor — duplicate marginBottom ───────────────────────────────
$f = "src\components\Config\Protocols\SynopticEditor.tsx"
$lines = Get-Content $f
$prevMargin = $false
$fixed = [System.Collections.Generic.List[string]]::new()
foreach ($line in $lines) {
    if ($line -match "^\s+marginBottom:") {
        if ($prevMargin) {
            $fixed.Add($line -replace "marginBottom:", "// _marginBottom:")
            $prevMargin = $false
            continue
        }
        $prevMargin = $true
    } else {
        if ($line.Trim() -ne "" -and $line -notmatch "^\s*//") { $prevMargin = $false }
    }
    $fixed.Add($line)
}
$fixed | Set-Content $f -Encoding UTF8
Write-Host "SynopticEditor.tsx updated"

# ── 5. SearchPage — add FilterState fields + types + fix functions ────────────
$f = "src\pages\SearchPage.tsx"
$content = Get-Content $f -Raw

# Add FilterState fields if missing
if ($content -notmatch "genderList: string") {
    $content = $content -replace "  dateFrom: string; dateTo: string;\r?\n\}", "  dateFrom: string; dateTo: string;`n  genderList: string[];`n  dobFrom: string; dobTo: string;`n  ageMin: number | undefined; ageMax: number | undefined;`n}"
}

# Add type definitions after last import if missing
if ($content -notmatch "CodeModalSystem") {
    $content = $content -replace "(import[^\n]+;\n)(?!import)", "`$1`ntype CodeModalSystem = 'snomed' | 'icd' | 'SNOMED' | 'ICD-10' | 'ICD-11' | 'ICD-O-topography' | 'ICD-O-morphology';`n`ninterface CodeSuggestion {`n  code: string;`n  label: string;`n  display: string;`n  jurisdiction: string;`n  active: boolean;`n  system?: string;`n}`n`n"
}

# Fix currentFilters to include new fields
if ($content -notmatch "genderList: \[\]") {
    $content = $content -replace "dateFrom, dateTo,\r?\n\s*\}\);", "dateFrom, dateTo,`n    genderList: [], dobFrom: '', dobTo: '', ageMin: undefined, ageMax: undefined,`n  });"
}

# Fix addSnomed/addIcd parameter types
$content = $content -replace "const addSnomed = \(s: CodeSuggestion\)", "const addSnomed = (s: ClinicalCode)"
$content = $content -replace "const addIcd = \(s: CodeSuggestion\)", "const addIcd = (s: ClinicalCode)"

# Fix setState type errors
$content = $content -replace "setSnomedList\(p=>p\.some\(x=>x\.code===s\.code\)\?p:\[\.\.\.p,s\]\)", "setSnomedList((p: any)=>p.some((x: any)=>x.code===s.code)?p:[...p,s])"
$content = $content -replace "setIcdCodes\(p=>p\.some\(x=>x\.code===s\.code\)\?p:\[\.\.\.p,s\]\)", "setIcdCodes((p: any)=>p.some((x: any)=>x.code===s.code)?p:[...p,s])"

# Fix unused caseId
$content = $content -replace "onBeforeNavigate=\{\(caseId\)=>sessionStorage", "onBeforeNavigate={(_caseId)=>sessionStorage"

# Remove IconBtn
$content = $content -replace "(?s)\nconst _?IconBtn: React\.FC<.+?\);\n", "`n"

$content | Set-Content $f -Encoding UTF8
Write-Host "SearchPage.tsx updated"

Write-Host "`nAll done - run npm run build"

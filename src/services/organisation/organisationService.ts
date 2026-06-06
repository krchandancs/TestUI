// src/services/organisation/organisationService.ts
// ─────────────────────────────────────────────────────────────
// Organisation, Site, and Lab service.
//
// MOCK PHASE (current):
//   Returns realistic mock data. Components wire against these
//   interfaces — no changes needed when backend is ready.
//
// REAL PHASE (when backend is ready):
//   Replace each function body with the corresponding fetch() call.
//   See API_CONTRACT.md Section 10 for full endpoint documentation.
// ─────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────

export type OrganisationType =
  | 'nhs_trust'
  | 'nhs_foundation_trust'
  | 'nhs_integrated_care_board'
  | 'private_hospital'
  | 'health_system'
  | 'independent_lab';

export type LisType =
  | 'WinPath' | 'Telepath' | 'Epic' | 'CoPath' | 'Beaker' | 'Other';

export type WorkflowMode = 'copilot' | 'orchestration';

export type TemplateStandard = 'CAP' | 'RCPath';
export type CodingSystem = 'SNOMED' | 'ICD10' | 'ICD11' | 'LOINC' | 'ICDO' | 'CPT' | 'OPCS4';

export interface Organisation {
  id:            string;
  name:          string;
  shortName:     string;
  type:          OrganisationType;
  country:       'UK' | 'US' | 'AU' | 'CA';
  locale:        string;
  timezone:      string;
  contractStart: string;
  contractTier:  'starter' | 'professional' | 'enterprise';
  active:        boolean;
  sites?:        Site[];
  labs?:         Lab[];
}

export interface Site {
  id:                      string;
  organisationId:          string;
  name:                    string;
  shortName:               string;
  siteCode:                string;   // accession prefix from LIS
  address:                 string;
  active:                  boolean;
  lisType:                 LisType;
  lisEndpoint:             string;
  lisVersion?:             string;
  defaultTemplateStandard: TemplateStandard;
  defaultLocale:           string;
  defaultWorkflowMode:     WorkflowMode;
  codingSystems:           CodingSystem[];   // ordered list — first is default tab
  secureEmailGateway?:     'Paubox' | 'Virtru' | 'Zix';
}

export interface Lab {
  id:             string;
  siteId:         string;
  organisationId: string;
  name:           string;
  subspecialties: string[];
  pathologistIds: string[];
  poolIds:        string[];
}

// ─── Mock Data ────────────────────────────────────────────────

const MOCK_ORGANISATIONS: Organisation[] = [
  {
    id: 'ORG-DVMC',
    name: 'Desert Valley Medical Center',
    shortName: 'DVMC',
    type: 'health_system',
    country: 'US',
    locale: 'en-US',
    timezone: 'America/Phoenix',
    contractStart: '2025-01-01',
    contractTier: 'professional',
    active: true,
    sites: [
      {
        id: 'SITE-DVMC-MAIN',
        organisationId: 'ORG-DVMC',
        name: 'Desert Valley Medical Center — Main Campus',
        shortName: 'DVMC',
        siteCode: 'S',
        address: '1234 Desert Blvd, Phoenix, AZ 85001',
        active: true,
        lisType: 'CoPath',
        lisEndpoint: 'hl7://lis.dvmc.org:2575',
        defaultTemplateStandard: 'CAP',
        defaultLocale: 'en-US',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'LOINC', 'CPT'],
        secureEmailGateway: 'Paubox',
      },
    ],
    labs: [
      {
        id: 'LAB-DVMC-PATH',
        siteId: 'SITE-DVMC-MAIN',
        organisationId: 'ORG-DVMC',
        name: 'Anatomic Pathology',
        subspecialties: ['Breast', 'GI', 'GU', 'Lung', 'Derm', 'Neuro'],
        pathologistIds: ['PATH-001', 'PATH-002', 'PATH-003', 'PATH-004', 'PATH-005'],
        poolIds: ['POOL-GI', 'POOL-DERM'],
      },
    ],
  },
  {
    id: 'ORG-MFT',
    name: 'Manchester University NHS Foundation Trust',
    shortName: 'MFT',
    type: 'nhs_foundation_trust',
    country: 'UK',
    locale: 'en-GB',
    timezone: 'Europe/London',
    contractStart: '2026-01-01',
    contractTier: 'enterprise',
    active: true,
    sites: [
      {
        id: 'SITE-MRI',
        organisationId: 'ORG-MFT',
        name: 'Manchester Royal Infirmary',
        shortName: 'MRI',
        siteCode: 'MFT',
        address: 'Oxford Road, Manchester, M13 9WL',
        active: true,
        lisType: 'WinPath',
        lisEndpoint: 'hl7://lis.mft.nhs.uk:2575',
        defaultTemplateStandard: 'RCPath',
        defaultLocale: 'en-GB',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'OPCS4', 'LOINC'],
      },
      {
        id: 'SITE-WYTH',
        organisationId: 'ORG-MFT',
        name: 'Wythenshawe Hospital',
        shortName: 'WYT',
        siteCode: 'MFT',
        address: 'Southmoor Road, Manchester, M23 9LT',
        active: true,
        lisType: 'WinPath',
        lisEndpoint: 'hl7://lis.mft.nhs.uk:2575',
        defaultTemplateStandard: 'RCPath',
        defaultLocale: 'en-GB',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'OPCS4', 'LOINC'],
      },
      {
        id: 'SITE-NMGH',
        organisationId: 'ORG-MFT',
        name: 'North Manchester General Hospital',
        shortName: 'NMGH',
        siteCode: 'MFT',
        address: 'Delaunays Road, Manchester, M8 5RB',
        active: true,
        lisType: 'WinPath',
        lisEndpoint: 'hl7://lis.mft.nhs.uk:2575',
        defaultTemplateStandard: 'RCPath',
        defaultLocale: 'en-GB',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'OPCS4', 'LOINC'],
      },
    ],
    labs: [
      {
        id: 'LAB-MFT-CELL',
        siteId: 'SITE-MRI',
        organisationId: 'ORG-MFT',
        name: 'Cellular Pathology',
        subspecialties: ['GI', 'Breast', 'GU', 'Uropathology', 'Gynaecology', 'Skin', 'Head & Neck'],
        pathologistIds: ['PATH-UK-001', 'PATH-UK-002'],
        poolIds: ['POOL-GI-UK', 'POOL-URO-UK'],
      },
    ],
  },
  {
    id: 'ORG-MPA',
    name: 'Midwest Pathology Associates',
    shortName: 'MPA',
    type: 'independent_lab',
    country: 'US',
    locale: 'en-US',
    timezone: 'America/Chicago',
    contractStart: '2026-04-01',
    contractTier: 'professional',
    active: true,
    sites: [
      {
        id: 'SITE-MPA-MAIN',
        organisationId: 'ORG-MPA',
        name: 'Midwest Pathology Associates — Chicago',
        shortName: 'MPA',
        siteCode: 'MPA',
        address: '200 E Illinois St, Chicago, IL 60611',
        active: true,
        lisType: 'CoPath',
        lisEndpoint: 'hl7://lis.midwestpath.com:2575',
        defaultTemplateStandard: 'CAP',
        defaultLocale: 'en-US',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'LOINC', 'CPT'],
        secureEmailGateway: 'Paubox',
      },
    ],
    labs: [
      {
        id: 'LAB-MPA-PATH',
        siteId: 'SITE-MPA-MAIN',
        organisationId: 'ORG-MPA',
        name: 'Surgical Pathology',
        subspecialties: ['Breast', 'GI', 'GU', 'Gynecologic', 'Lung'],
        pathologistIds: ['PATH-US-001'],
        poolIds: ['POOL-GYN-MPA'],
      },
    ],
  },
  {
    id: 'ORG-HFHS',
    name: 'Henry Ford Health System',
    shortName: 'HFHS',
    type: 'health_system',
    country: 'US',
    locale: 'en-US',
    timezone: 'America/Detroit',
    contractStart: '2026-04-01',
    contractTier: 'enterprise',
    active: true,
    sites: [
      {
        id: 'SITE-HFHS-MAIN',
        organisationId: 'ORG-HFHS',
        name: 'Henry Ford Hospital — Main Campus',
        shortName: 'HFH',
        siteCode: 'HFHS',
        address: '2799 W Grand Blvd, Detroit, MI 48202',
        active: true,
        lisType: 'CoPath',
        lisEndpoint: 'hl7://lis.henryford.org:2575',
        defaultTemplateStandard: 'CAP',
        defaultLocale: 'en-US',
        defaultWorkflowMode: 'copilot',
        codingSystems: ['SNOMED', 'ICD10', 'ICDO', 'LOINC', 'CPT'],
        secureEmailGateway: 'Paubox',
      },
    ],
    labs: [
      {
        id: 'LAB-HFHS-PATH',
        siteId: 'SITE-HFHS-MAIN',
        organisationId: 'ORG-HFHS',
        name: 'Department of Pathology',
        subspecialties: ['Breast', 'GI', 'GU', 'Lung', 'Gynecologic', 'Neuropathology', 'Hematopathology'],
        pathologistIds: ['PATH-US-001', 'PATH-US-002'],
        poolIds: ['POOL-GYN-US'],
      },
    ],
  },
];

// ─── In-memory lookup ─────────────────────────────────────────

const ORG_BY_ID   = new Map(MOCK_ORGANISATIONS.map(o => [o.id, o]));
const SITE_BY_ID  = new Map(
  MOCK_ORGANISATIONS.flatMap(o => o.sites ?? []).map(s => [s.id, s])
);
const SITE_BY_CODE = new Map(
  MOCK_ORGANISATIONS.flatMap(o => o.sites ?? []).map(s => [s.siteCode, s])
);

// ─── Service functions ────────────────────────────────────────

const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

/** GET /organisations */
export async function listOrganisations(): Promise<Organisation[]> {
  await delay();
  return MOCK_ORGANISATIONS;
  // REAL: const res = await fetch('/api/organisations'); return res.json();
}

/** GET /organisations/:id */
export async function getOrganisation(id: string): Promise<Organisation | null> {
  await delay();
  return ORG_BY_ID.get(id) ?? null;
  // REAL: const res = await fetch(`/api/organisations/${id}`); return res.json();
}

/** GET /organisations/current — resolves from auth token */
export async function getCurrentOrganisation(organisationId: string): Promise<Organisation | null> {
  await delay();
  return ORG_BY_ID.get(organisationId) ?? null;
  // REAL: const res = await fetch('/api/organisations/current'); return res.json();
}

/** GET /sites/:id/config */
export async function getSiteConfig(siteId: string): Promise<Site | null> {
  await delay();
  return SITE_BY_ID.get(siteId) ?? null;
  // REAL: const res = await fetch(`/api/sites/${siteId}/config`); return res.json();
}

/** Resolve site from accession prefix (siteCode) */
export function getSiteBySiteCode(siteCode: string): Site | null {
  return SITE_BY_CODE.get(siteCode) ?? null;
}

/** Resolve organisation from originHospitalId on a Case */
export function getOrganisationByHospitalId(hospitalId: string): Organisation | null {
  // Legacy field mapping — hospitalId maps to organisationId in new model
  const legacyMap: Record<string, string> = {
    'HOSP-001':  'ORG-DVMC',
    'HOSP-MFT':  'ORG-MFT',
    'HOSP-MPA':  'ORG-MPA',
    'HOSP-HFHS': 'ORG-HFHS',
  };
  const orgId = legacyMap[hospitalId];
  return orgId ? (ORG_BY_ID.get(orgId) ?? null) : null;
}

/** Get display name for a hospital ID (used in UI until full migration) */
export function getOrganisationDisplayName(hospitalId?: string | null): string | null {
  if (!hospitalId) return null;
  const org = getOrganisationByHospitalId(hospitalId);
  return org?.name ?? null;
}

/** Get short name for a hospital ID */
export function getOrganisationShortName(hospitalId?: string | null): string | null {
  if (!hospitalId) return null;
  const org = getOrganisationByHospitalId(hospitalId);
  return org?.shortName ?? null;
}

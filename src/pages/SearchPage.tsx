type CodeModalSystem = 'snomed' | 'icd' | 'SNOMED' | 'ICD-10' | 'ICD-11' | 'ICD-O-topography' | 'ICD-O-morphology';

import React, { useState, useEffect, useRef } from 'react';
import '../pathscribe.css';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@hooks/useLogout';
import WorklistTable from '../components/Worklist/WorklistTable';
import { caseService, codeService } from '../services';
import type { PathologyCase, CaseFilterParams, ClinicalCode } from '../services';
import { LookupModal, LookupSearch, LookupItem, LookupSection, LookupEmpty } from '../components/Common/LookupModal';
// Extended component — adds onClear prop until LookupModal.tsx is updated
const LookupModalX = LookupModal as React.ComponentType<React.ComponentProps<typeof LookupModal> & { onClear?: () => void; onDone?: () => void }>;
import { useSpecimenDictionary } from '../components/Config/System/useSpecimenDictionary';
import type { SpecimenEntry } from '../components/Config/System/specimenTypes';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { useBreadcrumb }   from '../contexts/BreadcrumbContext';
import { mockActionRegistryService } from '../services/actionRegistry/mockActionRegistryService';
import { normalizeAccession } from '../utils/normalizeAccession';
import { VOICE_CONTEXT } from '../constants/systemActions';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const toDateString = (d: Date): string => d.toISOString().split('T')[0];
const today   = (): string => toDateString(new Date());
const daysAgo = (n: number): string => { const d = new Date(); d.setDate(d.getDate() - n); return toDateString(d); };
const fmtDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
};

// â”€â”€â”€ localStorage / sessionStorage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LS_KEY = 'pathscribe:savedSearches';
const lsLoad = (): SavedSearch[] => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };
const lsSave = (s: SavedSearch[]) => { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} };

const SS_KEY = 'pathscribe:lastSearch';
interface LastSearchSnapshot { filters: FilterState; results: PathologyCase[]; hasSearched: boolean; }
const ssLoad  = (): LastSearchSnapshot | null => { try { const r = sessionStorage.getItem(SS_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const ssSave  = (s: LastSearchSnapshot) => { try { sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch {} };
const ssClear = () => { try { sessionStorage.removeItem(SS_KEY); } catch {} };

// â”€â”€â”€ Specimen dictionary (used for inline typeahead only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Full specimen list lives in mockSpecimenService ”” this is just for the
// search field suggestions until that service is wired to this page.
const SPECIMEN_DICTIONARY = [
  'Left Breast Mastectomy','Right Breast Mastectomy','Right Breast Lumpectomy','Left Breast Lumpectomy',
  'Right Hemicolectomy','Left Hemicolectomy','Radical Prostatectomy','Left Lower Lobe Lobectomy',
  'Right Upper Lobe Lobectomy','Total Thyroidectomy','Partial Thyroidectomy',
  'Cholecystectomy','Appendectomy','Partial Nephrectomy','Radical Nephrectomy',
  'Total Hysterectomy','Wide Local Excision','Axillary Node Dissection',
  'TURBT Specimen','Endocervical Curettage','Cervical Cone Biopsy',
  'Sentinel Lymph Node Biopsy','Core Needle Biopsy Breast','Prostate Biopsy Cores',
];

// â”€â”€â”€ SNOMED/ICD inline data removed ”” now served by codeService â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// See src/services/codes/mockCodeService.ts

// â”€â”€â”€ Synoptics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SynopticTemplate { id: string; name: string; organ: string; category: string; templateId: string; }
const ALL_SYNOPTICS: SynopticTemplate[] = [
  // Breast
  { id:'p01', templateId:'breast_invasive',            name:'CAP Breast Invasive Carcinoma', organ:'Breast',      category:'Breast'      },
  { id:'p02', templateId:'breast_dcis_resection',      name:'CAP Breast DCIS',               organ:'Breast DCIS', category:'Breast'      },
  // GI — alphabetical by organ
  { id:'p05', templateId:'appendix',                   name:'CAP Appendix',                  organ:'Appendix',    category:'GI'          },
  { id:'p03', templateId:'colon_resection',            name:'CAP Colon Resection',           organ:'Colon',       category:'GI'          },
  { id:'p04', templateId:'rcpath_colorectal_resection',name:'CAP Rectum Resection',          organ:'Rectum',      category:'GI'          },
  // GU — alphabetical by organ
  { id:'p09', templateId:'bladder_resection',          name:'CAP Bladder Resection',         organ:'Bladder',     category:'GU'          },
  { id:'p08', templateId:'kidney_resection',           name:'CAP Kidney Resection',          organ:'Kidney',      category:'GU'          },
  { id:'p06', templateId:'prostate_resection',         name:'CAP Prostatectomy',             organ:'Prostate',    category:'GU'          },
  { id:'p07', templateId:'prostate_needle_biopsy',     name:'CAP Prostate Biopsy',           organ:'Prostate Bx', category:'GU'          },
  // Thoracic
  { id:'p10', templateId:'lung_adeno',                 name:'CAP Lung Resection',            organ:'Lung',        category:'Thoracic'    },
  { id:'p11', templateId:'mesothelioma',               name:'CAP Mesothelioma',              organ:'Pleura',      category:'Thoracic'    },
  // Endocrine — alphabetical
  { id:'p13', templateId:'adrenal',                    name:'CAP Adrenal',                   organ:'Adrenal',     category:'Endocrine'   },
  { id:'p12', templateId:'thyroid_malignant',          name:'CAP Thyroid',                   organ:'Thyroid',     category:'Endocrine'   },
  // Gynaecology — alphabetical
  { id:'p15', templateId:'cervix_resection',           name:'CAP Cervix Resection',          organ:'Cervix',      category:'Gynaecology' },
  { id:'p14', templateId:'endometrium_biopsy',         name:'CAP Endometrium',               organ:'Uterus',      category:'Gynaecology' },
  { id:'p16', templateId:'ovary',                      name:'CAP Ovary',                     organ:'Ovary',       category:'Gynaecology' },
  // Skin — alphabetical
  { id:'p17', templateId:'melanoma_resection',         name:'CAP Melanoma',                  organ:'Skin',        category:'Skin'        },
  { id:'p18', templateId:'skin_scc',                   name:'CAP Squamous Cell Carcinoma',   organ:'Skin SCC',    category:'Skin'        },
  // Bone/Soft — alphabetical
  { id:'p20', templateId:'bone',                       name:'CAP Bone',                      organ:'Bone',        category:'Bone/Soft'   },
  { id:'p19', templateId:'soft_tissue',                name:'CAP Soft Tissue',               organ:'Soft Tissue', category:'Bone/Soft'   },
  // Haem
  { id:'p22', templateId:'hodgkin_lymphoma',           name:'CAP Hodgkin Lymphoma',          organ:'Lymphoma',    category:'Haem'        },
  { id:'p21', templateId:'lymph_node',                 name:'CAP Lymph Node',                organ:'Lymph Node',  category:'Haem'        },
];

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface UserStub { id: string; name: string; client: string; }
const ALL_PATHOLOGISTS: UserStub[] = [
  { id:'PATH-RB-001', name:'Dr. Rossana Babakhani', client:'Riverview Health System'      },
  { id:'PATH-UK-001', name:'Dr. Paul Carter',        client:'Manchester Foundation Trust'  },
  { id:'PATH-US-001', name:'Dr. Rachel Kim',         client:'Midwest Pathology Associates' },
  { id:'PATH-001',    name:'Dr. Pete Nimmo',         client:'Riverview Health System'      },
  { id:'PATH-UK-002', name:'Dr. Oliver Pemberton',   client:'Manchester Foundation Trust'  },
  { id:'PATH-US-002', name:'Dr. Marcus Thompson',    client:'Midwest Pathology Associates' },
];
const ALL_ATTENDINGS: UserStub[] = [
  // Sorted alphabetically by last name — sourced from requestingProvider values in mock case data
  { id:'att-7',  name:'Dr. Nathan Briggs',     client:'Metro General Hospital'       },
  { id:'att-11', name:'Dr. Amanda Chen',       client:'Metro General Hospital'       },
  { id:'att-6',  name:'Dr. Sarah Chen',        client:'Metro General Hospital'       },
  { id:'att-18', name:'Dr. Michelle Foster',   client:'Metro General Hospital'       },
  { id:'att-19', name:'Dr. Nancy Graves',      client:'Metro General Hospital'       },
  { id:'att-1',  name:'Dr. Mazen Iskandar',    client:'Henry Ford Health System'     },
  { id:'att-23', name:'Dr. Carolyn Johnston',  client:'Metro General Hospital'       },
  { id:'att-16', name:'Dr. Lisa Kaminski',     client:'Henry Ford Health System'     },
  { id:'att-14', name:'Dr. Helen Marsden',     client:'Manchester Foundation Trust'  },
  { id:'att-17', name:'Dr. Mani Menon',        client:'Henry Ford Health System'     },
  { id:'att-5',  name:'Dr. Patricia Moore',    client:'Metro General Hospital'       },
  { id:'att-21', name:'Dr. Priya Nair',        client:'Metro General Hospital'       },
  { id:'att-15', name:'Dr. Kevin Ng',          client:'Metro General Hospital'       },
  { id:'att-12', name:'Dr. James Nguyen',      client:'Metro General Hospital'       },
  { id:'att-26', name:'Dr. James Orringer',    client:'Henry Ford Health System'     },
  { id:'att-20', name:'Dr. Patricia Owens',    client:'Metro General Hospital'       },
  { id:'att-4',  name:'Dr. James Park',        client:'Metro General Hospital'       },
  { id:'att-22', name:'Dr. Susan Park',        client:'Metro General Hospital'       },
  { id:'att-8',  name:'Dr. Harvey Pass',       client:'Henry Ford Health System'     },
  { id:'att-9',  name:'Dr. Anil Sharma',       client:'Metro General Hospital'       },
  { id:'att-13', name:'Dr. Karen Shapiro',     client:'Metro General Hospital'       },
  { id:'att-2',  name:'Mr. Peter Thornton',    client:'Manchester Foundation Trust'  },
  { id:'att-3',  name:'Dr. Michael Torres',    client:'Riverside Medical Center'     },
  { id:'att-24', name:'Mr. David Whitmore',    client:'Manchester Foundation Trust'  },
  { id:'att-25', name:'Mr. James Whitfield',   client:'Manchester Foundation Trust'  },
  { id:'att-10', name:'Dr. Lisa Wong',         client:'Metro General Hospital'       },
];

// â”€â”€â”€ Flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Sorted alphabetically. 'STAT' (shorthand) catches all STAT-prefixed flags via name-contains
// matching in the service. The PRIORITY → STAT chip in the sidebar filters by case priority;
// these flag entries target case-level flag badges on the case card.
const ALL_FLAGS = [
  'Actionable Mutation — Oncology Alert',
  'Amended Report',
  'Awaiting Attending Sign-off',
  'BRAF V600E Positive',
  'BRCA1 Pathogenic Variant',
  'Close Margin — 3mm',
  'Colorectal MDT — Mon 13:00',
  'Colorectal MDT — Wed 14:00',
  'ER/PR/HER2 Pending',
  'Frozen Section',
  'Frozen Section Pending',
  'Geriatric Patient — 100y',
  'Gleason Upgrade from Bx',
  'Gynaecology Oncology',
  'IHC Panel (PD-L1)',
  'KRAS Result — Oncology Notified',
  'Melanoma MDT',
  'MMR IHC Panel',
  'Molecular Panel',
  'Molecular Profiling',
  'Oncology Awaiting Report',
  'Oncology Treatment on Hold',
  'OR Awaiting Result',
  'Pending Clinical Correlation',
  'Positive Surgical Margin',
  'PSMA IHC — Positive',
  'Second Opinion — MDT Review',
  'Second Opinion Requested',
  'Sentinel Node Positive — Completion Dissection?',
  'STAT',                                   // broad shorthand — matches any STAT-prefixed flag
  'STAT — Intraoperative Frozen Section',
  'STAT — Rush Processing',
  'Thoracic MDT — Fri 09:00',
  'Thyroid MDT',
  'Tumor Board — Thu 14:00',
  'Tumour Perforation — pT4',
  'Urology MDT',
  'Urology MDT — Fri 09:00',
  'VHL Mutation',
];

// Sorted alphabetically. Names in the top group match actual specimenFlag names in mock data
// (the sf.name === code check in the client-side filter will return results for these).
// Lower group are real clinical tests — currently no demo cases, but correctly named for future data.
const ALL_COMP_FLAGS = [
  // ── Have matching cases in mock data ──────────────────────────────────────
  'BRAF V600E',
  'ER/PR/HER2',
  'HER2 FISH',
  'IHC Panel (PD-L1)',
  'MMR IHC Panel',
  'Molecular Panel',
  'Molecular Profiling',
  'VHL Mutation',
  // ── Standard clinical tests (no demo cases yet) ───────────────────────────
  'ALK',
  'EGFR',
  'Flow Cytometry',
  'Ki-67',
  'KRAS/NRAS',
  'MSI/MMR',
  'PD-L1 (22C3)',
  'ROS1',
  'TMB',
];

const ALL_CLIENTS = [
  { id:'c4', name:'Bayview Memorial'                 },
  { id:'c8', name:'Henry Ford Health System'         },
  { id:'c6', name:'Manchester Foundation Trust'      },
  { id:'c1', name:'Metro General Hospital'           },
  { id:'c7', name:'Midwest Pathology Associates'     },
  { id:'c2', name:'Riverside Medical Center'         },
  { id:'c5', name:"St. Catherine's Medical Centre"   },
  { id:'c3', name:'Westside Community Hospital'      },
];

const CASE_STATUS_OPTIONS = ['draft','in-progress','pending','pending-review','pending-countersign','finalized','pool','amended'] as const;
const PRIORITY_OPTIONS    = ['Routine','STAT'] as const;

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FilterState {
  patientName: string; hospitalId: string; accessionNo: string;
  diagnosisList: string[]; specimenList: string[];
  snomedList: ClinicalCode[]; icdCodes: ClinicalCode[];
  synopticIds: string[]; flagsList: string[];
  pathologistIds: string[]; attendingIds: string[];
  submittingNames: string[]; statusList: string[]; priorityList: string[];
  dateFrom: string; dateTo: string;
  genderList: string[];
  dobFrom: string; dobTo: string;
  ageMin: number | undefined; ageMax: number | undefined;
}
interface SavedSearch { id: string; name: string; filters: FilterState; createdAt: string; }

// â”€â”€â”€ English summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const buildSummary = (f: FilterState): string => {
  const parts: string[] = [];
  if (f.dateFrom || f.dateTo) parts.push(`accession ${fmtDate(f.dateFrom)||'…'} — ${fmtDate(f.dateTo)||'today'}`);
  if (f.patientName)           parts.push(`patient "${f.patientName}"`);
  if (f.accessionNo)           parts.push(`accession "${f.accessionNo}"`);
  if (f.hospitalId)            parts.push(`MRN "${f.hospitalId}"`);
  if (f.specimenList.length)   parts.push(`specimen: ${f.specimenList.join(', ')}`);
  if (f.diagnosisList.length)  parts.push(`diagnosis: ${f.diagnosisList.join(', ')}`);
  if (f.snomedList.length)   parts.push(`SNOMED: ${f.snomedList.map(s=>s.code).join(', ')}`);
  if (f.icdCodes.length)     parts.push(`ICD: ${f.icdCodes.map(s=>`${s.system}:${s.code}`).join(', ')}`);
  if (f.statusList.length)     parts.push(`status: ${f.statusList.join(', ')}`);
  if (f.genderList?.length)    parts.push(`gender: ${f.genderList.join(', ')}`);
  if (f.dobFrom || f.dobTo)    parts.push(`DOB: ${f.dobFrom||'…'} â†’ ${f.dobTo||'…'}`);
  if (f.ageMin !== undefined || f.ageMax !== undefined) parts.push(`age: ${f.ageMin??'0'}—${f.ageMax??'âˆž'}yrs`);
  if (f.priorityList.length)   parts.push(`priority: ${f.priorityList.join(', ')}`);
  if (f.flagsList.length)      parts.push(`flags: ${f.flagsList.join(', ')}`);
  if (f.synopticIds.length)    parts.push(`synoptic: ${f.synopticIds.map(id=>ALL_SYNOPTICS.find(t=>t.id===id)?.organ??id).join(', ')}`);
  if (f.pathologistIds.length) parts.push(`pathologist: ${f.pathologistIds.map(id=>ALL_PATHOLOGISTS.find(u=>u.id===id)?.name??id).join(', ')}`);
  if (f.attendingIds.length)   parts.push(`attending: ${f.attendingIds.map(id=>ALL_ATTENDINGS.find(u=>u.id===id)?.name??id).join(', ')}`);
  return parts.length===0 ? 'Showing all cases' : 'Showing cases with '+parts.join(' · ');
};

// â”€â”€â”€ Virtual scroll wrapper removed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WorklistTable manages its own internal scroll and incremental row loading.
// Passing cases directly is sufficient.

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Chip: React.FC<{ label: string; onRemove: () => void; title?: string; accent?: string }> = ({ label, onRemove, title, accent='#0891B2' }) => (
  <span title={title} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:999,
    background:`${accent}33`, border:`1px solid ${accent}80`, fontSize:11, color:'#e2e8f0', cursor:'default' }}>
    {label}
    <button type="button" onClick={e=>{ e.preventDefault(); e.stopPropagation(); onRemove(); }} style={{ border:'none', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:14, lineHeight:1, padding:0, display:'flex', alignItems:'center' }}
      onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>×</button>
  </span>
);

const CheckPill: React.FC<{ label: string; checked: boolean; onChange: () => void; accent?: string }> = ({ label, checked, onChange, accent='#0891B2' }) => (
  <button type="button" onClick={onChange} style={{
    display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999,
    cursor:'pointer', fontSize:11, fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap' as const,
    background: checked ? `${accent}22` : 'rgba(15,23,42,0.5)',
    border:`1px solid ${checked ? accent : 'rgba(148,163,184,0.2)'}`,
    color: checked ? '#f1f5f9' : '#cbd5e1',
  }}>
    <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:checked?accent:'transparent', border:`1.5px solid ${checked?accent:'#64748b'}` }} />
    {label}
  </button>
);

// SectionLabel: clear by default, vivid cyan when active
const SectionLabel: React.FC<{ title: string; active?: boolean }> = ({ title, active=false }) => (
  <div style={{
    fontSize:10, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.7px',
    color: active ? '#7dd3fc' : '#94a3b8',
    transition:'color 0.15s',
  }}>{title}</div>
);

// Browse button ”” opens lookup modal, sits inline with input
const BrowseBtn: React.FC<{ onClick: () => void; count?: number }> = ({ onClick, count }) => (
  <button type="button" onClick={onClick} style={{
    display:'inline-flex', alignItems:'center', gap:3, padding:'5px 10px', borderRadius:7,
    border:'1px solid rgba(8,145,178,0.45)', background:'rgba(8,145,178,0.08)',
    color:'#7dd3fc', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
    whiteSpace:'nowrap' as const, flexShrink:0,
  }}
    onMouseEnter={e=>{e.currentTarget.style.background='rgba(8,145,178,0.18)'; e.currentTarget.style.borderColor='rgba(8,145,178,0.7)';}}
    onMouseLeave={e=>{e.currentTarget.style.background='rgba(8,145,178,0.08)'; e.currentTarget.style.borderColor='rgba(8,145,178,0.45)';}}>
    {count ? `Browse (${count})` : 'Browse'}
  </button>
);

const DROPDOWN_STYLE: React.CSSProperties = {
  position:'absolute', top:'100%', left:0, right:0, marginTop:3,
  background:'#020617', borderRadius:8, border:'1px solid rgba(148,163,184,0.35)',
  maxHeight:180, overflowY:'auto', zIndex:60, boxShadow:'0 8px 24px rgba(0,0,0,0.7)',
};
const DROP_BTN: React.CSSProperties = {
  width:'100%', textAlign:'left', padding:'6px 10px',
  border:'none', background:'transparent', color:'#e5e7eb', fontSize:12, cursor:'pointer',
};

// â”€â”€â”€ LookupModal and content components imported from Common/LookupModal â”€â”€â”€â”€â”€â”€
// LookupModal, LookupSearch, LookupItem, LookupSection, LookupEmpty

// â”€â”€â”€ Synoptic lookup content (local ”” synoptics are search-page-specific) â”€â”€â”€â”€â”€

const SynopticLookupContent: React.FC<{ selected: string[]; onToggle: (id: string) => void }> = ({ selected, onToggle }) => {
  const [q, setQ] = useState('');
  const categories = Array.from(new Set(ALL_SYNOPTICS.map(s => s.category)));
  const filtered = q.length < 1 ? ALL_SYNOPTICS : ALL_SYNOPTICS.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || s.organ.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <LookupSearch value={q} onChange={setQ} placeholder="Search protocols…" />
      {q.length < 1
        ? categories.map(cat => {
            const items = ALL_SYNOPTICS.filter(s => s.category === cat);
            return (
              <div key={cat}>
                <LookupSection label={cat} count={items.length} />
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:'8px 24px' }}>
                  {items.map(s => {
                    const sel = selected.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => onToggle(s.id)} style={{
                        padding:'5px 12px', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:500,
                        background: sel ? 'rgba(8,145,178,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sel ? '#0891B2' : 'rgba(255,255,255,0.1)'}`,
                        color: sel ? '#7dd3fc' : '#94a3b8', transition:'all 0.12s',
                      }}>{s.organ}</button>
                    );
                  })}
                </div>
              </div>
            );
          })
        : <>
            {filtered.length === 0
              ? <LookupEmpty query={q} />
              : filtered.map(s => (
                  <LookupItem key={s.id} selected={selected.includes(s.id)} onToggle={() => onToggle(s.id)}
                    primary={s.name} secondary={s.category} />
                ))
            }
          </>
      }
    </>
  );
};

// â”€â”€â”€ User lookup content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const UserLookupContent: React.FC<{ users: UserStub[]; selected: string[]; onToggle: (id: string) => void; accent?: string }> = ({ users, selected, onToggle, accent='#0891B2' }) => {
  const [nameQ,   setNameQ]   = useState('');
  const [clientQ, setClientQ] = useState('');

  const filtered = users.filter(u => {
    const matchName   = nameQ.length   < 1 || u.name.toLowerCase().includes(nameQ.toLowerCase());
    const matchClient = clientQ.length < 1 || u.client.toLowerCase().includes(clientQ.toLowerCase());
    return matchName && matchClient;
  });

  const initials = (name: string) => { const p = name.replace(/^(Dr|Mr|Ms|Mrs|Prof|Mx)\.\s*/i,'').split(' ').filter(Boolean); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():p[0]?.[0]?.toUpperCase()??'?'; };

  return (
    <>
      <div style={{ display:'flex', gap:8, padding:'12px 24px 4px' }}>
        <input
          value={nameQ} onChange={e => setNameQ(e.target.value)}
          placeholder="Search by name…"
          style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'7px 12px', fontSize:13, color:'#f1f5f9', outline:'none' }}
        />
        <input
          value={clientQ} onChange={e => setClientQ(e.target.value)}
          placeholder="Search by hospital…"
          style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'7px 12px', fontSize:13, color:'#f1f5f9', outline:'none' }}
        />
      </div>
      {filtered.length === 0
        ? <LookupEmpty query={nameQ || clientQ} />
        : filtered.map(u => {
            const sel = selected.includes(u.id);
            return (
              <LookupItem key={u.id} selected={sel} onToggle={() => onToggle(u.id)}
                primary={u.name}
                secondary={u.client}
                badge={initials(u.name)}
                badgeColor={accent}
              />
            );
          })
      }
    </>
  );
};

// â”€â”€â”€ Flags lookup content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FlagsLookupContent: React.FC<{ selected: string[]; onToggle: (f: string) => void }> = ({ selected, onToggle }) => {
  const [q, setQ] = useState('');
  const filtered = q.length < 1 ? ALL_FLAGS : ALL_FLAGS.filter(f => f.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <LookupSearch value={q} onChange={setQ} placeholder="Search flags…" />
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'4px 24px 20px' }}>
        {filtered.length === 0
          ? <LookupEmpty query={q} />
          : filtered.map(f => {
              const sel = selected.includes(f);
              return (
                <button key={f} type="button" onClick={() => onToggle(f)} style={{
                  padding:'6px 14px', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:500,
                  background: sel ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sel ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                  color: sel ? '#fbbf24' : '#94a3b8', transition:'all 0.12s',
                }}>{f}</button>
              );
            })
        }
      </div>
    </>
  );
};

// â”€â”€â”€ Specimen lookup content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SPECIMEN_TYPES = [
  'Biopsy','Resection','Excision','Cytology','FNA',
  'Molecular','Gross Only','Consult','Autopsy','Other',
] as const;

const SPECIMEN_TYPE_COLOURS: Record<string, string> = {
  'Biopsy':     '#0891B2',
  'Resection':  '#6366F1',
  'Excision':   '#8B5CF6',
  'Cytology':   '#10B981',
  'FNA':        '#F59E0B',
  'Molecular':  '#EC4899',
  'Gross Only': '#64748b',
  'Consult':    '#F97316',
  'Autopsy':    '#EF4444',
  'Other':      '#94a3b8',
};

const CompFlagsLookupContent: React.FC<{ selected: string[]; onToggle: (f: string) => void }> = ({ selected, onToggle }) => {
  const [q, setQ] = useState('');
  const filtered = ALL_COMP_FLAGS.filter(f => q.length < 1 || f.toLowerCase().includes(q.toLowerCase()));
  const abbr = (name: string) => name.replace(/[^A-Z0-9]/g,'').slice(0,3) || name.slice(0,2).toUpperCase();
  return (
    <>
      <div style={{ padding:'12px 24px 4px' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by test name…"
          style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:8, padding:'7px 12px', fontSize:13, color:'#f1f5f9', outline:'none', boxSizing:'border-box' as const }} />
      </div>
      {filtered.length === 0
        ? <LookupEmpty query={q} />
        : filtered.map(f => {
            const sel = selected.includes(f);
            return (
              <LookupItem key={f} selected={sel} onToggle={() => onToggle(f)}
                primary={f}
                secondary="Computational / LIS flag"
                badge={abbr(f)}
                badgeColor="#0891b2"
              />
            );
          })
      }
    </>
  );
};

const ClientLookupContent: React.FC<{ selected: string[]; onToggle: (id: string) => void }> = ({ selected, onToggle }) => {
  const [nameQ, setNameQ] = useState('');
  const filtered = ALL_CLIENTS.filter(c =>
    nameQ.length < 1 || c.name.toLowerCase().includes(nameQ.toLowerCase())
  );
  const abbr = (name: string) => name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <>
      <div style={{ padding:'12px 24px 4px' }}>
        <input value={nameQ} onChange={e => setNameQ(e.target.value)} placeholder="Search by facility name…"
          style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:8, padding:'7px 12px', fontSize:13, color:'#f1f5f9', outline:'none', boxSizing:'border-box' as const }} />
      </div>
      {filtered.length === 0
        ? <LookupEmpty query={nameQ} />
        : filtered.map(c => {
            const sel = selected.includes(c.id);
            return (
              <LookupItem key={c.id} selected={sel} onToggle={() => onToggle(c.id)}
                primary={c.name}
                secondary={c.id.toUpperCase()}
                badge={abbr(c.name)}
                badgeColor="#8b5cf6"
              />
            );
          })
      }
    </>
  );
};

const SpecimenLookupContent: React.FC<{
  specimens: SpecimenEntry[];
  selected:  string[];
  onToggle:  (name: string) => void;
}> = ({ specimens, selected, onToggle }) => {
  const [q,          setQ]          = useState('');
  const [pinnedType, setPinnedType] = useState<string | null>(null);

  const active = specimens.filter(s => s.active);
  const typesInUse = SPECIMEN_TYPES.filter(t => active.some(s => s.type === t));

  // Results driven by search query (no pill filter applied yet)
  const searched = (() => {
    if (q.trim().length < 1) return active;
    const lq = q.trim().toLowerCase();
    return active.filter(s =>
      s.name?.toLowerCase().includes(lq) ||
      s.normalizedLabel?.toLowerCase().includes(lq) ||
      (s.synonyms ?? []).some(syn => syn?.toLowerCase().includes(lq)) ||
      s.type?.toLowerCase().includes(lq) ||
      s.subspecialty?.toLowerCase().includes(lq)
    );
  })();

  // Which types have results right now ”” drives pill highlight
  const matchedTypes = new Set(searched.map(s => s.type));

  // Final display ”” apply pinned filter on top if set
  const displayed = pinnedType ? searched.filter(s => s.type === pinnedType) : searched;

  return (
    <>
      <LookupSearch value={q} onChange={setQ} placeholder="Search by name, procedure, site, or synonym…" />

      {/* Pills ”” always single row, horizontal scroll, highlight = has results */}
      <div style={{ display:'flex', flexWrap:'nowrap', overflowX:'auto', gap:5, padding:'4px 24px 12px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        scrollbarWidth:'none', msOverflowStyle:'none' } as React.CSSProperties}>
        {(['All', ...typesInUse] as const).map(t => {
          const isAll    = t === 'All';
          const colour   = isAll ? '#0891B2' : SPECIMEN_TYPE_COLOURS[t] ?? '#94a3b8';
          const isPinned = isAll ? pinnedType === null : pinnedType === t;
          const hasMatch = isAll ? searched.length > 0 : matchedTypes.has(t);
          const isLit    = hasMatch && (q.trim().length >= 1); // feedback mode when searching
          return (
            <button key={t} type="button"
              onClick={() => setPinnedType(isAll ? null : (pinnedType === t ? null : t))}
              style={{
                flexShrink: 0,
                padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer',
                transition:'all 0.15s',
                background: isPinned || isLit ? `${colour}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isPinned || isLit ? colour : 'rgba(255,255,255,0.1)'}`,
                color: isPinned || isLit ? colour : q.trim().length >= 1 && !hasMatch ? 'rgba(148,163,184,0.35)' : '#94a3b8',
                opacity: q.trim().length >= 1 && !hasMatch && !isAll ? 0.4 : 1,
              }}>
              {t}
            </button>
          );
        })}
      </div>

      {displayed.length === 0
        ? <LookupEmpty query={q || pinnedType || ''} />
        : displayed.map(s => {
            const colour = SPECIMEN_TYPE_COLOURS[s.type] ?? '#94a3b8';
            return (
              <LookupItem
                key={s.id}
                selected={selected.includes(s.name)}
                onToggle={() => onToggle(s.name)}
                primary={s.name}
                secondary={s.subspecialty}
                badge={s.type}
                badgeColor={colour}
              />
            );
          })
      }
    </>
  );
};

// â”€â”€â”€ Unified ICD modal ”” tabs shown only if active in config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type IcdTab = 'ICD-10' | 'ICD-11' | 'ICD-O-topography' | 'ICD-O-morphology';

const IcdModalContent: React.FC<{
  selected:    ClinicalCode[];
  onToggle:    (c: ClinicalCode) => void;
  icd10Active: boolean;
  icd11Active: boolean;
  icdoActive:  boolean;
}> = ({ selected, onToggle, icd10Active, icd11Active, icdoActive }) => {
  const allTabs: { id: IcdTab; label: string; active: boolean }[] = [
    { id:'ICD-10',           label:'ICD-10',           active: icd10Active },
    { id:'ICD-11',           label:'ICD-11',           active: icd11Active },
    { id:'ICD-O-topography', label:'ICD-O  Site',      active: icdoActive  },
    { id:'ICD-O-morphology', label:'ICD-O  Morphology',active: icdoActive  },
  ];
  const visibleTabs = allTabs.filter(t => t.active);
  const [tab, setTab] = useState<IcdTab>(() => visibleTabs[0]?.id ?? 'ICD-10');

  // If active tabs change and current tab is gone, reset to first visible
  useEffect(() => {
    if (!visibleTabs.some(t => t.id === tab)) {
      const first = visibleTabs[0];
      if (first) setTab(first.id);
    }
  }, [icd10Active, icd11Active, icdoActive]);

  if (visibleTabs.length === 0) {
    return (
      <div style={{ padding:'48px 24px', textAlign:'center', color:'#64748b', fontSize:14 }}>
        No ICD systems are enabled.<br />
        <span style={{ fontSize:12 }}>Enable them in Configuration â†’ System Settings.</span>
      </div>
    );
  }

  return (
    <>
      {/* Tab bar ”” only shows active systems */}
      <div style={{ display:'flex', gap:2, padding:'12px 24px 0', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        {visibleTabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            padding:'7px 16px', border:'none', borderRadius:'8px 8px 0 0',
            fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',            background: tab === t.id ? 'rgba(8,145,178,0.15)' : 'transparent',
            color: tab === t.id ? '#7dd3fc' : '#94a3b8',
            borderBottom: `2px solid ${tab === t.id ? '#0891B2' : 'transparent'}`,
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <CodeLookupContent system={tab} selected={selected} onToggle={onToggle} />
    </>
  );
};


// â”€â”€â”€ SNOMED CT modal ”” Big Four axes as tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SnomedAxis = 'Morphology' | 'Body Structure' | 'Procedure' | 'Specimen';

const SNOMED_AXIS_META: { id: SnomedAxis; label: string; accent: string; placeholder: string }[] = [
  { id:'Morphology',     label:'Morphology',     accent:'#8B5CF6', placeholder:'Search pathological changes… e.g. adenocarcinoma' },
  { id:'Body Structure', label:'Body Structure',  accent:'#0891B2', placeholder:'Search anatomical sites… e.g. breast, colon'     },
  { id:'Procedure',      label:'Procedure',       accent:'#10B981', placeholder:'Search diagnostic acts… e.g. biopsy, resection'  },
  { id:'Specimen',       label:'Specimen',        accent:'#F59E0B', placeholder:'Search specimen types… e.g. core needle, smear'  },
];

const SnomedAxisContent: React.FC<{
  axis:     SnomedAxis;
  selected: ClinicalCode[];
  onToggle: (c: ClinicalCode) => void;
}> = ({ axis, selected, onToggle }) => {
  const [q,        setQ]        = useState('');
  const [allCodes, setAllCodes] = useState<ClinicalCode[]>([]);
  const [loading,  setLoading]  = useState(true);

  const meta = SNOMED_AXIS_META.find(m => m.id === axis)!;

  // Reset search when axis tab changes
  useEffect(() => { setQ(''); }, [axis]);

  // Load full axis set once ”” client-side search, no re-fetch on keystroke
  useEffect(() => {
    setLoading(true);
    codeService.search({ system:'SNOMED', category: axis })
      .then(r => { if (r.ok) setAllCodes(r.data); })
      .finally(() => setLoading(false));
  }, [axis]);

  // Stable subgroup list from the full axis set
  const subgroups = Array.from(new Set(
    allCodes.map(c => c.category?.includes('|') ? c.category.split('|')[1] : null).filter(Boolean) as string[]
  ));

  // Displayed results driven purely by search query ”” no pill filter
  const isSearching = q.trim().length >= 1;
  const displayed = isSearching
    ? allCodes.filter(c =>
        c.code.toLowerCase().includes(q.toLowerCase()) ||
        c.display.toLowerCase().includes(q.toLowerCase()) ||
        c.category?.toLowerCase().includes(q.toLowerCase())
      )
    : allCodes;

  // Which subgroups have at least one match ”” drives pill highlight
  const matchedSubgroups = new Set(
    displayed.map(c => c.category?.includes('|') ? c.category.split('|')[1] : null).filter(Boolean) as string[]
  );

  return (
    <>
      <LookupSearch value={q} onChange={setQ} placeholder={meta.placeholder} />
      {loading
        ? <div style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>Loading…</div>
        : <>
            {/* Subgroup filter pills ”” only shown while searching, clickable to narrow results */}
            {isSearching && subgroups.length > 1 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5,
                padding:'4px 24px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {subgroups.map(sg => {
                  const matched = matchedSubgroups.has(sg);
                  return (
                    <button key={sg} type="button" title={`Filter to ${sg}`} style={{
                      flexShrink: 0, cursor: matched ? 'pointer' : 'default',
                      padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600,
                      border:'none', transition:'all 0.15s',
                      background: matched ? `${meta.accent}22` : 'rgba(255,255,255,0.03)',
                      outline: `1px solid ${matched ? meta.accent : 'rgba(255,255,255,0.07)'}`,
                      color: matched ? meta.accent : '#334155',
                    }}>
                      {sg}
                    </button>
                  );
                })}
              </div>
            )}
            {displayed.length === 0
              ? <LookupEmpty query={q} />
              : displayed.map(c => (
                  <LookupItem
                    key={c.code}
                    selected={selected.some(x => x.code === c.code)}
                    onToggle={() => onToggle(c)}
                    primary={c.display}
                    secondary={c.category?.split('|')[1]}
                    badge={c.code}
                    badgeColor={meta.accent}
                  />
                ))
            }
          </>
      }
    </>
  );
};

const SnomedModalContent: React.FC<{
  selected: ClinicalCode[];
  onToggle: (c: ClinicalCode) => void;
}> = ({ selected, onToggle }) => {
  const [axis, setAxis] = useState<SnomedAxis>('Morphology');

  return (
    <>
      {/* Axis tabs */}
      <div style={{ display:'flex', gap:0, padding:'12px 24px 0', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        {SNOMED_AXIS_META.map(m => (
          <button key={m.id} type="button" onClick={() => setAxis(m.id)} style={{
            padding:'7px 18px', border:'none', borderRadius:'8px 8px 0 0',
            fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
            background: axis === m.id ? `${m.accent}18` : 'transparent',
            color: axis === m.id ? m.accent : '#94a3b8',
            borderBottom: `2px solid ${axis === m.id ? m.accent : 'transparent'}`,
          }}>
            {m.label}
          </button>
        ))}
      </div>
      <SnomedAxisContent axis={axis} selected={selected} onToggle={onToggle} />
    </>
  );
};



const CodeLookupContent: React.FC<{
  system:   CodeModalSystem;
  selected: ClinicalCode[];
  onToggle: (c: ClinicalCode) => void;
}> = ({ system, selected, onToggle }) => {
  const [q, setQ] = useState('');
  const [codes, setCodes] = useState<ClinicalCode[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [allCodes,    setAllCodes]    = useState<ClinicalCode[]>([]); // stable full set for pill labels

  const svcSystem  = system === 'SNOMED' ? 'SNOMED' : system === 'ICD-11' ? 'ICD-11' : system.startsWith('ICD-O') ? 'ICD-O' : 'ICD-10';
  const svcSubtype = system === 'ICD-O-topography' ? 'topography' : system === 'ICD-O-morphology' ? 'morphology' : undefined;
  const accent     = system === 'SNOMED' ? '#0891B2' : system === 'ICD-11' ? '#F59E0B' : system.startsWith('ICD-O') ? '#10B981' : '#8B5CF6';

  // Load full set once for stable pill labels
  useEffect(() => {
    codeService.search({ system: svcSystem, subtype: svcSubtype })
      .then(r => { if (r.ok) setAllCodes(r.data); });
  }, [svcSystem, svcSubtype]);

  useEffect(() => {
    setLoading(true);
    codeService.search({ system: svcSystem, subtype: svcSubtype, query: q.length >= 2 ? q : undefined })
      .then(r => { if (r.ok) setCodes(r.data); })
      .finally(() => setLoading(false));
  }, [q, svcSystem, svcSubtype]);

  const allCategories  = Array.from(new Set(allCodes.map(c => c.category ?? 'Other')));
  const matchedCats    = new Set(codes.map(c => c.category ?? 'Other'));
  const isSearching    = q.trim().length >= 1;
  const [activeCat, setActiveCat] = useState<string | null>(null);

  // Apply active category filter on top of search results
  const displayed = activeCat ? codes.filter(c => (c.category ?? 'Other') === activeCat) : codes;

  return (
    <>
      <LookupSearch value={q} onChange={setQ} placeholder={`Search ${system} codes or descriptions…`} />
      {loading
        ? <div style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>Loading…</div>
        : <>
            {/* Category filter pills ”” clickable, wrap, highlight active/matched */}
            {allCategories.length > 1 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5,
                padding:'4px 24px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {allCategories.map(cat => {
                  const isActive  = activeCat === cat;
                  const matched   = !isSearching || matchedCats.has(cat);
                  return (
                    <button key={cat} type="button"
                      onClick={() => setActiveCat(isActive ? null : cat)}
                      style={{
                        flexShrink: 0, cursor: 'pointer', border: 'none',
                        padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:600,
                        transition:'all 0.15s',
                        background: isActive ? accent : matched ? `${accent}22` : 'rgba(255,255,255,0.03)',
                        outline: `1px solid ${isActive ? accent : matched ? accent : 'rgba(255,255,255,0.07)'}`,
                        color: isActive ? '#0f172a' : matched ? accent : '#475569',
                        opacity: isSearching && !matched ? 0.4 : 1,
                      }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
            {displayed.length === 0
              ? <LookupEmpty query={q || activeCat || ''} />
              : displayed.map(c => (
                  <LookupItem
                    key={c.code}
                    selected={selected.some(x => x.code === c.code)}
                    onToggle={() => onToggle(c)}
                    primary={c.display}
                    badge={c.code}
                    badgeColor={accent}
                  />
                ))
            }
          </>
      }
    </>
  );
};


const SearchPage: React.FC = () => {
  const navigate     = useNavigate();
  const handleLogout = useLogout();
  const { pushCrumb } = useBreadcrumb();
  const { dictionary: specimenDictionary } = useSpecimenDictionary();
  const { config } = useSystemConfig();

  const [isLoaded,        setIsLoaded]        = useState(false);
  const [isProfileOpen,   setIsProfileOpen]   = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Lookup modals
  const [snomedModal,    setSnomedModal]    = useState(false);
  const [icdModal,       setIcdModal]       = useState(false);
  const [specimenModal,  setSpecimenModal]  = useState(false);
  const [synopticModal,  setSynopticModal]  = useState(false);
  const [flagsModal,     setFlagsModal]     = useState(false);
  const [pathModal,      setPathModal]      = useState(false);
  const [attendingModal, setAttendingModal] = useState(false);

  // Active section (for label intensity)
  const [activeSection, setActiveSection] = useState('');

  // Filter state
  const [patientName,  setPatientName]  = useState('');
  const [hospitalId,   setHospitalId]   = useState('');
  const [accessionNo,  setAccessionNo]  = useState('');

  // Smart identifier box
  const [identifierQuery, setIdentifierQuery] = useState('');
  type IdentifierType = 'accession' | 'mrn' | 'name' | 'ambiguous' | null;
  const [detectedType, setDetectedType] = useState<IdentifierType>(null);

  const detectIdentifierType = (val: string): IdentifierType => {
    if (!val.trim()) return null;
    const v = val.trim();
    try {
      if (new RegExp(config.identifierFormats.accessionPattern, 'i').test(normalizeAccession(v, config.identifierFormats.accessionPattern))) return 'accession';
      if (new RegExp(config.identifierFormats.mrnPattern).test(v))            return 'mrn';
    } catch { /* invalid regex in config ”” fall through */ }
    // Name heuristic: contains space or comma, OR is a single alphabetic-only word
    const alphaRatio = (v.match(/[a-zA-Z]/g)?.length ?? 0) / v.length;
    if (alphaRatio > 0.6) return 'name'; // pure alphabetic = treat as name
    if ((v.includes(' ') || v.includes(',')) && alphaRatio > 0.5) return 'name';
    return 'ambiguous';
  };

  const applyIdentifier = (val: string, type: IdentifierType) => {
    setPatientName('');  setHospitalId('');  setAccessionNo('');
    if (type === 'accession') setAccessionNo(normalizeAccession(val.trim(), config.identifierFormats.accessionPattern));
    else if (type === 'mrn')  setHospitalId(val.trim());
    else if (type === 'name') setPatientName(val.trim());
    else { // ambiguous ”” populate all three so the search casts wide
      setAccessionNo(val.trim());
      setHospitalId(val.trim());
      setPatientName(val.trim());
    }
  };

  const handleIdentifierChange = (val: string) => {
    setIdentifierQuery(val);
    const type = detectIdentifierType(val);
    setDetectedType(type);
    applyIdentifier(val, type);
  };

  const IDENTIFIER_BADGE: Record<NonNullable<IdentifierType>, { label: string; color: string }> = {
    accession: { label: 'Accession #',  color: '#8B5CF6' },
    mrn:       { label: 'MRN',          color: '#0891B2' },
    name:      { label: 'Patient Name', color: '#10B981' },
    ambiguous: { label: 'All fields',   color: '#F59E0B' },
  };

  const [dateFrom,     setDateFrom]     = useState(daysAgo(30));
  const [dateTo,       setDateTo]       = useState(today());

  const [specimenQuery,       setSpecimenQuery]       = useState('');
  const [specimenList,        setSpecimenList]        = useState<string[]>([]);
  const [specimenSuggestions, setSpecimenSuggestions] = useState<string[]>([]);
  const [showSpecimenDrop,    setShowSpecimenDrop]    = useState(false);
  const specimenRef = useRef<HTMLDivElement|null>(null);

  const [diagnosisText, setDiagnosisText] = useState('');
  const [diagnosisList, setDiagnosisList] = useState<string[]>([]);

  const [snomedQuery,       setSnomedQuery]       = useState('');
  const [snomedList,        setSnomedList]        = useState<ClinicalCode[]>([]);
  const [snomedSuggestions, setSnomedSuggestions] = useState<ClinicalCode[]>([]);
  const [showSnomedDrop,    setShowSnomedDrop]    = useState(false);
  const snomedRef = useRef<HTMLDivElement|null>(null);

  const [icdQuery,       setIcdQuery]       = useState('');
  const [icdCodes,       setIcdCodes]       = useState<ClinicalCode[]>([]);
  const [icdSuggestions, setIcdSuggestions] = useState<ClinicalCode[]>([]);
  const [showIcdDrop,    setShowIcdDrop]    = useState(false);
  const icdRef = useRef<HTMLDivElement|null>(null);

  const [synopticIds,    setSynopticIds]    = useState<string[]>([]);
  const [flagsList,      setFlagsList]      = useState<string[]>([]);
  const [pathologistIds, setPathologistIds] = useState<string[]>([]);
  const [attendingIds,   setAttendingIds]   = useState<string[]>([]);
  const [compFlagsList,  setCompFlagsList]  = useState<string[]>([]);
  const [clientIds,      setClientIds]      = useState<string[]>([]);
  const [compFlagsModal, setCompFlagsModal] = useState(false);
  const [clientModal,    setClientModal]    = useState(false);
  const [submittingNames,setSubmittingNames]= useState<string[]>([]);
  const [statusList,     setStatusList]     = useState<string[]>([]);
  const [priorityList,   setPriorityList]   = useState<string[]>([]);
  // Patient Demographics
  const [genderList,     setGenderList]     = useState<string[]>([]);
  const [dobFrom,        setDobFrom]        = useState('');
  const [dobTo,          setDobTo]          = useState('');
  const [ageMin,         setAgeMin]         = useState('');
  const [ageMax,         setAgeMax]         = useState('');

  const [results,     setResults]     = useState<PathologyCase[]|null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(lsLoad);
  const [activeSavedId, setActiveSavedId] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const saveInputRef = useRef<HTMLInputElement|null>(null);

  // â”€â”€ Effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const returning = sessionStorage.getItem('pathscribe:searchReturn') === '1';
    sessionStorage.removeItem('pathscribe:searchReturn');
    if (!returning) { ssClear(); return; }
    const snap = ssLoad(); if (!snap) return;
    const f = snap.filters;
    setPatientName(f.patientName); setHospitalId(f.hospitalId); setAccessionNo(f.accessionNo);
    setDateFrom(f.dateFrom); setDateTo(f.dateTo);
    setSpecimenList(f.specimenList); setDiagnosisList(f.diagnosisList);
    setSnomedList(f.snomedList); setIcdCodes(f.icdCodes);
    setSynopticIds(f.synopticIds); setFlagsList(f.flagsList);
    setPathologistIds(f.pathologistIds ?? []); setAttendingIds(f.attendingIds ?? []);
    setSubmittingNames(f.submittingNames); setStatusList(f.statusList); setPriorityList(f.priorityList);
    // Restore demographics (previously omitted — back-navigation lost these filters)
    setGenderList(f.genderList ?? []);
    setDobFrom(f.dobFrom ?? '');
    setDobTo(f.dobTo ?? '');
    setAgeMin(f.ageMin !== undefined ? String(f.ageMin) : '');
    setAgeMax(f.ageMax !== undefined ? String(f.ageMax) : '');
    setResults(snap.results); setHasSearched(snap.hasSearched);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const t = setTimeout(()=>setIsLoaded(true), 80); return ()=>clearTimeout(t); }, []);
  useEffect(() => { pushCrumb('Case Search', '/search'); }, [pushCrumb]);
  useEffect(() => { lsSave(savedSearches); }, [savedSearches]);
  useEffect(() => { if (showSaveInput) saveInputRef.current?.focus(); }, [showSaveInput]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (specimenRef.current && !specimenRef.current.contains(e.target as Node)) setShowSpecimenDrop(false);
      if (snomedRef.current   && !snomedRef.current.contains(e.target as Node))   setShowSnomedDrop(false);
      if (icdRef.current      && !icdRef.current.contains(e.target as Node))      setShowIcdDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!specimenQuery || specimenQuery.length < 2) { setSpecimenSuggestions([]); setShowSpecimenDrop(false); return; }
    const q = specimenQuery.toLowerCase();
    const hits = specimenDictionary
      .filter(s => s.active && (
        (s.name?.toLowerCase() ?? '').includes(q) ||
        (s.normalizedLabel?.toLowerCase() ?? '').includes(q) ||
        (s.synonyms ?? []).some(syn => (syn?.toLowerCase() ?? '').includes(q))
      ) && !specimenList.includes(s.name))
      .map(s => s.name)
      .slice(0, 8);
    const fallback = hits.length > 0 ? hits :
      SPECIMEN_DICTIONARY.filter(s => s.toLowerCase().includes(q) && !specimenList.includes(s)).slice(0, 8);
    setSpecimenSuggestions(fallback); setShowSpecimenDrop(fallback.length > 0);
  }, [specimenQuery, specimenList]);

  useEffect(() => {
    if (!snomedQuery || snomedQuery.length < 2) { setSnomedSuggestions([]); setShowSnomedDrop(false); return; }
    codeService.search({ system:'SNOMED', query: snomedQuery }).then(r => {
      if (r.ok) { const hits = r.data.slice(0,6); setSnomedSuggestions(hits); setShowSnomedDrop(hits.length>0); }
    });
  }, [snomedQuery]);

  useEffect(() => {
    if (!icdQuery || icdQuery.length < 2) { setIcdSuggestions([]); setShowIcdDrop(false); return; }
    codeService.search({ system:'ICD-10', query: icdQuery }).then(r => {
      if (r.ok) { const hits = r.data.slice(0,6); setIcdSuggestions(hits); setShowIcdDrop(hits.length>0); }
    });
  }, [icdQuery]);

  useEffect(() => {
    if (!hasSearched) return; void runSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientName,hospitalId,accessionNo,diagnosisList,specimenList,snomedList,icdCodes,synopticIds,flagsList,pathologistIds,attendingIds,submittingNames,statusList,priorityList,dateFrom,dateTo,genderList,dobFrom,dobTo,ageMin,ageMax]);

  // â”€â”€ Filter helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const currentFilters = (): FilterState => ({
    patientName, hospitalId, accessionNo, diagnosisList, specimenList,
    snomedList, icdCodes, synopticIds, flagsList, pathologistIds, attendingIds,
    submittingNames, statusList, priorityList, dateFrom, dateTo,
    // Previously hardcoded to empty — now reads actual state so session
    // snapshots and saved searches correctly preserve demographic filters.
    genderList,
    dobFrom,
    dobTo,
    ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
    ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
  });

  const applyFilters = (f: FilterState) => {
    setPatientName(f.patientName); setHospitalId(f.hospitalId); setAccessionNo(f.accessionNo);
    // Restore smart identifier box from whichever field was populated
    const restored = f.accessionNo || f.patientName || f.hospitalId;
    setIdentifierQuery(restored);
    setDetectedType(restored ? detectIdentifierType(restored) : null);
    setDiagnosisList(f.diagnosisList); setSpecimenList(f.specimenList);
    setSnomedList(f.snomedList); setIcdCodes(f.icdCodes ?? []);
    setSynopticIds(f.synopticIds); setFlagsList(f.flagsList);
    setPathologistIds(f.pathologistIds ?? []); setAttendingIds(f.attendingIds ?? []);
    setSubmittingNames(f.submittingNames); setStatusList(f.statusList); setPriorityList(f.priorityList);
    setDateFrom(f.dateFrom); setDateTo(f.dateTo);
    // Restore demographics — previously hardcoded to empty which broke saved-search round-trips
    setGenderList(f.genderList ?? []);
    setDobFrom(f.dobFrom ?? '');
    setDobTo(f.dobTo ?? '');
    setAgeMin(f.ageMin !== undefined ? String(f.ageMin) : '');
    setAgeMax(f.ageMax !== undefined ? String(f.ageMax) : '');
  };

  const toggle = (val: string, list: string[], setter: (v: string[]) => void) =>
    list.includes(val) ? setter(list.filter(x=>x!==val)) : setter([...list, val]);

  const addSpecimen = (val: string) => {
    const v = val.trim(); if (!v) return;
    setSpecimenList(p=>p.includes(v)?p:[...p,v]); setSpecimenQuery(''); setShowSpecimenDrop(false);
  };
  const addDiagnosis = () => {
    const v = diagnosisText.trim(); if (!v) return;
    setDiagnosisList(p=>p.includes(v)?p:[...p,v]); setDiagnosisText('');
  };
  const addSnomed = (s: ClinicalCode) => {
    setSnomedList((p: any)=>p.some((x: any)=>x.code===s.code)?p:[...p,s]); setSnomedQuery(''); setShowSnomedDrop(false);
  };
  const addIcd = (s: ClinicalCode) => {
    setIcdCodes((p: any)=>p.some((x: any)=>x.code===s.code)?p:[...p,s]); setIcdQuery(''); setShowIcdDrop(false);
  };

  const runSearch = async () => {
    setIsSearching(true);
    try {
      const params: CaseFilterParams = {
        patientName,
        hospitalId,
        accessionNo,
        dateFrom:            dateFrom || undefined,
        dateTo:              dateTo   || undefined,
        diagnosisList,
        specimenList,
        // Pass codes (not display text) so service can match c.coding.snomed / c.coding.icd10
        snomedCodes:         snomedList.map(s => s.code),
        icdCodes:            icdCodes.map(s => s.code),
        statusList:          statusList  as CaseFilterParams['statusList'],
        priorityList:        priorityList as CaseFilterParams['priorityList'],
        genderList:          genderList.length ? genderList as CaseFilterParams['genderList'] : undefined,
        dobFrom:             dobFrom || undefined,
        dobTo:               dobTo   || undefined,
        ageMin:              ageMin  ? parseInt(ageMin, 10)  : undefined,
        ageMax:              ageMax  ? parseInt(ageMax, 10)  : undefined,
        clientIds:           clientIds.length      ? clientIds      : undefined,
        // Previously omitted — these are the filters that were being tracked in state but never sent
        flagIds:             flagsList.length      ? flagsList      : undefined,
        pathologistIds:      pathologistIds.length ? pathologistIds : undefined,
        // Resolve p01 → 'breast_invasive' templateId before passing so service can match synopticReports
        synopticProtocolIds: synopticIds.length
          ? synopticIds.map(id => ALL_SYNOPTICS.find(t => t.id === id)?.templateId ?? '').filter(Boolean)
          : undefined,
        // Pass full provider names (not att-1 IDs) — service matches c.order.requestingProvider
        ...(attendingIds.length && {
          attendingNames: attendingIds
            .map(id => ALL_ATTENDINGS.find(u => u.id === id)?.name ?? '')
            .filter(Boolean) as string[],
        }),
      };
      console.log('[Search] params:', params);
      const result = await caseService.getAll(params);
      console.log('[Search] result:', result.ok, result.ok ? result.data?.length : 0, 'cases');
      if (result.ok) {
        const filteredData = compFlagsList.length > 0
          ? result.data.filter((c: PathologyCase) =>
              compFlagsList.some(code =>
                ((c as any).specimenFlags ?? []).some((sf: any) =>
                  sf.lisCode === code || sf.id === code || sf.name === code
                )
              )
            )
          : result.data;
        setResults(filteredData);
        ssSave({ filters: currentFilters(), results: filteredData, hasSearched: true });
      }
    } catch (err) {
      console.error('[SearchPage] runSearch error:', err);
    } finally {
      // Always reset — even if caseService throws
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setHasSearched(true); void runSearch(); };

  const handleClear = () => {
    setPatientName(''); setHospitalId(''); setAccessionNo('');
    setIdentifierQuery(''); setDetectedType(null);
    setDiagnosisText(''); setDiagnosisList([]);
    setSpecimenQuery(''); setSpecimenList([]);
    setSnomedQuery(''); setSnomedList([]);
    setIcdQuery(''); setIcdCodes([]);
    setSynopticIds([]); setFlagsList([]); setPathologistIds([]); setAttendingIds([]);
    setSubmittingNames([]); setStatusList([]); setPriorityList([]);
    setGenderList([]); setDobFrom(''); setDobTo(''); setAgeMin(''); setAgeMax('');
    setDateFrom(daysAgo(30)); setDateTo(today());
    setResults(null); setHasSearched(false); setActiveSavedId('');
    ssClear();
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;
    const headers = [
      'Accession', 'Patient Name', 'MRN', 'Sex', 'DOB',
      'Specimen(s)', 'Accession Date', 'Physician', 'Priority', 'Status', 'Flags',
    ];
    const rows = results.map((c: any) => [
      c.accession?.fullAccession ?? '',
      `${c.patient?.firstName ?? ''} ${c.patient?.lastName ?? ''}`.trim(),
      c.patient?.mrn ?? '',
      c.patient?.sex ?? '',
      c.patient?.dateOfBirth
        ? new Date(c.patient.dateOfBirth).toLocaleDateString('en-US', { year:'numeric', month:'2-digit', day:'2-digit' })
        : '',
      (c.specimens ?? []).map((s: any) => s.description ?? s.label ?? '').join('; '),
      c.specimens?.[0]?.receivedAt
        ? new Date(c.specimens[0].receivedAt).toLocaleDateString('en-US', { year:'numeric', month:'2-digit', day:'2-digit' })
        : '',
      c.order?.requestingProvider ?? '',
      c.order?.priority ?? '',
      c.status ?? '',
      (c.caseFlags ?? []).map((f: any) => f.name ?? '').join('; '),
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv, ''], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pathscribe-cases-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveSearch = () => {
    const name = saveNameInput.trim(); if (!name) return;
    const ns: SavedSearch = { id:crypto.randomUUID(), name, filters:currentFilters(), createdAt:new Date().toISOString() };
    setSavedSearches(p=>[...p,ns]); setActiveSavedId(ns.id); setSaveNameInput(''); setShowSaveInput(false);
  };

  const handleLoadSearch = (id: string) => {
    const s = savedSearches.find(x=>x.id===id); if (!s) return;
    applyFilters(s.filters); setActiveSavedId(id); setHasSearched(true); void runSearch();
  };

  const handleDeleteSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); setSavedSearches(p=>p.filter(x=>x.id!==id));
    if (activeSavedId===id) setActiveSavedId('');
  };

  // ── Voice: selected result index ────────────────────────────
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);

  // ── Voice: set SEARCH context on mount ─────────────────────────
  useEffect(() => {
    mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.SEARCH);
    return () => mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
  }, []);

  // ── Voice: table navigation and search action listeners ─────────────────────
  useEffect(() => {
    const resultList = results ?? [];
    const clamp = (i: number) => Math.max(0, Math.min(i, resultList.length - 1));

    const next     = () => setSelectedResultIndex(i => clamp(i + 1));
    const previous = () => setSelectedResultIndex(i => clamp(Math.max(0, i) - 1));
    const pageDown = () => setSelectedResultIndex(i => clamp(i + 10));
    const pageUp   = () => setSelectedResultIndex(i => clamp(Math.max(0, i) - 10));
    const first    = () => setSelectedResultIndex(0);
    const last     = () => setSelectedResultIndex(resultList.length - 1);

    const openSelected = () => {
      if (selectedResultIndex >= 0 && resultList[selectedResultIndex]) {
        sessionStorage.setItem('pathscribe:navFrom', 'search');
        navigate(`/case/${resultList[selectedResultIndex].id}/synoptic`);
      }
    };

    const clearSearch = () => {
      handleClear();
      setSelectedResultIndex(-1);
    };

    const runVoiceSearch = () => {
      setHasSearched(true);
      void runSearch();
    };

    window.addEventListener('PATHSCRIBE_TABLE_NEXT',          next);
    window.addEventListener('PATHSCRIBE_TABLE_PREVIOUS',      previous);
    window.addEventListener('PATHSCRIBE_TABLE_PAGE_DOWN',     pageDown);
    window.addEventListener('PATHSCRIBE_TABLE_PAGE_UP',       pageUp);
    window.addEventListener('PATHSCRIBE_TABLE_FIRST',         first);
    window.addEventListener('PATHSCRIBE_TABLE_LAST',          last);
    window.addEventListener('PATHSCRIBE_TABLE_OPEN_SELECTED', openSelected);
    window.addEventListener('PATHSCRIBE_TABLE_CLEAR_SEARCH',  clearSearch);
    window.addEventListener('PATHSCRIBE_TABLE_SEARCH',        runVoiceSearch);

    return () => {
      window.removeEventListener('PATHSCRIBE_TABLE_NEXT',          next);
      window.removeEventListener('PATHSCRIBE_TABLE_PREVIOUS',      previous);
      window.removeEventListener('PATHSCRIBE_TABLE_PAGE_DOWN',     pageDown);
      window.removeEventListener('PATHSCRIBE_TABLE_PAGE_UP',       pageUp);
      window.removeEventListener('PATHSCRIBE_TABLE_FIRST',         first);
      window.removeEventListener('PATHSCRIBE_TABLE_LAST',          last);
      window.removeEventListener('PATHSCRIBE_TABLE_OPEN_SELECTED', openSelected);
      window.removeEventListener('PATHSCRIBE_TABLE_CLEAR_SEARCH',  clearSearch);
      window.removeEventListener('PATHSCRIBE_TABLE_SEARCH',        runVoiceSearch);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selectedResultIndex, navigate]);

  // â”€â”€ Style helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const INPUT: React.CSSProperties = {
    width:'100%', padding:'6px 10px',
    background:'rgba(15,23,42,0.7)', border:'1px solid rgba(148,163,184,0.25)',
    borderRadius:7, color:'#f1f5f9', fontSize:12, outline:'none', boxSizing:'border-box',
    transition:'border-color 0.15s',
  };

  // onF/onB now also update activeSection via data-section attribute
  const onF = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#0891B2';
    setActiveSection(e.currentTarget.dataset.section ?? '');
  };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
    setActiveSection('');
  };

  const activeCount = [
    patientName, hospitalId, accessionNo,
    ...diagnosisList, ...specimenList,
    ...snomedList.map(s=>s.code), ...icdCodes.map(s=>s.code),
    ...synopticIds, ...flagsList, ...pathologistIds, ...attendingIds, ...submittingNames,
    ...statusList, ...priorityList, dateFrom?'df':'', dateTo?'dt':'',
  ].filter(Boolean).length;

  const summary = hasSearched ? buildSummary(currentFilters()) : null;

  const quickLinks = {
    Protocols:  [{ title:'CAP Cancer Protocols', url:'https://www.cap.org/protocols-and-guidelines' }, { title:'WHO Classification', url:'https://www.who.int/publications' }],
    References: [{ title:'PathologyOutlines', url:'https://www.pathologyoutlines.com' }, { title:'UpToDate', url:'https://www.uptodate.com' }],
    Systems:    [{ title:'Hospital LIS', url:'#' }, { title:'Lab Management', url:'#' }],
  };

  const modalOverlay: React.CSSProperties = { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div style={{ position:'relative', width:'100vw', height:'var(--app-height, 100vh)', backgroundColor:'#000', color:'#fff', fontFamily:"'Inter',sans-serif", opacity:isLoaded?1:0, transition:'opacity 0.5s ease', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      <div style={{ position:'absolute', inset:0, backgroundImage:'url(/main_background.jpg)', backgroundSize:'cover', backgroundPosition:'center', zIndex:0, filter:'brightness(0.3) contrast(1.1)' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.4) 0%,#000 100%)', zIndex:1 }} />

      <div style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', height:'var(--app-height, 100vh)', overflow:'hidden' }}>

        {/* â”€â”€ Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(12px)', padding:'8px 40px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#f1f5f9', marginBottom:1 }}>Case Search</div>
              <div style={{ color:'#94a3b8', fontSize:12 }}>Search across cases, specimens, diagnoses, and clinical codes</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'flex-end', maxWidth:560 }}>
              {savedSearches.map(s => (
                <button key={s.id} type="button" onClick={()=>handleLoadSearch(s.id)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px 4px 11px', borderRadius:999, cursor:'pointer', fontSize:11, fontWeight:500, background:activeSavedId===s.id?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${activeSavedId===s.id?'#8B5CF6':'rgba(255,255,255,0.1)'}`, color:activeSavedId===s.id?'#c4b5fd':'#94a3b8' }}>
                  {s.name}
                  <span onClick={e=>handleDeleteSearch(s.id,e)} style={{ marginLeft:2, color:'#cbd5e1', fontSize:13, cursor:'pointer', padding:'0 2px' }} onMouseEnter={e=>(e.currentTarget.style.color='#ef4444')} onMouseLeave={e=>(e.currentTarget.style.color='#cbd5e1')}>×</span>
                </button>
              ))}
              {showSaveInput ? (
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <input ref={saveInputRef} type="text" value={saveNameInput} onChange={e=>setSaveNameInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')handleSaveSearch();if(e.key==='Escape'){setShowSaveInput(false);setSaveNameInput('');}}}
                    placeholder="Name this search…" style={{ padding:'4px 9px', fontSize:11, border:'1px solid rgba(255,255,255,0.15)', borderRadius:7, outline:'none', color:'#e2e8f0', background:'rgba(15,23,42,0.7)', width:145 }} />
                  <button type="button" onClick={handleSaveSearch} style={{ border:'none', background:'#8B5CF6', color:'#fff', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer' }}>Save</button>
                  <button type="button" onClick={()=>{setShowSaveInput(false);setSaveNameInput('');}} style={{ border:'1px solid #e2e8f0', background:'transparent', color:'#94a3b8', borderRadius:7, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>âœ•</button>
                </div>
              ) : (
                <button type="button" onClick={()=>setShowSaveInput(true)} style={{ border:'1px dashed #8B5CF6', background:'transparent', color:'#8B5CF6', borderRadius:999, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer' }}>+ Save Search</button>
              )}
              {activeCount>0&&<span style={{ background:'#8B5CF6', color:'#fff', fontSize:10, fontWeight:700, borderRadius:999, padding:'2px 8px', marginLeft:4 }}>{activeCount} filter{activeCount!==1?'s':''}</span>}
            </div>
          </div>
        </div>

        {/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <main style={{ flex:1, minHeight:0, padding:'20px 40px', display:'flex', flexDirection:'column', overflow:'hidden', gap:16 }}>
          <div style={{ flex:1, minHeight:0, display:'flex', gap:16, overflow:'hidden' }}>

          {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <aside className="ps-search-sidebar">
            <form onSubmit={handleSubmit} className="ps-search-form">

              {/* Accession Date */}
              <div className="ps-search-date-section">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <SectionLabel title="Accession Date" active={activeSection==="date"} />
                  <div style={{ display:'flex', gap:3 }}>
                    {([['7d',7],['30d',30],['90d',90],['1yr',365]] as [string,number][]).map(([label,days])=>(
                      <button key={label} type="button" onClick={()=>{setDateFrom(daysAgo(days));setDateTo(today());}}
                        style={{ fontSize:10, padding:'2px 6px', borderRadius:5, cursor:'pointer', border:'1px solid rgba(8,145,178,0.4)', background:'rgba(8,145,178,0.08)', color:'#7dd3fc', fontWeight:600 }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <div>
                    <div style={{ fontSize:10, color:activeSection==='date'?'#7dd3fc':'#94a3b8', marginBottom:2, transition:'color 0.15s' }}>From</div>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} onFocus={onF} onBlur={onB} data-section="date" style={{...INPUT, colorScheme:'dark' as any}} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:activeSection==='date'?'#7dd3fc':'#94a3b8', marginBottom:2, transition:'color 0.15s' }}>To</div>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} onFocus={onF} onBlur={onB} data-section="date" style={{...INPUT, colorScheme:'dark' as any}} />
                  </div>
                </div>
              </div>

              {/* Scrollable filters */}
              <div className="ps-search-filter-scroll">

                {/* Identifiers */}
                {/* Identifiers ”” smart single box */}
                <div onMouseEnter={()=>setActiveSection('id')} onMouseLeave={()=>setActiveSection(s=>s==='id'?'':s)}>
                  <div style={{marginBottom:4}}><SectionLabel title="Identifier" active={activeSection==='id'} /></div>
                  <div style={{ position:'relative' }}>
                    <input
                      data-capture-hide="true"
                      type="text"
                      value={identifierQuery}
                      onChange={e => handleIdentifierChange(e.target.value)}
                      onFocus={onF} onBlur={onB} data-section="id"
                      style={INPUT}
                      placeholder={`Accession #, patient name, or MRN…`}
                    />
                    {detectedType && identifierQuery && (
                      <div style={{
                        position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                        background: `${IDENTIFIER_BADGE[detectedType].color}22`,
                        border: `1px solid ${IDENTIFIER_BADGE[detectedType].color}66`,
                        color: IDENTIFIER_BADGE[detectedType].color,
                        borderRadius:999, padding:'1px 8px', fontSize:10, fontWeight:700,
                        pointerEvents:'none', whiteSpace:'nowrap',
                      }}>
                        {IDENTIFIER_BADGE[detectedType].label}
                      </div>
                    )}
                  </div>
                </div>


                {/* Patient Demographics */}
                <div
                  onMouseEnter={()=>setActiveSection('demographics')}
                  onMouseLeave={()=>setActiveSection(s=>s==='demographics'?'':s)}
                >
                  <div style={{ marginBottom:6 }}><SectionLabel title="Patient Demographics" active={activeSection==='demographics'} /></div>

                  {/* Gender */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Gender</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                      {(['Male','Female','Non-binary','Other','Unknown'] as const).map(g => (
                        <CheckPill key={g} label={g} checked={genderList.includes(g)} onChange={()=>toggle(g,genderList,setGenderList)} />
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth range */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Date of Birth</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      <div>
                        <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>From</div>
                        <input type="date" value={dobFrom} onChange={e=>setDobFrom(e.target.value)}
                          style={{...INPUT, colorScheme:'dark' as any, fontSize:11}} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>To</div>
                        <input type="date" value={dobTo} onChange={e=>setDobTo(e.target.value)}
                          style={{...INPUT, colorScheme:'dark' as any, fontSize:11}} />
                      </div>
                    </div>
                  </div>

                  {/* Age range */}
                  <div>
                    <div style={{ fontSize:10, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Age (years)</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      <div>
                        <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>Min</div>
                        <input type="number" min={0} max={130} placeholder="e.g. 40" value={ageMin} onChange={e=>setAgeMin(e.target.value)}
                          style={{...INPUT, fontSize:12}} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>Max</div>
                        <input type="number" min={0} max={130} placeholder="e.g. 65" value={ageMax} onChange={e=>setAgeMax(e.target.value)}
                          style={{...INPUT, fontSize:12}} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status + Priority ”” single row */}
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <SectionLabel title="Status" active={activeSection==='status'} />
                    <div style={{ width:1, height:10, background:'rgba(255,255,255,0.1)' }} />
                    <SectionLabel title="Priority" active={activeSection==='priority'} />
                  </div>
                  <div
                    onMouseEnter={()=>setActiveSection('status')}
                    onMouseLeave={()=>setActiveSection(s=>s==='status'||s==='priority'?'':s)}
                    style={{ display:'flex', flexWrap:'wrap', gap:3 }}
                  >
                    {CASE_STATUS_OPTIONS.map(s=><CheckPill key={s} label={({'draft':'Grossing','in-progress':'Awting Micro','pending':'Pending','pending-review':'Finalizing','pending-countersign':'Awaiting S/O','finalized':'Completed','pool':'Pool','amended':'Amended'})[s]??s} checked={statusList.includes(s)} onChange={()=>toggle(s,statusList,setStatusList)} />)}
                    <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.1)', margin:'0 2px' }} />
                    {PRIORITY_OPTIONS.map(p=><CheckPill key={p} label={p} checked={priorityList.includes(p)} onChange={()=>toggle(p,priorityList,setPriorityList)} accent={p==='STAT'?'#ef4444':'#0891B2'} />)}
                  </div>
                </div>

                {/* ── Browse-button sections: 2-column grid ── */}
                <div className="ps-search-2col">

                {/* Flags */}
                <div onMouseEnter={()=>setActiveSection('flags')} onMouseLeave={()=>setActiveSection(s=>s==='flags'?'':s)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Flags" active={activeSection==='flags'} />
                    <BrowseBtn onClick={()=>setFlagsModal(true)} count={ALL_FLAGS.length} />
                  </div>
                  {flagsList.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>{flagsList.map(f=><Chip key={f} label={f} onRemove={()=>setFlagsList(p=>p.filter(x=>x!==f))} />)}</div>}
                </div>

                {/* Synoptic */}
                <div onMouseEnter={()=>setActiveSection('synoptic')} onMouseLeave={()=>setActiveSection(s=>s==='synoptic'?'':s)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Synoptic Protocol" active={activeSection==='synoptic'} />
                    <BrowseBtn onClick={()=>setSynopticModal(true)} count={ALL_SYNOPTICS.length} />
                  </div>
                  {synopticIds.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>{synopticIds.map(id=>{const t=ALL_SYNOPTICS.find(s=>s.id===id);return t?<Chip key={id} label={t.organ} onRemove={()=>setSynopticIds(p=>p.filter(x=>x!==id))} />:null;})}</div>}
                </div>

                {/* Pathologist */}
                <div onMouseEnter={()=>setActiveSection('path')} onMouseLeave={()=>setActiveSection(s=>s==='path'?'':s)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Pathologist" active={activeSection==='path'} />
                    <BrowseBtn onClick={()=>setPathModal(true)} count={ALL_PATHOLOGISTS.length} />
                  </div>
                  {pathologistIds.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>{pathologistIds.map(id=>{const u=ALL_PATHOLOGISTS.find(x=>x.id===id);return u?<Chip key={id} label={u.name.replace('Dr. ','')} onRemove={()=>setPathologistIds(p=>p.filter(x=>x!==id))} />:null;})}</div>}
                </div>

                {/* Attending Physician */}
                <div onMouseEnter={()=>setActiveSection('attending')} onMouseLeave={()=>setActiveSection(s=>s==='attending'?'':s)}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Attending Physician" active={activeSection==='attending'} />
                    <BrowseBtn onClick={()=>setAttendingModal(true)} count={ALL_ATTENDINGS.length} />
                  </div>
                  {attendingIds.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>{attendingIds.map(id=>{const u=ALL_ATTENDINGS.find(x=>x.id===id);return u?<Chip key={id} label={u.name.replace('Dr. ','')} onRemove={()=>setAttendingIds(p=>p.filter(x=>x!==id))} />:null;})}</div>}
                </div>


                {/* Computational Flags */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Comp Flags" active={false} />
                    <BrowseBtn onClick={()=>setCompFlagsModal(true)} count={compFlagsList.length||undefined} />
                  </div>
                  {compFlagsList.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                    {compFlagsList.map(f=><Chip key={f} label={f} onRemove={()=>setCompFlagsList(p=>p.filter(x=>x!==f))} accent="#0891b2" />)}
                  </div>}
                </div>

                {/* Client */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <SectionLabel title="Client" active={false} />
                    <BrowseBtn onClick={()=>setClientModal(true)} count={clientIds.length||undefined} />
                  </div>
                  {clientIds.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                    {clientIds.map(id=><Chip key={id} label={ALL_CLIENTS.find(c=>c.id===id)?.name??id} onRemove={()=>setClientIds(p=>p.filter(x=>x!==id))} accent="#8b5cf6" />)}
                  </div>}
                </div>

                </div>{/* end ps-search-2col */}

                {/* Specimen */}
                <div onMouseEnter={()=>setActiveSection('specimen')} onMouseLeave={()=>setActiveSection(s=>s==='specimen'?'':s)}>
                  <div style={{marginBottom:4}}><SectionLabel title="Specimen" active={activeSection==='specimen'} /></div>
                  <div style={{ display:'flex', gap:4 }} ref={specimenRef}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input type="text" value={specimenQuery} onChange={e=>setSpecimenQuery(e.target.value)} onFocus={onF} onBlur={onB} data-section="specimen" style={INPUT} placeholder="Search specimen dictionary…"
                        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(specimenQuery.trim())addSpecimen(specimenQuery);}}} />
                      {showSpecimenDrop&&(
                        <div style={DROPDOWN_STYLE}>
                          {specimenSuggestions.map(s=>(
                            <button key={s} type="button" onClick={()=>addSpecimen(s)} style={DROP_BTN}
                              onMouseEnter={e=>(e.currentTarget.style.background='rgba(8,145,178,0.15)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>{s}</button>
                          ))}
                          {specimenQuery.trim()&&!SPECIMEN_DICTIONARY.some(s=>s.toLowerCase()===specimenQuery.toLowerCase())&&(
                            <button type="button" onClick={()=>addSpecimen(specimenQuery)} style={{...DROP_BTN,color:'#7dd3fc',borderTop:'1px solid rgba(148,163,184,0.1)'}}
                              onMouseEnter={e=>(e.currentTarget.style.background='rgba(8,145,178,0.15)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>+ Add "{specimenQuery}"</button>
                          )}
                        </div>
                      )}
                    </div>
                    <BrowseBtn onClick={()=>setSpecimenModal(true)} count={specimenList.length||undefined} />
                  </div>
                  {specimenList.length>0&&<div style={{ marginTop:4, display:'flex', flexWrap:'wrap', gap:3 }}>{specimenList.map(s=><Chip key={s} label={s} onRemove={()=>setSpecimenList(p=>p.filter(x=>x!==s))} />)}</div>}
                </div>

                {/* Diagnosis */}
                <div onMouseEnter={()=>setActiveSection('diagnosis')} onMouseLeave={()=>setActiveSection(s=>s==='diagnosis'?'':s)}>
                  <div style={{marginBottom:4}}><SectionLabel title="Diagnosis" active={activeSection==='diagnosis'} /></div>
                  <div style={{ display:'flex', gap:4 }}>
                    <input type="text" value={diagnosisText} onChange={e=>setDiagnosisText(e.target.value)} onFocus={onF} onBlur={onB} data-section="diagnosis" style={INPUT} placeholder="e.g. Carcinoma"
                      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addDiagnosis();}}} />
                    <button type="button" onClick={addDiagnosis} style={{ border:'none', borderRadius:6, padding:'0 8px', background:'#0891B2', color:'#e5e7eb', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>+</button>
                  </div>
                  {diagnosisList.length>0&&<div style={{ marginTop:4, display:'flex', flexWrap:'wrap', gap:3 }}>{diagnosisList.map(d=><Chip key={d} label={d} onRemove={()=>setDiagnosisList(p=>p.filter(x=>x!==d))} />)}</div>}
                </div>

                {/* SNOMED CT */}
                <div onMouseEnter={()=>setActiveSection('snomed')} onMouseLeave={()=>setActiveSection(s=>s==='snomed'?'':s)}>
                  <div style={{marginBottom:4}}><SectionLabel title="SNOMED CT" active={activeSection==='snomed'} /></div>
                  <div style={{ display:'flex', gap:4 }} ref={snomedRef}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input type="text" value={snomedQuery} onChange={e=>setSnomedQuery(e.target.value)} onFocus={onF} onBlur={onB} data-section="snomed" style={INPUT} placeholder="Search concept or description…" />
                      {showSnomedDrop&&(
                        <div style={DROPDOWN_STYLE}>
                          {snomedSuggestions.map(s=>(
                            <button key={s.code} type="button" onClick={()=>addSnomed(s)} style={DROP_BTN}
                              onMouseEnter={e=>(e.currentTarget.style.background='rgba(8,145,178,0.15)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                              <span style={{ fontFamily:'monospace', color:'#7dd3fc', marginRight:5, fontSize:11 }}>{s.code}</span>
                              <span style={{ color:'#cbd5e1', fontSize:11 }}>{s.display.substring(0,38)}…</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <BrowseBtn onClick={()=>setSnomedModal(true)} count={snomedList.length||undefined} />
                  </div>
                  {snomedList.length>0&&(
                    <div style={{ marginTop:4, display:'flex', flexWrap:'wrap', gap:3 }}>
                      {snomedList.map(s=><Chip key={s.code} label={s.code} title={`SNOMED CT: ${s.display}`} onRemove={()=>setSnomedList(p=>p.filter(x=>x.code!==s.code))} accent='#8B5CF6' />)}
                    </div>
                  )}
                </div>

                {/* ICD Codes ”” unified ICD-10 / ICD-11 / ICD-O */}
                <div onMouseEnter={()=>setActiveSection('icd')} onMouseLeave={()=>setActiveSection(s=>s==='icd'?'':s)} style={{ paddingBottom:8 }}>
                  <div style={{marginBottom:4}}><SectionLabel title="ICD Codes" active={activeSection==='icd'} /></div>
                  <div style={{ display:'flex', gap:4 }} ref={icdRef}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input type="text" value={icdQuery} onChange={e=>setIcdQuery(e.target.value)} onFocus={onF} onBlur={onB} data-section="icd" style={INPUT} placeholder="Search ICD-10 code or description…" />
                      {showIcdDrop&&(
                        <div className="ps-scroll" style={DROPDOWN_STYLE}>
                          {icdSuggestions.map(s=>(
                            <button key={s.code} type="button" onClick={()=>addIcd(s)} style={DROP_BTN}
                              onMouseEnter={e=>(e.currentTarget.style.background='rgba(8,145,178,0.15)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                              <span style={{ fontFamily:'monospace', color:'#c4b5fd', marginRight:5, fontSize:11 }}>{s.code}</span>
                              <span style={{ color:'#cbd5e1', fontSize:11 }}>{s.display.substring(0,38)}…</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <BrowseBtn onClick={()=>setIcdModal(true)} count={icdCodes.length||undefined} />
                  </div>
                  {icdCodes.length>0&&(
                    <div style={{ marginTop:4, display:'flex', flexWrap:'wrap', gap:3 }}>
                      {icdCodes.map(s=>{
                        const icdAccent = s.system==='ICD-11'?'#F59E0B':s.system?.startsWith('ICD-O')?'#10B981':'#8B5CF6';
                        return <Chip key={`${s.system}-${s.code}`} label={`${s.system} ${s.code}`} title={s.display} onRemove={()=>setIcdCodes(p=>p.filter(x=>x.code!==s.code))} accent={icdAccent} />;
                      })}
                    </div>
                  )}
                </div>

              </div>{/* end scrollable filters */}

              {/* Action buttons */}
              <div className="ps-search-actions">
                <button type="button" onClick={handleClear} className="ps-search-btn-clear">Clear</button>
                <button type="submit" disabled={isSearching} className="ps-search-btn-submit">
                  {isSearching?'Searching…':'Search Cases'}
                </button>
              </div>

            </form>
          </aside>

          {/* â”€â”€ Results pane â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div data-capture-hide="true" style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12 }}>

            {/* Summary bar */}
            <div style={{ padding:'9px 20px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              {summary ? (
                <p style={{ margin:0, fontSize:12, color:'#94a3b8', lineHeight:1.5, flex:1 }}>
                  
                  {summary.split(' · ').map((part,i,arr)=>(
                    <React.Fragment key={i}>
                      <span style={{ color:i===0?'#cbd5e1':'#7dd3fc', fontWeight:i===0?400:500 }}>{part}</span>
                      {i<arr.length-1&&<span style={{ color:'#1e293b', margin:'0 5px' }}>·</span>}
                    </React.Fragment>
                  ))}
                </p>
              ) : (
                <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Set filters and press <strong style={{ color:'#22c55e' }}>Search Cases</strong> to begin</p>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                {results!==null&&<span style={{ fontSize:12, color:'#94a3b8' }}>{results.length} case{results.length!==1?'s':''}</span>}
                {results!==null&&results.length>0&&(
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{ border:'1px solid rgba(148,163,184,0.2)', background:'transparent', color:'#64748b', borderRadius:6, padding:'3px 10px', fontSize:11, cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(8,145,178,0.5)'; e.currentTarget.style.color='#7dd3fc'; e.currentTarget.style.background='rgba(8,145,178,0.08)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(148,163,184,0.2)'; e.currentTarget.style.color='#64748b'; e.currentTarget.style.background='transparent'; }}
                  >Export CSV</button>
                )}
              </div>
            </div>

            {/* Result table ”” WorklistTable owns its own internal scroll */}
            <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {hasSearched
                ? <WorklistTable key={results?.length ?? 0} cases={results??[]} activeFilter="all" selectedIndex={selectedResultIndex} onRowSelect={setSelectedResultIndex} onBeforeNavigate={(_caseId)=>sessionStorage.setItem('pathscribe:navFrom','search')} />
                : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#1e293b', fontSize:13 }}>No search run yet</div>
              }
            </div>
          </div>
          </div>{/* end inner flex row */}
        </main>
      </div>

      {/* â”€â”€ Lookup modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

      {specimenModal&&(
        <LookupModal
          title="Specimen Dictionary"
          subtitle={`${specimenDictionary.filter(s=>s.active).length} specimens across ${[...new Set(specimenDictionary.map(s=>s.type))].length} types`}
          selectedCount={specimenList.length}
          onClose={()=>setSpecimenModal(false)}
        >
          <SpecimenLookupContent
            specimens={specimenDictionary}
            selected={specimenList}
            onToggle={name => setSpecimenList(p => p.includes(name) ? p.filter(x=>x!==name) : [...p, name])}
          />
        </LookupModal>
      )}

      {snomedModal&&(
        <LookupModal
          title="SNOMED CT"
          subtitle={`Search across ${SNOMED_AXIS_META.length} axes: ${SNOMED_AXIS_META.map(m=>m.label).join(", ")}`}
          selectedCount={snomedList.length}
          onClose={()=>setSnomedModal(false)}
        >
          <SnomedModalContent
            selected={snomedList}
            onToggle={c=>setSnomedList(p=>p.some(x=>x.code===c.code)?p.filter(x=>x.code!==c.code):[...p,c])}
          />
        </LookupModal>
      )}

      {icdModal&&(
        <LookupModal
          title="ICD Codes"
          subtitle="Select codes across active ICD systems"
          selectedCount={icdCodes.length}
          onClose={()=>setIcdModal(false)}
        >
          <IcdModalContent
            selected={icdCodes}
            onToggle={c=>setIcdCodes(p=>p.some(x=>x.code===c.code)?p.filter(x=>x.code!==c.code):[...p,c])}
            icd10Active={config.terminologyConfig.icd10.active}
            icd11Active={config.terminologyConfig.icd11.active}
            icdoActive={config.terminologyConfig.icdo.active}
          />
        </LookupModal>
      )}

      {synopticModal&&(
        <LookupModal title="Synoptic Protocol" subtitle={`${ALL_SYNOPTICS.length} protocols across ${Array.from(new Set(ALL_SYNOPTICS.map(s=>s.category))).length} categories`} selectedCount={synopticIds.length} onClose={()=>setSynopticModal(false)}>
          <SynopticLookupContent selected={synopticIds} onToggle={id=>toggle(id,synopticIds,setSynopticIds)} />
        </LookupModal>
      )}

      {flagsModal&&(
        <LookupModal title="Case Flags" subtitle={`${ALL_FLAGS.length} available flags`} selectedCount={flagsList.length} onClose={()=>setFlagsModal(false)}>
          <FlagsLookupContent selected={flagsList} onToggle={f=>toggle(f,flagsList,setFlagsList)} />
        </LookupModal>
      )}

      {pathModal&&(
        <LookupModal title="Pathologist" subtitle="Filter by assigned pathologist" selectedCount={pathologistIds.length} onClose={()=>setPathModal(false)}>
          <UserLookupContent users={ALL_PATHOLOGISTS} selected={pathologistIds} onToggle={id=>toggle(id,pathologistIds,setPathologistIds)} />
        </LookupModal>
      )}

      {attendingModal&&(
        <LookupModal title="Attending Physician" subtitle="Filter by referring or attending physician" selectedCount={attendingIds.length} onClose={()=>setAttendingModal(false)}>
          <UserLookupContent users={ALL_ATTENDINGS} selected={attendingIds} onToggle={id=>toggle(id,attendingIds,setAttendingIds)} accent="#10B981" />
        </LookupModal>
      )}

      {/* Client browse modal */}
      {clientModal && (
        <LookupModalX
          title="Submitting Client"
          subtitle="Filter cases by submitting facility"
          selectedCount={clientIds.length}
          onClose={() => setClientModal(false)}
          onClear={() => setClientIds([])}
          onDone={() => setClientModal(false)}
        >
          <ClientLookupContent
            selected={clientIds}
            onToggle={id => toggle(id, clientIds, setClientIds)}
          />
        </LookupModalX>
      )}

      {/* Computational Flags browse modal */}
      {compFlagsModal && (
        <LookupModalX
          title="Computational Flags"
          subtitle="Filter by live LIS test result flags"
          selectedCount={compFlagsList.length}
          onClose={() => setCompFlagsModal(false)}
          onClear={() => setCompFlagsList([])}
          onDone={() => setCompFlagsModal(false)}
        >
          <CompFlagsLookupContent
            selected={compFlagsList}
            onToggle={f => toggle(f, compFlagsList, setCompFlagsList)}
          />
        </LookupModalX>
      )}

      {/* â”€â”€ Profile modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isProfileOpen&&(
        <div style={modalOverlay} onClick={()=>setIsProfileOpen(false)}>
          <div style={{ width:400, backgroundColor:'#111', borderRadius:20, padding:40, border:'1px solid rgba(8,145,178,0.3)', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ color:'#0891B2', fontSize:24, fontWeight:700, marginBottom:24 }}>User Preferences</div>
            <button onClick={()=>setIsProfileOpen(false)} style={{ padding:'12px 24px', borderRadius:10, background:'rgba(8,145,178,0.15)', border:'1px solid rgba(8,145,178,0.3)', color:'#0891B2', fontWeight:600, fontSize:15, cursor:'pointer', width:'100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* â”€â”€ Resources modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isResourcesOpen&&(
        <div style={modalOverlay} onClick={()=>setIsResourcesOpen(false)}>
          <div style={{ width:500, maxHeight:'80vh', overflowY:'auto', backgroundColor:'#111', borderRadius:20, padding:40, border:'1px solid rgba(8,145,178,0.3)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ color:'#0891B2', fontSize:24, fontWeight:700, marginBottom:24, textAlign:'center' }}>Quick Links</div>
            {Object.entries(quickLinks).map(([section,links])=>(
              <div key={section} style={{ marginBottom:24 }}>
                <div style={{ color:'#94a3b8', fontSize:12, fontWeight:700, marginBottom:12, textTransform:'uppercase' }}>{section}</div>
                {links.map((link,i)=>(
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={()=>setIsResourcesOpen(false)}
                    style={{ display:'block', color:'#cbd5e1', textDecoration:'none', padding:'12px 16px', fontSize:16, borderRadius:8, marginBottom:8 }}
                    onMouseEnter={e=>{e.currentTarget.style.color='#0891B2';e.currentTarget.style.background='rgba(8,145,178,0.1)';}}
                    onMouseLeave={e=>{e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='transparent';}}>â†’ {link.title}</a>
                ))}
              </div>
            ))}
            <button onClick={()=>setIsResourcesOpen(false)} style={{ padding:'12px 24px', borderRadius:10, background:'rgba(8,145,178,0.15)', border:'1px solid rgba(8,145,178,0.3)', color:'#0891B2', fontWeight:600, fontSize:15, cursor:'pointer', width:'100%' }}>Close</button>
          </div>
        </div>
      )}


      {/* â”€â”€ Logout modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showLogoutModal&&(
        <div style={modalOverlay}>
          <div style={{ width:400, backgroundColor:'#111', padding:40, borderRadius:28, textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize:48, marginBottom:20 }}>âš ï¸</div>
            <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 12px' }}>Sign out?</h2>
            <p style={{ color:'#94a3b8', marginBottom:30, lineHeight:1.6, fontSize:15 }}>You'll be signed out of PathScribeAI.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <button onClick={()=>setShowLogoutModal(false)} style={{ padding:16, borderRadius:12, background:'#0891B2', border:'none', color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer' }}>â† Stay on Search</button>
              <button onClick={handleLogout} style={{ padding:16, borderRadius:12, background:'transparent', border:'2px solid #F59E0B', color:'#F59E0B', fontWeight:600, fontSize:15, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#F59E0B';e.currentTarget.style.color='#000';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#F59E0B';}}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;




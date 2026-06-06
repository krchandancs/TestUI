import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';
import { InternalNote, NewInternalNote, IInternalNoteService } from './IInternalNoteService';
import { mockAuditService } from '../auditlog/mockAuditService';

// ─── Audit Helper ─────────────────────────────────────────────────────────────

const audit = (
  event: string,
  detail: string,
  user: string,
  caseId: string | null = null
) => mockAuditService.logEvent({ type: 'user', event, detail, user, caseId, confidence: null });

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_NOTES: InternalNote[] = [
  // ── US cases (existing) ───────────────────────────────────────────────────
  {
    id: 'cn1',
    accession: 'S26-4401',
    authorId: 'u2',
    authorName: 'Lab Manager',
    type: 'informal_review',
    body: 'Reviewed Block A-4 with Dr. Johnson over the phone. Secondary morphology consistent with primary diagnosis. No formal addendum required at this time.',
    visibility: 'shared',
    messageThreadId: 'm1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'cn2',
    accession: 'S26-4405',
    authorId: 'u5',
    authorName: 'Dr. Aristhone',
    type: 'consultation',
    body: 'Complex lung biopsy referred for second opinion. Pattern suspicious for adenocarcinoma vs. atypical carcinoid. Awaiting IHC panel results before finalising.',
    visibility: 'shared',
    messageThreadId: 'm4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
  },
  {
    id: 'cn3',
    accession: 'S26-4412',
    authorId: 'u1',
    authorName: 'Dr. Sarah Johnson',
    type: 'clinical_observation',
    body: 'IHC panel complete. ER/PR positive, HER2 equivocal — FISH recommended. Discussed with oncology team.',
    visibility: 'shared',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: 'cn4',
    accession: 'S26-4412',
    authorId: 'u1',
    authorName: 'Dr. Sarah Johnson',
    type: 'other',
    body: 'Personal reminder: confirm FISH lab turnaround with Dr. Nguyen before end of day.',
    visibility: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
  },

  // ── MFT UK cases — Paul Carter (PATH-UK-001) ──────────────────────────────
  // Notes authored by colleagues (not PATH-UK-001) will trigger the amber badge

  // MFT26-8801-CR-RES — Hartley, William — Anterior resection
  {
    id: 'mft-cn1',
    accession: 'MFT26-8801-CR-RES',
    authorId: 'mft-qasystem',
    authorName: 'PathScribe QA',
    type: 'informal_review',
    body: 'QA review requested prior to Wednesday colorectal MDT. Please confirm: (1) pTNM staging, (2) CRM distance, (3) tumour regression score, (4) MMR/KRAS results documented. Target sign-off before 12:00 Wednesday.',
    visibility: 'shared',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: 'mft-cn2',
    accession: 'MFT26-8801-CR-RES',
    authorId: 'PATH-UK-001',
    authorName: 'Paul Carter',
    type: 'other',
    body: 'Personal note: discuss KRAS G12V result implications with Dr. Marsden before MDT. Anti-EGFR therapy not indicated.',
    visibility: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },

  // MFT26-8802-PR-BX — Barrowclough, Geoffrey — Prostate biopsy
  {
    id: 'mft-cn3',
    accession: 'MFT26-8802-PR-BX',
    authorId: 'uk-whitmore',
    authorName: 'Mr. David Whitmore',
    type: 'clinical_observation',
    body: 'Urology note: PSMA PET positive, right posterior zone. Biopsy result critical for treatment planning — patient being considered for PSMA-targeted therapy. Please confirm Grade Group and core involvement percentage for Friday MDT.',
    visibility: 'shared',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },

  // MFT26-8803-CR-LOC — Ashworth, Margaret — TEMS excision
  {
    id: 'mft-cn4',
    accession: 'MFT26-8803-CR-LOC',
    authorId: 'uk-okafor',
    authorName: 'Dr. Sarah Okafor',
    type: 'consultation',
    body: 'Second opinion requested on the deep margin. I have reviewed the H&E sections on slide A3. The area of concern at the deep aspect shows glandular irregularity — in my view this is most consistent with tangential sectioning of high grade dysplastic glands rather than frank pT1 invasion. The glands lack the desmoplastic stroma I would expect with true invasion. I would report as HGD, deep margin close but clear. Happy to discuss.',
    visibility: 'shared',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
  },

  // MFT26-8804-PR-RP — Pemberton, Thomas — Radical prostatectomy
  {
    id: 'mft-cn5',
    accession: 'MFT26-8804-PR-RP',
    authorId: 'uk-whitmore',
    authorName: 'Mr. David Whitmore',
    type: 'clinical_observation',
    body: 'Urology: patient and family counselled re positive margin. Adjuvant radiotherapy being discussed at Friday MDT. Please ensure positive margin extent (mm) and location are clearly stated in the final report — this is critical for RT planning. Also confirm whether extraprostatic extension is confirmed histologically.',
    visibility: 'shared',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 'mft-cn6',
    accession: 'MFT26-8804-PR-RP',
    authorId: 'PATH-UK-001',
    authorName: 'Paul Carter',
    type: 'other',
    body: 'Reminder: include pT3a staging explicitly and note EPE at right posterolateral apex. RT planning team needs exact margin location.',
    visibility: 'private',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },

  // MFT26-8805-CR-FIN — Hollingsworth, Patricia — Right hemicolectomy (peer review)
  {
    id: 'mft-cn7',
    accession: 'MFT26-8805-CR-FIN',
    authorId: 'uk-okafor',
    authorName: 'Dr. Sarah Okafor',
    type: 'informal_review',
    body: 'Paul — I have reviewed the right hemicolectomy for Mrs Hollingsworth as requested. Overall I agree with your reporting. One point worth flagging: the apical lymph node (Node 14 in your submission) shows a focus of extranodal extension that I feel should be explicitly mentioned in the final report text, not just captured in the synoptic fields. This may have implications for adjuvant chemotherapy discussion at MDT. The morphology is otherwise consistent with your diagnosis — moderately differentiated adenocarcinoma pT3 N2a. Happy to discuss before you sign off.',
    visibility: 'shared',
    messageThreadId: 'uk-m7',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
// ⚠️  Internal notes are part of the clinical record but must never be included
//     in patient-facing report exports, PDF generation, or LIS transmissions.
//     Do not expose this collection through any report template or formatted output.
//     report exports, PDF generation, or LIS transmissions. Do not expose
//     this collection through any patient-facing API or report template.

const STORAGE_KEY = 'pathscribe_internal_notes_v2'; // bumped — forces seed data refresh
const load    = () => storageGet<InternalNote[]>(STORAGE_KEY, SEED_NOTES);
const persist = (data: InternalNote[]) => storageSet(STORAGE_KEY, data);

// Restore Date objects after JSON parse (storageGet returns plain objects)
const hydrate = (notes: InternalNote[]): InternalNote[] =>
  notes.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));

let MOCK_NOTES: InternalNote[] = hydrate(load());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

// ─── Service ──────────────────────────────────────────────────────────────────

export const mockInternalNoteService: IInternalNoteService = {

  async getForCase(accession: string, userId: ID) {
    await delay();
    const notes = MOCK_NOTES.filter(
      n => n.accession === accession &&
           (n.visibility === 'shared' || n.authorId === userId)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return ok([...notes]);
  },

  async add(note: NewInternalNote) {
    await delay();
    const newNote: InternalNote = {
      ...note,
      id: 'cn' + Date.now(),
      timestamp: new Date(),
    };
    MOCK_NOTES = [...MOCK_NOTES, newNote];
    persist(MOCK_NOTES);
    await audit(
      'INTERNAL_NOTE_ADDED',
      `${note.type.replace('_', ' ')} note added to Case ${note.accession}${note.visibility === 'private' ? ' [private]' : ''}`,
      note.authorName,
      note.accession
    );
    return ok({ ...newNote });
  },

  async update(id: ID, authorId: ID, changes) {
    await delay();
    const idx = MOCK_NOTES.findIndex(n => n.id === id);
    if (idx === -1) return err(`Note ${id} not found`);
    if (MOCK_NOTES[idx].authorId !== authorId) return err('Not authorised to edit this note');
    MOCK_NOTES = MOCK_NOTES.map(n => n.id === id ? { ...n, ...changes } : n);
    persist(MOCK_NOTES);
    const updated = MOCK_NOTES[idx];
    await audit(
      'INTERNAL_NOTE_UPDATED',
      `Case note updated on Case ${updated.accession}`,
      updated.authorName,
      updated.accession
    );
    return ok({ ...MOCK_NOTES[idx], ...changes });
  },

  async remove(id: ID, authorId: ID) {
    await delay();
    const target = MOCK_NOTES.find(n => n.id === id);
    if (!target) return err(`Note ${id} not found`);
    if (target.authorId !== authorId) return err('Not authorised to delete this note');
    MOCK_NOTES = MOCK_NOTES.filter(n => n.id !== id);
    persist(MOCK_NOTES);
    await audit(
      'INTERNAL_NOTE_DELETED',
      `Case note deleted from Case ${target.accession}`,
      target.authorName,
      target.accession
    );
    return ok(undefined);
  },
};

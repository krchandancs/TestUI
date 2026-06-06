import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';
import { Message, MessageThread, IMessageService } from './IMessageService';
import { mockAuditService } from '../auditlog/mockAuditService';

// ─── Audit Helper ─────────────────────────────────────────────────────────────

const audit = (
  event: string,
  detail: string,
  user: string,
  caseId: string | null = null
) => mockAuditService.logEvent({ type: 'user', event, detail, user, caseId, confidence: null });

// ─── Seed Data ────────────────────────────────────────────────────────────────
// All seeded messages are addressed to Dr. Sarah Johnson (userId: 'PATH-001')

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'u2',
    senderName: 'Lab Manager',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Urgent: Morphology Review',
    body: 'Please review the secondary morphology for this case immediately.',
    caseNumber: '24-8821',
    timestamp: new Date(),
    isUrgent: true,
    isRead: false,
    isDeleted: false,
    thread: [
      { sender: 'Lab Manager',       senderId: 'u2', text: 'Please review the secondary morphology for this case immediately.',  timestamp: new Date(Date.now() - 1000 * 60 * 20) },
      { sender: 'Dr. Sarah Johnson', senderId: 'PATH-001', text: 'Checking now. Is this for Case 24-8821?',                            timestamp: new Date(Date.now() - 1000 * 60 * 10) },
      { sender: 'Lab Manager',       senderId: 'u2', text: 'Correct. Block A-4 specifically.',                                   timestamp: new Date(Date.now() - 1000 * 60 * 5)  },
    ],
  },
  {
    id: 'm2',
    senderId: 'u3',
    senderName: 'System Admin',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Version 2.4.2 Update',
    body: 'The new CAP protocols have been successfully synchronized.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isUrgent: false,
    isRead: false,
    isDeleted: false,
    thread: [
      { sender: 'System Admin', senderId: 'u3', text: 'The new CAP protocols have been successfully synchronized.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    ],
  },
  {
    id: 'm3',
    senderId: 'u4',
    senderName: 'Dr. Sarah Chen',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Frozen Section Follow-up',
    body: 'The permanent sections for the margin check are now available for review.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'Dr. Sarah Chen', senderId: 'u4', text: 'The permanent sections for the margin check are now available for review.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    ],
  },
  {
    id: 'm4',
    senderId: 'u5',
    senderName: 'Dr. Aristhone',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Consultation Request',
    body: 'I have shared a complex lung biopsy case for your review.',
    caseNumber: '24-7710',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'Dr. Aristhone', senderId: 'u5', text: 'I have shared a complex lung biopsy case for your review.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6) },
    ],
  },
  {
    id: 'm5',
    senderId: 'u6',
    senderName: 'IT Support',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Workstation Maintenance',
    body: 'Your primary workstation is scheduled for a security patch update.',
    timestamp: new Date('2026-02-15T09:00:00'),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'IT Support', senderId: 'u6', text: 'Your primary workstation is scheduled for a security patch update.', timestamp: new Date('2026-02-15T09:00:00') },
    ],
  },
  {
    id: 'm6',
    senderId: 'u7',
    senderName: 'Billing Dept',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Coding Query',
    body: 'Please clarify the CPT codes for the skin excision case.',
    timestamp: new Date('2026-02-14T14:30:00'),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'Billing Dept', senderId: 'u7', text: 'Please clarify the CPT codes for the skin excision case.', timestamp: new Date('2026-02-14T14:30:00') },
    ],
  },
  {
    id: 'm7',
    senderId: 'u8',
    senderName: 'Dr. Miller',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Frozen Section',
    body: 'Great job on the quick turnaround this morning.',
    timestamp: new Date('2026-02-14T11:00:00'),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'Dr. Miller', senderId: 'u8', text: 'Great job on the quick turnaround this morning.', timestamp: new Date('2026-02-14T11:00:00') },
    ],
  },
  {
    id: 'm8',
    senderId: 'u9',
    senderName: 'Archives',
    recipientId: 'PATH-001',
    recipientName: 'Dr. Sarah Johnson',
    subject: 'Slide Retrieval',
    body: 'The historical slides for patient Case-8829 have been pulled.',
    timestamp: new Date('2026-02-13T10:00:00'),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      { sender: 'Archives', senderId: 'u9', text: 'The historical slides for patient Case-8829 have been pulled.', timestamp: new Date('2026-02-13T10:00:00') },
    ],
  },
  { id: 'm9',  senderId: 'u10', senderName: 'QA Team',         recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Audit Review',    body: 'Stats ready.',             timestamp: new Date('2026-02-12'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'QA Team',         senderId: 'u10', text: 'Stats ready.',             timestamp: new Date('2026-02-12') }] },
  { id: 'm10', senderId: 'u11', senderName: 'Dr. Patel',        recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'GI Consult',      body: 'Unusual case.',            timestamp: new Date('2026-02-11'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Dr. Patel',        senderId: 'u11', text: 'Unusual case.',            timestamp: new Date('2026-02-11') }] },
  { id: 'm11', senderId: 'u12', senderName: 'Transcription',    recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Draft Ready',     body: 'Case 24-110.',             timestamp: new Date('2026-02-10'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Transcription',    senderId: 'u12', text: 'Case 24-110.',             timestamp: new Date('2026-02-10') }] },
  { id: 'm12', senderId: 'u13', senderName: 'Medical Records',  recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Patient History', body: 'Prior pathology.',         timestamp: new Date('2026-02-09'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Medical Records',  senderId: 'u13', text: 'Prior pathology.',         timestamp: new Date('2026-02-09') }] },
  { id: 'm13', senderId: 'u14', senderName: 'Dr. Wilson',       recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Tumor Board',     body: 'Agenda attached.',         timestamp: new Date('2026-02-08'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Dr. Wilson',       senderId: 'u14', text: 'Agenda attached.',         timestamp: new Date('2026-02-08') }] },
  { id: 'm14', senderId: 'u15', senderName: 'Compliance',       recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Training Due',    body: 'Annual update.',           timestamp: new Date('2026-02-07'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Compliance',       senderId: 'u15', text: 'Annual update.',           timestamp: new Date('2026-02-07') }] },
  { id: 'm15', senderId: 'u16', senderName: 'Supply Room',      recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Reagents',        body: 'Order confirmed.',         timestamp: new Date('2026-02-06'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Supply Room',      senderId: 'u16', text: 'Order confirmed.',         timestamp: new Date('2026-02-06') }] },
  { id: 'm16', senderId: 'u17', senderName: 'Dr. Lee',          recipientId: 'PATH-001', recipientName: 'Dr. Sarah Johnson', subject: 'Dermpath Query',  body: 'Need second opinion.',     timestamp: new Date('2026-02-05'), isUrgent: false, isRead: true, isDeleted: false, thread: [{ sender: 'Dr. Lee',          senderId: 'u17', text: 'Need second opinion.',     timestamp: new Date('2026-02-05') }] },

  // ─── Paul Carter (PATH-UK-001) — MFT UK Demo Messages ────────────────────

  {
    id: 'uk-m1',
    senderId: 'mft-oncology',
    senderName: 'Dr. Helen Marsden',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'KRAS Result — Hartley, William — Oncology notified',
    body: 'Paul, just to confirm I have reviewed the KRAS mutation result for MFT26-8801. The tumour is KRAS G12D mutant. Patient has been listed for discussion at the colorectal MDT on Wednesday at 14:00. Could you confirm the mesorectal lymph node status before then? Many thanks.',
    caseNumber: 'MFT26-8801-CR-RES',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isUrgent: false,
    isRead: false,
    isDeleted: false,
    thread: [
      {
        sender: 'Dr. Helen Marsden',
        senderId: 'mft-oncology',
        text: 'Paul, just to confirm I have reviewed the KRAS mutation result for MFT26-8801. The tumour is KRAS G12D mutant. Patient has been listed for discussion at the colorectal MDT on Wednesday at 14:00. Could you confirm the mesorectal lymph node status before then? Many thanks.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
      },
    ],
  },

  {
    id: 'uk-m2',
    senderId: 'mft-surgery',
    senderName: 'Mr. James Whitfield',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'URGENT — Blackwood, Edward — Tumour perforation query',
    body: 'Paul, we have had a look at the operative findings for Mr Blackwood (MFT26-8806). The sigmoid was perforated intraoperatively — I need to know whether the perforation is through tumour or through normal bowel wall as this will significantly affect staging and adjuvant treatment planning. Please treat as STAT. Thank you.',
    caseNumber: 'MFT26-8806-CR-STAT',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isUrgent: true,
    isRead: false,
    isDeleted: false,
    thread: [
      {
        sender: 'Mr. James Whitfield',
        senderId: 'mft-surgery',
        text: 'Paul, we have had a look at the operative findings for Mr Blackwood (MFT26-8806). The sigmoid was perforated intraoperatively — I need to know whether the perforation is through tumour or through normal bowel wall as this will significantly affect staging and adjuvant treatment planning. Please treat as STAT. Thank you.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
      },
    ],
  },

  {
    id: 'uk-m3',
    senderId: 'mft-urology',
    senderName: 'Mr. David Whitmore',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'Barrowclough — PSMA IHC positive — Urology MDT Friday 09:00',
    body: 'Hi Paul, many thanks for the PSMA immunohistochemistry result on Mr Barrowclough (MFT26-8802). The positive result is very helpful. We are planning to discuss at the urology MDT this Friday at 09:00 — are you able to attend in person or by Teams? We may need your input on the Gleason grading.',
    caseNumber: 'MFT26-8802-PR-BX',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isUrgent: false,
    isRead: false,
    isDeleted: false,
    thread: [
      {
        sender: 'Mr. David Whitmore',
        senderId: 'mft-urology',
        text: 'Hi Paul, many thanks for the PSMA immunohistochemistry result on Mr Barrowclough (MFT26-8802). The positive result is very helpful. We are planning to discuss at the urology MDT this Friday at 09:00 — are you able to attend in person or by Teams? We may need your input on the Gleason grading.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        sender: 'Dr. Paul Carter',
        senderId: 'PATH-UK-001',
        text: 'David, happy to join by Teams. I will have the full Gleason breakdown ready by Thursday afternoon. Paul.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
      },
    ],
  },

  {
    id: 'uk-m4',
    senderId: 'mft-gastro',
    senderName: 'Dr. James Whitfield',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'Second opinion request — Ashworth, Margaret — TEMS rectal polyp',
    body: 'Paul, I would value your opinion on the TEMS excision for Mrs Ashworth (MFT26-8803). The lesion is at the anterior wall below the peritoneal reflection. My concern is whether this represents a pT1 with clear deep margin or whether there is involvement of the muscularis propria. I have requested a second opinion flag on the system. Thank you.',
    caseNumber: 'MFT26-8803-CR-LOC',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      {
        sender: 'Dr. James Whitfield',
        senderId: 'mft-gastro',
        text: 'Paul, I would value your opinion on the TEMS excision for Mrs Ashworth (MFT26-8803). The lesion is at the anterior wall below the peritoneal reflection. My concern is whether this represents a pT1 with clear deep margin or whether there is involvement of the muscularis propria. I have requested a second opinion flag on the system. Thank you.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        sender: 'Dr. Paul Carter',
        senderId: 'PATH-UK-001',
        text: 'James, I will review the slides this afternoon and add my opinion to the report. I will message you directly once done.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    ],
  },

  {
    id: 'uk-m5',
    senderId: 'mft-urology-2',
    senderName: 'Mr. David Whitmore',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'Pemberton — Positive surgical margin — Urology MDT Friday',
    body: 'Paul, I have been alerted to the positive surgical margin flag on Mr Pemberton\'s radical prostatectomy (MFT26-8804). Can you let me know the location and extent of the positive margin when your report is finalised? This will be critical for the adjuvant radiotherapy discussion at Friday\'s MDT.',
    caseNumber: 'MFT26-8804-PR-RP',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      {
        sender: 'Mr. David Whitmore',
        senderId: 'mft-urology-2',
        text: 'Paul, I have been alerted to the positive surgical margin flag on Mr Pemberton\'s radical prostatectomy (MFT26-8804). Can you let me know the location and extent of the positive margin when your report is finalised? This will be critical for the adjuvant radiotherapy discussion at Friday\'s MDT.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    ],
  },

  {
    id: 'uk-m7',
    senderId: 'mft-qa',
    senderName: 'Dr. Sarah Okafor',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'Informal case review — Hollingsworth, Patricia — Right hemicolectomy',
    body: 'Paul, I have completed my informal review of the right hemicolectomy for Mrs Hollingsworth (MFT26-8805). Overall I agree with the reporting. One point worth noting — the apical lymph node has a focus of extranodal extension which I feel should be explicitly mentioned in the final report. Happy to discuss. I have linked the case below for reference.',
    caseNumber: 'MFT26-8805-CR-FIN',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    isUrgent: false,
    isRead: false,
    isDeleted: false,
    thread: [
      {
        sender: 'Dr. Sarah Okafor',
        senderId: 'mft-qa',
        text: 'Paul, I have completed my informal review of the right hemicolectomy for Mrs Hollingsworth (MFT26-8805). Overall I agree with the reporting. One point worth noting — the apical lymph node has a focus of extranodal extension which I feel should be explicitly mentioned in the final report. Happy to discuss. I have linked the case below for reference.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      },
      {
        sender: 'Dr. Paul Carter',
        senderId: 'PATH-UK-001',
        text: 'Sarah, thank you — good spot. I will add a comment on the extranodal extension to the final report before sign-off. Paul.',
        timestamp: new Date(Date.now() - 1000 * 60 * 40),
      },
    ],
  },

  {
    id: 'uk-m8',
    senderId: 'mft-qasystem',
    senderName: 'PathScribe QA',
    recipientId: 'PATH-UK-001',
    recipientName: 'Dr. Paul Carter',
    subject: 'QA review request — Hartley, William — Anterior resection',
    body: 'A peer QA review has been requested for case MFT26-8801 (Hartley, William — anterior resection). Please review the synoptic report and complete the QA checklist: (1) Dataset completeness, (2) pTNM staging accuracy, (3) Margin assessment, (4) Lymph node yield adequacy. Target completion: prior to Wednesday MDT. Click the case link to open the report.',
    caseNumber: 'MFT26-8801-CR-RES',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isUrgent: false,
    isRead: true,
    isDeleted: false,
    thread: [
      {
        sender: 'PathScribe QA',
        senderId: 'mft-qasystem',
        text: 'A peer QA review has been requested for case MFT26-8801 (Hartley, William — anterior resection). Please review the synoptic report and complete the QA checklist: (1) Dataset completeness, (2) pTNM staging accuracy, (3) Margin assessment, (4) Lymph node yield adequacy. Target completion: prior to Wednesday MDT. Click the case link to open the report.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        sender: 'Dr. Paul Carter',
        senderId: 'PATH-UK-001',
        text: 'Reviewed. Dataset complete, pTNM staging confirmed T3 N1 M0. Proximal and distal margins clear. Lymph node yield 18 nodes — adequate per RCPath guidelines. No concerns.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        sender: 'PathScribe QA',
        senderId: 'mft-qasystem',
        text: 'QA review recorded. Thank you Dr. Carter. Report cleared for sign-off.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
      },
    ],
  },

 {
  id: 'uk-m6',
  senderId: 'mft-admin', // FIX: Added missing required property
  senderName: 'MFT Laboratory Admin',
  recipientId: 'PATH-UK-001',
  recipientName: 'Dr. Paul Carter',
  subject: `Pool case available — Right hemicolectomy emergency resection`,
  // Use backticks to safely handle apostrophes like "patient's" or "Carter's"
  body: `Dr. Carter, a STAT pool case has been added to the histopathology queue — MFT26-8809, Dorothy Whitworth, right hemicolectomy emergency resection. This case has not yet been assigned. Please accept from the pool if you are able to report today.`,
  caseNumber: 'MFT26-8809-POOL',
  timestamp: new Date(Date.now() - 1000 * 60 * 30),
  isUrgent: true,
  isRead: false,
  isDeleted: false,
  thread: [
    {
      sender: 'MFT Laboratory Admin',
      senderId: 'mft-admin',
      text: `Dr. Carter, a STAT pool case has been added to the histopathology queue — MFT26-8809, Dorothy Whitworth, right hemicolectomy emergency resection. This case has not yet been assigned. Please accept from the pool if you are able to report today.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ],
},

  // ── Amber Fehrs-Battey (PATH-US-001) — Michigan Pathology Associates ────────

  // Urgent: case-linked consultation request from ordering physician
  {
    id: 'mpa-001',
    senderId: 'u-priya-nair', senderName: 'Dr. Priya Nair',
    recipientId: 'PATH-US-001', recipientName: 'Dr. Amber Fehrs-Battey',
    subject: 'Urgent Query — MPA26-1001-BR',
    body: `Dr. Fehrs-Battey — the patient's oncologist is requesting clarification on the ER Allred score for case MPA26-1001-BR (Patricia Novak). They need it before the tumour board meeting tomorrow at 09:00. Please advise when you have a moment.`,
    caseNumber: 'MPA26-1001-BR',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isUrgent: true, isRead: false, isDeleted: false,
    thread: [
      { sender: 'Dr. Priya Nair', senderId: 'u-priya-nair',
        text: `Dr. Fehrs-Battey — the patient's oncologist is requesting clarification on the ER Allred score for case MPA26-1001-BR (Patricia Novak). They need it before the tumour board meeting tomorrow at 09:00. Please advise when you have a moment.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 45) },
    ],
  },

  // System: AI confidence alert on colorectal case
  {
    id: 'mpa-002',
    senderId: 'system', senderName: 'PathScribe AI',
    recipientId: 'PATH-US-001', recipientName: 'Dr. Amber Fehrs-Battey',
    subject: 'AI Confidence Alert — MPA26-1002-CR',
    body: 'PathScribe AI flagged low confidence (61%) on the Tumour Deposits field for case MPA26-1002-CR (Robert Dziedzic, colorectal resection). Manual review of the synoptic is recommended before sign-out. Case MPA26-1002-CR is ready for your review.',
    caseNumber: 'MPA26-1002-CR',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    isUrgent: false, isRead: false, isDeleted: false,
    thread: [
      { sender: 'PathScribe AI', senderId: 'system',
        text: 'PathScribe AI flagged low confidence (61%) on the Tumour Deposits field for case MPA26-1002-CR. Manual review recommended.',
        timestamp: new Date(Date.now() - 1000 * 60 * 90) },
    ],
  },

  // Pediatric access request auto-notification to Amber
  {
    id: 'mpa-003',
    senderId: 'system', senderName: 'PathScribe System',
    recipientId: 'PATH-US-001', recipientName: 'Dr. Amber Fehrs-Battey',
    subject: 'Pediatric Case Access Restricted — MPA26-1007-PED',
    body: 'You attempted to open case MPA26-1007-PED which contains a pediatric patient (age 8) from Metro General Hospital.\n\nAccess to this case requires authorization on the client record.\n\nTo request access:\n1. Go to Configuration → System → Client Dictionary\n2. Open Metro General Hospital\n3. Add your name to the Authorized Pediatric Pathologists list\n\nIf you believe this is an error, contact your System Administrator.',
    caseNumber: 'MPA26-1007-PED',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    isUrgent: false, isRead: false, isDeleted: false,
    thread: [
      { sender: 'PathScribe System', senderId: 'system',
        text: 'Access restricted: case MPA26-1007-PED contains a pediatric patient. See message for instructions to request authorization.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20) },
    ],
  },

  // Read: case assigned notification
  {
    id: 'mpa-004',
    senderId: 'u3', senderName: 'System Admin',
    recipientId: 'PATH-US-001', recipientName: 'Dr. Amber Fehrs-Battey',
    subject: 'Cases Assigned — MPA26-1001, 1002, 1003',
    body: 'Three new cases have been assigned to you from Michigan Pathology Associates:\n\n• MPA26-1001-BR — Breast lumpectomy, Patricia Novak\n• MPA26-1002-CR — Colorectal resection, Robert Dziedzic\n• MPA26-1003-PRO — Radical prostatectomy, Charles Okafor\n\nAll cases are available in your worklist. CAP synoptic templates have been pre-loaded.',
    caseNumber: undefined,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isUrgent: false, isRead: true, isDeleted: false,
    thread: [
      { sender: 'System Admin', senderId: 'u3',
        text: 'Three new cases assigned: MPA26-1001-BR, MPA26-1002-CR, MPA26-1003-PRO. All available in worklist.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    ],
  },

  // Read: LIS sync confirmation
  {
    id: 'mpa-005',
    senderId: 'system', senderName: 'PathScribe System',
    recipientId: 'PATH-US-001', recipientName: 'Dr. Amber Fehrs-Battey',
    subject: 'LIS Sync Complete — MPA26-1003-PRO',
    body: 'Gross description for case MPA26-1003-PRO (Charles Okafor, radical prostatectomy) has been received from the LIS and is now available in the synoptic editor. AI analysis is in progress.',
    caseNumber: 'MPA26-1003-PRO',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isUrgent: false, isRead: true, isDeleted: false,
    thread: [
      { sender: 'PathScribe System', senderId: 'system',
        text: 'LIS sync complete for MPA26-1003-PRO. Gross description available.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    ],
  },

  // ── Pediatric Access Routing Notification ────────────────────────────────
  {
    id: 'm-ped-001',
    senderId: 'system',
    senderName: 'PathScribe System',
    recipientId: 'u3',
    recipientName: 'System Admin',
    subject: '⚠️ Pediatric Case Requires Assignment — MPA26-1007-PED',
    body: 'Case MPA26-1007-PED (Liam Osei, age 8) was received from Metro General Hospital and could not be assigned to Dr. Amber Fehrs-Battey.\n\nReason: Metro General Hospital has a pediatric age threshold of 18 years. The assigned pathologist does not have Pediatric Access enabled on their role.\n\nThe case has been moved to the Pediatric — Awaiting Assignment pool and requires manual assignment to a qualified pathologist.\n\nTo resolve:\n• Assign the case to a pathologist with Pediatric Access, OR\n• Enable Pediatric Access on Dr. Fehrs-Battey\'s role in Configuration → Staff → Role Dictionary\n\nCase: Right radical nephrectomy, Wilms tumour (nephroblastoma), 7.2 cm.',
    caseNumber: 'MPA26-1007-PED',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    isUrgent: true,
    isRead: false,
    isDeleted: false,
    thread: [
      {
        sender: 'PathScribe System',
        senderId: 'system',
        text: 'Case MPA26-1007-PED automatically rerouted to Pediatric — Awaiting Assignment pool. Assigned pathologist PATH-US-001 lacks Pediatric Access permission.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
      },
    ],
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pathscribe_messages';
const MESSAGES_VERSION = '6'; // bumped: added Amber seed messages
const VERSION_KEY = 'pathscribe_messages_version';

const load = (): Message[] => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== MESSAGES_VERSION) {
    localStorage.setItem(VERSION_KEY, MESSAGES_VERSION);
    storageSet(STORAGE_KEY, SEED_MESSAGES);
    return SEED_MESSAGES;
  }
  return storageGet<Message[]>(STORAGE_KEY, SEED_MESSAGES);
};
const persist = (data: Message[]) => storageSet(STORAGE_KEY, data);
let MOCK_MESSAGES: Message[] = load();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok  = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

// ─── Service ──────────────────────────────────────────────────────────────────

export const mockMessageService: IMessageService = {

  async getInbox(userId: ID) {
    await delay();
    const inbox = MOCK_MESSAGES.filter(
      m => m.recipientId === userId || m.senderId === userId
    );
    return ok([...inbox]);
  },

  async getById(id: ID) {
    await delay();
    const m = MOCK_MESSAGES.find(m => m.id === id);
    return m ? ok({ ...m }) : err(`Message ${id} not found`);
  },

  async send(message) {
    await delay();
    const newMsg: Message = {
      ...message,
      id: 'm' + Date.now(),
      isRead: false,
      isDeleted: false,
      thread: [{
        sender: message.senderName,
        senderId: message.senderId,
        text: message.body,
        timestamp: message.timestamp,
      }],
    };
    MOCK_MESSAGES = [...MOCK_MESSAGES, newMsg];
    persist(MOCK_MESSAGES);
    await audit(
      'MESSAGE_SENT',
      `Message sent to ${message.recipientName} — Subject: "${message.subject}"${message.caseNumber ? ` — Case: ${message.caseNumber}` : ''}${message.isUrgent ? ' [URGENT]' : ''}`,
      message.senderName,
      message.caseNumber ?? null
    );
    return ok({ ...newMsg });
  },

  async reply(messageId: ID, senderId: ID, senderName: string, text: string) {
    await delay();
    const idx = MOCK_MESSAGES.findIndex(m => m.id === messageId);
    if (idx === -1) return err(`Message ${messageId} not found`);
    const newThread: MessageThread = { sender: senderName, senderId, text, timestamp: new Date() };
    MOCK_MESSAGES = MOCK_MESSAGES.map(m =>
      m.id === messageId
        ? { ...m, body: text, thread: [...(m.thread || []), newThread] }
        : m
    );
    persist(MOCK_MESSAGES);
    const msg = MOCK_MESSAGES[idx];
    await audit(
      'MESSAGE_REPLIED',
      `Reply sent to ${msg.senderName} — Subject: "${msg.subject}"${msg.caseNumber ? ` — Case: ${msg.caseNumber}` : ''}`,
      senderName,
      msg.caseNumber ?? null
    );
    return ok({ ...MOCK_MESSAGES[idx] });
  },

  async markRead(id: ID) {
    await delay();
    const idx = MOCK_MESSAGES.findIndex(m => m.id === id);
    if (idx === -1) return err(`Message ${id} not found`);
    MOCK_MESSAGES = MOCK_MESSAGES.map(m => m.id === id ? { ...m, isRead: true } : m);
    persist(MOCK_MESSAGES);
    return ok({ ...MOCK_MESSAGES[idx], isRead: true });
  },

  async markAllRead(userId: ID) {
    await delay();
    MOCK_MESSAGES = MOCK_MESSAGES.map(m =>
      m.recipientId === userId ? { ...m, isRead: true } : m
    );
    persist(MOCK_MESSAGES);
    return ok(undefined);
  },

  async softDelete(id: ID) {
    await delay();
    const idx = MOCK_MESSAGES.findIndex(m => m.id === id);
    if (idx === -1) return err(`Message ${id} not found`);
    const target = MOCK_MESSAGES[idx];
    MOCK_MESSAGES = MOCK_MESSAGES.map(m => m.id === id ? { ...m, isDeleted: true } : m);
    persist(MOCK_MESSAGES);
    await audit(
      'MESSAGE_DELETED',
      `Message moved to Recently Deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
      target.recipientName,
      target.caseNumber ?? null
    );
    return ok({ ...MOCK_MESSAGES[idx], isDeleted: true });
  },

  async restore(id: ID) {
    await delay();
    const idx = MOCK_MESSAGES.findIndex(m => m.id === id);
    if (idx === -1) return err(`Message ${id} not found`);
    const target = MOCK_MESSAGES[idx];
    MOCK_MESSAGES = MOCK_MESSAGES.map(m => m.id === id ? { ...m, isDeleted: false } : m);
    persist(MOCK_MESSAGES);
    await audit(
      'MESSAGE_RESTORED',
      `Message restored from Recently Deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
      target.recipientName,
      target.caseNumber ?? null
    );
    return ok({ ...MOCK_MESSAGES[idx], isDeleted: false });
  },

  async permanentDelete(id: ID) {
    await delay();
    const target = MOCK_MESSAGES.find(m => m.id === id);
    MOCK_MESSAGES = MOCK_MESSAGES.filter(m => m.id !== id);
    persist(MOCK_MESSAGES);
    if (target) {
      await audit(
        'MESSAGE_PERMANENTLY_DELETED',
        `Message permanently deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
        target.recipientName,
        target.caseNumber ?? null
      );
    }
    return ok(undefined);
  },

  async emptyDeleted(userId: ID) {
    await delay();
    const toDelete = MOCK_MESSAGES.filter(
      m => m.isDeleted && (m.recipientId === userId || m.senderId === userId)
    );
    MOCK_MESSAGES = MOCK_MESSAGES.filter(
      m => !(m.isDeleted && (m.recipientId === userId || m.senderId === userId))
    );
    persist(MOCK_MESSAGES);
    const actor = toDelete[0]?.recipientName ?? userId;
    await audit(
      'INBOX_EMPTIED',
      `Recently Deleted emptied — ${toDelete.length} message(s) permanently removed`,
      actor,
      null
    );
    return ok(undefined);
  },
};

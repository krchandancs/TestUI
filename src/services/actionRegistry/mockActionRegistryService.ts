import { IActionRegistryService, SystemAction } from './IActionRegistryService';
import { ACTION_MAP, VOICE_CONTEXT } from '../../constants/systemActions';

// ─────────────────────────────────────────────────────────────────────────────
// Categories always eligible regardless of current context
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CATEGORIES = new Set(['SYSTEM', 'NAVIGATION']);

// ─────────────────────────────────────────────────────────────────────────────
// Actions dispatched via custom DOM events rather than internalKey keyboard
// events — either React state targets, browser-reserved keys, or dictation.
// Pattern: PATHSCRIBE_<ACTION_ID>
// ─────────────────────────────────────────────────────────────────────────────
const CUSTOM_EVENT_ACTIONS = new Set([
  //Delegation Module
  'DELEGATE_PEER_REVIEW', 
  'DELEGATE_FORMAL_CONSULT', 
  'DELEGATE_FULL_TRANSFER',
  'DELEGATE_CONFIRM',
  'OPEN_DELEGATE_MODAL',
  // Page navigation (React Router)
  'OPEN_MESSAGES', 'OPEN_WORKLIST', 'OPEN_CONFIGURATION',
  'OPEN_SEARCH', 'OPEN_AUDIT', 'OPEN_CONTRIBUTION', 'OPEN_HOME',
  'GO_BACK', 'GO_FORWARD',
  // Case navigation (React Router)
  'NEXT_CASE', 'PREVIOUS_CASE',
  // Tab switching (component state)
  'NEXT_TAB', 'PREVIOUS_TAB',
  // Table navigation (component state)
  'TABLE_NEXT', 'TABLE_PREVIOUS', 'TABLE_PAGE_DOWN', 'TABLE_PAGE_UP',
  'TABLE_FIRST', 'TABLE_LAST', 'TABLE_SELECT', 'TABLE_SELECT_ALL',
  'TABLE_DESELECT_ALL', 'TABLE_OPEN_SELECTED', 'TABLE_REFRESH',
  'TABLE_SORT_DATE', 'TABLE_SORT_PRIORITY', 'TABLE_SORT_STATUS',
  'TABLE_FILTER_URGENT', 'TABLE_FILTER_REVIEW', 'TABLE_FILTER_COMPLETED', 'TABLE_FILTER_PHYSICIAN', 'TABLE_CLEAR_FILTER', 'TABLE_CLEAR_SORT',
  'TABLE_SEARCH', 'TABLE_CLEAR_SEARCH', 'TABLE_REFINE_SEARCH',
  'READ_FLAGS', 'READ_SPECIMEN',
  'TABLE_SORT_BY_COLUMN',
  'TABLE_DELETE',
  // Messages (component state in AppShell)
  'MSG_NEXT', 'MSG_PREVIOUS', 'MSG_REPLY', 'MSG_DELETE',
  'MSG_MARK_READ', 'MSG_MARK_READ_ALL', 'MSG_MARK_UNREAD', 'MSG_MARK_URGENT',
  'MSG_COMPOSE', 'MSG_SEND', 'MSG_CLOSE', 'MSG_SEARCH', 'MSG_EDIT',
  'MSG_VIEW_DELETED', 'MSG_VIEW_MESSAGES', 'MSG_RESTORE',
  'MSG_DELETE_ALL', 'MSG_URGENT',
  'MSG_CLEAR_SUBJECT', 'MSG_CLEAR_BODY',
  'MSG_GOTO_SUBJECT', 'MSG_GOTO_BODY',
  'MSG_RECIPIENT_SEARCH', 'MSG_RECIPIENT_ADD', 'MSG_SECURE_EMAIL',
  // Home page
  'OPEN_ENHANCEMENT_REQUEST', 'OPEN_TESTING_FEEDBACK',
  'VIEW_HELP', 'OPEN_RESOURCES', 'SYSTEM_LOGOUT',
  // Dictation (VoiceProvider)
  'ENTER_GROSS', 'ENTER_MICRO', 'ENTER_DIAGNOSIS', 'ENTER_ADDENDUM',
  // Synoptic field navigation
  'NEXT_UNANSWERED', 'NEXT_REQUIRED', 'CONFIRM_FIELD', 'EDIT_FIELD', 'SKIP_FIELD',
  // Synoptic view toggles
  'FULL_VIEW', 'TABBED_VIEW', 'MAX_VIEW', 'MIN_VIEW', 'PREVIEW_REPORT',
  // Synoptic modal openers
  'VOICE_CASE_COMMENT', 'VOICE_SPECIMEN_COMMENT', 'VOICE_INTERNAL_NOTE', 'VOICE_ADD_SYNOPTIC', 'VOICE_FLAGS',
  // Internal notes drawer actions
  'NOTE_ADD', 'NOTE_DICTATE', 'NOTE_VISIBILITY_PRIVATE', 'NOTE_VISIBILITY_SHARED', 'NOTE_SAVE', 'NOTE_CANCEL', 'NOTE_CLOSE',
  // Finalisation flow
  'OPEN_PRE_FINALISE', 'FINALISE_AND_NEXT', 'FINALISE_CONFIRM', 'FINALISE_CANCEL',
  // Post-finalization
  'ADD_ADDENDUM', 'ADD_AMENDMENT', 'SIGNOUT_NEXT',
  // Navigation + cancel
  'GOTO_CODES', 'SELECT_SPECIMEN', 'OPEN_HISTORY', 'CLOSE_HISTORY', 'VOICE_CANCEL',
  // Codes panel
  'VOICE_ADD_CODE',
  // AI Review Mode (triage before finalize)
  'AI_REVIEW_CONFIRM', 'AI_REVIEW_OVERRIDE', 'AI_REVIEW_SKIP', 'AI_REVIEW_NEXT', 'AI_REVIEW_CANCEL',
  // Pool Case actions
  'POOL_ACCEPT_CASE', 'POOL_PASS_CASE',
  // Case Team actions
  'OPEN_CASE_TEAM', 'CASE_TEAM_ADD', 'CASE_TEAM_ASSIGN',
  // Worklist participation filters
  'TABLE_FILTER_PARTICIPATING', 'TABLE_FILTER_COUNTERSIGN', 'TABLE_FILTER_POOL',
  // Config navigation
  'OPEN_ROUTING_RULES', 'TEST_ROUTING', 'OPEN_PARTICIPATION_TYPES',
  'COMP_OPEN_SIDECAR', 'COMP_ORDER_OPEN', 'COMP_ORDER_PLACE', 'COMP_ORDER_CANCEL',
  'FLAG_OPEN_MANAGER', 'FLAG_APPLY_STAT',
  'SAVE_DRAFT', 'DISCARD_CHANGES', 'TEMPLATE_SELECT',
  // Search page
  'SEARCH_EXECUTE', 'SEARCH_CLEAR', 'SEARCH_LOAD_SAVED',
  // Flag manager
  'FLAG_SELECT_CASE', 'FLAG_SELECT_ALL_SPECIMENS', 'FLAG_DESELECT_ALL', 'FLAG_SAVE', 'FLAG_CANCEL',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Full action registry
//
// VOICE TRIGGER RULES
// ───────────────────
// · Minimum two words for most triggers (prevents mid-sentence false fires)
// · Single-word exceptions: unambiguous domain words in narrow contexts
//   e.g. 'worklist', 'reply', 'restore' — unlikely in normal speech for that context
// · Compound words include both joined and split variants for Web Speech API
// · SIGN_OUT requires 'case' qualifier to avoid collision with system logout
// · 'save' alone removed — fires too easily mid-sentence
// · 'macro' alone removed — appears naturally in clinical dictation
//
// DELETE DISAMBIGUATION (Messages)
// ──────────────────────────────────
// "delete" means different things depending on UI state:
//   Normal view  → MSG_DELETE   (soft delete focused message)
//   Edit mode    → MSG_DELETE   (soft delete selected messages — same action, UI handles state)
//   Deleted view → MSG_DELETE   (permanent delete — AppShell checks filterType)
//   "delete all" → MSG_DELETE_ALL (always explicit)
// The AppShell listener checks filterType/isEditing to route correctly.
// ─────────────────────────────────────────────────────────────────────────────

const SEED_ACTIONS: SystemAction[] = [

// ── DELEGATION — Case Hand-off & Review ────────────────────────────────────
  {
    id: 'OPEN_DELEGATE_MODAL', 
    label: 'Open Delegation Menu', 
    category: 'SYNOPTIC',
    shortcut: 'Alt+D', 
    internalKey: 'F13+PS150',
    voiceTriggers: ['open delegation', 'delegate case', 'transfer case', 'show handoff'],
    learnedTriggers: [], 
    requiredRole: 'Pathologist', 
    isActive: true,
  },
  {
    id: 'DELEGATE_PEER_REVIEW', 
    label: 'Select Peer Review', 
    category: 'SYNOPTIC',
    shortcut: 'Alt+1', 
    internalKey: 'F13+PS151',
    voiceTriggers: ['request peer review', 'internal review', 'informal opinion'],
    learnedTriggers: [], 
    requiredRole: 'Pathologist', 
    isActive: true,
  },
  {
    id: 'DELEGATE_FORMAL_CONSULT', 
    label: 'Select Formal Consult', 
    category: 'SYNOPTIC',
    shortcut: 'Alt+2', 
    internalKey: 'F13+PS152',
    voiceTriggers: ['formal consultation', 'add consultant', 'official consult'],
    learnedTriggers: [], 
    requiredRole: 'Pathologist', 
    isActive: true,
  },
  {
    id: 'DELEGATE_FULL_TRANSFER', 
    label: 'Select Full Transfer', 
    category: 'SYNOPTIC',
    shortcut: 'Alt+3', 
    internalKey: 'F13+PS153',
    voiceTriggers: ['full transfer', 'transfer ownership', 'assign to pool'],
    learnedTriggers: [], 
    requiredRole: 'Pathologist', 
    isActive: true,
  },
  {
    id: 'DELEGATE_CONFIRM', 
    label: 'Confirm Delegation', 
    category: 'SYNOPTIC',
    shortcut: 'Ctrl+Enter', 
    internalKey: 'F13+PS154',
    voiceTriggers: ['confirm delegation', 'send case', 'complete transfer'],
    learnedTriggers: [], 
    requiredRole: 'Pathologist', 
    isActive: true,
  },

  // ── AI REVIEW MODE — Triage before finalize ──────────────────────────────
  {
    id: 'AI_REVIEW_CONFIRM',
    label: 'Confirm AI Finding',
    category: 'SYNOPTIC',
    shortcut: 'Space',
    internalKey: 'F13+PS160',
    voiceTriggers: ['confirm', 'accept', 'agree', 'correct', 'confirm finding', 'accept finding'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'AI_REVIEW_OVERRIDE',
    label: 'Override AI Finding',
    category: 'SYNOPTIC',
    shortcut: 'O',
    internalKey: 'F13+PS161',
    voiceTriggers: ['override', 'incorrect', 'wrong', 'override finding', 'ai is wrong', 'change this'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'AI_REVIEW_SKIP',
    label: 'Skip AI Finding',
    category: 'SYNOPTIC',
    shortcut: 'S',
    internalKey: 'F13+PS162',
    voiceTriggers: ['skip', 'skip this', 'next field', 'move on', 'skip finding'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'AI_REVIEW_CANCEL',
    label: 'Cancel AI Review',
    category: 'SYNOPTIC',
    shortcut: 'Escape',
    internalKey: 'F13+PS163',
    voiceTriggers: ['cancel review', 'exit review', 'stop review', 'go back'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── POOL CASES ────────────────────────────────────────────────────────────
  {
    id: 'POOL_ACCEPT_CASE',
    label: 'Accept Pool Case',
    category: 'SYNOPTIC',
    shortcut: 'Alt+A',
    internalKey: 'F13+PS165',
    voiceTriggers: ['accept case', 'take this case', 'assign to me', 'accept'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'POOL_PASS_CASE',
    label: 'Pass Pool Case',
    category: 'SYNOPTIC',
    shortcut: 'Alt+P',
    internalKey: 'F13+PS166',
    voiceTriggers: ['pass case', 'skip case', 'return to pool', 'pass'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── SYSTEM — always available ─────────────────────────────────────────────
  {
    id: 'OPEN_HOME', label: 'Go Home', category: 'SYSTEM',
    shortcut: 'Alt+H', internalKey: ACTION_MAP['system.openWorklist']?.internalKey ?? 'F13+PS002',
    voiceTriggers: ['go home', 'home page', 'go to home', 'open home'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_MESSAGES', label: 'Open Messages', category: 'SYSTEM',
    shortcut: 'Alt+I', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['open messages', 'open message', 'show messages', 'messages'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_WORKLIST', label: 'Open Worklist', category: 'NAVIGATION',
    shortcut: 'Alt+W', internalKey: ACTION_MAP['system.openWorklist']?.internalKey ?? 'F13+PS002',
    voiceTriggers: [
      'open worklist', 'go to worklist', 'show worklist', 'worklist',
      'open work list', 'go to work list', 'show work list', 'work list',
    ],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'GO_BACK', label: 'Go Back', category: 'SYSTEM',
    shortcut: 'Alt+ArrowLeft', internalKey: ACTION_MAP['system.goBack']?.internalKey ?? 'F13+PS003',
    voiceTriggers: ['go back', 'back', 'previous page', 'go to previous page'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'GO_FORWARD', label: 'Go Forward', category: 'SYSTEM',
    shortcut: 'Alt+ArrowRight', internalKey: ACTION_MAP['system.goForward']?.internalKey ?? 'F13+PS004',
    voiceTriggers: ['go forward', 'forward', 'next page', 'go to next page'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_CONFIGURATION', label: 'Open Configuration', category: 'NAVIGATION',
    shortcut: 'Alt+C', internalKey: ACTION_MAP['system.openConfiguration']?.internalKey ?? 'F13+PS007',
    voiceTriggers: [
      'open configuration', 'go to configuration', 'configuration',
      'open config', 'go to config', 'config', 'open settings', 'settings',
    ],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_SEARCH', label: 'Open Search', category: 'NAVIGATION',
    shortcut: 'Alt+F', internalKey: ACTION_MAP['system.openSearch']?.internalKey ?? 'F13+PS008',
    voiceTriggers: ['open search', 'go to search', 'search cases', 'find case', 'search'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_AUDIT', label: 'System Audit', category: 'NAVIGATION',
    shortcut: 'Alt+U', internalKey: ACTION_MAP['system.openAudit']?.internalKey ?? 'F13+PS009',
    voiceTriggers: ['open audit', 'system audit', 'open system audit', 'go to audit', 'audit log', 'audit'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_CONTRIBUTION', label: 'My Contribution', category: 'NAVIGATION',
    shortcut: 'Alt+K', internalKey: ACTION_MAP['system.openContribution']?.internalKey ?? 'F13+PS010',
    voiceTriggers: ['my contribution', 'open my contribution', 'go to my contribution', 'contribution'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── HOME page actions — SYSTEM category (available from home screen) ───────
  {
    id: 'OPEN_ENHANCEMENT_REQUEST', label: 'Open Enhancement Request', category: 'SYSTEM',
    shortcut: '', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['open enhancement request', 'enhancement request', 'open enhancement'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_TESTING_FEEDBACK', label: 'Open Testing Feedback', category: 'SYSTEM',
    shortcut: '', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['open testing feedback', 'testing feedback', 'QA feedback', 'open feedback'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VIEW_HELP', label: 'View System Help', category: 'SYSTEM',
    shortcut: '', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['view help', 'open help', 'system help', 'show help', 'help'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_RESOURCES', label: 'Open Clinical Resources', category: 'SYSTEM',
    shortcut: '', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['open resources', 'clinical resources', 'open clinical resources', 'quick links', 'open quick links'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // "log out" used as trigger — avoids collision with "sign out case" in reporting context
    id: 'SYSTEM_LOGOUT', label: 'Log Out', category: 'SYSTEM',
    shortcut: '', internalKey: ACTION_MAP['system.openMessages']?.internalKey ?? 'F13+PS001',
    voiceTriggers: ['log out', 'sign out system', 'logout', 'log me out'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── CASE NAVIGATION — always available ────────────────────────────────────
  {
    id: 'NEXT_CASE', label: 'Next Case', category: 'NAVIGATION',
    shortcut: 'Alt+N', internalKey: ACTION_MAP['nav.nextCase']?.internalKey ?? 'F14+PS001',
    voiceTriggers: ['next case', 'go to next case', 'next patient', 'open next case'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'PREVIOUS_CASE', label: 'Previous Case', category: 'NAVIGATION',
    shortcut: 'Alt+P', internalKey: ACTION_MAP['nav.previousCase']?.internalKey ?? 'F14+PS002',
    voiceTriggers: ['previous case', 'go to previous case', 'prior case', 'last case', 'open previous case'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NEXT_TAB', label: 'Next Tab / Section', category: 'NAVIGATION',
    shortcut: 'Alt+.', internalKey: ACTION_MAP['nav.nextTab']?.internalKey ?? 'F14+PS003',
    voiceTriggers: ['next tab', 'go to next tab', 'tab right', 'next section', 'go to next section'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'PREVIOUS_TAB', label: 'Previous Tab / Section', category: 'NAVIGATION',
    shortcut: 'Alt+,', internalKey: ACTION_MAP['nav.previousTab']?.internalKey ?? 'F14+PS004',
    voiceTriggers: ['previous tab', 'go to previous tab', 'tab left', 'prior tab', 'previous section', 'go to previous section', 'prior section'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── TABLE / LIST NAVIGATION — WORKLIST + SEARCH contexts ─────────────────
  {
    id: 'TABLE_NEXT', label: 'Next Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+ArrowDown', internalKey: ACTION_MAP['table.next']?.internalKey ?? 'F15+PS001',
    voiceTriggers: ['next', 'next row', 'move down', 'down one'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_PREVIOUS', label: 'Previous Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+ArrowUp', internalKey: ACTION_MAP['table.previous']?.internalKey ?? 'F15+PS002',
    voiceTriggers: ['previous', 'previous row', 'move up', 'up one', 'prior row'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_PAGE_DOWN', label: 'Page Down', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+PageDown', internalKey: ACTION_MAP['table.pageDown']?.internalKey ?? 'F15+PS003',
    voiceTriggers: ['page down', 'scroll down', 'more results'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_PAGE_UP', label: 'Page Up', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+PageUp', internalKey: ACTION_MAP['table.pageUp']?.internalKey ?? 'F15+PS004',
    voiceTriggers: ['page up', 'scroll up', 'back to top'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_FIRST', label: 'First Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+Home', internalKey: ACTION_MAP['table.first']?.internalKey ?? 'F15+PS005',
    voiceTriggers: ['first', 'go to first', 'top of list', 'first row', 'beginning'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_LAST', label: 'Last Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+End', internalKey: ACTION_MAP['table.last']?.internalKey ?? 'F15+PS006',
    voiceTriggers: ['last', 'go to last', 'end of list', 'last row', 'bottom'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SELECT', label: 'Select Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+Space', internalKey: ACTION_MAP['table.select']?.internalKey ?? 'F15+PS007',
    voiceTriggers: ['select', 'select this', 'select row', 'check this', 'tick this'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SELECT_ALL', label: 'Select All', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+Shift+A', internalKey: ACTION_MAP['table.selectAll']?.internalKey ?? 'F15+PS008',
    voiceTriggers: ['select all', 'check all', 'tick all', 'select everything'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_DESELECT_ALL', label: 'Deselect All', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+Shift+D', internalKey: ACTION_MAP['table.deselectAll']?.internalKey ?? 'F15+PS009',
    voiceTriggers: ['deselect all', 'clear selection', 'uncheck all', 'deselect everything'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_OPEN_SELECTED', label: 'Open Selected', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+Enter', internalKey: ACTION_MAP['table.openSelected']?.internalKey ?? 'F15+PS010',
    voiceTriggers: ['open', 'open selected', 'open case', 'open this case', 'select this case'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_REFRESH', label: 'Refresh', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+R', internalKey: ACTION_MAP['table.refresh']?.internalKey ?? 'F15+PS011',
    voiceTriggers: ['refresh', 'reload', 'refresh list', 'refresh worklist', 'update list'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SORT_DATE', label: 'Sort by Date', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.sortByDate']?.internalKey ?? 'F15+PS012',
    voiceTriggers: ['sort by date', 'sort by time', 'order by date', 'newest first'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SORT_PRIORITY', label: 'Sort by Priority', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.sortByPriority']?.internalKey ?? 'F15+PS013',
    voiceTriggers: ['sort by priority', 'urgent first', 'show urgent first', 'order by priority'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SORT_STATUS', label: 'Sort by Status', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.sortByStatus']?.internalKey ?? 'F15+PS014',
    voiceTriggers: ['sort by status', 'order by status', 'group by status'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_FILTER_URGENT', label: 'Filter Urgent', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS015',
    voiceTriggers: ['filter urgent', 'urgent cases', 'filter stat', 'stat cases', 'show urgent'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_FILTER_REVIEW', label: 'Filter Needs Review', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS015',
    voiceTriggers: ['filter needs review', 'filter review', 'needs review', 'show needs review'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_FILTER_PHYSICIAN', label: 'Filter by Physician', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS016',
    voiceTriggers: ['filter by', 'cases by', 'show cases by', 'physician filter'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'READ_FLAGS', label: 'Read Flags', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS017',
    voiceTriggers: ['read flags', 'what are the flags', 'case flags', 'list flags'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'READ_SPECIMEN', label: 'Read Specimen', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS018',
    voiceTriggers: ['read specimen', 'what is the specimen', 'specimen type', 'confirm specimen'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
{
    id: 'TABLE_FILTER_COMPLETED',
    label: 'Filter Completed',
    category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', 
    internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS020',
    voiceTriggers: ['filter completed', 'show completed', 'completed cases', 'show completed cases'],
    learnedTriggers: [], 
    requiredRole: 'All Staff', 
    isActive: true,
  },
  {
    id: 'TABLE_CLEAR_FILTER', label: 'Clear Filter', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.clearFilter']?.internalKey ?? 'F15+PS016',
    voiceTriggers: ['clear filter', 'remove filter', 'show all', 'reset filter', 'clear filters', 'show all cases'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SORT_BY_COLUMN', label: 'Sort By Column', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.filterUrgent']?.internalKey ?? 'F15+PS019',
    voiceTriggers: ['sort by', 'sort column', 'order by'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_CLEAR_SORT', label: 'Clear Sort', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.clearFilter']?.internalKey ?? 'F15+PS016',
    voiceTriggers: ['clear sort', 'remove sort', 'reset sort', 'clear sorting'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_SEARCH', label: 'Search', category: VOICE_CONTEXT.WORKLIST,
    shortcut: 'Alt+/', internalKey: ACTION_MAP['table.search']?.internalKey ?? 'F15+PS017',
    voiceTriggers: ['search worklist', 'find in list', 'search the list'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABLE_CLEAR_SEARCH', label: 'Clear Search', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.clearSearch']?.internalKey ?? 'F15+PS018',
    voiceTriggers: ['clear search', 'clear the search', 'remove search', 'reset search'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Worklist filter for completed cases
    id: 'TABLE_FILTER_COMPLETED', label: 'Show Completed', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.clearSearch']?.internalKey ?? 'F15+PS018',
    voiceTriggers: ['show completed', 'completed cases', 'filter completed', 'show completed cases'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Delete a row in a table — context guards which tables support this
    id: 'TABLE_DELETE', label: 'Delete Row', category: VOICE_CONTEXT.WORKLIST,
    shortcut: '', internalKey: ACTION_MAP['table.clearSearch']?.internalKey ?? 'F15+PS018',
    voiceTriggers: ['delete row', 'delete this row', 'remove row', 'delete entry'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── REPORTING ACTIONS ─────────────────────────────────────────────────────
  {
    id: 'SAVE_DRAFT', label: 'Save Draft', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+S', internalKey: ACTION_MAP['system.saveDraft']?.internalKey ?? 'F13+PS005',
    voiceTriggers: ['save draft', 'save report', 'save my draft', 'save the report'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'INSERT_MACRO', label: 'Insert Macro', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+M', internalKey: ACTION_MAP['editor.insertMacro']?.internalKey ?? 'F16+PS005',
    voiceTriggers: ['insert macro', 'add macro'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'SIGN_OUT', label: 'Sign Out Case', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+Shift+S', internalKey: ACTION_MAP['system.signOut']?.internalKey ?? 'F13+PS006',
    voiceTriggers: ['sign out case', 'sign out the case', 'case sign out'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'OPEN_PRE_FINALISE', label: 'Finalise Report', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+F', internalKey: (ACTION_MAP as any)['system.finalise']?.internalKey ?? 'F13+PS010',
    voiceTriggers: [
      'finalise', 'finalize', 'finalise report', 'finalize report',
      'finalise case', 'finalize case', 'sign off', 'sign off report',
      'submit report', 'complete report',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'FINALISE_AND_NEXT', label: 'Finalise and Next Case', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+Shift+F', internalKey: (ACTION_MAP as any)['system.finaliseNext']?.internalKey ?? 'F13+PS011',
    voiceTriggers: [
      'finalise and next', 'finalize and next',
      'finalise next', 'finalize next',
      'sign off and next', 'complete and next',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'FINALISE_CONFIRM', label: 'Confirm Finalise', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: '',
    voiceTriggers: ['confirm finalise', 'confirm finalize', 'confirm sign off', 'yes finalise', 'yes finalize'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'FINALISE_CANCEL', label: 'Cancel Finalise', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Escape', internalKey: '',
    voiceTriggers: ['cancel finalise', 'cancel finalize', 'cancel sign off', 'go back'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'NEXT_FIELD', label: 'Next Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Tab', internalKey: ACTION_MAP['editor.nextField']?.internalKey ?? 'F16+PS001',
    voiceTriggers: [
      'next field', 'next question', 'go forward', 'forward',
      'tab forward', 'move to next field', 'move forward', 'next item',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'PREVIOUS_FIELD', label: 'Previous Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Shift+Tab', internalKey: ACTION_MAP['editor.previousField']?.internalKey ?? 'F16+PS002',
    voiceTriggers: [
      'previous field', 'previous question', 'go back', 'back',
      'tab back', 'move to previous field', 'go back one field', 'back one', 'prior field',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },

  // ── DICTATION TARGETS ─────────────────────────────────────────────────────
  {
    id: 'ENTER_GROSS', label: 'Enter Gross Description', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+G', internalKey: ACTION_MAP['diagnosis.grossDescription']?.internalKey ?? 'F17+PS001',
    voiceTriggers: [
      'enter gross', 'start gross', 'dictate gross',
      'gross description', 'enter gross description', 'start gross description',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'ENTER_MICRO', label: 'Enter Microscopic Description', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+Shift+G', internalKey: ACTION_MAP['diagnosis.microscopicDescription']?.internalKey ?? 'F17+PS002',
    voiceTriggers: [
      'enter micro', 'start micro', 'dictate micro',
      'microscopic description', 'enter microscopic description',
      'micro scopic description', 'my croscopic description',
      'enter micro scopic', 'start micro scopic',
    ],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'ENTER_DIAGNOSIS', label: 'Enter Diagnosis', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+D', internalKey: ACTION_MAP['diagnosis.enterDiagnosis']?.internalKey ?? 'F17+PS003',
    voiceTriggers: ['enter diagnosis', 'start diagnosis', 'dictate diagnosis', 'add diagnosis'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },
  {
    id: 'ENTER_ADDENDUM', label: 'Enter Addendum', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+Shift+D', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS004',
    voiceTriggers: ['enter addendum', 'add addendum', 'start addendum', 'dictate addendum'],
    learnedTriggers: [], requiredRole: 'Pathologist', isActive: true,
  },

  // ── Synoptic field navigation ──────────────────────────────────────────────
  {
    id: 'NEXT_UNANSWERED', label: 'Next Unanswered Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+U', internalKey: 'F17+PS005',
    voiceTriggers: ['next unanswered', 'go to next unanswered', 'next empty field', 'next field', 'next blank'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NEXT_REQUIRED', label: 'Next Required Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+R', internalKey: 'F17+PS006',
    voiceTriggers: ['next required', 'go to next required', 'next required field', 'show required'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'CONFIRM_FIELD', label: 'Confirm Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+C', internalKey: 'F17+PS007',
    // Kept distinct from AI_REVIEW_CONFIRM — this fires in REPORTING context (normal work),
    // AI_REVIEW_CONFIRM fires in SYNOPTIC context (triage modal only)
    voiceTriggers: ['confirm field', 'accept field', 'approve field', 'confirm answer', 'accept answer'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'EDIT_FIELD', label: 'Edit Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+E', internalKey: 'F17+PS008',
    voiceTriggers: ['edit field', 'change field', 'correct field', 'modify field', 'override field'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'SKIP_FIELD', label: 'Skip Field', category: VOICE_CONTEXT.REPORTING,
    shortcut: 'Alt+S', internalKey: 'F17+PS009',
    voiceTriggers: ['skip field', 'skip this field', 'move on', 'leave blank'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'FULL_VIEW', label: 'Full View', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS010',
    voiceTriggers: ['full view', 'show full view', 'expand view', 'all sections'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'TABBED_VIEW', label: 'Tabbed View', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS011',
    voiceTriggers: ['tabbed view', 'show tabbed view', 'tab view', 'collapse view'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MAX_VIEW', label: 'Maximise View', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS012',
    voiceTriggers: ['max', 'maximise', 'maximize', 'full screen', 'expand screen'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MIN_VIEW', label: 'Minimise View', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS013',
    voiceTriggers: ['min', 'minimise', 'minimize', 'exit full screen', 'restore view'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'PREVIEW_REPORT', label: 'Preview Report', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS014',
    voiceTriggers: ['preview report', 'show preview', 'report preview', 'preview'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_CASE_COMMENT', label: 'Case Comment', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS015',
    voiceTriggers: ['case comment', 'open case comment', 'add case comment', 'dictate case comment'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_SPECIMEN_COMMENT', label: 'Specimen Comment', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS016',
    voiceTriggers: ['specimen comment', 'open specimen comment', 'add specimen comment', 'dictate specimen comment'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_INTERNAL_NOTE', label: 'Internal Note', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS017',
    voiceTriggers: ['internal note', 'open internal note', 'add note', 'open notes'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_ADD_SYNOPTIC', label: 'Add Synoptic', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS018',
    voiceTriggers: ['add synoptic', 'open add synoptic', 'add report', 'new synoptic'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_FLAGS', label: 'Flags', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS019',
    voiceTriggers: ['flags', 'open flags', 'flag manager', 'manage flags'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_ADD', label: 'Add Note', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS020',
    voiceTriggers: ['add note', 'new note', 'open add note'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_DICTATE', label: 'Dictate Note', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS021',
    voiceTriggers: ['dictate note', 'dictate', 'dictate into note'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_VISIBILITY_PRIVATE', label: 'Note Visibility Private', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS022',
    voiceTriggers: ['visibility private', 'set private', 'private note', 'make private'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_VISIBILITY_SHARED', label: 'Note Visibility Shared', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS023',
    voiceTriggers: ['visibility shared', 'set shared', 'shared note', 'make shared'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_SAVE', label: 'Save Note', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS024',
    voiceTriggers: ['save note', 'submit note', 'save'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_CANCEL', label: 'Cancel Note', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS025',
    voiceTriggers: ['cancel note', 'discard note'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'NOTE_CLOSE', label: 'Close Notes', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS026',
    voiceTriggers: ['close notes', 'close drawer', 'close internal notes'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'ADD_ADDENDUM', label: 'Add Addendum', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS027',
    voiceTriggers: ['add addendum', 'open addendum', 'addendum request', 'request addendum'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'ADD_AMENDMENT', label: 'Add Amendment', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS028',
    voiceTriggers: ['add amendment', 'open amendment', 'request amendment', 'amendment'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'SIGNOUT_NEXT', label: 'Sign Out and Next', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS029',
    voiceTriggers: ['signout next', 'sign out next', 'finalize and next', 'sign out and next', 'next case sign out'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'GOTO_CODES', label: 'Go to Codes', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS030',
    voiceTriggers: ['goto codes', 'go to codes', 'codes tab', 'open codes'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_ADD_CODE', label: 'Add Code', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS040',
    voiceTriggers: ['add code', 'open add code', 'new code', 'add medical code'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'SELECT_SPECIMEN', label: 'Select Specimen', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS031',
    voiceTriggers: ['select specimen', 'goto specimen', 'go to specimen', 'specimen one', 'specimen two', 'specimen three', 'specimen 1', 'specimen 2', 'specimen 3'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'OPEN_HISTORY', label: 'Open History', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS032',
    voiceTriggers: ['open history', 'show history', 'prior cases', 'similar cases', 'open similar cases'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'CLOSE_HISTORY', label: 'Close History', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS033',
    voiceTriggers: ['close history', 'close similar cases', 'close prior cases'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'VOICE_CANCEL', label: 'Cancel', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS034',
    voiceTriggers: ['cancel', 'close modal', 'dismiss', 'go back to report'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── SEARCH context ─────────────────────────────────────────────────────
  {
    id: 'SEARCH_EXECUTE', label: 'Execute Search', category: VOICE_CONTEXT.SEARCH,
    shortcut: '', internalKey: ACTION_MAP['system.openSearch']?.internalKey ?? 'F13+PS008',
    voiceTriggers: ['execute search', 'run search', 'search now', 'go', 'find'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'SEARCH_CLEAR', label: 'Clear Search', category: VOICE_CONTEXT.SEARCH,
    shortcut: '', internalKey: ACTION_MAP['system.openSearch']?.internalKey ?? 'F13+PS008',
    voiceTriggers: ['clear search', 'reset search', 'clear all', 'new search'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'SEARCH_LOAD_SAVED', label: 'Load Saved Search', category: VOICE_CONTEXT.SEARCH,
    shortcut: '', internalKey: ACTION_MAP['system.openSearch']?.internalKey ?? 'F13+PS008',
    voiceTriggers: ['load search', 'open saved search', 'search protocol', 'saved search'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── FLAG MANAGER context (REPORTING) ────────────────────────────────
  {
    id: 'FLAG_SELECT_CASE', label: 'Select Case', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS035',
    voiceTriggers: ['select case', 'flag case', 'case flag'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'FLAG_SELECT_ALL_SPECIMENS', label: 'Select All Specimens', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS036',
    voiceTriggers: ['select all specimens', 'all specimens', 'flag all specimens'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'FLAG_DESELECT_ALL', label: 'Deselect All', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS037',
    voiceTriggers: ['deselect all', 'clear selection', 'deselect all specimens'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'FLAG_SAVE', label: 'Save Flags', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS038',
    voiceTriggers: ['save flags', 'apply flags', 'save changes'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'FLAG_CANCEL', label: 'Cancel Flags', category: VOICE_CONTEXT.REPORTING,
    shortcut: '', internalKey: ACTION_MAP['diagnosis.enterAddendum']?.internalKey ?? 'F17+PS039',
    voiceTriggers: ['cancel flags', 'discard flag changes', 'close flag manager'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── MESSAGES context ──────────────────────────────────────────────────────
  // Navigation
  {
    id: 'MSG_NEXT', label: 'Next Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+ArrowDown', internalKey: ACTION_MAP['messages.next']?.internalKey ?? 'F18+PS001',
    voiceTriggers: ['next message', 'next', 'move to next message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_PREVIOUS', label: 'Previous Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+ArrowUp', internalKey: ACTION_MAP['messages.previous']?.internalKey ?? 'F18+PS002',
    voiceTriggers: ['previous message', 'previous', 'prior message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // Core actions
  {
    id: 'MSG_REPLY', label: 'Reply', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+Shift+R', internalKey: ACTION_MAP['messages.reply']?.internalKey ?? 'F18+PS003',
    voiceTriggers: ['reply', 'reply to message', 'respond', 'respond to message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Disambiguated: AppShell listener checks filterType/isEditing to decide
    // soft delete vs permanent delete. Single trigger covers all UI states.
    id: 'MSG_DELETE', label: 'Delete Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+Delete', internalKey: ACTION_MAP['messages.delete']?.internalKey ?? 'F18+PS004',
    voiceTriggers: ['delete message', 'delete this message', 'remove message', 'delete'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_MARK_READ', label: 'Mark as Read', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.markRead']?.internalKey ?? 'F18+PS005',
    voiceTriggers: ['mark as read', 'mark read', 'read this message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_MARK_READ_ALL', label: 'Mark All as Read', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.markRead']?.internalKey ?? 'F18+PS005',
    voiceTriggers: ['read all', 'mark all read', 'mark all as read', 'read all messages'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Marks the currently open thread message as unread — available via ⋯ menu or voice
    id: 'MSG_MARK_UNREAD', label: 'Mark as Unread', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.markUnread']?.internalKey ?? 'F18+PS014',
    voiceTriggers: ['mark as unread', 'mark unread', 'unread', 'set as unread'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // Compose
  {
    id: 'MSG_COMPOSE', label: 'New Internal Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+Shift+C', internalKey: ACTION_MAP['messages.compose']?.internalKey ?? 'F18+PS007',
    voiceTriggers: ['compose', 'compose message', 'new message', 'write message', 'create message', 'internal message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_SEND', label: 'Send Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+Shift+Enter', internalKey: ACTION_MAP['messages.send']?.internalKey ?? 'F18+PS008',
    voiceTriggers: ['send', 'send message', 'send this message', 'submit message', 'send internally'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Routes to external secure email gateway (Paubox / Virtru / Zix).
    // Requires at least one recipient and a subject/body to be active.
    id: 'MSG_SECURE_EMAIL', label: 'Send Secure Email', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Alt+Shift+E', internalKey: ACTION_MAP['messages.secureEmail']?.internalKey ?? 'F18+PS015',
    voiceTriggers: ['secure email', 'send secure email', 'send email', 'external email', 'secure message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // To: field — recipient management
  {
    // Opens full UserSearchOverlay from the To: field spyglass button
    id: 'MSG_RECIPIENT_SEARCH', label: 'Search Recipients', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.recipientSearch']?.internalKey ?? 'F18+PS016',
    voiceTriggers: ['search recipients', 'find user', 'search for user', 'browse users', 'open recipient search'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    // Confirms the highlighted suggestion in the To: inline dropdown (same as Enter/Tab key)
    id: 'MSG_RECIPIENT_ADD', label: 'Add Recipient', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.recipientAdd']?.internalKey ?? 'F18+PS017',
    voiceTriggers: ['add recipient', 'add this person', 'select recipient', 'confirm recipient'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // Compose field helpers
  {
    id: 'MSG_GOTO_SUBJECT', label: 'Go to Subject', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.gotoSubject']?.internalKey ?? 'F18+PS010',
    voiceTriggers: ['goto subject', 'go to subject', 'enter subject', 'type subject', 'subject field'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_GOTO_BODY', label: 'Go to Message Body', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.gotoBody']?.internalKey ?? 'F18+PS011',
    voiceTriggers: ['goto message', 'go to message', 'enter message', 'type message', 'message body', 'message field'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_CLEAR_SUBJECT', label: 'Clear Subject', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.clearSubject']?.internalKey ?? 'F18+PS012',
    voiceTriggers: ['clear subject', 'erase subject', 'delete subject', 'remove subject'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_CLEAR_BODY', label: 'Clear Message Body', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.clearBody']?.internalKey ?? 'F18+PS013',
    voiceTriggers: ['clear message', 'erase message', 'delete message body', 'start over', 'clear body'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // Urgent toggle — in compose panel
  {
    id: 'MSG_URGENT', label: 'Toggle Urgent', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.markUrgent']?.internalKey ?? 'F18+PS006',
    voiceTriggers: ['urgent', 'mark urgent', 'toggle urgent', 'set urgent', 'mark as urgent'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  // View and management
  {
    id: 'MSG_CLOSE', label: 'Close Messages', category: VOICE_CONTEXT.MESSAGES,
    shortcut: 'Escape', internalKey: ACTION_MAP['messages.close']?.internalKey ?? 'F18+PS009',
    voiceTriggers: ['close messages', 'close', 'dismiss messages', 'hide messages', 'close drawer'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_SEARCH', label: 'Search Messages', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.search']?.internalKey ?? 'F18+PS018',
    voiceTriggers: ['search messages', 'search', 'find message', 'filter messages'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_EDIT', label: 'Toggle Edit Mode', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.edit']?.internalKey ?? 'F18+PS019',
    voiceTriggers: ['edit', 'edit messages', 'select messages', 'manage messages', 'edit mode'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_VIEW_DELETED', label: 'View Recently Deleted', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.viewDeleted']?.internalKey ?? 'F18+PS021',
    voiceTriggers: ['view deleted', 'show deleted', 'recently deleted', 'deleted messages'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_VIEW_MESSAGES', label: 'View Messages', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.next']?.internalKey ?? 'F18+PS001',
    voiceTriggers: ['view messages', 'show messages list', 'back to messages', 'inbox'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_RESTORE', label: 'Restore Message', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.restore']?.internalKey ?? 'F18+PS020',
    voiceTriggers: ['restore', 'restore message', 'undelete', 'undelete message', 'recover message'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },
  {
    id: 'MSG_DELETE_ALL', label: 'Delete All Selected', category: VOICE_CONTEXT.MESSAGES,
    shortcut: '', internalKey: ACTION_MAP['messages.deleteAll']?.internalKey ?? 'F18+PS022',
    voiceTriggers: ['delete all', 'delete all selected', 'delete all messages', 'empty deleted'],
    learnedTriggers: [], requiredRole: 'All Staff', isActive: true,
  },

  // ── CASE TEAM ─────────────────────────────────────────────────────────────
  {
    id: 'OPEN_CASE_TEAM',
    label: 'Open Case Team',
    category: 'SYNOPTIC',
    shortcut: 'Alt+T',
    internalKey: 'F13+PS200',
    voiceTriggers: ['open case team', 'case team', 'manage team', 'show team', 'team members'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'CASE_TEAM_ADD',
    label: 'Add Team Member',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS201',
    voiceTriggers: ['add team member', 'add participant', 'add to team', 'assign participant'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'CASE_TEAM_ASSIGN',
    label: 'Assign to Participation Type',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS202',
    voiceTriggers: ['assign as', 'assign to', 'set as primary', 'set as consultant', 'set as grossing'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── WORKLIST — participation filters ──────────────────────────────────────
  {
    id: 'TABLE_FILTER_PARTICIPATING',
    label: 'Filter My Cases',
    category: 'WORKLIST',
    shortcut: '',
    internalKey: 'F15+PS030',
    voiceTriggers: ['my cases', 'cases i am on', 'my participating cases', 'filter my cases', 'show my cases'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },
  {
    id: 'TABLE_FILTER_COUNTERSIGN',
    label: 'Filter Awaiting Countersign',
    category: 'WORKLIST',
    shortcut: '',
    internalKey: 'F15+PS031',
    voiceTriggers: ['awaiting countersign', 'needs countersign', 'pending countersign', 'countersign cases'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'TABLE_FILTER_POOL',
    label: 'Filter Pool Cases',
    category: 'WORKLIST',
    shortcut: '',
    internalKey: 'F15+PS032',
    voiceTriggers: ['pool cases', 'show pool', 'unassigned cases', 'filter pool'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── ROUTING (Config context) ───────────────────────────────────────────────
  {
    id: 'OPEN_ROUTING_RULES',
    label: 'Open Routing Rules',
    category: 'SYSTEM',
    shortcut: '',
    internalKey: 'F13+PS210',
    voiceTriggers: ['open routing rules', 'routing rules', 'case routing', 'open case routing'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },
  {
    id: 'TEST_ROUTING',
    label: 'Test Routing Rule',
    category: 'SYSTEM',
    shortcut: '',
    internalKey: 'F13+PS211',
    voiceTriggers: ['test routing', 'test rule', 'check routing', 'route this specimen'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },

  // ── PARTICIPATION TYPES (Config context) ──────────────────────────────────
  {
    id: 'OPEN_PARTICIPATION_TYPES',
    label: 'Open Participation Types',
    category: 'SYSTEM',
    shortcut: '',
    internalKey: 'F13+PS220',
    voiceTriggers: ['participation types', 'open participation types', 'case participation', 'manage participation types'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },

  // ── Computational Sidecar ───────────────────────────────────────────────────
  {
    id: 'COMP_OPEN_SIDECAR',
    label: 'Open Computational Panel',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS230',
    voiceTriggers: ['open computational', 'show computationals', 'open results panel', 'lab results', 'show lab panel'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'COMP_ORDER_OPEN',
    label: 'Order Additional Test',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS231',
    voiceTriggers: ['order test', 'order additional test', 'add test', 'order panel', 'order lab test'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'COMP_ORDER_PLACE',
    label: 'Place Computational Orders',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS232',
    voiceTriggers: ['place order', 'place orders', 'confirm order', 'submit order', 'send order'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'COMP_ORDER_CANCEL',
    label: 'Cancel Computational Order',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS233',
    voiceTriggers: ['cancel order', 'cancel test', 'cancel lab order', 'remove order'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── Flag Management ─────────────────────────────────────────────────────────
  {
    id: 'FLAG_OPEN_MANAGER',
    label: 'Open Flag Manager',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS240',
    voiceTriggers: ['open flags', 'manage flags', 'show flags', 'flag case', 'add flag'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },
  {
    id: 'FLAG_APPLY_STAT',
    label: 'Apply STAT Flag',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS241',
    voiceTriggers: ['flag stat', 'mark stat', 'stat flag', 'urgent stat', 'rush processing'],
    learnedTriggers: [],
    requiredRole: 'All Staff',
    isActive: true,
  },

  // ── Report / Dirty State ────────────────────────────────────────────────────
  {
    id: 'SAVE_DRAFT',
    label: 'Save Report Draft',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS250',
    voiceTriggers: ['save draft', 'save report', 'save changes', 'save my work'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },
  {
    id: 'DISCARD_CHANGES',
    label: 'Discard Unsaved Changes',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS251',
    voiceTriggers: ['discard changes', 'undo all changes', 'revert changes', 'cancel changes'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

  // ── Report Template ─────────────────────────────────────────────────────────
  {
    id: 'TEMPLATE_SELECT',
    label: 'Select Report Template',
    category: 'SYNOPTIC',
    shortcut: '',
    internalKey: 'F13+PS260',
    voiceTriggers: ['select template', 'change template', 'choose template', 'switch template'],
    learnedTriggers: [],
    requiredRole: 'Pathologist',
    isActive: true,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Action registry persistence
// Admins edit shortcuts + voice triggers in the UI — these must survive deploys.
// Pattern: seed from SEED_ACTIONS, load from localStorage, write back on updateAction.
// New actions added to SEED_ACTIONS are merged in on load (migration guard).
// ─────────────────────────────────────────────────────────────────────────────

const ACTIONS_STORAGE_KEY = 'ps_action_registry';

function loadActions(): SystemAction[] {
  try {
    const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (!raw) return SEED_ACTIONS.map(a => ({ ...a }));
    const stored: SystemAction[] = JSON.parse(raw);
    const storedIds = new Set(stored.map(a => a.id));
    // Migration: add any new seed actions not yet in storage
    const newActions = SEED_ACTIONS.filter(a => !storedIds.has(a.id));
    return [...stored, ...newActions];
  } catch {
    return SEED_ACTIONS.map(a => ({ ...a }));
  }
}

function persistActions(actions: SystemAction[]) {
  try {
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // localStorage unavailable — degrade gracefully
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string | undefined | null): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function phraseMatch(transcript: string | undefined | null, trigger: string | undefined | null): boolean {
  if (!transcript || !trigger) return false;
  const t  = norm(transcript);
  const tr = norm(trigger);
  if (t === tr) return true;
  const escaped = tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(t);
}

function fuzzyScore(transcript: string, trigger: string): number {
  const tWords  = new Set(norm(transcript).split(' ').filter(Boolean));
  const trWords = norm(trigger).split(' ').filter(Boolean);
  if (!trWords.length) return 0;
  const overlap = trWords.filter(w => tWords.has(w)).length;
  const score   = overlap / trWords.length;
  return score >= 0.6 ? score : 0;
}

function dispatchInternalKey(internalKey: string) {
  const fnKey = internalKey.split('+')[0];
  const cfg: KeyboardEventInit = {
    key: fnKey, code: fnKey,
    ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    bubbles: true, cancelable: true, composed: true,
  };
  [window, document, document.body].forEach(
    t => t.dispatchEvent(new KeyboardEvent('keydown', cfg))
  );
}


let currentAppContext: string = VOICE_CONTEXT.WORKLIST;

// ─── Live registry — loaded from storage, mutated by updateAction ─────────────
let LIVE_ACTIONS: SystemAction[] = loadActions();

// ─────────────────────────────────────────────────────────────────────────────
// Learning layer — persisted to localStorage so mappings survive page refresh
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ps_learned_triggers';

// Local types — shapes match IActionRegistryService exactly
interface LocalLearnedMapping {
  transcript:         string;   // normalised transcript (acts as unique key)
  actionId:           string;
  confirmedAt:        number;
  confirmationMethod: 'shortcut' | 'repeat' | 'manual';
  useCount:           number;
}

interface LocalPendingMiss {
  id:         string;
  transcript: string;
  timestamp:  number;
}

// ── Candidate scoring — top 3 fuzzy matches for VoiceMissPrompt ──────────
function computeCandidates(transcript: string, actions: SystemAction[]): SystemAction[] {
  const scored: { action: SystemAction; score: number }[] = [];
  for (const action of actions) {
    if (!action.isActive) continue;
    let best = 0;
    for (const t of [...action.voiceTriggers, ...(action.learnedTriggers ?? [])]) {
      const s = fuzzyScore(transcript, t);
      if (s > best) best = s;
    }
    if (best > 0) scored.push({ action, score: best });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.action);
}

// ── localStorage helpers ──────────────────────────────────────────────────
function loadMappings(): LocalLearnedMapping[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalLearnedMapping[]) : [];
  } catch {
    return [];
  }
}

function saveMappings(mappings: LocalLearnedMapping[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch {
    // localStorage unavailable — degrade gracefully, in-memory still works
  }
}

// Sync learnedTriggers from storage into LIVE_ACTIONS so findActionByTrigger
// picks them up immediately on first load (e.g. after a page refresh).
function syncLearnedTriggersToActions(mappings: LocalLearnedMapping[]) {
  for (const action of LIVE_ACTIONS) {
    action.learnedTriggers = mappings
      .filter(m => m.actionId === action.id)
      .map(m => m.transcript);
  }
}

let learnedMappings: LocalLearnedMapping[] = loadMappings().filter(m => !!m.transcript && !!m.actionId);
syncLearnedTriggersToActions(learnedMappings);

// ── Pending miss window ───────────────────────────────────────────────────
const pendingMisses: LocalPendingMiss[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────
export const mockActionRegistryService: IActionRegistryService = {

  getActions: () => LIVE_ACTIONS,

  getActionById: (id: string) => LIVE_ACTIONS.find(a => a.id === id),

  updateAction: async (id: string, updates: Partial<SystemAction>) => {
    const index = LIVE_ACTIONS.findIndex(a => a.id === id);
    if (index !== -1) {
      LIVE_ACTIONS[index] = { ...LIVE_ACTIONS[index], ...updates };
      persistActions(LIVE_ACTIONS);
    }
  },

  setCurrentContext: (c: string) => {
    currentAppContext = c;
  },
onAction: (callback: (actionId: string) => void) => {
    const handler = (e: any) => {
      if (e.detail?.id) callback(e.detail.id);
    };
    window.addEventListener('VOICE_ACTION_TRIGGERED', handler);
    return () => window.removeEventListener('VOICE_ACTION_TRIGGERED', handler);
  },
  findActionByTrigger: (transcript: string): SystemAction | undefined => {
    const eligible = LIVE_ACTIONS.filter(
      a => a.isActive && (
        GLOBAL_CATEGORIES.has(a.category) ||
        a.category === currentAppContext
      )
    );

    // 1. Exact phrase — canonical
    for (const a of eligible) {
      if (a.voiceTriggers.some(t => phraseMatch(transcript, t))) return a;
    }
    // 2. Exact phrase — learned
    for (const a of eligible) {
      if ((a.learnedTriggers ?? []).some(t => phraseMatch(transcript, t))) return a;
    }
    // 3. Fuzzy fallback
    let best: { action: SystemAction; score: number } | null = null;
    for (const a of eligible) {
      for (const t of [...a.voiceTriggers, ...(a.learnedTriggers ?? [])].filter(Boolean)) {
        const score = fuzzyScore(transcript, t);
        if (score > 0 && (!best || score > best.score)) best = { action: a, score };
      }
    }
    return best?.action ?? undefined;
  },

  executeAction: (action: SystemAction, transcript?: string) => {
    console.log('[VoiceRegistry] Executing:', action.id, '->', action.internalKey);
    window.dispatchEvent(new CustomEvent('VOICE_ACTION_TRIGGERED', { detail: action }));
    const notify = () =>
      window.dispatchEvent(new CustomEvent('VOICE_ACTION_TRIGGERED', { detail: action }));

    // Special case: TABLE_SORT_BY_COLUMN — pass transcript so WorklistPage can extract column name
    if (action.id === 'TABLE_SORT_BY_COLUMN' && transcript) {
      window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_SORT_BY_COLUMN', { detail: { transcript } }));
      notify();
      return;
    }

    // Special case: TABLE_FILTER_PHYSICIAN — pass transcript as detail so WorklistPage can extract the name
    if (action.id === 'TABLE_FILTER_PHYSICIAN' && transcript) {
      window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_FILTER_PHYSICIAN', { detail: { transcript } }));
      notify();
      return;
    }

    // Special case: SELECT_SPECIMEN — extract the number from the transcript
    if (action.id === 'SELECT_SPECIMEN' && transcript) {
      const match = norm(transcript).match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
      const wordToNum: Record<string, number> = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
      const n = match ? (wordToNum[match[1]] ?? parseInt(match[1], 10)) : 1;
      window.dispatchEvent(new CustomEvent('PATHSCRIBE_SELECT_SPECIMEN', { detail: { index: n - 1 } }));
      notify();
      return;
    }

    if (CUSTOM_EVENT_ACTIONS.has(action.id)) {
      window.dispatchEvent(new CustomEvent(`PATHSCRIBE_${action.id}`, { detail: action }));
      notify();
      return;
    }

    dispatchInternalKey(action.internalKey);
    notify();
  },

  onActionExecuted: (cb) => {
    const h = (e: any) => cb(e.detail);
    window.addEventListener('VOICE_ACTION_TRIGGERED', h);
    return () => window.removeEventListener('VOICE_ACTION_TRIGGERED', h);
  },

  onActionFailed: (cb) => {
    const h = (e: any) => cb(e.detail);
    window.addEventListener('VOICE_COMMAND_NOT_FOUND', h);
    return () => window.removeEventListener('VOICE_COMMAND_NOT_FOUND', h);
  },

  // ── Miss recording ────────────────────────────────────────────────────────
  recordMiss: (transcript: string): LocalPendingMiss => {
    const miss: LocalPendingMiss = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      transcript,
      timestamp: Date.now(),
    };
    pendingMisses.push(miss);
    // Compute candidates now so onMissRecorded subscribers receive them
    const candidates = computeCandidates(transcript, LIVE_ACTIONS);
    window.dispatchEvent(new CustomEvent('VOICE_COMMAND_NOT_FOUND', { detail: transcript }));
    window.dispatchEvent(new CustomEvent('VOICE_MISS_RECORDED', { detail: { miss, candidates } }));
    return miss;
  },

  dismissMiss: (missId: string) => {
    const idx = pendingMisses.findIndex(m => m.id === missId);
    if (idx !== -1) pendingMisses.splice(idx, 1);
  },

  getPendingMisses: () => [...pendingMisses],

  // ── Learning ──────────────────────────────────────────────────────────────
  // Called when the user confirms what they meant — via keyboard shortcut,
  // repeat utterance, or the VoiceMissPrompt UI tap.
  // Stores the transcript as a learned trigger so it fires next time.
  confirmMiss: (missId: string, actionId: string, method: 'shortcut' | 'repeat' | 'manual'): LocalLearnedMapping => {
    // Find and remove from pending window
    const missIdx = pendingMisses.findIndex(m => m.id === missId);
    if (missIdx === -1) {
      // Miss already expired — still record the learning
      const mapping = learnedMappings.find(m => m.actionId === actionId);
      return mapping ?? { transcript: '', actionId, confirmedAt: Date.now(), confirmationMethod: method, useCount: 1 };
    }
    const miss = pendingMisses[missIdx];
    pendingMisses.splice(missIdx, 1);

    const trigger = norm(miss.transcript);
    if (!trigger) {
      return { transcript: trigger, actionId, confirmedAt: Date.now(), confirmationMethod: method, useCount: 1 };
    }

    // If already learned, just increment useCount
    const existing = learnedMappings.find(
      m => m.actionId === actionId && m.transcript === trigger
    );
    if (existing) {
      existing.useCount++;
      saveMappings(learnedMappings);
      return existing;
    }

    // Persist new mapping
    const mapping: LocalLearnedMapping = {
      transcript: trigger,
      actionId,
      confirmedAt: Date.now(),
      confirmationMethod: method,
      useCount: 1,
    };
    learnedMappings.push(mapping);
    saveMappings(learnedMappings);

    // Sync onto the live action so it works immediately (no reload needed)
    const action = LIVE_ACTIONS.find(a => a.id === actionId);
    if (action) {
      action.learnedTriggers = [...(action.learnedTriggers ?? []), trigger];
    }

    console.log(`[VoiceRegistry] Learned: "${trigger}" -> ${actionId} (via ${method})`);
    window.dispatchEvent(new CustomEvent('VOICE_MAPPING_LEARNED', { detail: { mapping, action } }));

    // Execute the action so the user's original intent is carried out
    if (action) mockActionRegistryService.executeAction(action, miss.transcript);

    return mapping;
  },

  getLearnedMappings: () => [...learnedMappings],

  // removeLearnedMapping takes transcript (the unique key) per interface
  removeLearnedMapping: (transcript: string) => {
    const t = norm(transcript);
    const idx = learnedMappings.findIndex(m => m.transcript === t);
    if (idx === -1) return;
    const { actionId } = learnedMappings[idx];
    learnedMappings.splice(idx, 1);
    saveMappings(learnedMappings);

    // Remove from the live action's learnedTriggers
    const action = LIVE_ACTIONS.find(a => a.id === actionId);
    if (action) {
      action.learnedTriggers = (action.learnedTriggers ?? []).filter(tr => tr !== t);
    }
    console.log(`[VoiceRegistry] Removed learned mapping: "${t}" -> ${actionId}`);
  },

  // onMissRecorded — passes both miss and candidates to the callback
  onMissRecorded: (cb) => {
    const h = (e: any) => cb(e.detail.miss, e.detail.candidates);
    window.addEventListener('VOICE_MISS_RECORDED', h);
    return () => window.removeEventListener('VOICE_MISS_RECORDED', h);
  },
};

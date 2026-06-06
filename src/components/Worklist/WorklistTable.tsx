import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { messageService, clientService, auditService } from "@/services";
import { useMessaging } from "@/contexts/MessagingContext";
import { getOrganisationByHospitalId, getOrganisationShortName } from '../../services/organisation/organisationService';
import '../../pathscribe.css';
import { Case } from "../../types/case/Case";
import { Flag } from '../../services/flags/IFlagService';
import { useSidecar } from '@/contexts/SidecarContext';
import ComputationalFlagIcon from '../Flags/ComputationalFlagIcon';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SortEntry = { 
  key: string; 
  dir: 'asc' | 'desc' 
};

type DividerRow = { 
  __divider: true; 
  label: string; 
  count: number 
};

type DisplayRow = Case | DividerRow;

interface WorklistTableProps {
  cases: Case[];
  activeFilter: string;
  tableHeight?: number;
  delegatedCaseIds?: string[];
  onBeforeNavigate?: (caseId: string) => void;
  /** 'search' when inside SearchPage, 'worklist' otherwise */
  navSource?: 'search' | 'worklist';
  onPoolCaseClick?: (caseId: string, summary: string) => void;
  selectedIndex?: number;
  selectedCaseId?: string | null;
  onRowSelect?: (index: number, id: string) => void;
  onFirstCaseId?: (id: string | null) => void;
  onDisplayOrder?: (ids: string[]) => void;
  /** Flag definitions from IFlagService — used to identify Computational flags. */
  flagDefinitions?: Flag[];
}
// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 15;
const SORT_KEY   = 'worklistSort';

const HEADER_COLUMNS: { label: string; key: string }[] = [
  { label: 'Case',        key: 'id'                  },
  { label: 'Patient',     key: 'lastName'             },
  { label: 'MRN',         key: 'mrn'                  },
  { label: 'Sex',         key: 'sex'                  },
  { label: 'DOB (Age)',   key: 'dateOfBirth'          },
  { label: 'Specimen(s)', key: 'specimenSummary'      },
  { label: 'Accession',   key: 'accessionDate'        },
  { label: 'Physician',   key: 'submittingPhysician'  },
  { label: 'Flag(s)',     key: 'flagSeverity'         },
  { label: 'Status   ', key: 'status'               },
];
// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────────────────────────────────────

const FLAG_PALETTE: Record<string, { bg: string; border: string; dot: string }> = {
  red:    { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   dot: '#EF4444' },
  yellow: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  dot: '#F59E0B' },
  blue:   { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  dot: '#3B82F6' },
  green:  { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)',  dot: '#10B981' },
  orange: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)',  dot: '#F97316' },
  purple: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)',  dot: '#F97316' },
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE & TIME HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const getAgeLabel = (dobStr: string): string => {
  const dob = new Date(dobStr);
  const now = new Date();
  const msOld = now.getTime() - dob.getTime();
  const days = Math.floor(msOld / (1000 * 3600 * 24));
  
  if (days < 1) return `${Math.max(0, Math.floor(msOld / (1000 * 3600)))}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30.43)}mo`;
  return `${Math.floor(days / 365.25)}y`;
};
// ─────────────────────────────────────────────────────────────────────────────
// SORTING LOGIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A versatile comparator that handles:
 * 1. Null/Undefined values (pushed to bottom)
 * 2. ISO Date strings (converted to timestamps)
 * 3. Numbers (direct subtraction)
 * 4. Strings (locale-aware comparison)
 */
const compareValues = (a: any, b: any, dir: 'asc' | 'desc'): number => {
  // Move null/undefined to the end regardless of direction
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Attempt to parse as dates if they look like strings
  if (typeof a === 'string' && typeof b === 'string') {
    const aDate = Date.parse(a);
    const bDate = Date.parse(b);
    
    // Only compare as dates if both are valid timestamps and look like ISO strings
    if (!isNaN(aDate) && !isNaN(bDate) && a.includes('-') && b.includes('-')) {
      return dir === 'asc' ? aDate - bDate : bDate - aDate;
    }
  }

  // Numeric comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a;
  }

  // Fallback to string comparison
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  
  if (sa < sb) return dir === 'asc' ? -1 : 1;
  if (sa > sb) return dir === 'asc' ?  1 : -1;
  return 0;
};

/**
 * Extracts the raw value from a Case object based on the header key.
 * This is used by the sorting engine to know what to compare.
 */
const getSortValue = (c: Case, key: string): any => {
  switch (key) {
    case 'id':
      return c.id;
    case 'lastName':
      return c.patient?.lastName ?? '';
    case 'mrn':
      return c.patient?.mrn ?? '';
    case 'sex':
      return c.patient?.sex ?? '';
    case 'dateOfBirth':
      return c.patient?.dateOfBirth ?? '';
    case 'specimenSummary':
      return (c.specimens || []).map(s => s.label).join('');
    case 'accessionDate':
      return c.order?.receivedDate ?? '';
    case 'submittingPhysician':
      return c.order?.requestingProvider ?? '';
    case 'status':
      return c.status;
    case 'flagSeverity':
      // Derived value: total number of flags
      return (c.caseFlags?.length ?? 0) + (c.specimenFlags?.length ?? 0);
    default:
      return (c as any)[key];
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// STATUS & VISUAL STYLES
// ─────────────────────────────────────────────────────────────────────────────

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'draft':
      return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: 'rgba(148,163,184,0.4)' }; // slate  — matches Draft tile
    case 'in-progress':
      return { bg: 'rgba(8,145,178,0.15)',   color: '#0891B2', border: 'rgba(8,145,178,0.3)'   }; // teal   — matches In Progress tile
    case 'pending-review':
      return { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  }; // amber  — matches Needs Review tile
    case 'finalized':
      return { bg: 'rgba(16,185,129,0.15)',  color: '#10B981', border: 'rgba(16,185,129,0.3)'  }; // green  — matches Completed tile
    case 'amended':
      return { bg: 'rgba(139,92,246,0.15)',  color: '#8B5CF6', border: 'rgba(139,92,246,0.3)'  }; // violet — matches Amended tile
    case 'finalizing':
      return { bg: 'rgba(236,72,153,0.15)',  color: '#EC4899', border: 'rgba(236,72,153,0.3)'  }; // pink — matches Finalizing tile
    case 'pool':
      return { bg: 'rgba(249,115,22,0.15)',  color: '#F97316', border: 'rgba(249,115,22,0.3)'  }; // orange — matches Pool tile
    default:
      return { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'rgba(255,255,255,0.1)' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FlagChip: Renders a small badge with a flag icon.
 * isSpecimen = true renders a dashed flag icon.
 * isSpecimen = false renders a solid flag icon.
 */
const FlagChip: React.FC<{ flag: any; isSpecimen?: boolean }> = React.memo(({ flag, isSpecimen }) => {
  const palette = FLAG_PALETTE[flag.color] ?? FLAG_PALETTE.blue;
  const label: string = flag.label || flag.name || flag.type || flag.color || 'Flag';
  
  return (
    <span
      className="wl-flag-chip"
      title={`${isSpecimen ? 'Specimen' : 'Case'}: ${label}`}
      style={{
        background: palette.bg, 
        border: `1px solid ${palette.border}`,
        color: palette.dot,
      }}
    >
      <svg width="7" height="8" viewBox="0 0 7 8" fill="none" className="wl-flag-chip-icon">
        <path
          d="M1 7V1 M1 1 L6 2.5 L1 4"
          stroke={palette.dot}
          strokeWidth={isSpecimen ? 1.2 : 1.8}
          strokeLinecap="round" 
          strokeLinejoin="round"
          strokeDasharray={isSpecimen ? '2 1' : undefined}
          fill="none"
        />
      </svg>
      {label}
    </span>
  );
});
/**
 * SpecimenChip: Renders a compact pill for each specimen.
 * Includes a tooltip for the full description.
 */
const SpecimenChip: React.FC<{ 
  label: string; 
  description: string; 
  fullDescription?: string 
}> = React.memo(({ label, description, fullDescription }) => (
  <span className="wl-specimen-chip" title={`${label}: ${fullDescription || description}`}>
    <span className="wl-specimen-chip__label">{label}</span>
    <span className="wl-specimen-chip__sep">·</span>
    <span className="wl-specimen-chip__desc">{description}</span>
  </span>
));

/**
 * StatusDot: A simple colored circle representing the case status.
 */
const StatusDot: React.FC<{ status: string }> = React.memo(({ status }) => {
  const s = getStatusStyle(status);
  const label = status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <span
      title={`Status: ${label}`}
      className="wl-status-dot"
      style={{ background: s.color, boxShadow: `0 0 4px ${s.color}66` }}
    />
  );
});

/**
 * UrgentDot: A red pulsing dot used to highlight STAT/Urgent cases.
 */
const UrgentDot: React.FC = React.memo(() => (
  <span title="Urgent Case (STAT)" className="wl-urgent-dot" />
));
// ─────────────────────────────────────────────────────────────────────────────
// WORKLIST TABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const WorklistTable: React.FC<WorklistTableProps> = ({
  cases,
  activeFilter,
  tableHeight,
  delegatedCaseIds = [],
  onBeforeNavigate,
  navSource = 'worklist',
  onPoolCaseClick,
  selectedIndex: _selectedIndex,
  selectedCaseId = null,
  onRowSelect,
  onFirstCaseId,
  onDisplayOrder,
  flagDefinitions = [],
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reloadInbox } = useMessaging();

  const { openOverlay, isOpen: isDrawerOpen, close: closeDrawer } = useSidecar();

  // Lookup map: flagDefinitionId or lisCode → Flag definition.
  // Used to identify which applied flags are COMPUTATIONAL.
  const defMap = useMemo(() => {
    const m = new Map<string, Flag>();
    flagDefinitions.forEach(f => {
      m.set(f.id, f);
      if (f.lisCode) m.set(f.lisCode, f);
    });
    return m;
  }, [flagDefinitions]);


  // ── Pediatric access state ──────────────────────────────────────────────
  const [pedBlockedCase, setPedBlockedCase] = React.useState<{id:string;age:number;clientId?:string}|null>(null);

  // Persisted set of case IDs where access has been requested — survives refresh
  const [pedRequestedIds, setPedRequestedIds] = React.useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pathscribe_ped_requested');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const markPedRequested = React.useCallback((caseId: string) => {
    setPedRequestedIds(prev => {
      const next = new Set(prev).add(caseId);
      localStorage.setItem('pathscribe_ped_requested', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const pedRequestSent = pedBlockedCase ? pedRequestedIds.has(pedBlockedCase.id) : false;
  const [clientThresholds, setClientThresholds] = React.useState<Record<string, any>>({});

  const loadClientThresholds = React.useCallback(() => {
    clientService.getAll().then(res => {
      if (!res.ok) return;
      const map: Record<string, any> = {};
      res.data.forEach((c: any) => {
        map[c.id] = c.pediatricAgeThreshold ?? null;
        map[`${c.id}_authorized`] = c.authorizedPediatricPathologistIds ?? [];
      });
      setClientThresholds(map);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    loadClientThresholds();
  }, [loadClientThresholds]);

  // Reload when tab becomes visible — picks up client changes made in config
  React.useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadClientThresholds(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadClientThresholds]);

  const isPedRestricted = React.useCallback((c: any): boolean => {
    const clientId  = c?.order?.clientId;
    const dob       = c?.patient?.dateOfBirth;
    const threshold = clientId ? (clientThresholds[clientId] ?? null) : null;
    if (!dob || threshold === null) return false; // client has no pediatric policy

    const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
    if (age >= threshold) return false; // not a pediatric patient

    // Option C: user must be in the client's authorized pediatric pathologist list
    const authorizedIds: string[] = clientId
      ? ((clientThresholds as any)[`${clientId}_authorized`] ?? [])
      : [];
    return !authorizedIds.includes((user as any)?.id ?? '');
  }, [user, clientThresholds]);
  
  // Ref for the scrollable container to implement infinite scroll
  const scrollRef  = useRef<HTMLDivElement>(null);
  // Ref for the floating mirror scrollbar at the bottom of the table container
  const mirrorRef  = useRef<HTMLDivElement>(null);
  const innerRef   = useRef<HTMLDivElement>(null); // tracks inner table width for mirror

  // ─────────────────────────────────────────────────────────────────────────────
  // RESPONSIVE: must be declared early — referenced by useEffects below
  // ─────────────────────────────────────────────────────────────────────────────
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isTablet = viewportWidth < 1024;

  // Stable refs for parent callbacks — prevents them from being dependency array
  // triggers that cause infinite re-render loops when parents pass inline functions.
  const onFirstCaseIdRef = useRef(onFirstCaseId);
  const onDisplayOrderRef = useRef(onDisplayOrder);
  useEffect(() => { onFirstCaseIdRef.current = onFirstCaseId; }, [onFirstCaseId]);
  useEffect(() => { onDisplayOrderRef.current = onDisplayOrder; }, [onDisplayOrder]);

  // Pagination & Loading State
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Hover state for row highlighting
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  /**
   * Reset pagination whenever the filter changes to ensure the user 
   * starts at the top of the new list.
   */
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SORT STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * multi-sort stack: 
   * The first element is the primary sort, second is secondary, etc.
   */
  const [sortStack, setSortStack] = useState<SortEntry[]>(() => {
    try {
      const raw = localStorage.getItem(SORT_KEY);
      if (!raw) return [{ key: 'id', dir: 'asc' }];
      
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as SortEntry[];
      }
      return [{ key: 'id', dir: 'asc' }];
    } catch (e) {
      console.warn("Failed to parse sort state from localStorage", e);
      return [{ key: 'id', dir: 'asc' }];
    }
  });

  // Persist sort preferences to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, JSON.stringify(sortStack));
    } catch (e) {
      console.error("Failed to save sort state", e);
    }
  }, [sortStack]);
// ─────────────────────────────────────────────────────────────────────────────
  // SORT INTERACTION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * handleHeaderClick:
   * 1. If key is already in stack, toggle its direction.
   * 2. If key is new, add it to the end of the stack (up to 3 levels).
   */
  const onHeaderClick = useCallback((key: string) => {
    setSortStack(prev => {
      const existingIdx = prev.findIndex(e => e.key === key);
      
      if (existingIdx !== -1) {
        // Toggle direction of existing sort
        const next = [...prev];
        next[existingIdx] = { 
          key, 
          dir: prev[existingIdx].dir === 'asc' ? 'desc' : 'asc' 
        };
        return next;
      }
      
      // Limit multi-sort to 3 levels to maintain UI clarity and performance
      if (prev.length >= 3) return prev;
      
      // Add new sort level
      // Note: flags default to descending (most flags first)
      const defaultDir = key === 'flagSeverity' ? 'desc' : 'asc';
      return [...prev, { key, dir: defaultDir }];
    });
  }, []);

  /**
   * onRemoveSort: 
   * Removes a specific level of sorting from the stack.
   */
  const onRemoveSort = useCallback((key: string) => {
    setSortStack(prev => {
      const filtered = prev.filter(e => e.key !== key);
      // If stack becomes empty, fallback to default ID sort
      return filtered.length > 0 ? filtered : [{ key: 'id', dir: 'asc' }];
    });
  }, []);

  /**
   * clearSort:
   * Resets the table to the default primary sort.
   */
  const clearSort = useCallback(() => {
    setSortStack([{ key: 'id', dir: 'asc' }]);
  }, []);
// ─────────────────────────────────────────────────────────────────────────────
  // FILTERING & CATEGORIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * isUrgentCase:
   * Returns true if the case is marked as 'STAT' in the order priority.
   */
  const isUrgentCase = useCallback((c: Case) => {
    return c.order?.priority === 'STAT';
  }, []);

  /**
   * filteredCases:
   * Applies the UI's active filter to the master cases array.
   */
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // 1. Show everything — pool cases are grouped separately in the table
      if (activeFilter === 'all') return true;

      // 1b. Pool queue (show only pool)
      if (activeFilter === 'pool') return c.status === 'pool';

      // Pool cases: only pass through for filters where they can actually qualify.
      // Status-based filters (inprogress, review, amended, draft etc.) should NOT
      // show pool cases — pool cases have status='pool' and won't match those statuses.
      if (c.status === 'pool') {
        if (activeFilter === 'urgent') return isUrgentCase(c);
        return false; // excluded from all status-specific filters
      }

      // 2. Urgent / STAT cases only
      if (activeFilter === 'urgent') return isUrgentCase(c);

      // 3. Delegated to me
      if (activeFilter === 'delegated') return delegatedCaseIds.includes(c.id);

      // 4. Status-based filters — cast to any to bypass CaseStatus union constraint
      if (activeFilter === 'review')     return c.status === 'pending-review';
      if (activeFilter === 'inprogress') return c.status === 'in-progress';
      if (activeFilter === 'amended')    return c.status === 'amended';
      if (activeFilter === 'draft')      return c.status === 'draft';
      if (activeFilter === 'finalizing') return c.status === 'finalizing';

      // 4. Completed filter: 
      // Only show cases finalized TODAY (2026-04-02)
      if (activeFilter === 'completed') {
        if (c.status !== 'finalized' || !c.updatedAt) return false;
        
        const updateDate = new Date(c.updatedAt);
        const today = new Date();
        
        return (
          updateDate.getFullYear() === today.getFullYear() &&
          updateDate.getMonth() === today.getMonth() &&
          updateDate.getDate() === today.getDate()
        );
      }

      return true;
    });
  }, [cases, activeFilter, isUrgentCase]);
/**
   * sortGroup:
   * A helper that applies the current multi-level sortStack to a 
   * specific array of cases.
   */
  const sortGroup = useCallback(
    (arr: Case[]) => {
      if (sortStack.length === 0) return [...arr];

      return [...arr].sort((a, b) => {
        // Iterate through each sort level in the stack
        for (const { key, dir } of sortStack) {
          const valA = getSortValue(a, key);
          const valB = getSortValue(b, key);
          
          const result = compareValues(valA, valB, dir);
          
          // If this sort level finds a difference, return it.
          // If they are equal (0), proceed to the next level in the stack.
          if (result !== 0) return result;
        }
        return 0;
      });
    },
    [sortStack]
  );

  /**
   * finalCases:
   * The source of truth for the table's display order.
   * 1. Splits cases into Urgent (STAT) and Normal.
   * 2. Sorts each group independently using the sortStack.
   * 3. Re-combines them so Urgent is always first.
   */
  const finalCases = useMemo(() => {
    const poolCases = filteredCases.filter(c => c.status === 'pool');
    const nonPool   = filteredCases.filter(c => c.status !== 'pool');
    const urgent    = nonPool.filter(isUrgentCase);
    const normal    = nonPool.filter(c => !isUrgentCase(c));

    return [
      ...sortGroup(urgent),
      ...sortGroup(normal),
      ...sortGroup(poolCases),
    ];
  }, [filteredCases, isUrgentCase, sortGroup]);

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION & SELECTION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * openCase:
   * Triggers the navigation to the synoptic reporting view,
   * passing the current worklist order in the router state.
   */
  const openCase = useCallback(
    (id: string) => {
      sessionStorage.setItem('pathscribe:navFrom', navSource);
      onBeforeNavigate?.(id);
      navigate(`/case/${id}/synoptic`, {
        state: { 
          // Pass the IDs so the case view can implement "Next/Prev"
          worklistCaseIds: finalCases.map((c) => c.id) 
        },
      });
    },
    [navigate, onBeforeNavigate, finalCases, navSource]
  );

  /**
   * handleRowClick:
   * Synchronizes the selection with parent components before navigating.
   */
  const handleRowClick = useCallback(
    (id: string) => {
      // If sidecar overlay is open, first click closes it — does not navigate.
      // We check a ref rather than state to avoid stale closure issues.
      if (isDrawerOpen) {
        closeDrawer();
        return;
      }

      const c = cases.find(c => c.id === id);

      // Pediatric restricted — show access modal instead of opening case
      if (isPedRestricted(c as any)) {
        const dob = (c as any)?.patient?.dateOfBirth;
        const age = dob ? Math.floor((Date.now()-new Date(dob).getTime())/31557600000) : 0;
        const clientId = (c as any)?.order?.clientId;
        setPedBlockedCase({ id, age, clientId });
        // Audit: access denied event
        auditService.logEvent({
          type: 'system',
          event: 'Pediatric Access Denied',
          detail: `Case ${id} opened by ${(user as any)?.name ?? 'Unknown'} — blocked: patient age ${age} below client pediatric threshold. User lacks canViewPediatric permission.`,
          user: (user as any)?.name ?? 'Unknown',
          caseId: id,
          confidence: null,
        }).catch(() => {});
        return;
      }

      // Pool cases open the claim modal instead of navigating
      if ((c as any)?.status === 'pool' && onPoolCaseClick) {
        const summary = c?.specimens?.[0]?.description ?? c?.specimens?.[0]?.label ?? '';
        onPoolCaseClick(id, summary);
        return;
      }

      const idx = cases.findIndex((c) => c.id === id);
      if (idx !== -1) {
        onRowSelect?.(idx, id);
      }
      openCase(id);
    },
    [cases, openCase, onRowSelect, onPoolCaseClick, isDrawerOpen, closeDrawer]
  );
// ─────────────────────────────────────────────────────────────────────────────
  // DISPLAY ROW GENERATION (Dividers + Virtualization)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * displayRows:
   * Maps the sorted cases into a format that includes UI dividers.
   */
  const displayRows = useMemo<DisplayRow[]>(() => {
    const pool        = finalCases.filter(c => c.status === 'pool');
    const poolUrgent  = pool.filter(isUrgentCase);
    const poolNormal  = pool.filter(c => !isUrgentCase(c));
    const urgent      = finalCases.filter(c => isUrgentCase(c) && c.status !== 'pool');
    const normal      = finalCases.filter(c => !isUrgentCase(c) && c.status !== 'pool');
    const rows: DisplayRow[] = [];

    // Urgent non-pool cases always first
    if (urgent.length > 0) {
      rows.push({ __divider: true, label: 'Urgent',    count: urgent.length });
      rows.push(...urgent);
    }
    // Normal non-pool cases
    if (normal.length > 0) {
      rows.push({ __divider: true, label: 'All Cases', count: normal.length });
      rows.push(...normal);
    }
    // Pool urgent cases before pool normal
    if (poolUrgent.length > 0) {
      rows.push({ __divider: true, label: 'Pool — Urgent', count: poolUrgent.length });
      rows.push(...poolUrgent);
    }
    if (poolNormal.length > 0) {
      rows.push({ __divider: true, label: 'Pool', count: poolNormal.length });
      rows.push(...poolNormal);
    }

    return rows;
  }, [finalCases, isUrgentCase]);

  /**
   * visibleRows:
   * Slices the displayRows based on the current infinite scroll position.
   * This prevents the DOM from becoming heavy with 800+ rows.
   */
  const visibleRows = useMemo(() => {
    let caseCount = 0;
    const result: DisplayRow[] = [];
    
    for (const row of displayRows) {
      // Dividers don't count toward the BATCH_SIZE limit
      if ('__divider' in row) {
        result.push(row);
        continue;
      }

      if (caseCount >= visibleCount) break;
      
      result.push(row);
      caseCount++;
    }
    return result;
  }, [displayRows, visibleCount]);

  /**
   * hasMore:
   * Boolean flag to tell the scroll listener if there's more data to fetch.
   */
  const hasMore = visibleCount < finalCases.length;
/**
   * handleScroll:
   * Monitors scroll position for infinite load + syncs floating mirror scrollbar.
   */
  const handleScroll = useCallback(() => {
    // Sync mirror scrollbar horizontal position
    if (mirrorRef.current && scrollRef.current) {
      mirrorRef.current.scrollLeft = scrollRef.current.scrollLeft;
    }
    if (!scrollRef.current || isLoadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 80;
    if (isNearBottom) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, finalCases.length));
        setIsLoadingMore(false);
      }, 400);
    }
  }, [isLoadingMore, hasMore, finalCases.length]);

  // When user drags the mirror bar, sync back to the table
  const handleMirrorScroll = useCallback(() => {
    if (mirrorRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = mirrorRef.current.scrollLeft;
    }
  }, []);

  // Keep the mirror inner spacer width in sync with the actual table width
  // Hide the mirror bar when the table fits without horizontal scrolling
  useEffect(() => {
    if (isTablet) return;
    const table = scrollRef.current?.querySelector('table');
    if (!innerRef.current || !table) return;
    const sync = () => {
      if (!innerRef.current || !scrollRef.current) return;
      innerRef.current.style.width = `${table.scrollWidth}px`;
      const needsScroll = table.scrollWidth > scrollRef.current.clientWidth;
      if (mirrorRef.current) mirrorRef.current.style.display = needsScroll ? '' : 'none';
    };
    const observer = new ResizeObserver(sync);
    observer.observe(table);
    sync();
    return () => observer.disconnect();
  }, [isTablet]);

  /**
   * Parent Synchronization:

   * Keeps the parent component informed about which case is at the 
   * top of the current sorted/filtered list and the total sequence.
   */
  useEffect(() => {
    onFirstCaseIdRef.current?.(finalCases[0]?.id ?? null);
    onDisplayOrderRef.current?.(finalCases.map(c => c.id));
  }, [finalCases]); // Callbacks intentionally read from refs — omitting them here is correct

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: TABLE SHELL & SORT RIBBON
  // ─────────────────────────────────────────────────────────────────────────────


  // Renders either a ComputationalFlagIcon (with stopPropagation) or the
  // existing FlagChip — determined by the flag definition's tagClass.
  const renderFlag = (appliedFlag: any, caseId: string, idx: number, isSpecimen: boolean) => {
    const key = appliedFlag.flagDefinitionId ?? appliedFlag.lisCode ?? appliedFlag.id;
    const def = key ? defMap.get(key) : undefined;
    // Use definition tagClass first, then the flag's own tagClass as fallback
    const effectiveTagClass = def?.tagClass ?? (appliedFlag as any).tagClass;

    if (effectiveTagClass === 'COMPUTATIONAL' && def) {
      return (
        <ComputationalFlagIcon
          key={`comp-${def.id}-${idx}`}
          flag={def}
          caseId={caseId}
          size={26}
          onSelect={(flag) => { openOverlay(flag, caseId); }}
        />
      );
    }

    return <FlagChip key={`${isSpecimen ? 'sf' : 'cf'}-${idx}`} flag={appliedFlag} isSpecimen={isSpecimen} />;
  };


  // Renders flags with computational icons FIRST (actionable data),
  // followed by administrative pills (informational).
  const renderFlags = (caseFlags: any[], specimenFlags: any[], caseId: string) => {
    const allFlags = [
      ...caseFlags.map(f => ({ f, isSpecimen: false })),
      ...specimenFlags.map(f => ({ f, isSpecimen: true })),
    ];
    const computational = allFlags.filter(({ f }) => {
      const key = f.flagDefinitionId ?? f.lisCode ?? f.id;
      const def = key ? defMap.get(key) : undefined;
      const effectiveTagClass = def?.tagClass ?? (f as any).tagClass;
      return effectiveTagClass === 'COMPUTATIONAL';
    });
    const administrative = allFlags.filter(({ f }) => {
      const key = f.flagDefinitionId ?? f.lisCode ?? f.id;
      const def = key ? defMap.get(key) : undefined;
      const effectiveTagClass = def?.tagClass ?? (f as any).tagClass;
      return !effectiveTagClass || effectiveTagClass !== 'COMPUTATIONAL';
    });
    return (
      <div className="wl-flags-wrap">
        {computational.length > 0 && (
          <div className="wl-comp-flags" style={{ marginRight: administrative.length > 0 ? 6 : 0 }}>
            {computational.map(({ f, isSpecimen }, idx) => renderFlag(f, caseId, idx, isSpecimen))}
          </div>
        )}
        {administrative.map(({ f, isSpecimen }, idx) => renderFlag(f, caseId, idx + 1000, isSpecimen))}
      </div>
    );
  };

  return (
    <div className="wl-container" style={{ height: tableHeight ? `${tableHeight}px` : '100%' }}>
      
      {/* Multi-Sort Indicator Ribbon */}
      {sortStack.length > 1 && (
        <div className="wl-sort-ribbon">
          <span className="wl-sort-ribbon__label">Sorted by:</span>
          {sortStack.map((s) => (
            <div key={s.key} className="wl-sort-chip">
              {HEADER_COLUMNS.find(h => h.key === s.key)?.label}
              <span className="wl-sort-chip__dir">{s.dir}</span>
              <button onClick={() => onRemoveSort(s.key)} className="wl-sort-chip__remove">×</button>
            </div>
          ))}
          <button onClick={clearSort} className="wl-sort-clear">Clear All</button>
        </div>
      )}

      {/*
        Layout: <table> with tableLayout:'fixed' + <colgroup> is the ONLY reliable
        way to guarantee header/body column alignment. CSS Grid 1fr columns diverge
        between header and body when scroll gutters or padding differ by even 1px.
        Sticky <thead> works correctly inside overflow-y:auto when the table itself
        provides the scroll height — no sticky-inside-overflow conflict.

        Below 1024px (iPad / tablet) we switch to a card layout via isTablet.
      */}

      {/* ── CARD LAYOUT (tablet / iPad < 1024px) ── */}
      {isTablet ? (
        <div className="wl-scroll wl-card-list" ref={scrollRef} onScroll={handleScroll}>
          {finalCases.length === 0 ? (
            <div className="wl-empty-state">No cases match the current filter.</div>
          ) : (
            <>
              {visibleRows.map((row: DisplayRow, rowIndex: number) => {

                // Section divider
                if ('__divider' in row) {
                  return (
                    <div key={`div-${row.label}-${rowIndex}`} className="wl-card-divider">
                      <span className={`wl-card-divider__label${row.label === 'Urgent' || row.label === 'Pool — Urgent' ? ' wl-card-divider__label--urgent' : row.label === 'Pool' ? ' wl-card-divider__label--pool' : ''}`}>
                        {row.label}
                      </span>
                      <span className="wl-card-divider__count">{row.count}</span>
                      <div className="wl-card-divider__line" />
                    </div>
                  );
                }

                // Case card
                const c = row as Case;
                const isUrgent = isUrgentCase(c);
                const isSelected = selectedCaseId ? c.id === selectedCaseId : false;
                const statusStyle = getStatusStyle(c.status);
                const statusLabel = c.status.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());

                let cardClass = 'wl-card';
                if (isSelected) cardClass += ' wl-card--selected';
                else if (isUrgent) cardClass += ' wl-card--urgent';

                return (
                  <div
                    key={c.id}
                    className={cardClass}
                    onClick={() => handleRowClick(c.id)}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* ── Card header: case ID + status badge ── */}
                    <div className="wl-card__header">
                      <div className="wl-card__id-group">
                        {isUrgent && <UrgentDot />}
                        <div>
                          {c.originHospitalId && c.originHospitalId !== 'HOSP-001' && (
                            <div
                              className="wl-card__org"
                              title={getOrganisationByHospitalId(c.originHospitalId)?.name ?? c.originHospitalId}
                            >
                              {getOrganisationShortName(c.originHospitalId)}
                            </div>
                          )}
                          <span className={`wl-card__case-id${isUrgent ? ' wl-card__case-id--urgent' : ''}`}>
                            {c.id}
                          </span>
                        </div>
                      </div>
                      <span
                        className="wl-card__status-badge"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* ── Card body ── */}
                    <div className="wl-card__body">

                      {/* Patient */}
                      <div>
                        <div className="wl-card__field-label">Patient</div>
                        <div className="wl-card__field-value" data-phi="name">
                          {isPedRestricted(c)
                            ? <span className="wl-ped-name">🔒 Restricted Patient</span>
                            : <>{c.patient.lastName}, {c.patient.firstName}</>}
                        </div>
                        {isPedRestricted(c) ? (
                          <div className="wl-ped-hint">
                            {pedRequestedIds.has(c.id) ? (
                              <span className="wl-ped-badge">⏳ Access requested</span>
                            ) : 'Click to request pediatric access'}
                          </div>
                        ) : (
                          <div className="wl-card__field-sub" data-phi="dob">
                            {c.patient.sex?.charAt(0) ?? '—'}
                            {' · '}
                            {formatDate(c.patient.dateOfBirth)}
                            {' '}
                            ({c.patient.dateOfBirth ? getAgeLabel(c.patient.dateOfBirth) : '—'})
                            <span className="wl-mrn-inline" data-phi="mrn">· MRN {c.patient.mrn ?? '—'}</span>
                          </div>
                        )}
                      </div>

                      {/* Accession + Physician */}
                      <div>
                        <div className="wl-card__field-label">Accession · Physician</div>
                        <div className="wl-card__field-sub">{formatDate(c.order?.receivedDate)}</div>
                        <div className="wl-card__field-sub">
                          {c.order?.requestingProvider ?? '—'}
                        </div>
                      </div>

                      {/* Specimens — full width */}
                      {!isPedRestricted(c) && c.specimens && c.specimens.length > 0 && (
                        <div className="wl-card__body-full">
                          <div className="wl-card__field-label">Specimen{c.specimens.length > 1 ? 's' : ''}</div>
                          <div className="wl-card__chips">
                            {c.specimens.slice(0, 3).map(s => (
                              <SpecimenChip key={s.id} label={s.label} description={s.description} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flags — full width, only if present */}
                      {!isPedRestricted(c) && ((c.caseFlags?.length ?? 0) + (c.specimenFlags?.length ?? 0)) > 0 && (
                        <div className="wl-card__body-full">
                          <div className="wl-card__field-label">Flags</div>
                          <div className="wl-card__chips">
                            {renderFlags(c.caseFlags ?? [], c.specimenFlags ?? [], c.id)}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {isLoadingMore && (
                <div className="wl-loading-state">
                  <div className="wl-loader-spinner wl-loader-center" />
                </div>
              )}

              {/* Bottom buffer */}
              <div style={{ height: '80px' }} />
            </>
          )}
        </div>

      ) : (

      /* ── TABLE LAYOUT (desktop ≥ 1024px) ── */
      <div className="wl-table-wrap">

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="wl-table-scroll"
        >
          <table className="wl-table" style={{ minWidth: '1100px' }}>

          {/* Column widths tuned for 1366px viewport — total ~1107px */}
          <colgroup>
            <col style={{ width: '32px'  }} />{/* urgent dot */}
            <col style={{ width: '130px' }} />{/* case id */}
            <col style={{ width: '135px' }} />{/* patient */}
            <col style={{ width: '60px'  }} />{/* mrn */}
            <col style={{ width: '30px'  }} />{/* sex */}
            <col style={{ width: '105px' }} />{/* dob */}
            <col style={{ width: '190px' }} />{/* specimens */}
            <col style={{ width: '85px'  }} />{/* accession */}
            <col style={{ width: '120px' }} />{/* physician */}
            <col style={{ width: '180px' }} />{/* flags */}
            <col style={{ width: '40px'  }} />{/* status dot */}
          </colgroup>

          {/* ── Sticky Header ── */}
          <thead className="wl-thead">
            <tr className="wl-thead-row">
              <th className="wl-th-dot" />
              {HEADER_COLUMNS.map(({ label, key }, colIdx) => {
                const sortEntry = sortStack.find(e => e.key === key);
                const isPrimary = sortStack[0]?.key === key;
                const isLast    = colIdx === HEADER_COLUMNS.length - 1;
                return (
                  <th key={key} className={isLast ? 'wl-col-th--last' : 'wl-col-th'}>
                    <button onClick={() => onHeaderClick(key)} className={isLast ? 'wl-col-header-btn wl-col-header-btn--last' : 'wl-col-header-btn'} style={{ color: isPrimary ? '#38bdf8' : sortEntry ? '#7dd3fc' : '#94a3b8' }}>
                      {label}
                      {sortEntry && <span className="wl-sort-arrow">{sortEntry.dir === 'asc' ? '▴' : '▾'}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {finalCases.length === 0 ? (
              <tr>
                <td colSpan={11} className="wl-td-empty">
                  No cases match the current filter.
                </td>
              </tr>
            ) : (
              visibleRows.map((row: DisplayRow, rowIndex: number) => {

                // Section divider
                if ('__divider' in row) {
                  const isUrgentDiv = row.label === 'Urgent' || row.label === 'Pool — Urgent';
                  const isPoolDiv   = row.label === 'Pool' || row.label === 'Pool — Urgent';
                  return (
                    <tr key={`div-${row.label}-${rowIndex}`}>
                      <td colSpan={11} className={isUrgentDiv ? 'wl-td-divider--urgent' : 'wl-td-divider--normal'}>
                        <div className="wl-card-divider" style={{ padding: 0 }}>
                          <span className={`wl-card-divider__label${isUrgentDiv ? ' wl-card-divider__label--urgent' : isPoolDiv ? ' wl-card-divider__label--pool' : ''}`}>
                            {row.label}
                          </span>
                          <span className="wl-card-divider__count">{row.count}</span>
                          <div className="wl-card-divider__line" />
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Case row
                const c = row as Case;
                const isUrgent = isUrgentCase(c);
                const isPool   = c.status === 'pool';
                const isSelected = selectedCaseId ? c.id === selectedCaseId : false;
                const isHovered = hoveredRow === c.id;

                return (
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c.id)}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isSelected ? 'rgba(8,145,178,0.18)' : isHovered && isPool ? 'rgba(249,115,22,0.10)' : isHovered ? 'rgba(8,145,178,0.10)' : 'transparent',
                      borderLeft: `2px solid ${isSelected ? '#0891B2' : isPool ? 'rgba(249,115,22,0.7)' : isUrgent ? 'rgba(239,68,68,0.5)' : 'transparent'}`,
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Urgent dot */}
                    <td className="wl-td-dot">
                      <div className="wl-td-dot-inner">
                        {isUrgent && <UrgentDot />}
                      </div>
                    </td>

                    {/* Case ID */}
                    <td className="wl-td">
                      {c.originHospitalId && c.originHospitalId !== 'HOSP-001' && (
                        <div title={getOrganisationByHospitalId(c.originHospitalId)?.name ?? c.originHospitalId}
                          className="wl-org-label">
                          {getOrganisationShortName(c.originHospitalId)}
                        </div>
                      )}
                      <div style={{ fontWeight: 600, color: isUrgent ? '#f87171' : isPool ? '#F97316' : '#0891b2', fontSize: '13px' }}>
                        {c.id}
                      </div>
                    </td>

                    {/* Patient name */}
                    <td className="wl-td" data-phi="name">
                      {isPedRestricted(c) ? (
                        <div>
                          <div className="wl-ped-name">🔒 Restricted Patient</div>
                          {pedRequestedIds.has(c.id) ? (
                            <div className="wl-ped-badge">⏳ Access requested</div>
                          ) : (
                            <div className="wl-ped-hint">Click to request pediatric access</div>
                          )}
                        </div>
                      ) : (
                        <div className="wl-patient-overflow">
                          {c.patient.lastName}, {c.patient.firstName}
                        </div>
                      )}
                    </td>

                    {/* MRN */}
                    <td className="wl-td-muted" data-phi="mrn">
                      {isPedRestricted(c) ? '—' : (c.patient.mrn ?? '—')}
                    </td>

                    {/* Sex */}
                    <td className="wl-td-center">
                      {isPedRestricted(c) ? '—' : (c.patient.sex?.charAt(0) ?? '—')}
                    </td>

                    {/* DOB */}
                    <td className="wl-td-dob" data-phi="dob">
                      {isPedRestricted(c) ? '—' : (
                        <>{formatDate(c.patient.dateOfBirth)}
                        <span className="wl-dob-age">({c.patient.dateOfBirth ? getAgeLabel(c.patient.dateOfBirth) : '—'})</span></>
                      )}
                    </td>

                    {/* Specimens */}
                    <td className="wl-td">
                      {isPedRestricted(c) ? (
                        <span className="wl-specimen-empty">—</span>
                      ) : (
                        <div className="wl-chips-wrap">
                          {c.specimens?.slice(0, 3).map(s => (
                            <SpecimenChip key={s.id} label={s.label} description={s.description} />
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Accession date */}
                    <td className="wl-td-date">
                      {formatDate(c.order?.receivedDate)}
                    </td>

                    {/* Physician */}
                    <td className="wl-td-physician">
                      {c.order?.requestingProvider ?? '—'}
                    </td>

                    {/* Flags */}
                    <td className="wl-td">
                      <div className="wl-chips-wrap">
                        {renderFlags(c.caseFlags ?? [], c.specimenFlags ?? [], c.id)}
                      </div>
                    </td>

                    {/* Status dot */}
                    <td className="wl-td-status">
                      <StatusDot status={c.status} />
                    </td>
                  </tr>
                );
              })
            )}

            {isLoadingMore && (
              <tr>
                <td colSpan={11} className="wl-loading-state">
                  <div className="wl-loader-spinner wl-loader-center" />
                </td>
              </tr>
            )}
            <tr><td colSpan={11} className="wl-row-spacer" /></tr>
          </tbody>
        </table>
        </div>{/* end scroll container */}

        {/* Floating mirror scrollbar — bidirectional horizontal scroll sync.
            Dragging this bar scrolls the table; scrolling the table syncs this bar.
            The innerRef div is kept in sync with the table's actual scroll width
            via the ResizeObserver in the useEffect above. */}
        <div
          ref={mirrorRef}
          className="wl-mirror-bar"
          onScroll={handleMirrorScroll}
        >
          <div ref={innerRef} style={{ height: '1px' }} />
        </div>

      </div>

      )} {/* end isTablet ternary */}

      {/* ── Pediatric Access Modal ─────────────────────────────────────── */}
      {pedBlockedCase && (
        <div className="ps-overlay" onClick={() => setPedBlockedCase(null)}>
          <div className="ps-modal ps-modal-md" onClick={e => e.stopPropagation()}
            style={{ borderColor: 'rgba(245,158,11,0.4)' }}>

            <div className="ps-modal-header">
              <div className="ps-modal-header-inner">
                <div className="ps-ped-icon">🔒</div>
                <div>
                  <div className="ps-modal-title">Pediatric Access Required</div>
                  <div className="ps-modal-subtitle">
                    Patient age {pedBlockedCase.age} · Case {pedBlockedCase.id}
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-modal-body">
              <p className="ps-ped-body">
                This patient is classified as pediatric. Access requires both a user-level qualification <em>and</em> authorization
                by the submitting client. Your System Admin can grant access via{' '}
                <strong className="ps-ped-highlight">Configuration → Client Dictionary</strong>.
              </p>

              {pedRequestSent ? (
                <div className="ps-ped-pending">
                  ⏳ Access request pending — your System Admin has been notified.<br/>
                  <span className="ps-ped-pending-sub">You'll receive a message when access is granted.</span>
                </div>
              ) : (
                <div className="ps-ped-info-box">
                  <strong className="ps-ped-highlight">Request Pediatric Access</strong><br/>
                  One click sends an automated request to your System Admin.
                </div>
              )}
            </div>

            <div className="ps-modal-footer">
              <button className="ps-btn-secondary" onClick={() => setPedBlockedCase(null)}>
                Close
              </button>
              {!pedRequestSent && (
                <button className="ps-btn-primary" onClick={async () => {
                  if (!user || !pedBlockedCase) return;
                  try {
                    await messageService.send({
                      senderId: (user as any).id,
                      senderName: (user as any).name,
                      recipientId: 'u3',
                      recipientName: 'System Admin',
                      subject: `Pediatric Access Request — ${(user as any).name}`,
                      body: `${(user as any).name} needs Pediatric Access for case ${pedBlockedCase.id} (patient age ${pedBlockedCase.age}).\n\nTo grant access:\n1. Go to Configuration → Client Dictionary\n2. Open the submitting client for this case\n3. Add ${(user as any).name} to the Authorized Pediatric Pathologists list\n\nNote: Both the user-level Pediatric flag AND the client authorization must be set for access to be granted.`,
                      configLink: pedBlockedCase.clientId
                        ? `/configuration?tab=system&section=clients&client=${pedBlockedCase.clientId}`
                        : '/configuration?tab=system&section=clients',
                      timestamp: new Date(),
                      isUrgent: false,
                    });
                    markPedRequested(pedBlockedCase.id);
                    reloadInbox();
                    auditService.logEvent({
                      type: 'system',
                      event: 'Pediatric Access Requested',
                      detail: `${(user as any)?.name ?? 'Unknown'} requested Pediatric Access permission for case ${pedBlockedCase!.id} (patient age ${pedBlockedCase!.age}). Request sent to System Admin.`,
                      user: (user as any)?.name ?? 'Unknown',
                      caseId: pedBlockedCase!.id,
                      confidence: null,
                    }).catch(() => {});
                  } catch { markPedRequested(pedBlockedCase.id); }
                }}>
                  Request Pediatric Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorklistTable;

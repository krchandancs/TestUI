// src/pages/WorklistPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getDelegations } from '@/services/cases/mockCaseService';
import { caseRouter } from '@/services/cases/CaseRouter';
import type { Case } from '@/types/case/Case';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '@hooks/useLogout';
import WorklistTable      from '../../components/Worklist/WorklistTable';
import ResourcesModal     from './ResourcesModal';
import LogoutWarningModal from './LogoutWarningModal';
import CaseSearchBar from '../../components/Search/CaseSearchBar';
import { mockActionRegistryService } from '../../services/actionRegistry/mockActionRegistryService';
import { VOICE_CONTEXT } from '../../constants/systemActions';
import { COMP_EVENT, COMP_VOICE, COMP_AUDIT } from '../../constants/computationalActions';
import { useAuditLog } from '../../components/Audit/useAuditLog';
import { PoolClaimModal } from '../../components/Worklist/PoolClaimModal';
import { useAuth } from '@/contexts/AuthContext';
import { flagService }    from '@/services';
import { Flag }           from '@/services/flags/IFlagService';
import SidecarDrawer      from '../../components/sidecar/SidecarDrawer';
import { useSidecar }     from '@/contexts/SidecarContext';

const FILTER_TITLES: Record<string, string> = {
  all:        'Active Cases',
  urgent:     'Urgent Cases',
  pool:       'Pool Cases',
  delegated:  'Delegated to Me',
  review:     'Needs Review',
  inprogress: 'In Progress',
  draft:      'Draft Cases',
  finalizing: 'Finalizing',
  amended:    'Amended Cases',
  completed:  'Completed Today',
  physician:  'Physician View',
};

const WorklistPage: React.FC = () => {
  const handleLogout = useLogout();
  const { user } = useAuth();
  const { log }  = useAuditLog();
  const navigate = useNavigate();
  const location  = useLocation();

  // contextFilter: which data source (LIS or Outreach) — the "home" context
  // Sticky for the session — restored from sessionStorage on mount
  const [contextFilter, setContextFilter] = useState<'lis' | 'outreach'>(
    () => (sessionStorage.getItem('ps_worklist_context') as 'lis' | 'outreach') ?? 'lis'
  );
  // Persist whenever it changes
  React.useEffect(() => {
    sessionStorage.setItem('ps_worklist_context', contextFilter);
  }, [contextFilter]);

  // activeFilter:  which sub-filter within that context
  const [activeFilter, setActiveFilter]       = useState<'all' | 'review' | 'completed' | 'urgent' | 'physician' | 'pool' | 'delegated' | 'inprogress' | 'amended' | 'draft' | 'finalizing'>('all');
  const [realCases, setRealCases]             = useState<Case[]>([]);

  // Note: orchestrator mode flag read via localStorage when needed at case open
  const [delegatedToMeCount, setDelegatedToMeCount] = useState(0);
  const [delegatedCaseIds, setDelegatedCaseIds]     = useState<string[]>([]);
  const [physicianFilter, setPhysicianFilter] = useState<string>('');
  const [physicianPrompt, setPhysicianPrompt] = useState<string | null>(null);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const CURRENT_USER_ID   = user?.id   ?? 'PATH-001';
  const CURRENT_USER_NAME = user?.name ?? 'Dr. Sarah Johnson';

  // Measure available height for the table container.
  // We get the wrapper's top offset from the viewport and subtract from var(--app-height, 100vh).
  // This is immune to any parent overflow/flex chain issues.
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number>(400);
  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current) return;
      const top = wrapperRef.current.getBoundingClientRect().top;
      const available = window.innerHeight - top - 16; // 16px bottom breathing room
      setTableHeight(Math.max(200, available));
    };
    // Small delay so the tiles/header have rendered and settled
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

  // Pool claim modal state
  const [claimModal, setClaimModal] = useState<{ caseId: string; summary: string; poolName: string } | null>(null);

  // Flag definitions — needed by WorklistTable to identify computational flags
  // and by SidecarDrawer to populate the navigator pane.
  const [allFlags,           setAllFlags]           = useState<Flag[]>([]);
  const [computationalFlags, setComputationalFlags] = useState<Flag[]>([]);

  // Sidecar — reset to overlay mode when returning from synoptic page.
  const { openOverlay, close: closeSidecar } = useSidecar();
  useEffect(() => {
    closeSidecar(); // close overlay when returning to worklist — re-opens on next icon click
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  useEffect(() => {
    flagService.getAll().then(res => {
      if (!res.ok) return;
      setAllFlags(res.data);
      setComputationalFlags(res.data.filter((f: Flag) => f.tagClass === 'COMPUTATIONAL' && f.status === 'Active'));
    }).catch(() => {});
  }, []);

  // Load cases via the unified CaseRouter (routes LIS / Orchestrator by case ID prefix)
  // Also load client pediatric thresholds so we can filter cases the user can't access
  const [clientThresholds, setClientThresholds] = useState<Record<string, number | null>>({});
  const [clientAuthorized, setClientAuthorized] = useState<Record<string, string[]>>({});
  const [thresholdsLoaded, setThresholdsLoaded] = useState(false);
  useEffect(() => {
    import('@/services').then(({ clientService }) => {
      clientService.getAll().then(res => {
        if (!res.ok) return;
        const threshMap: Record<string, number | null> = {};
        const authMap: Record<string, string[]> = {};
        for (const c of res.data) {
          threshMap[c.id] = (c as any).pediatricAgeThreshold ?? null;
          authMap[c.id] = (c as any).authorizedPediatricPathologistIds ?? [];
        }
        setClientThresholds(threshMap);
        setClientAuthorized(authMap);
        setThresholdsLoaded(true);
      }).catch(() => setThresholdsLoaded(true));
    });
  }, [location.key]);

  useEffect(() => {
    const canViewPeds = (user as any)?.canViewPediatric ?? false;
    // Load cases from both services via the unified router
    caseRouter.listCasesForUser(user?.id ?? 'current')
      .then(setRealCases)
      .catch(() => {});
    // Load delegated-to-me count + case IDs
    getDelegations().then(all => {
      const mine = all.filter(d => d.toUserId === CURRENT_USER_ID && d.status === 'pending');
      setDelegatedToMeCount(mine.length);
      setDelegatedCaseIds(mine.map(d => d.caseId).filter(Boolean));
    }).catch(() => {});
  }, [user?.id, location.key]);

  // Auto-clear the "Access requested" badge for any case that is no longer restricted
  useEffect(() => {
    if (!thresholdsLoaded || realCases.length === 0) return;
    try {
      const stored = localStorage.getItem('pathscribe_ped_requested');
      if (!stored) return;
      const requested: string[] = JSON.parse(stored);
      const stillRestricted = requested.filter(caseId => {
        const c = realCases.find((rc: any) => rc.id === caseId);
        if (!c) return false; // case gone — clear it
        return !canViewCase(c); // keep only if still restricted
      });
      if (stillRestricted.length !== requested.length) {
        localStorage.setItem('pathscribe_ped_requested', JSON.stringify(stillRestricted));
      }
    } catch { /* ignore */ }
  }, [thresholdsLoaded, realCases]);

  // Quick Links Data
  const quickLinks = {
    protocols: [
      { title: 'CAP Cancer Protocols', url: 'https://www.cap.org/protocols-and-guidelines' },
      { title: 'WHO Classification', url: 'https://www.who.int/publications' }
    ],
    references: [
      { title: 'PathologyOutlines', url: 'https://www.pathologyoutlines.com' },
      { title: 'UpToDate', url: 'https://www.uptodate.com' }
    ],
    systems: [
      { title: 'Hospital LIS', url: '#' },
      { title: 'Lab Management', url: '#' }
    ]
  };

  // ── 50 Mock Cases ──────────────────────────────────────────────────────────
  // ── Voice: selected row index for keyboard/voice navigation ───────────────
  const [selectedIndex,    setSelectedIndex]    = useState<number>(-1);
  const [selectedCaseId,   setSelectedCaseId]   = useState<string | null>(null);
  const [displayOrder,     setDisplayOrder]      = useState<string[]>([]);

  // ── Return-from-case selection ─────────────────────────────────────────
  // When navigating back from a synoptic report, advance to the next case
  // in the table's actual display order (respects active sort).
  // displayOrder is populated by WorklistTable via onDisplayOrder before this runs.
  const fromCaseId    = (location.state as any)?.fromCaseId    as string | undefined;
  const restoreFilter = (location.state as any)?.restoreFilter as string | undefined;

  // Restore filter when navigating back from report page
  useEffect(() => {
    if (restoreFilter) {
      setActiveFilter(restoreFilter as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once on mount

  useEffect(() => {
    if (!fromCaseId || displayOrder.length === 0) return;
    const viewedIdx = displayOrder.indexOf(fromCaseId);
    const targetId  = displayOrder[viewedIdx + 1] ?? displayOrder[viewedIdx] ?? null;
    if (!targetId) return;
    setSelectedIndex(0);
    setSelectedCaseId(targetId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOrder]); // fires once displayOrder arrives from the table


  // Returns true if the current user is allowed to see this case
  const canViewCase = (c: any): boolean => {
    if (!thresholdsLoaded) return false;
    const dob = c?.patient?.dateOfBirth;
    const clientId = c?.order?.clientId;
    const threshold = clientId ? (clientThresholds[clientId] ?? null) : null;
    if (!dob || threshold === null) return true; // no pediatric threshold configured — always visible
    const ageYrs = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (ageYrs >= threshold) return true; // not pediatric — always visible
    // Patient is pediatric — check Option C dual gate:
    // Either user-level flag OR being in the client's authorized list grants access
    const canViewPeds = (user as any)?.canViewPediatric ?? false;
    const authorizedIds: string[] = clientId ? (clientAuthorized[clientId] ?? []) : [];
    return canViewPeds || authorizedIds.includes(user?.id ?? '');
  };

  // Split by reporting mode
  const lisCases  = React.useMemo(() => realCases.filter(c => (c as any).reportingMode !== 'orchestrator'), [realCases]);
  const orchCases = React.useMemo(() => realCases.filter(c => (c as any).reportingMode === 'orchestrator'),  [realCases]);

  // displayCases stays simple — filteredCases handles the LIS/Outreach split explicitly
  const displayCases = realCases;

  // Outreach sub-counts (always from orchCases regardless of active filter)
  const orchAssignedCount = React.useMemo(() => orchCases.filter(c => c.status !== 'pool').length,                                    [orchCases]);
  const orchUrgentCount   = React.useMemo(() => orchCases.filter(c => c.order?.priority === 'STAT' && c.status !== 'pool').length, [orchCases]);
  const orchPoolCount     = React.useMemo(() => orchCases.filter(c => c.status === 'pool').length,                                    [orchCases]);
  const hasUrgentPool     = React.useMemo(() => orchCases.some(c => c.status === 'pool' && c.order?.priority === 'STAT'),             [orchCases]);

  // Source cases — driven by contextFilter (which worklist is "home")
  const sourceCases = contextFilter === 'outreach' ? orchCases : lisCases;

  // filteredCases — applies sub-filter within the current context
  // thresholdsLoaded + clientThresholds must be deps since canViewCase gates on them.
  const filteredCases = React.useMemo(() => {
    return sourceCases.filter(c => {
      if (!canViewCase(c)) return false;
      if (activeFilter === 'pool')       return c.status === 'pool';
      if (activeFilter === 'all')        return true;
      if (c.status === 'pool')           return activeFilter === 'urgent' && c.order?.priority === 'STAT';
      if (activeFilter === 'urgent')     return c.order?.priority === 'STAT';
      if (activeFilter === 'review')     return c.status === 'pending-review';
      if (activeFilter === 'completed')  return c.status === 'finalized';
      if (activeFilter === 'draft')      return c.status === 'draft';
      if (activeFilter === 'inprogress') return c.status === 'in-progress';
      if (activeFilter === 'amended')    return c.status === 'amended';
      if (activeFilter === 'physician')  return (c.order?.requestingProvider ?? '').toLowerCase().includes(physicianFilter.toLowerCase());
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCases, activeFilter, physicianFilter, thresholdsLoaded, clientThresholds]);

  // Stats — always from sourceCases so tile counts match the current context
  const statsCases   = sourceCases;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nonPoolStats = React.useMemo(() => statsCases.filter(c => c.status !== 'pool' && canViewCase(c)),
    [statsCases, thresholdsLoaded, clientThresholds]); // eslint-disable-line react-hooks/exhaustive-deps

  // LIS counts — always fixed, never switch with context
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lisNonPool      = React.useMemo(() => lisCases.filter(c => c.status !== 'pool' && canViewCase(c)),
    [lisCases, thresholdsLoaded, clientThresholds]); // eslint-disable-line react-hooks/exhaustive-deps
  const lisNonPoolCount = lisNonPool.length;
  const lisUrgentCount  = React.useMemo(() => lisNonPool.filter(c => c.order?.priority === 'STAT').length, [lisNonPool]);
  const lisPoolCount    = React.useMemo(() => lisCases.filter(c => c.status === 'pool').length, [lisCases]);
  const hasUrgentLisPool = React.useMemo(() => lisCases.some(c => c.status === 'pool' && c.order?.priority === 'STAT'), [lisCases]);
  const stats = {
    total:          nonPoolStats.length,
    pool:           statsCases.filter(c => c.status === 'pool').length,
    outreach:       orchCases.length,
    urgent:         nonPoolStats.filter(c => c.order?.priority === 'STAT').length,
    inProgress:     nonPoolStats.filter(c => c.status === 'in-progress').length,
    needsReview:    nonPoolStats.filter(c => c.status === 'pending-review').length,
    amended:        nonPoolStats.filter(c => c.status === 'amended').length,
    draft:          nonPoolStats.filter(c => c.status === 'draft').length,
    finalizing:     nonPoolStats.filter(c => c.status === 'finalizing').length,
    completedToday: nonPoolStats.filter(c => {
      if (c.status !== 'finalized') return false;
      if (!c.updatedAt) return false;
      const u = new Date(c.updatedAt), t = new Date();
      return u.getFullYear() === t.getFullYear() &&
             u.getMonth()    === t.getMonth()    &&
             u.getDate()     === t.getDate();
    }).length,
  };



  // ── Voice: set WORKLIST context on mount ──────────────────────────────────
  // Register computational voice actions with the action registry
  useEffect(() => {
    const registerComp = () => {
      Object.entries(COMP_VOICE).forEach(([key, phrases]) => {
        const eventName = COMP_EVENT[key as keyof typeof COMP_EVENT];
        (mockActionRegistryService as any).registerAction?.({
          id:       `comp_${key.toLowerCase()}`,
          label:    phrases[0],
          phrases,
          event:    eventName,
          context:  VOICE_CONTEXT.WORKLIST,
          category: 'Computational Data',
        });
      });
    };
    registerComp();
  }, []);

  useEffect(() => {
    mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
    return () => mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
  }, []);

  // ── Voice: table navigation listeners ────────────────────────────────────────
  useEffect(() => {
    const clamp = (i: number) => Math.max(0, Math.min(i, filteredCases.length - 1));

    // Sync both index and case ID together so selection survives sort/filter changes
    const syncId = (idx: number) => {
      setSelectedIndex(idx);
      setSelectedCaseId(filteredCases[idx]?.id ?? null);
    };

    // Default to row 0 on first voice command if nothing selected yet
    const ensureSelection = (i: number) => i < 0 ? 0 : i;

    const next        = () => setSelectedIndex(i => { const n = clamp(ensureSelection(i) + 1); syncId(n); return n; });
    const previous    = () => setSelectedIndex(i => { const n = clamp(ensureSelection(i) - 1); syncId(n); return n; });
    const pageDown    = () => setSelectedIndex(i => { const n = clamp(ensureSelection(i) + 10); syncId(n); return n; });
    const pageUp      = () => setSelectedIndex(i => { const n = clamp(ensureSelection(i) - 10); syncId(n); return n; });
    const first       = () => syncId(0);
    const last        = () => syncId(clamp(filteredCases.length - 1));
    const refresh     = () => window.location.reload();

    // TTS helper — reads text aloud via Web Speech Synthesis
    const speak = (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1; u.volume = 1;
      window.speechSynthesis.speak(u);
    };

    // Read flags for the focused row
    const readFlags = () => {
      const focused = realCases.find(c => c.id === selectedCaseId);
      if (!focused) { speak('No case selected.'); return; }
      const flags = [
        ...((focused as any).caseFlags    ?? []).map((f: any) => f.name),
        ...((focused as any).specimenFlags ?? []).map((f: any) => f.name),
      ];
      if (flags.length === 0) {
        speak(`${focused.id} has no flags.`);
      } else {
        speak(`${focused.id} has ${flags.join(' and ')}.`);
      }
    };

    // Read specimen type for the focused row
    const readSpecimen = () => {
      const focused = realCases.find(c => c.id === selectedCaseId);
      if (!focused) { speak('No case selected.'); return; }
      const spec = focused.specimens?.[0];
      speak(`${focused.id}: ${spec ? spec.description : 'no specimen description'}.`);
    };

    // Filter by physician name — extracted from transcript
    const filterPhysician = (e: Event) => {
      const transcript = ((e as CustomEvent).detail?.transcript as string) ?? '';
      const name = transcript.toLowerCase().replace(/filter by\s*/i, '').trim();
      if (!name) return;

      // Find all unique physicians in the worklist
      const physicians = [...new Set(realCases.map(c => c.order?.requestingProvider ?? '').filter(Boolean))];
      const matches = physicians.filter(p => p.toLowerCase().includes(name));

      if (matches.length === 0) {
        speak(`No physician found matching ${name}.`);
      } else if (matches.length === 1) {
        setPhysicianFilter(matches[0]);
        setActiveFilter('physician');
        setSelectedIndex(-1); setSelectedCaseId(null);
        speak(`Filtering by ${matches[0]}.`);
      } else {
        // Ambiguity — prompt for clarification
        setPhysicianPrompt(`Did you mean: ${matches.slice(0, 3).join(', or ')}?`);
        speak(`Multiple physicians match ${name}. ${matches.slice(0, 3).join(', or ')}?`);
      }
    };

    // Filter commands — reset selection when filter changes
    const filterUrgent    = () => { setActiveFilter('urgent');    setSelectedIndex(-1); setSelectedCaseId(null); };
    const filterCompleted = () => { setActiveFilter('completed'); setSelectedIndex(-1); setSelectedCaseId(null); };
    const filterReview    = () => { setActiveFilter('review');    setSelectedIndex(-1); setSelectedCaseId(null); };
    const clearFilter     = () => { setActiveFilter('all');       setSelectedIndex(-1); setSelectedCaseId(null); };

    // Sort commands — forward to WorklistTable's internal sort system via custom events
    const sortDate     = () => window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_SORT_APPLY', { detail: { key: 'accessionDate', dir: 'desc' } }));
    const sortPriority = () => window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_SORT_APPLY', { detail: { key: 'flagSeverity',  dir: 'desc' } }));
    const sortStatus   = () => window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_SORT_APPLY', { detail: { key: 'status',        dir: 'asc'  } }));

    // Sort by column name — extracted from transcript e.g. "sort by date", "sort by physician"
    const sortByColumn = (e: Event) => {
      const t = ((e as CustomEvent).detail?.transcript as string ?? '').toLowerCase().replace('sort by', '').trim();
      const map: Record<string, () => void> = {
        'date': sortDate, 'accession date': sortDate, 'accession': sortDate,
        'priority': sortPriority, 'stat': sortPriority, 'urgency': sortPriority,
        'status': sortStatus, 'case status': sortStatus,
      };
      const fn = map[t];
      if (fn) { fn(); }
      else { speak(`Column "${t}" not recognised. Try date, priority, or status.`); }
    };
    const clearSort    = () => window.dispatchEvent(new CustomEvent('PATHSCRIBE_TABLE_SORT_CLEAR'));

    const openResources = () => setIsResourcesOpen(true);

    const worklistState = { worklistCaseIds: filteredCases.map(c => c.id) };

    const openSelected = () => {
      if (selectedIndex >= 0 && filteredCases[selectedIndex]) {
        navigate(`/case/${filteredCases[selectedIndex].id}/synoptic`, { state: worklistState });
      }
    };

    const nextCase = () => {
      const idx = clamp(ensureSelection(selectedIndex) + 1);
      syncId(idx);
      navigate(`/case/${filteredCases[idx].id}/synoptic`, { state: worklistState });
    };

    const prevCase = () => {
      const idx = clamp(ensureSelection(selectedIndex) - 1);
      syncId(idx);
      navigate(`/case/${filteredCases[idx].id}/synoptic`, { state: worklistState });
    };

    window.addEventListener('PATHSCRIBE_TABLE_NEXT',             next);
    window.addEventListener('PATHSCRIBE_TABLE_PREVIOUS',         previous);
    window.addEventListener('PATHSCRIBE_TABLE_PAGE_DOWN',        pageDown);
    window.addEventListener('PATHSCRIBE_TABLE_PAGE_UP',          pageUp);
    window.addEventListener('PATHSCRIBE_TABLE_FIRST',            first);
    window.addEventListener('PATHSCRIBE_TABLE_LAST',             last);
    window.addEventListener('PATHSCRIBE_TABLE_OPEN_SELECTED',    openSelected);
    window.addEventListener('PATHSCRIBE_TABLE_REFRESH',          refresh);
    window.addEventListener('PATHSCRIBE_TABLE_FILTER_URGENT',    filterUrgent);
    window.addEventListener('PATHSCRIBE_TABLE_FILTER_COMPLETED', filterCompleted);
    window.addEventListener('PATHSCRIBE_TABLE_CLEAR_FILTER',     clearFilter);
    window.addEventListener('PATHSCRIBE_TABLE_FILTER_REVIEW',    filterReview);
    window.addEventListener('PATHSCRIBE_TABLE_FILTER_PHYSICIAN', filterPhysician);
    window.addEventListener('PATHSCRIBE_READ_FLAGS',             readFlags);
    window.addEventListener('PATHSCRIBE_READ_SPECIMEN',          readSpecimen);
    window.addEventListener('PATHSCRIBE_TABLE_SORT_DATE',        sortDate);
    window.addEventListener('PATHSCRIBE_TABLE_SORT_PRIORITY',    sortPriority);
    window.addEventListener('PATHSCRIBE_TABLE_SORT_STATUS',      sortStatus);
    window.addEventListener('PATHSCRIBE_TABLE_SORT_BY_COLUMN',   sortByColumn);
    window.addEventListener('PATHSCRIBE_TABLE_CLEAR_SORT',       clearSort);
    window.addEventListener('PATHSCRIBE_NAV_NEXT_CASE',          nextCase);
    window.addEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE',      prevCase);
    window.addEventListener('PATHSCRIBE_PAGE_OPEN_RESOURCES',    openResources);

    // ── Computational Sidecar voice actions ──────────────────────────────
    const openSidecar = () => {
      const focused = filteredCases.find(c => c.id === selectedCaseId);
      if (!focused) { speak('No case selected.'); return; }
      // Trigger first computational flag icon click via custom event
      window.dispatchEvent(new CustomEvent('PATHSCRIBE_COMP_OPEN_FOR_CASE', {
        detail: { caseId: focused.id }
      }));
      log(COMP_AUDIT.USE_SIDECAR_OPENED, { caseId: focused.id, source: 'voice' });
    };

    const closeSidecar = () => {
      window.dispatchEvent(new CustomEvent(COMP_EVENT.CLOSE_SIDECAR));
      const focused = filteredCases.find(c => c.id === selectedCaseId);
      log(COMP_AUDIT.USE_SIDECAR_CLOSED, { caseId: focused?.id });
    };

    const readResult = () => {
      window.dispatchEvent(new CustomEvent(COMP_EVENT.READ_RESULT));
    };

    const nextAssay = () => window.dispatchEvent(new CustomEvent(COMP_EVENT.NEXT_ASSAY));
    const prevAssay = () => window.dispatchEvent(new CustomEvent(COMP_EVENT.PREV_ASSAY));

    window.addEventListener(COMP_EVENT.OPEN_SIDECAR,  openSidecar);
    window.addEventListener(COMP_EVENT.CLOSE_SIDECAR, closeSidecar);
    window.addEventListener(COMP_EVENT.READ_RESULT,   readResult);
    window.addEventListener(COMP_EVENT.NEXT_ASSAY,    nextAssay);
    window.addEventListener(COMP_EVENT.PREV_ASSAY,    prevAssay);

    return () => {
      window.removeEventListener('PATHSCRIBE_TABLE_NEXT',             next);
      window.removeEventListener('PATHSCRIBE_TABLE_PREVIOUS',         previous);
      window.removeEventListener('PATHSCRIBE_TABLE_PAGE_DOWN',        pageDown);
      window.removeEventListener('PATHSCRIBE_TABLE_PAGE_UP',          pageUp);
      window.removeEventListener('PATHSCRIBE_TABLE_FIRST',            first);
      window.removeEventListener('PATHSCRIBE_TABLE_LAST',             last);
      window.removeEventListener('PATHSCRIBE_TABLE_OPEN_SELECTED',    openSelected);
      window.removeEventListener('PATHSCRIBE_TABLE_REFRESH',          refresh);
      window.removeEventListener('PATHSCRIBE_TABLE_FILTER_URGENT',    filterUrgent);
      window.removeEventListener('PATHSCRIBE_TABLE_FILTER_COMPLETED', filterCompleted);
      window.removeEventListener('PATHSCRIBE_TABLE_CLEAR_FILTER',     clearFilter);
      window.removeEventListener('PATHSCRIBE_TABLE_FILTER_REVIEW',    filterReview);
      window.removeEventListener('PATHSCRIBE_TABLE_FILTER_PHYSICIAN', filterPhysician);
      window.removeEventListener('PATHSCRIBE_READ_FLAGS',             readFlags);
      window.removeEventListener('PATHSCRIBE_READ_SPECIMEN',          readSpecimen);
      window.removeEventListener('PATHSCRIBE_TABLE_SORT_DATE',        sortDate);
      window.removeEventListener('PATHSCRIBE_TABLE_SORT_PRIORITY',    sortPriority);
      window.removeEventListener('PATHSCRIBE_TABLE_SORT_STATUS',      sortStatus);
      window.removeEventListener('PATHSCRIBE_TABLE_SORT_BY_COLUMN',   sortByColumn);
      window.removeEventListener('PATHSCRIBE_TABLE_CLEAR_SORT',       clearSort);
      window.removeEventListener('PATHSCRIBE_NAV_NEXT_CASE',          nextCase);
      window.removeEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE',      prevCase);
      window.removeEventListener('PATHSCRIBE_PAGE_OPEN_RESOURCES',    openResources);
    window.removeEventListener(COMP_EVENT.OPEN_SIDECAR,  openSidecar);
    window.removeEventListener(COMP_EVENT.CLOSE_SIDECAR, closeSidecar);
    window.removeEventListener(COMP_EVENT.READ_RESULT,   readResult);
    window.removeEventListener(COMP_EVENT.NEXT_ASSAY,    nextAssay);
    window.removeEventListener(COMP_EVENT.PREV_ASSAY,    prevAssay);
    };
  }, [filteredCases, selectedIndex, navigate]);

  return (
    <div style={{
      position: 'relative', width: '100vw', height: 'var(--app-height, var(--app-height, 100vh))',
      backgroundColor: '#000000', color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Backgrounds — self-closing, no scroll contribution */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/main_background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, filter: 'brightness(0.3) contrast(1.1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, #000000 100%)', zIndex: 1 }} />

      {/* All content — fills viewport exactly, no overflow */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* Main — fills remaining height */}
        <main style={{ flex: 1, minHeight: 0, padding: 'clamp(8px,1.5vw,12px) clamp(12px,2vw,20px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

            {/* ── Header: Row 1 = Title + Search, Row 2 = Mode tiles + Filter tiles ── */}
            <div data-capture-hide="true" className="ps-wl-header" style={{ marginBottom: '12px', flexShrink: 0 }}>

              {/* Row 1 — Title left, Search right */}
              <div className="ps-wl-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
                <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                  {FILTER_TITLES[activeFilter] ?? 'Active Cases'}
                </h1>
                <div data-capture-hide="true" style={{ width: '280px', flexShrink: 0 }}>
                  <CaseSearchBar compact />
                </div>
              </div>

              {/* Row 2 — Mode tiles left, Filter tiles right, same row = visual alignment */}
              <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '0', minWidth: 0 }}>

                {/* Left: LIS Cases + Outreach */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch', flexShrink: 0 }}>
                  {/* LIS TILE */}
                  {(() => {
                    const isActive  = contextFilter === 'lis';
                    const showBadge = contextFilter === 'outreach';
                    return (
                      <button
                        title={isActive ? 'Currently in LIS Cases' : 'Switch to LIS Cases'}
                        onClick={() => { setContextFilter('lis'); setActiveFilter('all'); setSelectedIndex(-1); setSelectedCaseId(null); }}
                        style={{ background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)'}`, borderRadius: '8px', padding: '6px 10px', backdropFilter: 'blur(10px)', minWidth: '80px', minHeight: '44px', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' as const, outline: 'none', transform: isActive ? 'translateY(-1px)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <div style={{ flex: '0 0 auto' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#e2e8f0' : '#8899aa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>LIS Cases</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>{lisNonPoolCount}</div>
                        </div>
                        {showBadge && (lisUrgentCount > 0 || lisPoolCount > 0) && (
                          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '3px' }}>
                            {lisUrgentCount > 0 && <span style={{ fontSize: '9px', fontWeight: 900, color: '#EF4444', letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1 }}>Urgent</span>}
                            {lisPoolCount > 0 && <span style={{ fontSize: '9px', fontWeight: 900, color: hasUrgentLisPool ? '#EF4444' : '#F97316', letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1 }}>Pool</span>}
                          </div>
                        )}
                      </button>
                    );
                  })()}
                  {/* OUTREACH TILE */}
                  {(() => {
                    const isActive  = contextFilter === 'outreach';
                    const showBadge = contextFilter === 'lis';
                    const poolColor = hasUrgentPool ? '#EF4444' : '#F97316';
                    return (
                      <button
                        title={isActive ? 'Currently in Outreach Cases' : 'Switch to Outreach Cases'}
                        onClick={() => { setContextFilter('outreach'); setActiveFilter('all'); setSelectedIndex(-1); setSelectedCaseId(null); }}
                        style={{ background: isActive ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.05)', border: `1.5px solid ${isActive ? '#F59E0B' : 'rgba(245,158,11,0.18)'}`, boxShadow: isActive ? '0 0 12px rgba(245,158,11,0.4)' : 'none', borderRadius: '8px', padding: '6px 10px', backdropFilter: 'blur(10px)', minWidth: '80px', minHeight: '44px', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' as const, outline: 'none', transform: isActive ? 'translateY(-1px)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <div style={{ flex: '0 0 auto' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#F59E0B' : '#8899aa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Outreach</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{orchAssignedCount}</div>
                        </div>
                        {showBadge && (orchUrgentCount > 0 || orchPoolCount > 0) && (
                          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '3px' }}>
                            {orchUrgentCount > 0 && <span style={{ fontSize: '9px', fontWeight: 900, color: '#EF4444', letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1 }}>Urgent</span>}
                            {orchPoolCount > 0 && <span style={{ fontSize: '9px', fontWeight: 900, color: poolColor, letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1 }}>Pool</span>}
                          </div>
                        )}
                      </button>
                    );
                  })()}
                </div>

                {/* Right: filter tiles */}
                <div className="ps-wl-filter-strip" style={{ display: 'flex', gap: '6px', alignItems: 'stretch', overflowX: 'auto', flexShrink: 1, minWidth: 0, paddingBottom: '2px' }}>

                {([
                  { key: 'pool',       label: activeFilter === 'pool'       ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Pool Cases',      count: stats.pool,           color: '#F97316', bg: 'rgba(249,115,22,0.05)',  border: 'rgba(249,115,22,0.18)',  activeBg: 'rgba(249,115,22,0.18)',  activeBorder: '#F97316',  glow: '0 0 12px rgba(249,115,22,0.4)',  sublabel: undefined },
                  { key: 'delegated',  label: activeFilter === 'delegated'  ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Delegated to Me', count: delegatedToMeCount,   color: '#38bdf8', bg: 'rgba(56,189,248,0.05)',  border: 'rgba(56,189,248,0.18)',  activeBg: 'rgba(56,189,248,0.18)',  activeBorder: '#38bdf8',  glow: '0 0 12px rgba(56,189,248,0.4)',  sublabel: undefined },
                  { key: 'urgent',     label: activeFilter === 'urgent'     ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Urgent',          count: stats.urgent,         color: '#EF4444', bg: 'rgba(239,68,68,0.05)',   border: 'rgba(239,68,68,0.18)',   activeBg: 'rgba(239,68,68,0.18)',   activeBorder: '#EF4444',  glow: '0 0 12px rgba(239,68,68,0.4)',   sublabel: undefined },
                  { key: 'inprogress', label: activeFilter === 'inprogress' ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'In Progress',     count: stats.inProgress,     color: '#0891B2', bg: 'rgba(8,145,178,0.05)',   border: 'rgba(8,145,178,0.18)',   activeBg: 'rgba(8,145,178,0.18)',   activeBorder: '#0891B2',  glow: '0 0 12px rgba(8,145,178,0.4)',   sublabel: undefined },
                  { key: 'review',     label: activeFilter === 'review'     ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Needs Review',    count: stats.needsReview,    color: '#F59E0B', bg: 'rgba(245,158,11,0.05)',  border: 'rgba(245,158,11,0.18)',  activeBg: 'rgba(245,158,11,0.18)',  activeBorder: '#F59E0B',  glow: '0 0 12px rgba(245,158,11,0.4)',  sublabel: undefined },
                  { key: 'amended',    label: activeFilter === 'amended'    ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Amended',         count: stats.amended,        color: '#8B5CF6', bg: 'rgba(139,92,246,0.05)',  border: 'rgba(139,92,246,0.18)',  activeBg: 'rgba(139,92,246,0.18)',  activeBorder: '#8B5CF6',  glow: '0 0 12px rgba(139,92,246,0.4)',  sublabel: undefined },
                  { key: 'completed',  label: activeFilter === 'completed'  ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Completed Today', count: stats.completedToday, color: '#10B981', bg: 'rgba(16,185,129,0.05)',  border: 'rgba(16,185,129,0.18)',  activeBg: 'rgba(16,185,129,0.18)',  activeBorder: '#10B981',  glow: '0 0 12px rgba(16,185,129,0.4)',  sublabel: undefined },
                  { key: 'draft',      label: activeFilter === 'draft'      ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Draft',           count: stats.draft,          color: '#94a3b8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.18)', activeBg: 'rgba(148,163,184,0.18)', activeBorder: '#94a3b8',  glow: '0 0 12px rgba(148,163,184,0.3)', sublabel: undefined },
                  { key: 'finalizing', label: activeFilter === 'finalizing' ? `← Back to ${contextFilter === 'outreach' ? 'Outreach' : 'LIS Cases'}` : 'Finalizing',      count: stats.finalizing,     color: '#EC4899', bg: 'rgba(236,72,153,0.05)',  border: 'rgba(236,72,153,0.18)',  activeBg: 'rgba(236,72,153,0.18)',  activeBorder: '#EC4899',  glow: '0 0 12px rgba(236,72,153,0.4)',  sublabel: undefined },
                ] as const).map(tile => {
                  const isActive = activeFilter === tile.key;
                  return (
                    <button
                      key={tile.key}
                      title={isActive ? `Showing: ${tile.label} — click to reset` : `Filter by: ${tile.label}`}
                      onClick={() => { setActiveFilter(isActive ? 'all' : tile.key as any); setSelectedIndex(-1); setSelectedCaseId(null); }}
                      style={{
                        background:     isActive ? tile.activeBg  : tile.bg,
                        border:         `1.5px solid ${isActive ? tile.activeBorder : tile.border}`,
                        boxShadow:      isActive ? tile.glow : 'none',
                        borderRadius:   '8px', padding: '6px 12px', backdropFilter: 'blur(10px)',
                        minWidth: '80px', minHeight: '44px', cursor: 'pointer',
                        transition: 'all 0.15s ease', textAlign: 'left' as const, outline: 'none',
                        transform: isActive ? 'translateY(-1px)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? tile.color : '#8899aa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                        {tile.label}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: tile.color, lineHeight: 1 }}>
                        {tile.count}
                      </div>
                      {tile.sublabel && (
                        <div style={{ fontSize: '9px', fontWeight: 600, color: tile.color, opacity: 0.75, marginTop: '2px', letterSpacing: '0.2px' }}>
                          {tile.sublabel}
                        </div>
                      )}
                    </button>
                  );
                })}

                {activeFilter === 'physician' && physicianFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '8px', fontSize: '12px', color: '#a78bfa', fontWeight: 600 }}>
                    👤 {physicianFilter}
                    <button onClick={() => { setActiveFilter('all'); setPhysicianFilter(''); }} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '14px', padding: '0 0 0 4px', lineHeight: 1 }}>✕</button>
                  </div>
                )}


              </div>
            </div>
            </div>

            {/* Physician voice prompt — conditional, fixed height */}
            {physicianPrompt && (
              <div style={{ flexShrink: 0, marginBottom: '8px', padding: '8px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 500 }}>🎙️ {physicianPrompt}</span>
                <button onClick={() => setPhysicianPrompt(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            )}

            {/* Worklist table — height measured from viewport top offset */}
            <div
              ref={wrapperRef}
              data-capture-hide="true"
              className="ps-table-scroll-wrap"
              style={{ position: 'relative' }}
            >
              {/* Overlay Sidecar — opens when a computational flag icon is clicked.
                  Positioned absolute within this container so it overlays the table
                  without affecting page layout. Closes on outside click or scroll. */}
              <SidecarDrawer computationalFlags={computationalFlags} />
              <WorklistTable
                flagDefinitions={allFlags}
                cases={filteredCases}
                activeFilter={activeFilter}
                tableHeight={tableHeight}
                delegatedCaseIds={delegatedCaseIds}
                onPoolCaseClick={(caseId, summary) => {
                  const c = realCases.find(c => c.id === caseId);
                  setClaimModal({
                    caseId,
                    summary,
                    poolName: c?.originHospitalId ?? 'MFT Pool',
                  });
                }}
                selectedIndex={selectedIndex}
                selectedCaseId={selectedCaseId}
                onRowSelect={(idx: number, id: string) => { setSelectedIndex(idx); setSelectedCaseId(id); }}
                onFirstCaseId={(id: string | null) => {
                  if ((location.state as any)?.fromCaseId) return;
                  if (selectedCaseId) return;
                  if (id) { setSelectedIndex(0); setSelectedCaseId(id); }
                }}
                onDisplayOrder={useCallback((ids: string[]) => setDisplayOrder(ids), [])}
              />
            </div>

          </div>
        </main>

      </div>

      <ResourcesModal
        isOpen={isResourcesOpen}
        onClose={() => setIsResourcesOpen(false)}
        quickLinks={quickLinks}
      />
      <LogoutWarningModal
        isOpen={showLogoutWarning}
        onClose={() => setShowLogoutWarning(false)}
        onLogout={handleLogout}
      />
      <PoolClaimModal
        isOpen={!!claimModal}
        caseId={claimModal?.caseId ?? null}
        caseSummary={claimModal?.summary}
        poolName={claimModal?.poolName}
        currentUserId={CURRENT_USER_ID}
        currentUserName={CURRENT_USER_NAME}
        fromFilter="pool"
        onAccepted={() => {
          setClaimModal(null);
          caseRouter.listCasesForUser(user?.id ?? 'current').then(setRealCases).catch(() => {});
        }}
        onPassed={() => setClaimModal(null)}
        onClose={() => setClaimModal(null)}
      />

    </div>
  );
};

export default WorklistPage;

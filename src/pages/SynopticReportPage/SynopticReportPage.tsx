// src/pages/SynopticReportPage/SynopticReportPage.tsx
// ─────────────────────────────────────────────────────────────
// Orchestrator — assembles the full clinical workspace shell:
//
//   ┌─ NavBar ──────────────────────────────────────────────────┐
//   ├─ HeaderBar (accession, patient, sign-out) ────────────────┤
//   ├─ Sidebar │ LeftReportPanel │ RightSynopticPanel ──────────┤
//   └─ BottomActionBar ─────────────────────────────────────────┘
//
// RightSynopticPanel owns all synoptic state and rendering.
// This file is intentionally thin — layout + modal wiring only.
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AddSynopticModal from './components/AddSynopticModal';
import NavBar             from '@/components/NavBar/NavBar';
import HeaderBar          from './components/HeaderBar';
import Sidebar            from './components/Sidebar';
import LeftReportPanel    from './components/LeftReportPanel';
import RightSynopticPanel, { type RightSynopticPanelHandle, type AiSuggestion, type MissingRequiredField, type ReviewField } from './components/RightSynopticPanel';
import BottomActionBar    from './components/BottomActionBar';

import AmendmentModal        from './modals/AmendmentModal';
import { CaseCommentModal }   from '../Synoptic/Comments/CaseCommentModal';
import PatientHistoryModal    from '../../components/CasePanel/PatientHistoryModal';
import FlagManagerModal       from '../../components/Flags/FlagManagerModal';
import { AddCodeModal }       from '../Synoptic/Codes/AddCodeModal';
import { ReportCommentModal } from '../Synoptic/Comments/ReportCommentModal';
import CaseSignOutModal      from './modals/CaseSignOutModal';
import FinalizeSynopticModal from './modals/FinalizeSynopticModal';
import LogoutWarningModal    from './modals/LogoutWarningModal';
import UnsavedWarningModal   from './modals/UnsavedWarningModal';

import { useSynopticFinalize } from '../Synoptic/useSynopticFinalize';
import { useSynopticModals }   from '../Synoptic/useSynopticModals';
import { useSynopticToast }    from '../Synoptic/useSynopticToast';
import { useSynopticFlags }    from '../Synoptic/useSynopticFlags';
import { SaveToast }           from '../Synoptic/UI/SaveToast';

import { caseRouter } from '@/services/cases/CaseRouter';
import { flagService }    from '@/services';
import type { Flag }      from '@/services/flags/IFlagService';
import ComputationalPanel from '../../components/sidecar/ComputationalPanel';
import SynopticSidebar    from '../../components/synoptic/SynopticSidebar';
import { useSidecar }     from '@/contexts/SidecarContext';
import { useDirtyState } from '@/contexts/DirtyStateContext';
import { useLogout } from '@/hooks/useLogout';
import '@/pathscribe.css';

import type { Case } from '@/types/case/Case';
import { AiReviewModal }  from './modals/AiReviewModal';
import { DelegateModal }  from '../Synoptic/Delegate/DelegateModal';
import CaseTeamModal            from './modals/CaseTeamModal';
import { PreFinalisationModal, type SynopticForReview } from './modals/PreFinalisationModal';
import { getFieldLabel, type ReportingStandard } from '@/utils/synopticFieldLabels';
import { ProtocolChangeModal, type ProtocolChange }     from './modals/ProtocolChangeModal';
import { mockActionRegistryService } from '@/services/actionRegistry/mockActionRegistryService';
import { COMP_EVENT, COMP_VOICE, COMP_AUDIT } from '@/constants/computationalActions';
import { useAuditLog } from '@/components/Audit/useAuditLog';

// ── Orchestrator ───────────────────────────────────────────────
import OrchestratorReportPanel, { textToHtml } from './components/OrchestratorReportPanel';
import type { OrchestratorSection } from './components/OrchestratorReportPanel';
import SequencerPanel from './components/SequencerPanel';
import { OrchestratorEngine } from '@/orchestrator/orchestratorEngine';
import type { OrchestratorCallbacks } from '@/orchestrator/orchestratorEngine';
import { buildContext } from '@/lib/contextBuilder';

// ─── Shared overlay style (passed to all modals) ──────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 25000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const SynopticReportPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { log }   = useAuditLog();
  const navigate   = useNavigate();
  const location   = useLocation();
  const handleLogout = useLogout();

  // ── Worklist state ─────────────────────────────────────────
  const routerWorklistIds: string[] = (location.state as any)?.worklistCaseIds ?? [];

  // Track whether this case was opened from Search or Worklist.
  // sessionStorage key is set by SearchPage / WorklistTable before navigation.
  const navSource: 'search' | 'worklist' = React.useMemo(() => {
    return sessionStorage.getItem('pathscribe:navFrom') === 'search' ? 'search' : 'worklist';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const backPath = navSource === 'search' ? '/search' : '/worklist';

  // ── Case data ──────────────────────────────────────────────
  const [caseData, setCaseData]     = useState<Case | null>(null);
  const [isLoaded, setIsLoaded]     = useState(false);
  const [activeTab, setActiveTab]       = useState('tumor');
  const { isDirty: hasUnsavedData, setDirty: setHasUnsavedData, pendingPath, confirmNavigate: confirmContextNavigate, cancelNavigate: cancelContextNavigate } = useDirtyState();
  const [activeSpecimenId, setActiveSpecimenId] = useState<string>('');
  const [showCaseCommentModal, setShowCaseCommentModal] = useState(false);
  const [showSpecimenCommentModal, setShowSpecimenCommentModal] = useState(false);
  const [activeSpecimenCommentId, setActiveSpecimenCommentId] = useState<string>('');
  const [hasCaseComment, setHasCaseComment] = useState(false);
  const [caseCommentAttending, setCaseCommentAttending] = useState('');
  const [specimenComments, setSpecimenComments] = useState<Record<string, string>>({});
  const [showAddSynopticModal, setShowAddSynopticModal] = useState(false);
  const [activeReportInstanceId, setActiveReportInstanceId] = useState<string>('');
  const [isAlertExpanded, setIsAlertExpanded] = useState(true);
  const [isSimilarCasesOpen, setIsSimilarCasesOpen] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [panelMode, setPanelMode] = useState<null | 'expanded'>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [worklistCases, setWorklistCases] = useState<string[]>([]);
  const [worklistIndex, setWorklistIndex] = useState(0);
  const [alertFieldId, setAlertFieldId] = useState<string | null>(null);
  const [availableProtocols, setAvailableProtocols] = useState<{id:string;name:string}[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showDelegateModal, setShowDelegateModal]   = useState(false);
  const [delegateReturnTo,  setDelegateReturnTo]    = useState<'team' | null>(null);
  const [showTeamModal,     setShowTeamModal]       = useState(false);

  // Computational flags + left panel tab state
  const [computationalFlags,   setComputationalFlags]   = useState<Flag[]>([]);
  const refreshCompFlags = useCallback(async () => {
    const res = await flagService.getAll().catch(() => null);
    if (!res?.ok) return;
    const allComp = (res.data as Flag[]).filter(f => f.tagClass === 'COMPUTATIONAL' && f.status === 'Active');
    const seenCodes = new Set<string>();
    const compFlags = allComp.filter(f => {
      if (!f.lisCode || seenCodes.has(f.lisCode)) return false;
      seenCodes.add(f.lisCode);
      return true;
    });
    setComputationalFlags(compFlags);
    if (caseId) {
      const c = await caseRouter.getCase(caseId);
      if (c) setCaseData(c);
    }
    if (compFlags.length > 0 && caseId) {
      const { resultService } = await import('@/services');
      const entries = await Promise.allSettled(
        compFlags.map(async f => {
          if (!f.dataSource?.sourceId) return null;
          const result = await resultService.getResult(f.dataSource.sourceId, caseId);
          return [f.name, result.data] as [string, Record<string, string | number | boolean | null>];
        })
      );
      const resultsMap: Record<string, Record<string, string | number | boolean | null>> = {};
      entries.forEach(e => {
        if (e.status === "fulfilled" && e.value) {
          const [name, data] = e.value;
          if (data && Object.keys(data).length > 0) resultsMap[name] = data;
        }
      });
      setComputationalResults(resultsMap);
    }
  }, [caseId]);

  // ── Left panel tab + Orchestrator state ───────────────────
  const [leftTab, setLeftTab] = useState<'draft' | 'sequencer' | 'report' | 'results'>(
    () => (caseId?.startsWith('O26-') ? 'draft' : 'report')
  );
  const [showSequencer, setShowSequencer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('ps_sidebar_collapsed') === 'true'
  );

  // Orchestration mode = PathScribe owns the report.
  // CoPilot mode = LIS owns the report; PathScribe feeds structured data back.
  // Orchestration mode = PathScribe owns the report (Outreach/O26- cases).
  // Determined by case ID prefix — matches CaseRouter's routing key.
  // LIS cases (S26-*, no reportingMode) must NOT default to orchestration mode.
  const isOrchestrationMode = !!(caseId?.startsWith('O26-'));

  useEffect(() => {
    localStorage.setItem('ps_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // If mode changes to copilot while on draft tab, move to report tab
  useEffect(() => {
    if (!isOrchestrationMode && leftTab === 'draft') setLeftTab('report');
  }, [isOrchestrationMode]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const [orchSections,    setOrchSections]    = useState<OrchestratorSection[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  const abortRef  = React.useRef<AbortController | null>(null);

  // ── Dirty-state timing guards ──────────────────────────────────────────
  // Track when hasUnsavedData first becomes true relative to case load.
  // Changes that fire within 1200 ms of load are from component initialisation
  // (e.g. RightSynopticPanel seeding form values) — not real user edits.
  const caseLoadedAt = React.useRef<number>(Date.now());
  const dirtySetAt   = React.useRef<number | null>(null);
  const engineRef = React.useRef<OrchestratorEngine | null>(null);

  // AI suggestions lifted from RightSynopticPanel
  const [aiSuggestions,        setAiSuggestions]        = useState<Record<string, AiSuggestion>>({});
  const [computationalResults, setComputationalResults] = useState<Record<string, Record<string, string | number | boolean | null>>>({});

  useEffect(() => {
    if (!caseId) return;

    // Reset dirty-timing refs for each fresh case load
    caseLoadedAt.current = Date.now();
    dirtySetAt.current   = null;

    // ── Worklist for Previous / Next ──────────────────────────
    if (routerWorklistIds.length > 0) {
      // Arrived via case-to-case navigation (prev/next already carried the list)
      setWorklistCases(routerWorklistIds);
      setWorklistIndex(routerWorklistIds.indexOf(caseId));
    } else if (navSource === 'search') {
      // Arrived from Search results — use the saved search result order
      try {
        const searchIds: string[] = JSON.parse(
          sessionStorage.getItem('pathscribe:searchResultIds') ?? '[]'
        );
        if (searchIds.length > 0) {
          setWorklistCases(searchIds);
          setWorklistIndex(searchIds.indexOf(caseId ?? ''));
        }
      } catch { /* malformed storage — ignore */ }
    } else {
      // Arrived from regular Worklist
      caseRouter.listCasesForUser('current').then((cases: any[]) => {
        const ids = cases.map((c: any) => c.id);
        setWorklistCases(ids);
        setWorklistIndex(ids.indexOf(caseId));
      }).catch(() => {});
    }

    refreshCompFlags();

    setHasUnsavedData(false);
    caseRouter.getCase(caseId).then(c => {
      setCaseData(c ?? null);
      if (c?.specimens?.length) setActiveSpecimenId(c.specimens[0].id);
      if (c?.synopticReports?.length) setActiveReportInstanceId(c.synopticReports[0].instanceId);
      import('@/services/templates/templateService').then(m =>
        m.listTemplates('published').then(templates =>
          setAvailableProtocols(templates.map((t: any) => ({ id: t.id, name: t.name })))
        )
      );
      const stored = c?.id ? localStorage.getItem(`ps_case_comment_${c.id}`) : null;
      if (stored) { setCaseCommentAttending(stored); setHasCaseComment(true); }
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, [caseId]);

  // Track when dirty state was first set relative to case load
  React.useEffect(() => {
    if (hasUnsavedData) {
      if (dirtySetAt.current === null) dirtySetAt.current = Date.now();
    } else {
      dirtySetAt.current = null;
    }
  }, [hasUnsavedData]);

  // Returns true only when dirty state originated from a real user edit
  // (not from component initialisation within the first 1200 ms of case load)
  const shouldWarnDirty = React.useCallback((): boolean => {
    if (!hasUnsavedData) return false;
    const likelyInit = dirtySetAt.current !== null &&
      (dirtySetAt.current - caseLoadedAt.current) < 1200;
    return !likelyInit;
  }, [hasUnsavedData]);

  // ── Hooks ──────────────────────────────────────────────────
  const {
    showFinalizeModal,  setShowFinalizeModal,
    finalizePassword,   setFinalizePassword,
    finalizeError,
    showSignOutModal,   setShowSignOutModal,
    signOutUser,        setSignOutUser,
    signOutPassword,    setSignOutPassword,
    signOutError,
    setCaseSigned,
    showAmendmentModal, setShowAmendmentModal,
    amendmentText,      setAmendmentText,
    amendmentMode,      setAmendmentMode,
  } = useSynopticFinalize();

  const {
    showLogoutModal,  setShowLogoutModal,
    isProfileOpen,    setIsProfileOpen,
  } = useSynopticModals();

  const { toastMsg, toastVisible, showToast } = useSynopticToast();

  const caseComputationalFlags = React.useMemo(() => {
    if (!caseData) return [];

    // Collect all applied flag objects (raw) from the case
    const appliedFlags: any[] = [
      ...((caseData as any).caseFlags     ?? []),
      ...((caseData as any).specimenFlags ?? []),
      ...((caseData as any).flags         ?? []),
    ];
    (caseData as any).specimens?.forEach((sp: any) => {
      appliedFlags.push(...(sp.specimenFlags ?? sp.flags ?? sp.appliedFlags ?? []));
    });

    // Collect applied lisCodes and specimenId assignments
    const appliedLisCodes = new Set<string>();
    const lisCodeToSpecimenId: Record<string, string | null> = {};
    appliedFlags.forEach(f => {
      if (!f?.lisCode) return;
      appliedLisCodes.add(f.lisCode);
      const spId = f.specimenId ?? null;
      if (!(f.lisCode in lisCodeToSpecimenId) || spId !== null) {
        lisCodeToSpecimenId[f.lisCode] = spId;
      }
    });

    if (appliedLisCodes.size === 0) {
      // No computational tests ordered on this case — return empty, not all definitions
      return [];
    }

    // Match against flag service definitions (by lisCode)
    const fromDefinitions = computationalFlags
      .filter(f => f.lisCode && appliedLisCodes.has(f.lisCode))
      .map(f => ({ ...f, specimenId: lisCodeToSpecimenId[f.lisCode!] ?? null }));

    if (fromDefinitions.length > 0) return fromDefinitions;

    // Fallback: definitions didn't have matching lisCodes — use the raw applied flags
    // directly if they carry enough info (tagClass, name, lisCode)
    return appliedFlags
      .filter(f => f?.lisCode && f?.tagClass === 'COMPUTATIONAL')
      .map(f => ({
        ...f,
        specimenId: lisCodeToSpecimenId[f.lisCode] ?? null,
      }));
  }, [
    caseData?.id,
    JSON.stringify(((caseData as any)?.specimenFlags ?? []).map((f: any) => `${f.lisCode}:${f.specimenId ?? ''}`)),
    JSON.stringify(((caseData as any)?.caseFlags    ?? []).map((f: any) => `${f.lisCode}:${f.specimenId ?? ''}`)),
    computationalFlags.length,
  ]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { protocolIds, flagName } = (e as CustomEvent).detail;
      if (!protocolIds?.length) return;
      setAvailableProtocols((prev: any[]) =>
        prev.filter((p: any) => protocolIds.includes(p.id))
      );
      setShowAddSynopticModal(true);
      showToast(`${flagName} ordered — select a protocol to add`);
    };
    window.addEventListener('ps:suggest-protocols', handler);
    return () => window.removeEventListener('ps:suggest-protocols', handler);
  }, [showToast]);

  // ── Computational voice actions ────────────────────────────
  useEffect(() => {
    Object.entries(COMP_VOICE).forEach(([key, phrases]) => {
      const eventName = COMP_EVENT[key as keyof typeof COMP_EVENT];
      (mockActionRegistryService as any).registerAction?.({
        id:       `comp_synoptic_${key.toLowerCase()}`,
        label:    phrases[0],
        phrases,
        event:    eventName,
        context:  'SYNOPTIC',
        category: 'Computational Data',
      });
    });

    const openCompTab   = () => { setLeftTab('results'); log(COMP_AUDIT.USE_COMP_TAB_OPENED, { caseId, source: 'voice' }); };
    const openReportTab = () => setLeftTab('report');
    const openOrderModal = () => {
      setLeftTab('results');
      setTimeout(() => window.dispatchEvent(new CustomEvent('PATHSCRIBE_COMP_OPEN_ORDER_MODAL_INTERNAL')), 100);
      log(COMP_AUDIT.USE_ORDER_MODAL_OPENED, { caseId });
    };
    const nextAssay  = () => window.dispatchEvent(new CustomEvent(COMP_EVENT.NEXT_ASSAY));
    const prevAssay  = () => window.dispatchEvent(new CustomEvent(COMP_EVENT.PREV_ASSAY));
    const readResult = () => window.dispatchEvent(new CustomEvent(COMP_EVENT.READ_RESULT));

    window.addEventListener(COMP_EVENT.OPEN_COMP_TAB,    openCompTab);
    window.addEventListener(COMP_EVENT.OPEN_REPORT_TAB,  openReportTab);
    window.addEventListener(COMP_EVENT.OPEN_ORDER_MODAL, openOrderModal);
    window.addEventListener(COMP_EVENT.NEXT_ASSAY,       nextAssay);
    window.addEventListener(COMP_EVENT.PREV_ASSAY,       prevAssay);
    window.addEventListener(COMP_EVENT.READ_RESULT,      readResult);

    return () => {
      window.removeEventListener(COMP_EVENT.OPEN_COMP_TAB,    openCompTab);
      window.removeEventListener(COMP_EVENT.OPEN_REPORT_TAB,  openReportTab);
      window.removeEventListener(COMP_EVENT.OPEN_ORDER_MODAL, openOrderModal);
      window.removeEventListener(COMP_EVENT.NEXT_ASSAY,       nextAssay);
      window.removeEventListener(COMP_EVENT.PREV_ASSAY,       prevAssay);
      window.removeEventListener(COMP_EVENT.READ_RESULT,      readResult);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const { selectedFlag, isOpen } = useSidecar();
  React.useEffect(() => {
    if (isOpen && selectedFlag) setLeftTab('results');
  }, [selectedFlag, isOpen]);

  const {
    flagCaseData, setFlagCaseData: _setFlagCaseData,
    flagDefinitions,
    showFlagManager, setShowFlagManager,
    openFlagManager,
    onApplyFlags,
    onRemoveFlag,
  } = useSynopticFlags(caseId ?? '');

  // Tracks whether onApplyFlags/onRemoveFlag fired during this modal session
  // Watch caseFlags/specimenFlags — set dirty any time they change after initial load.
  // Works regardless of which modal or callback applied the change.
  const initialFlagsKey = React.useRef<string | null>(null);

  // When caseFlags or specimenFlags change after load → mark dirty
  React.useEffect(() => {
    if (!isLoaded || !caseData) return;
    const key = JSON.stringify([
      ((caseData as any).caseFlags ?? []).map((f: any) => f.id ?? f.lisCode),
      (caseData.specimens ?? []).map((sp: any) => ((sp as any).specimenFlags ?? []).map((f: any) => f.id ?? f.lisCode)),
    ]);
    if (initialFlagsKey.current === null) {
      initialFlagsKey.current = key;
      return;
    }
    if (key !== initialFlagsKey.current) {
      setHasUnsavedData(true);
      initialFlagsKey.current = key;
    }
  }); // intentionally no dep array — runs after every render but only acts when key changes

  React.useEffect(() => {
    if (hasUnsavedData && leftTab === "results") setLeftTab("report");
  }, [hasUnsavedData, leftTab]);

  const guard = useCallback((path: string, state?: object) => {
    // Remap /worklist → /search when the user arrived from a search result
    const dest = (path === '/worklist' && navSource === 'search') ? '/search' : path;
    // Tell SearchPage to restore previous results when returning to it
    if (dest === '/search') sessionStorage.setItem('pathscribe:searchReturn', '1');
    if (shouldWarnDirty()) { setPendingNavigation(dest); return; }
    navigate(dest, state ? { state } : undefined);
  }, [shouldWarnDirty, navSource, navigate]);

  React.useEffect(() => {
    const openTeam = () => setShowTeamModal(true);
    window.addEventListener('PATHSCRIBE_OPEN_CASE_TEAM',   openTeam);
    window.addEventListener('PATHSCRIBE_CASE_TEAM_ADD',    openTeam);
    window.addEventListener('PATHSCRIBE_CASE_TEAM_ASSIGN', openTeam);
    return () => {
      window.removeEventListener('PATHSCRIBE_OPEN_CASE_TEAM',   openTeam);
      window.removeEventListener('PATHSCRIBE_CASE_TEAM_ADD',    openTeam);
      window.removeEventListener('PATHSCRIBE_CASE_TEAM_ASSIGN', openTeam);
    };
  }, []);

  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedData) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedData]);

  // Block browser back/forward button when dirty.
  // BrowserRouter doesn't support useBlocker, so we use popstate instead.
  React.useEffect(() => {
    if (!hasUnsavedData) return;
    // Push a sentinel so the back button has somewhere to go
    window.history.pushState(null, '', window.location.href);
    const handlePop = () => {
      // Push again to keep the user on this page
      window.history.pushState(null, '', window.location.href);
      setPendingNavigation('__back__');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [hasUnsavedData]);

  const navigateToCase = useCallback((direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? worklistIndex + 1 : worklistIndex - 1;
    if (newIndex >= 0 && newIndex < worklistCases.length) {
      navigate(`/case/${worklistCases[newIndex]}/synoptic`, {
        state: { worklistCaseIds: worklistCases },
      });
    }
  }, [worklistCases, worklistIndex, navigate]);

  const handleSignOutConfirm = useCallback(() => {
    setCaseSigned(true);
    setShowSignOutModal(false);
    showToast('Case signed out successfully');
  }, [setCaseSigned, setShowSignOutModal, showToast]);

  // ── Build SynopticForReview[] for PreFinalisationModal ─────────────────
  const buildSynopticsForReview = useCallback((): SynopticForReview[] => {
    if (!caseData?.synopticReports?.length) return [];
    return caseData.synopticReports
      .filter(r => (r as any).status !== 'deferred')
      .map(report => {
        const specimen  = caseData.specimens?.find(s => s.id === report.specimenId) as any;
        const answers   = (report as any).answers ?? {};
        const fieldKeys = Object.keys(answers);
        const answeredCount = fieldKeys.filter(k => {
          const v = answers[k];
          return v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0);
        }).length;
        const std: ReportingStandard =
          report.templateName?.includes('RCPath') ? 'RCPath' :
          report.templateName?.includes('RCPA')  ? 'RCPA'  :
          report.templateName?.includes('WHO')   ? 'WHO'   : 'CAP';
        const fieldLabels: Record<string, string> = {};
        fieldKeys.forEach(k => { fieldLabels[k] = getFieldLabel(k, std); });
        return {
          instanceId:    report.instanceId,
          templateName:  report.templateName,
          specimenId:    report.specimenId,
          specimenLabel: specimen?.label ?? '?',
          specimenDesc:  specimen?.specimenType ?? specimen?.description ?? 'Specimen',
          answers, fieldLabels, fieldOrder: fieldKeys,
          answeredCount, totalCount: fieldKeys.length,
          status: (report as any).status,
        };
      });
  }, [caseData]);

  const synopticPanelRef = React.useRef<RightSynopticPanelHandle>(null);
  const [missingFields,          setMissingFields]          = React.useState<MissingRequiredField[]>([]);
  const [showMissingWarning,     setShowMissingWarning]     = React.useState(false);
  const [reviewFields,           setReviewFields]           = React.useState<ReviewField[]>([]);
  const [showAiReview,           setShowAiReview]           = React.useState(false);
  const [finalizeAndNextPending, setFinalizeAndNextPending] = React.useState(false);

  // ── Pre-finalisation + protocol review state ───────────────────────
  const [showPreFinalise,   setShowPreFinalise]   = React.useState(false);
  const [preFinalSynoptics, setPreFinalSynoptics] = React.useState<SynopticForReview[]>([]);
  const [showProtoReview,   setShowProtoReview]   = React.useState(false);
  const [protoChanges,      setProtoChanges]      = React.useState<ProtocolChange[]>([]);

  const handleProtocolChangesDetected = useCallback((changes: ProtocolChange[]) => {
    if (!changes.length) return;
    setProtoChanges(changes);
    setShowProtoReview(true);
  }, []);

  const handleProtoCommit = useCallback((acceptedIds: string[]) => {
    setShowProtoReview(false);
    console.log('[ProtocolChange] Accepted', acceptedIds.length, 'of', protoChanges.length, 'proposed changes');
  }, [protoChanges.length]);

  const handleRequestFinalize = useCallback((andNext: boolean) => {
    setFinalizeAndNextPending(andNext);
    if (!synopticPanelRef.current) {
      setPreFinalSynoptics(buildSynopticsForReview());
      setShowPreFinalise(true);
      return;
    }
    const missing = synopticPanelRef.current.validateRequired();
    if (missing.length > 0) { setMissingFields(missing); setShowMissingWarning(true); return; }
    const uncertain = synopticPanelRef.current.getUncertainRequiredFields();
    if (uncertain.length > 0) { setReviewFields(uncertain); setFinalizeAndNextPending(andNext); setShowAiReview(true); return; }
    const deferred = (caseData?.synopticReports ?? []).filter((r: any) => r.status === 'deferred');
    if (deferred.length > 0) {
      const names = deferred.map((r: any) => r.templateName).join(', ');
      if (!window.confirm(`${deferred.length} synoptic report(s) are marked deferred:\n\n${names}\n\nProceed?`)) return;
    }
    setPreFinalSynoptics(buildSynopticsForReview());
    setShowPreFinalise(true);
  }, [buildSynopticsForReview, caseData, setMissingFields, setShowMissingWarning, setReviewFields, setShowAiReview, setFinalizeAndNextPending, setPreFinalSynoptics, setShowPreFinalise]);

  const handlePreFinalConfirm = useCallback((_ordered: string[], _excluded: string[]) => {
    setShowPreFinalise(false);
    // Credentials already verified inside PreFinalisationModal — finalize directly.
    // TODO: call finalize service with ordered/excluded instanceIds
    console.log('[Finalise] ordered:', _ordered, 'excluded:', _excluded);
  }, []);

  const [deferredAmendmentContext, setDeferredAmendmentContext] = React.useState<{ title: string; prefill: string } | null>(null);

  const handleFinalizeConfirm = useCallback(() => {
    if (synopticPanelRef.current) {
      const { verificationSummary } = synopticPanelRef.current.sweepAndGetFinalState();
      console.info('[PathScribe] Finalization sweep:', verificationSummary);
    }
    setShowFinalizeModal(false);
    const activeReport = caseData?.synopticReports?.find(r => r.instanceId === activeReportInstanceId) as any;
    if (caseData?.status === 'finalized' && activeReport?.status === 'deferred') {
      const completedFields = Object.entries(activeReport.answers ?? {})
        .filter(([, v]) => v && (Array.isArray(v) ? (v as string[]).length > 0 : (v as string).trim()))
        .map(([k]) => k).join(', ');
      const pendingNote = activeReport.deferredPending ? ` (${activeReport.deferredPending})` : '';
      setDeferredAmendmentContext({
        title: activeReport.templateName ?? 'Deferred Synoptic',
        prefill: `Amendment — completion of deferred synoptic${pendingNote}: ${activeReport.templateName ?? ''}.

Ancillary results now available. Completed fields: ${completedFields || 'see synoptic report'}.

Original report issued pending ancillary studies. This amendment incorporates the completed findings.`,
      });
      setAmendmentMode('amendment');
      setShowAmendmentModal(true);
    } else {
      showToast('Report finalized');
    }
  }, [setShowFinalizeModal, showToast, caseData, activeReportInstanceId, setAmendmentMode, setShowAmendmentModal]);

  const handleAmendmentSubmit = useCallback(() => {
    setShowAmendmentModal(false);
    showToast(`${amendmentMode === 'addendum' ? 'Addendum' : 'Amendment'} submitted`);
    setAmendmentText('');
  }, [amendmentMode, setAmendmentText, setShowAmendmentModal, showToast]);

  // ── Orchestrator handlers ──────────────────────────────────

  // ── Orchestrator callbacks ─────────────────────────────────────────────────
  const buildOrchCallbacks = useCallback((): OrchestratorCallbacks => ({
    onSectionStart: (sectionId, title) => {
      setOrchSections(prev => {
        const exists = prev.find(s => s.id === sectionId);
        if (exists) return prev.map(s => s.id === sectionId ? { ...s, isStreaming: true, pendingDraft: undefined } : s);
        return [...prev, { id: sectionId, label: title, type: 'narrative' as const, text: '', aiGenerated: '', userEdited: false, isStreaming: true }];
      });
    },
    onToken: (sectionId, token) => {
      setOrchSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        if (s.userEdited) return { ...s, pendingDraft: (s.pendingDraft ?? '') + token };
        return { ...s, text: s.text + token };
      }));
    },
    onSectionComplete: (sectionId, result) => {
      const html = textToHtml(result.text ?? '');
      setOrchSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        if (s.userEdited) return { ...s, isStreaming: false, pendingDraft: html };
        return { ...s, isStreaming: false, text: html, aiGenerated: html };
      }));
    },
    onComplete: () => {
      setIsOrchestrating(false);
      setLastGeneratedAt(new Date());
      engineRef.current = null;
      abortRef.current  = null;
    },
    onError: (_sectionId, error) => {
      setIsOrchestrating(false);
      engineRef.current = null;
      abortRef.current  = null;
      showToast(`Generation error: ${error}`);
    },
  }), [showToast]);

  const handleGenerateReport = useCallback(async () => {
    if (!caseData) return;
    const engine = new OrchestratorEngine(undefined, buildContext(caseData, null) as any, buildOrchCallbacks());
    engineRef.current = engine;
    setIsOrchestrating(true);
    setLeftTab('draft');
    try {
      await engine.run();
    } catch (e: any) {
      if (e?.name !== 'AbortError') showToast(`Generation failed: ${e?.message ?? 'Unknown'}`);
      setIsOrchestrating(false);
      engineRef.current = null;
      abortRef.current  = null;
    }
  }, [caseData, buildOrchCallbacks, showToast]);

  const handleAbortGenerate = useCallback(() => {
    engineRef.current?.cancel();
    setIsOrchestrating(false);
    engineRef.current = null;
    abortRef.current  = null;
    showToast('Generation cancelled');
  }, [showToast]);

  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    if (!caseData || isOrchestrating) return;
    const engine = new OrchestratorEngine(undefined, buildContext(caseData, null) as any, buildOrchCallbacks());
    engineRef.current = engine;
    setIsOrchestrating(true);
    try {
      await engine.regenerateSection(sectionId);
    } catch (e: any) {
      if (e?.name !== 'AbortError') showToast(`Regeneration failed: ${e?.message ?? 'Unknown'}`);
    } finally {
      setIsOrchestrating(false);
      engineRef.current = null;
      abortRef.current  = null;
    }
  }, [caseData, isOrchestrating, buildOrchCallbacks, showToast]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: 'var(--app-height, 100vh)',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.4s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/main_background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, filter: 'brightness(0.3) contrast(1.1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 100%)', zIndex: 1 }} />

      {/* Toast */}
      <SaveToast message={toastMsg} visible={toastVisible} />

      {/* Shell */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* NavBar */}
        <NavBar
          onLogoClick={() => guard('/')}
          onLogout={() => setShowLogoutModal(true)}
          onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
        />

        {/* HeaderBar */}
        <HeaderBar
          caseData={caseData}
          onNavigate={guard}
          onSignOut={() => setShowSignOutModal(true)}
          aiConfidence={92}
        />

        {/* Alert bar */}
        {(() => {
          const reports = caseData?.synopticReports ?? [];
          const activeReport = activeReportInstanceId
            ? reports.find(r => r.instanceId === activeReportInstanceId)
            : reports[0];
          const answers = activeReport?.answers ?? caseData?.synopticAnswers ?? {};
          void answers;
          const templateId = activeReport?.templateId ?? caseData?.synopticTemplateId;
          if (!templateId) return null;
          return (
            <div style={{ background: '#fef3c7', borderTop: 'none', borderBottom: '1px solid #fde047', flexShrink: 0 }}>
              <div
                onClick={() => setAlertFieldId('scroll_to_unanswered')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 40px', cursor: 'pointer', userSelect: 'none' as const }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#92400e', fontSize: '12px' }}>
                  ⚠️ Alert — Some required fields are incomplete.{' '}
                  <span style={{ textDecoration: 'underline', fontWeight: 700 }}>Click to review →</span>
                </div>
                <span
                  style={{ fontSize: '12px', color: '#92400e', transform: isAlertExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setIsAlertExpanded(a => !a); }}
                >▼</span>
              </div>
              {isAlertExpanded && (
                <div style={{ padding: '0 40px 6px', color: '#78350f', fontSize: '11px', borderTop: '1px solid #fde047', paddingTop: '5px' }}>
                  Review all <strong>required fields</strong> marked with * in the synoptic checklist. Ensure all required data elements are completed before finalizing.
                </div>
              )}
            </div>
          );
        })()}

        {/* Main body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* Sidebar */}
          <SynopticSidebar>
            <Sidebar
              caseData={caseData}
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              activeSpecimenId={activeSpecimenId}
              onSelectSpecimen={setActiveSpecimenId}
              onAddSynoptic={() => setShowAddSynopticModal(true)}
              onOpenCaseComment={() => setShowCaseCommentModal(true)}
              onOpenSpecimenComment={(id) => { setActiveSpecimenCommentId(id); setShowSpecimenCommentModal(true); }}
              hasCaseComment={hasCaseComment}
              specimenComments={specimenComments}
              activeReportInstanceId={activeReportInstanceId}
              onSelectReport={(instanceId, specimenId) => {
                setActiveReportInstanceId(instanceId);
                setActiveSpecimenId(specimenId);
              }}
              onDeleteReport={(instanceId) => {
                if (!caseData) return;
                const remaining = (caseData.synopticReports ?? []).filter(r => r.instanceId !== instanceId);
                const updated: Case = { ...caseData, synopticReports: remaining, updatedAt: new Date().toISOString() };
                setCaseData(updated);
                setHasUnsavedData(true);
                if (activeReportInstanceId === instanceId) {
                  setActiveReportInstanceId(remaining[0]?.instanceId ?? '');
                  setActiveSpecimenId(remaining[0]?.specimenId ?? '');
                }
              }}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            />
          </SynopticSidebar>

          {/* Left panel — tabbed ──────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column' }}>

            {/* Collapsed sidebar nav strip */}
            {sidebarCollapsed && (() => {
              const allSynoptics = (caseData?.specimens ?? []).flatMap(sp =>
                (caseData?.synopticReports ?? [])
                  .filter(r => r.specimenId === sp.id)
                  .map(r => ({ ...r, specimenLabel: sp.label, specimenDesc: sp.description }))
              );
              const idx     = allSynoptics.findIndex(r => r.instanceId === activeReportInstanceId);
              const current = allSynoptics[idx];
              const prev    = allSynoptics[idx - 1];
              const next    = allSynoptics[idx + 1];
              return (
                <div className="ps-syn-nav-strip">
                  <button
                    className="ps-syn-nav-strip-btn"
                    onClick={() => prev && (setActiveReportInstanceId(prev.instanceId), setActiveSpecimenId(prev.specimenId))}
                    disabled={!prev}
                  >‹</button>
                  <div className="ps-syn-nav-strip-text">
                    {current ? (
                      <>
                        <span className="ps-syn-nav-strip-letter">{current.specimenLabel}:</span>
                        {' '}{current.specimenDesc}
                        <span className="ps-syn-nav-strip-sep">›</span>
                        <span className="ps-syn-nav-strip-name">{current.templateName}</span>
                        <span className="ps-syn-nav-strip-count">{idx + 1} / {allSynoptics.length}</span>
                      </>
                    ) : (
                      <span style={{ color: '#475569' }}>No synoptic selected</span>
                    )}
                  </div>
                  <button
                    className="ps-syn-nav-strip-btn"
                    onClick={() => next && (setActiveReportInstanceId(next.instanceId), setActiveSpecimenId(next.specimenId))}
                    disabled={!next}
                  >›</button>
                </div>
              );
            })()}

            {/* Tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0, background: 'rgba(10,16,32,0.6)',
            }}>
              {(['draft', 'report', 'results'] as const)
                .filter(tab => tab !== 'draft' || isOrchestrationMode)
                .map(tab => {
                const label = tab === 'draft' ? '✍️ Report Draft' : tab === 'report' ? '📋 Full Report' : '⚗️ Computational';
                const isActive = leftTab === tab;
                const hasResult = tab === 'results' && caseComputationalFlags.length > 0;
                return (
                  <button
                    key={tab}
                    onClick={() => setLeftTab(tab)}
                    style={{
                      padding: '9px 18px', fontSize: 12,
                      fontWeight:   isActive ? 600 : 400,
                      color:        isActive ? '#38bdf8' : 'rgba(148,163,184,0.7)',
                      background:   'none', border: 'none',
                      borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap' as const,
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; }}
                  >
                    {label}
                    {hasResult && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        background:  isActive ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)',
                        color:       isActive ? '#38bdf8' : 'rgba(148,163,184,0.6)',
                        padding: '0px 5px', borderRadius: 99, lineHeight: '16px',
                      }}>
                        {caseComputationalFlags.length}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Sequencer — modal trigger, visually distinct from tabs */}
              <div style={{ marginLeft: 'auto', padding: '0 10px', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setShowSequencer(true)}
                  title="Open report sequencer"
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 600,
                    color: '#38bdf8', cursor: 'pointer',
                    background: 'rgba(8,145,178,0.1)',
                    border: '1px solid rgba(8,145,178,0.3)',
                    borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.2)'; e.currentTarget.style.borderColor = '#0891B2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.1)'; e.currentTarget.style.borderColor = 'rgba(8,145,178,0.3)'; }}
                >
                  🔀 Sequencer ↗
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
              {/* Report Draft — Orchestrator output */}
              <div style={{ position: 'absolute', inset: 0, display: leftTab === 'draft' ? 'flex' : 'none', flexDirection: 'column' }}>
                <OrchestratorReportPanel
                  sections={orchSections}
                  isGenerating={isOrchestrating}
                  lastGeneratedAt={lastGeneratedAt}
                  onSectionChange={(id, html) => setOrchSections(prev =>
                    prev.map(s => s.id === id ? { ...s, text: html, userEdited: html !== s.aiGenerated } : s)
                  )}
                  onAcceptDraft={id => setOrchSections(prev =>
                    prev.map(s => s.id === id && s.pendingDraft != null
                      ? { ...s, text: s.pendingDraft, aiGenerated: s.pendingDraft, userEdited: false, pendingDraft: undefined }
                      : s)
                  )}
                  onKeepVersion={id => setOrchSections(prev =>
                    prev.map(s => s.id === id ? { ...s, pendingDraft: undefined } : s)
                  )}
                  onRegenerateSection={handleRegenerateSection}
                />
              </div>

              {/* Sequencer — now a modal, triggered by tab button */}
              <SequencerPanel
                show={showSequencer}
                onClose={() => setShowSequencer(false)}
                caseData={caseData}
                activeReportInstanceId={activeReportInstanceId}
                onSelectReport={(instanceId, specimenId) => {
                  setActiveReportInstanceId(instanceId);
                  setActiveSpecimenId(specimenId);
                }}
              />

              {/* Full Report — LIS source */}
              <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: leftTab === 'report' ? 'block' : 'none' }}>
                <LeftReportPanel caseData={caseData} highlightText={highlightText ?? undefined} />
              </div>

              {/* Computational */}
              {leftTab === 'results' && (
                <div style={{ position: 'absolute', inset: 0, background: '#0b1120' }}>
                  {caseId && (
                    <ComputationalPanel
                      caseId={caseId}
                      allCompFlags={caseComputationalFlags}
                      allAvailableFlags={computationalFlags}
                      aiSuggestions={aiSuggestions}
                      onFlagsChanged={async () => {
                        // Re-fetch case so the tab badge count stays in sync
                        if (!caseId) return;
                        const c = await caseRouter.getCase(caseId).catch(() => null);
                        if (c) setCaseData(c ?? null);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand button */}
          <div style={{ position: 'relative', width: 0, zIndex: 200, display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setPanelMode(m => m ? null : 'expanded')}
              title="Full-screen review mode"
              style={{
                position: 'absolute', left: -16,
                width: 32, height: 32, borderRadius: '50%',
                background: '#0891B2', border: '2px solid rgba(255,255,255,0.2)',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 15, boxShadow: '0 2px 12px rgba(0,0,0,0.8)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0e7490')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0891B2')}
            >⤢</button>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, minWidth: 0, background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <RightSynopticPanel
                ref={synopticPanelRef}
                caseData={caseData}
                activeTab={activeTab}
                activeReportInstanceId={activeReportInstanceId}
                onReportInstanceChange={setActiveReportInstanceId}
                onCaseUpdate={(updated) => { setCaseData(updated); setHasUnsavedData(true); }}
                isDirty={hasUnsavedData}
                scrollToField={alertFieldId}
                onScrollComplete={() => setAlertFieldId(null)}
                onHighlight={setHighlightText}
                computationalResults={computationalResults}
                onAiSuggestionsUpdate={setAiSuggestions}
              />
            </div>
          </div>
        </div>

        {/* Fullscreen review overlay */}
        {panelMode === 'expanded' && caseData && (() => {
          const accession = caseData.accession?.fullAccession ?? caseData.accession?.accessionNumber ?? '';
          const patient   = caseData.patient ? `${caseData.patient.lastName}, ${caseData.patient.firstName}` : '';
          const dob       = caseData.patient?.dateOfBirth ? new Date(caseData.patient.dateOfBirth).toLocaleDateString() : '';
          const sex       = caseData.patient?.sex ?? '';
          return (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column', background: '#0a0f1e' }}
              onKeyDown={e => { if (e.key === 'Escape') setPanelMode(null); }}
              tabIndex={-1}
            >
              <div style={{ background: 'rgba(8,20,40,0.98)', borderBottom: '1px solid rgba(8,145,178,0.3)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', height: 34, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{accession}</span>
                  {patient && <><span style={{ color: '#334155' }}>·</span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>{patient}</span></>}
                  {sex  && <><span style={{ color: '#334155' }}>·</span><span style={{ color: '#f1f5f9' }}>{sex}</span></>}
                  {dob  && <><span style={{ color: '#334155' }}>·</span><span style={{ color: '#94a3b8', fontSize: 11 }}>DOB</span><span style={{ color: '#f1f5f9', marginLeft: 3 }}>{dob}</span></>}
                </div>
                {caseData.specimens && caseData.specimens.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 10px', overflowX: 'auto' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0, textTransform: 'uppercase', marginRight: 4 }}>Specimen:</span>
                    {caseData.specimens.map((sp: any) => {
                      const reports  = (caseData.synopticReports ?? []).filter((r: any) => r.specimenId === sp.id);
                      const hasNone  = reports.length === 0;
                      const hasMulti = reports.length > 1;
                      const isActive = sp.id === activeSpecimenId;
                      const pillBorder = hasNone ? '#d97706' : '#0891B2';
                      const pillBg     = hasNone ? 'transparent' : isActive ? '#0891B2' : 'transparent';
                      const pillColor  = hasNone ? '#fbbf24' : isActive ? '#ffffff' : '#7dd3fc';
                      const labelColor = hasNone ? '#f59e0b' : isActive ? '#ffffff' : '#38bdf8';
                      return (
                        <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            className={`ps-specimen-pill${hasNone ? ' warning' : ''}`}
                            onClick={() => {
                              setActiveSpecimenId(sp.id);
                              if (hasNone) { setShowAddSynopticModal(true); }
                              else if (!hasMulti) { setActiveReportInstanceId(reports[0].instanceId); }
                            }}
                            style={{
                              padding: '3px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                              borderRadius: 20, border: `1.5px solid ${pillBorder}`,
                              background: pillBg, color: pillColor,
                              cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ color: labelColor, fontWeight: 800 }}>{sp.label}:</span>
                            <span>{sp.description}</span>
                            {hasNone && <span style={{ fontSize: 10 }}>⚠</span>}
                          </button>
                          {hasMulti && (
                            <select
                              className="ps-specimen-pill"
                              value={isActive ? activeReportInstanceId : reports[0].instanceId}
                              onChange={e => { setActiveSpecimenId(sp.id); setActiveReportInstanceId(e.target.value); }}
                              style={{
                                height: 24, fontSize: 11, fontWeight: 600, maxWidth: 160, flexShrink: 0,
                                background: 'rgba(8,145,178,0.15)', color: '#7dd3fc',
                                border: '1.5px solid #0891B2', borderRadius: 20,
                                padding: '0 8px', cursor: 'pointer', outline: 'none',
                              }}
                            >
                              {reports.map((r: any, i: number) => (
                                <option key={r.instanceId} value={r.instanceId}>
                                  {sp.label}: {r.templateId ? r.templateId.replace(/-/g, ' ') : `Report ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.95)' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'rgba(10,16,32,0.6)' }}>
                    {(['draft', 'sequencer', 'report', 'results'] as const).map(tab => {
                      const isActive = leftTab === tab;
                      const label    = tab === 'draft' ? '✍️ Report Draft' : tab === 'sequencer' ? '🔀 Sequencer' : tab === 'report' ? '📋 Full Report' : '⚗️ Computational';
                      return (
                        <button key={tab} onClick={() => setLeftTab(tab)} style={{
                          padding: '9px 18px', fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#38bdf8' : 'rgba(148,163,184,0.7)',
                          background: 'none', border: 'none',
                          borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; }}
                        >
                          {label}
                          {tab === 'results' && caseComputationalFlags.length > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 600,
                              background: isActive ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)',
                              color: isActive ? '#38bdf8' : 'rgba(148,163,184,0.6)',
                              padding: '0 5px', borderRadius: 99, lineHeight: '16px',
                            }}>{caseComputationalFlags.length}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, display: leftTab === 'draft' ? 'flex' : 'none', flexDirection: 'column' }}>
                      <OrchestratorReportPanel
                        sections={orchSections}
                        isGenerating={isOrchestrating}
                        lastGeneratedAt={lastGeneratedAt}
                        onSectionChange={(id, html) => setOrchSections(prev =>
                          prev.map(s => s.id === id ? { ...s, text: html, userEdited: html !== s.aiGenerated } : s)
                        )}
                        onAcceptDraft={id => setOrchSections(prev =>
                          prev.map(s => s.id === id && s.pendingDraft != null
                            ? { ...s, text: s.pendingDraft, aiGenerated: s.pendingDraft, userEdited: false, pendingDraft: undefined }
                            : s)
                        )}
                        onKeepVersion={id => setOrchSections(prev =>
                          prev.map(s => s.id === id ? { ...s, pendingDraft: undefined } : s)
                        )}
                        onRegenerateSection={handleRegenerateSection}
                      />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: leftTab === 'sequencer' ? 'flex' : 'none', flexDirection: 'column' }}>
                      <SequencerPanel
                        show={leftTab === 'sequencer'}
                        onClose={() => setLeftTab('report')}
                        caseData={caseData}
                        activeReportInstanceId={activeReportInstanceId}
                        onSelectReport={(instanceId, specimenId) => {
                          setActiveReportInstanceId(instanceId);
                          setActiveSpecimenId(specimenId);
                        }}
                      />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: leftTab === 'report' ? 'block' : 'none' }}>
                      <LeftReportPanel caseData={caseData} highlightText={highlightText ?? undefined} />
                    </div>
                    {leftTab === 'results' && (
                      <div style={{ position: 'absolute', inset: 0, background: '#0b1120', display: 'flex' }}>
                        {caseId && (
                          <ComputationalPanel
                            caseId={caseId}
                            allCompFlags={caseComputationalFlags}
                            allAvailableFlags={computationalFlags}
                            aiSuggestions={aiSuggestions}
                            
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative', width: 0, zIndex: 200, display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setPanelMode(null)}
                    title="Exit full-screen (Esc)"
                    style={{
                      position: 'absolute', left: -16,
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#0891B2', border: '2px solid rgba(255,255,255,0.2)',
                      color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15, boxShadow: '0 2px 12px rgba(0,0,0,0.8)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0e7490')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#0891B2')}
                  >⤡</button>
                </div>

                <div style={{ flex: 1, minWidth: 0, background: 'rgba(15,23,42,0.95)', overflowY: 'auto' }}>
                  <RightSynopticPanel
                    caseData={caseData}
                    activeTab={activeTab}
                    activeReportInstanceId={activeReportInstanceId}
                    onReportInstanceChange={setActiveReportInstanceId}
                    onCaseUpdate={(updated) => { setCaseData(updated); setHasUnsavedData(true); }}
                    scrollToField={alertFieldId}
                    onScrollComplete={() => setAlertFieldId(null)}
                    onHighlight={setHighlightText}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* DEV only: simulate microscopic received → triggers protocol review */}
        {import.meta.env.DEV && caseData && (
          <div style={{ position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
            <button
              onClick={() => handleProtocolChangesDetected([{
                id: 'demo-proto-1',
                specimenId:           caseData.specimens?.[0]?.id ?? 'sp-1',
                specimenLabel:        (caseData.specimens?.[0] as any)?.label ?? 'A',
                specimenDesc:         (caseData.specimens?.[0] as any)?.specimenType ?? 'Core biopsy',
                currentTemplateId:    'breast_core_general',
                currentTemplateName:  'Breast Core Biopsy (General)',
                proposedTemplateId:   'breast_invasive_carcinoma',
                proposedTemplateName: 'Breast Invasive Carcinoma (CAP)',
                reason:               'Microscopic shows invasive ductal carcinoma, nuclear grade 2, tubule formation score 3.',
                confidence:           92,
              }])}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}
            >
              ⚡ DEV: Simulate Microscopic Received
            </button>
          </div>
        )}
        {/* Bottom action bar */}
        <BottomActionBar
          caseData={caseData}
          isDirty={hasUnsavedData}
          onSaveDraft={() => { setHasUnsavedData(false); showToast('Draft saved'); }}
          onSaveAndNext={() => { setHasUnsavedData(false); showToast('Draft saved'); navigateToCase('next'); }}
          onFinalize={() => handleRequestFinalize(false)}
          onFinalizeAndNext={() => handleRequestFinalize(true)}
          onSignOut={() => { if (caseData?.reportingMode !== 'copilot') setShowSignOutModal(true); }}
          
          onHistory={() => setIsSimilarCasesOpen(true)}
          onFlags={() => openFlagManager(caseData)}
          onDelegate={() => setShowDelegateModal(true)}
          onTeam={() => setShowTeamModal(true)}
          onCodes={() => setShowCodesModal(true)}
          onNextCase={() => { if (shouldWarnDirty()) { setPendingNavigation('next'); } else { navigateToCase('next'); } }}
          onPreviousCase={() => { if (shouldWarnDirty()) { setPendingNavigation('prev'); } else { navigateToCase('prev'); } }}
          onGenerateReport={isOrchestrationMode ? handleGenerateReport : undefined}
          isGenerating={isOrchestrating}
          onAbortGenerate={handleAbortGenerate}
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}

      <CaseSignOutModal
        show={showSignOutModal}
        overlayStyle={overlayStyle}
        accession={caseData?.accession?.fullAccession ?? caseData?.accession?.accessionNumber ?? ''}
        signOutUser={signOutUser}
        signOutPassword={signOutPassword}
        signOutError={signOutError}
        onClose={() => setShowSignOutModal(false)}
        onUserChange={setSignOutUser}
        onPasswordChange={setSignOutPassword}
        onConfirm={handleSignOutConfirm}
      />

      {showAiReview && (
        <AiReviewModal
          fields={reviewFields}
          finalizeAndNext={finalizeAndNextPending}
          onConfirm={(fieldId: string) => synopticPanelRef.current?.setFieldVerification(fieldId, 'verified')}
          onOverride={(fieldId: string) => synopticPanelRef.current?.setFieldVerification(fieldId, 'disputed')}
          onSkip={(_fieldId: string) => { /* stays unverified */ }}
          onComplete={(summary) => {
            console.info('[PathScribe] AI review summary:', summary);
            setShowAiReview(false);
            setShowFinalizeModal(true);
          }}
          onCancel={() => setShowAiReview(false)}
        />
      )}

      {showMissingWarning && (
        <div
          onClick={() => setShowMissingWarning(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 520, background: '#0f172a', borderRadius: 16, border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}
          >
            <div style={{ padding: '18px 24px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Cannot Finalise</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Required Fields Incomplete</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                The following required fields must be completed before this report can be finalised:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {missingFields.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8 }}>
                    <span style={{ fontSize: 14, color: '#f87171', flexShrink: 0 }}>✗</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>{f.fieldLabel}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{f.sectionTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{missingFields.length} field{missingFields.length !== 1 ? 's' : ''} need attention</span>
              <button
                onClick={() => setShowMissingWarning(false)}
                style={{ padding: '9px 20px', borderRadius: 8, background: '#0891B2', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0e7490')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0891B2')}
              >
                Return and Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-finalisation review — two-pane: specimen list + Q&A preview + signing */}
      <PreFinalisationModal
        show={showPreFinalise}
        caseAccession={caseData?.accession?.fullAccession ?? ''}
        patientName={`${caseData?.patient?.firstName ?? ''} ${caseData?.patient?.lastName ?? ''}`.trim()}
        reportingMode={caseData?.reportingMode === 'copilot' ? 'copilot' : 'pathscribe'}
        synoptics={preFinalSynoptics}
        userId={(caseData as any)?.order?.assignedTo ?? 'current'}
        userDisplayName={(caseData as any)?.assignedPathologistName ?? 'Pathologist'}
        userCredentials=""
        finalizeAndNext={finalizeAndNextPending}
        onConfirm={handlePreFinalConfirm}
        onCancel={() => setShowPreFinalise(false)}
      />

      {/* Legacy per-synoptic password confirm — kept for deferred/amendment flow */}
      <FinalizeSynopticModal
        show={showFinalizeModal}
        overlayStyle={overlayStyle}
        activeSynoptic={null}
        finalizePassword={finalizePassword}
        finalizeError={finalizeError}
        finalizeAndNext={false}
        onClose={() => setShowFinalizeModal(false)}
        onPasswordChange={setFinalizePassword}
        onConfirm={handleFinalizeConfirm}
      />

      {/* Protocol change review — AI proposes after microscopic received */}
      <ProtocolChangeModal
        show={showProtoReview}
        changes={protoChanges}
        onCommit={handleProtoCommit}
        onCancel={() => setShowProtoReview(false)}
      />

      <AmendmentModal
        show={showAmendmentModal}
        overlayStyle={overlayStyle}
        amendmentMode={amendmentMode}
        amendmentText={amendmentText}
        activeSynopticTitle={caseData?.accession?.fullAccession ?? 'Case'}
        onModeChange={setAmendmentMode}
        onTextChange={setAmendmentText}
        onClose={() => { setShowAmendmentModal(false); setDeferredAmendmentContext(null); }}
        onSubmit={handleAmendmentSubmit}
        triggeredBySynopticTitle={deferredAmendmentContext?.title}
        prefillText={deferredAmendmentContext?.prefill}
      />

      <LogoutWarningModal
        show={showLogoutModal}
        overlayStyle={overlayStyle}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => { setShowLogoutModal(false); handleLogout(); }}
      />

      {showAddSynopticModal && (
        <AddSynopticModal
          caseData={caseData}
          availableProtocols={availableProtocols}
          onClose={() => setShowAddSynopticModal(false)}
          onAdd={(newInstances, updatedCase) => {
            setCaseData(updatedCase);
            setHasUnsavedData(true);
            setActiveReportInstanceId(newInstances[0].instanceId);
            setActiveSpecimenId(newInstances[0].specimenId);
          }}
        />
      )}

      {showCaseCommentModal && (
        <CaseCommentModal
          accession={caseData?.accession?.fullAccession ?? caseData?.accession?.accessionNumber ?? ''}
          caseComments={{ attending: caseCommentAttending }}
          onChangeAttending={(html) => {
            setCaseCommentAttending(html);
            setHasCaseComment(!!html && html !== '<p></p>');
            if (caseData?.id) localStorage.setItem(`ps_case_comment_${caseData.id}`, html);
            setHasUnsavedData(true);
          }}
          onClose={() => setShowCaseCommentModal(false)}
        />
      )}

      {showSpecimenCommentModal && activeSpecimenCommentId && (
        <ReportCommentModal
          specimenName={
            caseData?.specimens?.find(s => s.id === activeSpecimenCommentId)
              ? `Specimen ${caseData.specimens.find(s => s.id === activeSpecimenCommentId)!.label} › ${caseData.specimens.find(s => s.id === activeSpecimenCommentId)!.description}`
              : 'Specimen'
          }
          specimenId={activeSpecimenCommentId}
          content={specimenComments[activeSpecimenCommentId] ?? ''}
          isFinalized={false}
          onChange={(html) => {
            setSpecimenComments(prev => ({ ...prev, [activeSpecimenCommentId]: html }));
            setHasUnsavedData(true);
          }}
          onClose={() => setShowSpecimenCommentModal(false)}
        />
      )}

      {isSimilarCasesOpen && caseData && (
        <PatientHistoryModal
          patientName={`${caseData.patient.lastName}, ${caseData.patient.firstName}`}
          mrn={caseData.patient.mrn ?? ''}
          onClose={() => setIsSimilarCasesOpen(false)}
        />
      )}

      {showCodesModal && caseData && (
        <AddCodeModal
          existingCodes={(caseData as any).codes ?? []}
          allSpecimens={(caseData.specimens ?? []).map((sp, i) => ({
            index: i, id: i + 1,
            name: `${sp.label}: ${sp.description ?? ''}`,
          }))}
          activeSpecimenIndex={0}
          caseText={{
            gross:       caseData.diagnostic?.grossDescription ?? '',
            microscopic: caseData.diagnostic?.microscopicDescription ?? '',
            ancillary:   caseData.diagnostic?.ancillaryStudies ?? '',
          }}
          synopticAnswers={
            (activeReportInstanceId
              ? caseData.synopticReports?.find(r => r.instanceId === activeReportInstanceId)?.answers
              : caseData.synopticReports?.[0]?.answers
            ) ?? caseData.synopticAnswers ?? {}
          }
          templateName={
            (activeReportInstanceId
              ? caseData.synopticReports?.find(r => r.instanceId === activeReportInstanceId)?.templateName
              : caseData.synopticReports?.[0]?.templateName
            ) ?? ''
          }
          narrativeText={
            (caseData.synopticReports?.find(r => r.instanceId === activeReportInstanceId) as any)?.narrativeContent ?? undefined
          }
          onAddToSpecimens={(codes, _specimenIndices) => {
            const newIcd    = codes.filter(c => c.system === 'ICD').map(c => c.code);
            const newSnomed = codes.filter(c => c.system === 'SNOMED').map(c => c.code);
            setCaseData(prev => prev ? {
              ...prev,
              coding: {
                icd10:  [...((prev as any).coding?.icd10  ?? []), ...newIcd],
                snomed: [...((prev as any).coding?.snomed ?? []), ...newSnomed],
              },
            } : prev);
            setHasUnsavedData(true);
            setShowCodesModal(false);
          }}
          onClose={() => setShowCodesModal(false)}
          originHospitalId={caseData?.originHospitalId}
        />
      )}

      {showFlagManager && flagCaseData && (
        <FlagManagerModal
          key={`flag-modal-${flagCaseData.id}`}
          caseData={{
            ...flagCaseData,
            accession: (flagCaseData.accession as any)?.fullAccession ?? (flagCaseData.accession as any)?.accessionNumber ?? flagCaseData.accession ?? '',
            flags: (flagCaseData as any).flags ?? [],
          } as any}
          flagDefinitions={flagDefinitions}
          onApplyFlags={async (...args: Parameters<typeof onApplyFlags>) => { await onApplyFlags(...args); }}
          onRemoveFlag={async (...args: Parameters<typeof onRemoveFlag>) => { await onRemoveFlag(...args); }}
          onClose={() => {
            if (flagCaseData && caseData) {
              setCaseData(prev => prev ? {
                ...prev,
                caseFlags: (flagCaseData as any).flags ?? [],
                specimens: prev.specimens?.map(sp => {
                  const updated = flagCaseData.specimens?.find((s: any) => s.id === sp.id);
                  return updated ? { ...sp, specimenFlags: (updated as any).flags ?? [] } : sp;
                }),
              } : prev);
            }
            setShowFlagManager(false);
          }}
        />
      )}

      {showTeamModal && caseData && (
        <CaseTeamModal
          caseData={caseData}
          onClose={() => setShowTeamModal(false)}
          onUpdated={(updated) => { setCaseData(updated); setHasUnsavedData(true); }}
          onDelegate={() => { setShowTeamModal(false); setDelegateReturnTo('team'); setShowDelegateModal(true); }}
        />
      )}

      {showDelegateModal && (
        <DelegateModal
          isOpen={showDelegateModal}
          onClose={() => {
            setShowDelegateModal(false);
            if (delegateReturnTo === 'team') { setShowTeamModal(true); setDelegateReturnTo(null); }
          }}
          registry={mockActionRegistryService}
          caseId={caseId}
          currentUserId="PATH-001"
          onDelegated={() => {
            setShowDelegateModal(false);
            showToast('Case delegated successfully');
            if (delegateReturnTo === 'team') { setShowTeamModal(true); setDelegateReturnTo(null); }
          }}
          synopticInstances={(caseData?.synopticReports ?? []).map(r => ({
            instanceId: r.instanceId,
            specimenDescription: caseData?.specimens?.find(s => s.id === r.specimenId)?.description ?? r.specimenId,
            templateName: r.templateName,
          }))}
        />
      )}

      <UnsavedWarningModal
        show={!!pendingNavigation || !!pendingPath}
        overlayStyle={overlayStyle}
        onCancel={() => {
          setPendingNavigation(null);
          cancelContextNavigate();
        }}
        onConfirm={() => {
          setHasUnsavedData(false);
          if (pendingPath) confirmContextNavigate();
          const dest = pendingNavigation;
          setPendingNavigation(null);
          if (dest === 'next') navigateToCase('next');
          else if (dest === 'prev') navigateToCase('prev');
          else if (dest === '__back__') {
            if (backPath === '/search') sessionStorage.setItem('pathscribe:searchReturn', '1');
            navigate(backPath);
          }
          // backPath is '/search' or '/worklist' depending on navSource
          else if (dest) navigate(dest);
        }}
      />
    </div>
  );
};

export default SynopticReportPage;

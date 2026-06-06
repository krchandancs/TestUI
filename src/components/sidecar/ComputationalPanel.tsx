// PathScribe — ComputationalPanel
// Standalone two-pane panel for the Computational tab in SynopticReportPage.
// Uses the same service-fetch logic as SidecarDrawer to get case-specific flags,
// and the same Navigator + Display layout — no SidecarContext dependency.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Flag }               from '@/services/flags/IFlagService';
import { ComputationalResult } from '@/types/smarttag.types';
import { caseService, messageService } from '@/services';
import SidecarDisplay   from './SidecarDisplay';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { COMP_EVENT, COMP_AUDIT } from '@/constants/computationalActions';
import { useAuditLog } from '@/components/Audit/useAuditLog';

// ─── Props ────────────────────────────────────────────────────────────────────

// ─── DnD sub-components ───────────────────────────────────────────────────────

const SpecimenDropZone: React.FC<{
  dropId: string;
  isOver: boolean;
  children: React.ReactNode;
}> = ({ dropId, isOver, children }) => {
  const { setNodeRef } = useDroppable({ id: dropId });
  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 6,
        outline: isOver ? '2px solid #38bdf8' : '2px solid transparent',
        outlineOffset: -2,
        background: isOver ? 'rgba(56,189,248,0.06)' : 'transparent',
        transition: 'outline 0.12s, background 0.12s',
      }}
    >
      {children}
    </div>
  );
};

const DraggableFlagCard: React.FC<{
  flag: Flag;
  isPending: boolean;
  isDragging: boolean;
  protocolLabel: string;
  onToggle: () => void;
}> = ({ flag, isPending, isDragging, protocolLabel, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `flag-${flag.id}` });
  return (
    <div
      ref={setNodeRef}
      className={`fm-flag-card${isPending ? ' applied' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: isDragging ? 0.35 : 1,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        touchAction: 'none',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'opacity 0.15s',
        padding: '10px 14px',
      }}
      onClick={onToggle}
    >
      {/* Drag handle — left side */}
      <div
        {...listeners}
        {...attributes}
        style={{ cursor: 'grab', flexShrink: 0, color: '#334155', display: 'flex', alignItems: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/>
          <circle cx="9" cy="2.5" r="1.2"/><circle cx="9" cy="7" r="1.2"/><circle cx="9" cy="11.5" r="1.2"/>
        </svg>
      </div>

      <span className={`fm-code-chip${isPending ? ' applied' : ''}`}>{flag.lisCode}</span>

      <div className="fm-flag-info" style={{ flex: 1, minWidth: 0 }}>
        <div className="fm-flag-name-row">
          <span className="fm-flag-name">{flag.name}</span>
          {isPending && <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, marginLeft: 6, flexShrink: 0 }}>✓ Staged</span>}
        </div>
        <span className="fm-flag-desc">{protocolLabel}</span>
      </div>
    </div>
  );
};

interface Props {
  caseId:              string;
  /** All active computational flag definitions — passed from parent. */
  allCompFlags:        Flag[];
  /** All available flags in the system — used to derive orderable flags. */
  allAvailableFlags?:  Flag[];
  /** Callback to refresh flags in the parent after order/cancel. */
  onFlagsChanged?:     () => void | Promise<void>;
  /** AI suggestions from RightSynopticPanel for concordance checking. */
  aiSuggestions?:      Record<string, any>;
}

// ─── ComputationalPanel ───────────────────────────────────────────────────────

const ComputationalPanel: React.FC<Props> = ({ caseId, allCompFlags, allAvailableFlags, aiSuggestions, onFlagsChanged }) => {
  const { log } = useAuditLog();
  const orderModalRef  = useRef<HTMLDivElement>(null);
  const cancelModalRef = useRef<HTMLDivElement>(null);
  const [caseFlags,    setCaseFlags]    = useState<Flag[]>([]);
  const [orderableFlags, setOrderableFlags] = useState<Flag[]>([]); // comp flags NOT yet on case
  const [availableProtocols, setAvailableProtocols] = useState<Record<string, string>>({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null); // null = all specimens
  const [caseSpecimens,  setCaseSpecimens]  = useState<Array<{ id: string; label: string; description: string }>>([]);
  const [orderSearch,    setOrderSearch]    = useState('');
  const [pendingOrders,  setPendingOrders]  = useState<Array<{ flag: Flag; specimenId: string | null }>>([]);
  const [placing,        setPlacing]        = useState(false);
  const [cancelTarget,   setCancelTarget]   = useState<Flag | null>(null);
  const [cancelling,     setCancelling]     = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [results,      setResults]      = useState<Record<string, ComputationalResult | null>>({});

  // DnD state for order modal
  const [activeDragFlag, setActiveDragFlag] = useState<Flag | null>(null);
  const [overDropId,     setOverDropId]     = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  useFocusTrap(orderModalRef,  showOrderModal);
  useFocusTrap(cancelModalRef, !!cancelTarget);

  // ── Load protocol names for display in confirmation modal ────────────────
  useEffect(() => {
    import('@/services/templates/templateService').then(m =>
      m.listTemplates('published').then((templates: any[]) => {
        const map: Record<string, string> = {};
        templates.forEach((t: any) => { map[t.id] = t.name; });
        setAvailableProtocols(map);
      })
    ).catch(() => {});
  }, []);

  // ── Sync case flags from pre-filtered allCompFlags prop ──────────────────
  useEffect(() => {
    if (!caseId) return;

    // allCompFlags is already filtered to this case by SynopticReportPage
    setCaseFlags(allCompFlags);
    // Always ensure selectedFlag is still in the current list — fixes the race
    // where all flags flash briefly before caseData loads and the list narrows
    if (allCompFlags.length > 0) {
      const stillPresent = selectedFlag && allCompFlags.find(f => f.id === selectedFlag.id);
      if (!stillPresent) setSelectedFlag(allCompFlags[0]);
    } else {
      setSelectedFlag(null);
    }

    // Orderable = all available flags NOT already on this case
    const caseIds = new Set(allCompFlags.map(f => f.id));
    setOrderableFlags(
      (allAvailableFlags ?? []).filter(f =>
        f.status === 'Active' &&
        f.tagClass === 'COMPUTATIONAL' &&
        !caseIds.has(f.id)
      )
    );

    // Load specimen list for the order modal
    caseService.getCase(caseId).then(caseData => {
      if (!caseData) return;
      const specs = ((caseData as any).specimens ?? []).map((sp: any) => ({
        id: sp.id, label: sp.label, description: sp.description ?? '',
      }));
      setCaseSpecimens(specs);
    }).catch(() => {});
  }, [caseId, allCompFlags.length, allCompFlags.map(f => f.id).join(',')]);

  // ── Fetch all results for Navigator dot colours ───────────────────────────
  useEffect(() => {
    if (!caseId || caseFlags.length === 0) return;
    import('@/services').then(({ resultService }) => {
      caseFlags.forEach(flag => {
        const sourceId = flag.dataSource?.sourceId;
        if (!sourceId) return;
        resultService.getResult(sourceId, caseId)
          .then((result: ComputationalResult) =>
            setResults(prev => ({ ...prev, [flag.id]: result }))
          )
          .catch(() => {});
      });
    });
  }, [caseId, caseFlags.length]);




  const togglePendingOrder = useCallback((flag: Flag, specimenId: string | null) => {
    setPendingOrders(prev => {
      const exists = prev.find(o => o.flag.id === flag.id);
      if (exists) return prev.filter(o => o.flag.id !== flag.id);
      return [...prev, { flag, specimenId }];
    });
  }, []);

  const handlePlaceOrders = useCallback(async () => {
    if (pendingOrders.length === 0) return;
    setPlacing(true);
    try {
      for (const { flag } of pendingOrders) {
        await messageService.send?.({
          subject: `Order Request: ${flag.name}`,
          body: `Order request for ${flag.name} (${flag.lisCode}) on case ${caseId}.`,
          caseNumber: caseId,
        } as any).catch(() => {});
        if (flag.defaultProtocolIds?.length && caseId) {
          window.dispatchEvent(new CustomEvent('ps:suggest-protocols', {
            detail: { caseId, protocolIds: flag.defaultProtocolIds, flagName: flag.name }
          }));
        }
      }
      log(COMP_AUDIT.USE_ORDERS_PLACED, {
        caseId,
        count: pendingOrders.length,
        flags: pendingOrders.map(o => ({
          flagId: o.flag.id, lisCode: o.flag.lisCode, specimenId: o.specimenId
        })),
      });
      const orderedIds = new Set(pendingOrders.map(o => o.flag.id));
      const newCaseFlags = pendingOrders.map(o => ({ ...o.flag, specimenId: o.specimenId ?? undefined }));

      // Persist new flags into the case so caseData.specimenFlags is up-to-date
      // when SynopticReportPage re-fetches. Without this the badge count stays stale.
      if (caseId) {
        const freshCase = await caseService.getCase(caseId).catch(() => null);
        if (freshCase) {
          const existing = ((freshCase as any).specimenFlags ?? []) as any[];
          // Merge: update specimenId if flag already exists, add if new
          const merged = [...existing];
          for (const newFlag of newCaseFlags) {
            const idx = merged.findIndex((f: any) => f.lisCode === newFlag.lisCode);
            if (idx >= 0) {
              // Update specimenId on existing entry
              merged[idx] = { ...merged[idx], specimenId: newFlag.specimenId ?? null };
            } else {
              merged.push(newFlag);
            }
          }
          await caseService.updateCase(caseId, { specimenFlags: merged } as any).catch(() => {});
        }
      }

      setCaseFlags(prev => [...prev, ...newCaseFlags]);
      setOrderableFlags(prev => prev.filter(f => !orderedIds.has(f.id)));
      setPendingOrders([]);
      setShowOrderModal(false);
      onFlagsChanged?.();
    } catch (e) {
      console.error('[ComputationalPanel] Order request failed:', e);
    } finally {
      setPlacing(false);
    }
  }, [pendingOrders, caseId]);


  const handleCancelOrder = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const orderedVia = (cancelTarget as any).orderedVia ?? 'lis';

      log(COMP_AUDIT.USE_ORDER_CANCELLED, {
        caseId,
        flagId: cancelTarget.id,
        flagName: cancelTarget.name,
        orderedVia: (cancelTarget as any).orderedVia ?? 'lis',
      });

      // Send cancellation notification (non-blocking)
        await messageService.send?.({
          subject: `Cancellation Request: ${cancelTarget.name}`,
          body: `Cancellation request for ${cancelTarget.name} (${cancelTarget.lisCode}) on case ${caseId}. ` +
                (orderedVia === 'pathscribe'
                  ? 'Order was placed via PathScribe — lab notified to cancel.'
                  : 'Order originated in LIS — PathScribe has notified the lab. Please also cancel in your LIS system.'),
          caseNumber: caseId,
        } as any).catch(() => {});

      // Remove from case flags
      // Remove from case persisted data too
      if (caseId) {
        const caseData = await caseService.getCase(caseId).catch(() => null);
        if (caseData) {
          const updated = ((caseData as any).specimenFlags ?? []).filter((f: any) => f.lisCode !== cancelTarget.lisCode);
          await caseService.updateCase(caseId, { specimenFlags: updated } as any).catch(() => {});
        }
      }
      setCaseFlags(prev => prev.filter(f => f.id !== cancelTarget.id));
      setOrderableFlags(prev => [...prev, cancelTarget]);
      setCancelTarget(null);
      onFlagsChanged?.();
    } catch (e) {
      console.error('[ComputationalPanel] Cancellation failed:', e);
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget, caseId]);

  // ── Voice event handlers ──────────────────────────────────────────────
  useEffect(() => {
    const nextAssay = () => {
      setCaseFlags(prev => {
        const idx = prev.findIndex(f => f.id === selectedFlag?.id);
        const next = prev[idx + 1];
        if (next) setSelectedFlag(next);
        return prev;
      });
    };
    const prevAssay = () => {
      setCaseFlags(prev => {
        const idx = prev.findIndex(f => f.id === selectedFlag?.id);
        const prev2 = prev[idx - 1];
        if (prev2) setSelectedFlag(prev2);
        return prev;
      });
    };
    const readResult = () => {
      if (!selectedFlag || !window.speechSynthesis) return;
      const result = results[selectedFlag.id];
      if (!result || !result.data) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${selectedFlag.name}: no result available yet.`));
        return;
      }
      const lines = Object.entries(result.data)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('. ');
      const u = new SpeechSynthesisUtterance(`${selectedFlag.name}. ${lines}`);
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      log(COMP_AUDIT.USE_RESULT_READ_ALOUD, { caseId, flagId: selectedFlag.id });
    };
    const openOrderModal = () => {
      setShowOrderModal(true);
      setOrderSearch('');
      setPendingOrders([]);
      setSelectedTarget(null);
      log(COMP_AUDIT.USE_ORDER_MODAL_OPENED, { caseId });
    };

    window.addEventListener(COMP_EVENT.NEXT_ASSAY,       nextAssay);
    window.addEventListener(COMP_EVENT.PREV_ASSAY,       prevAssay);
    window.addEventListener(COMP_EVENT.READ_RESULT,      readResult);
    window.addEventListener('PATHSCRIBE_COMP_OPEN_ORDER_MODAL_INTERNAL', openOrderModal);

    return () => {
      window.removeEventListener(COMP_EVENT.NEXT_ASSAY,  nextAssay);
      window.removeEventListener(COMP_EVENT.PREV_ASSAY,  prevAssay);
      window.removeEventListener(COMP_EVENT.READ_RESULT, readResult);
      window.removeEventListener('PATHSCRIBE_COMP_OPEN_ORDER_MODAL_INTERNAL', openOrderModal);
    };
  }, [selectedFlag, results, caseId]);

  const handleResultLoaded = useCallback((flagId: string, result: ComputationalResult) => {
    setResults(prev => ({ ...prev, [flagId]: result }));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const specimenLabel = (spId: string | null | undefined) => {
    if (!spId) return 'Case level';
    const sp = caseSpecimens.find(s => s.id === spId);
    return sp ? `${sp.label}: ${sp.description}` : spId;
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (caseFlags.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 12,
      }}>
        <div style={{ color: '#4e607a', fontSize: 13 }}>
          No computational assays ordered for this case.
        </div>
        {orderableFlags.length > 0 && (
          <button
            onClick={() => { setShowOrderModal(true); setOrderSearch(''); setPendingOrders([]); setSelectedTarget(null); }}
            className="comp-order-trigger-btn"
          >
            + Order a test
          </button>
        )}
      </div>
    );
  }

  // ── Two-pane layout (matches worklist overlay) ───────────────────────────
  return (
    <>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Navigator + orderable section */}
        <div style={{
          width:      220,
          flexShrink: 0,
          borderRight:'1px solid rgba(30,41,59,0.9)',
          display:    'flex',
          flexDirection: 'column',
          overflow:   'hidden',
        }}>
          {/* Ordered assays — grouped by case level then specimen */}
          <div className="comp-navigator" role="listbox" aria-label="Ordered computational tests">
            {caseFlags.length === 0 && (
              <div className="comp-empty-note">No computational flags on this case.</div>
            )}

            {(() => {
              // Group flags: null specimenId = case level, otherwise by specimen
              const caseLevelFlags = caseFlags.filter(f => !(f as any).specimenId);
              const bySpecimen = caseSpecimens.map(sp => ({
                sp,
                flags: caseFlags.filter(f => (f as any).specimenId === sp.id),
              }));

              const renderFlag = (flag: Flag) => {
                const result     = results[flag.id];
                const status     = result?.status;
                const isPending  = !status || status === 'PENDING';
                const isSelected = selectedFlag?.id === flag.id;
                const dotColor   = status === 'FINAL' && result?.actionability === 'ACTIONABLE' ? '#dc2626'
                  : status === 'FINAL' ? '#059669'
                  : status === 'PRELIMINARY' ? '#f59e0b'
                  : '#0891b2';
                const statusLabel = status === 'FINAL' && result?.actionability === 'ACTIONABLE'
                  ? 'Final — actionable' : status === 'FINAL' ? 'Final'
                  : status === 'PRELIMINARY' ? 'Preliminary' : 'Pending';
                return (
                  <button
                    key={flag.id}
                    role="option"
                    aria-selected={isSelected}
                    className="comp-flag-row"
                    style={{ paddingLeft: 20 }}
                    onClick={() => {
                      setSelectedFlag(flag);
                      log(COMP_AUDIT.USE_RESULT_VIEWED, {
                        caseId, flagId: flag.id, flagName: flag.name, status: status ?? 'PENDING'
                      });
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFlag(flag); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); const next = caseFlags[caseFlags.indexOf(flag) + 1]; if (next) setSelectedFlag(next); }
                      if (e.key === 'ArrowUp')   { e.preventDefault(); const prev = caseFlags[caseFlags.indexOf(flag) - 1]; if (prev) setSelectedFlag(prev); }
                    }}
                  >
                    <span className="comp-status-dot" style={{ background: dotColor }} aria-hidden="true" />
                    <span className="ps-sr-only">{statusLabel} — </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="comp-flag-row-name">{flag.name}</div>
                      <div className="comp-flag-row-code">{flag.lisCode}</div>
                    </div>
                    {isPending && (
                      <button
                        className="comp-trash-btn"
                        aria-label={`Cancel ${flag.name} order`}
                        onClick={e => { e.stopPropagation(); setCancelTarget(flag); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 4h10M6 4V3h4v1M7 7v5M9 7v5M4 4l1 9h6l1-9"
                            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </button>
                );
              };

              return (
                <>
                  {/* Case level */}
                  {(caseLevelFlags.length > 0 || caseSpecimens.length === 0) && (
                    <div>
                      <div className="comp-col-label" style={{ paddingTop: 10 }}>
                        Case level
                        {caseLevelFlags.length > 0 && (
                          <span className="comp-group-count">{caseLevelFlags.length}</span>
                        )}
                      </div>
                      {caseLevelFlags.length === 0
                        ? <div className="comp-empty-note" style={{ paddingTop: 2 }}>None</div>
                        : caseLevelFlags.map(renderFlag)
                      }
                    </div>
                  )}

                  {/* Per-specimen groups */}
                  {bySpecimen.map(({ sp, flags: spFlags }) => (
                    <div key={sp.id}>
                      <div className="comp-col-label" style={{ paddingTop: 10 }}>
                        {sp.label}: {sp.description}
                        {spFlags.length > 0 && (
                          <span className="comp-group-count">{spFlags.length}</span>
                        )}
                      </div>
                      {spFlags.length === 0
                        ? <div className="comp-empty-note" style={{ paddingTop: 2 }}>None ordered</div>
                        : spFlags.map(renderFlag)
                      }
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          {/* Order button — always visible in left pane footer */}
          <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid rgba(30,41,59,0.9)' }}>
            <button
              onClick={() => { if (orderableFlags.length === 0) return; setShowOrderModal(true); setOrderSearch(''); setPendingOrders([]); setSelectedTarget(null); }}
              className="comp-order-trigger-btn"
              disabled={orderableFlags.length === 0}
              title={orderableFlags.length === 0 ? 'All available tests are already ordered' : 'Order an additional computational test'}
              style={{ opacity: orderableFlags.length === 0 ? 0.4 : 1, cursor: orderableFlags.length === 0 ? 'default' : 'pointer' }}
            >
              {orderableFlags.length === 0 ? '✓ All tests ordered' : '+ Order additional test'}
            </button>
          </div>
        </div>

        {/* Display pane */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {selectedFlag ? (
            <SidecarDisplay
              key={selectedFlag.id}
              flag={selectedFlag}
              caseId={caseId}
              aiSuggestions={aiSuggestions}
              onResultLoaded={handleResultLoaded}
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#4e607a', fontSize: 13,
            }}>
              Select an assay from the list
            </div>
          )}
        </div>
      </div>

      {/* ── Order Additional Test modal — Flag Manager style ── */}
      {showOrderModal && (
        <div className="fm-overlay" style={{ zIndex: 10100 }} onClick={() => setShowOrderModal(false)} onKeyDown={e => e.key === 'Escape' && setShowOrderModal(false)}>
          <div className="ps-research-modal fm-modal comp-order-modal" ref={orderModalRef} role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(30,41,59,0.9)', flexShrink: 0 }}>
              <div className="fm-eyebrow">Computational Data</div>
              <div className="fm-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="fm-title" id="order-modal-title">Order Additional Test</span>
                  <span className="fm-active-badge">{orderableFlags.length} available</span>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  aria-label="Close order modal"
                  className="comp-modal-close-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Body: left specimen selector + right test list — drag flag cards onto targets */}
            <DndContext
              sensors={sensors}
              onDragStart={(e: DragStartEvent) => {
                const flagId = String(e.active.id).replace('flag-', '');
                setActiveDragFlag(orderableFlags.find(f => f.id === flagId) ?? null);
              }}
              onDragOver={(e: DragOverEvent) => setOverDropId(e.over ? String(e.over.id) : null)}
              onDragEnd={(e: DragEndEvent) => {
                const flagId = String(e.active.id).replace('flag-', '');
                const flag   = orderableFlags.find(f => f.id === flagId);
                const overId = e.over ? String(e.over.id) : null;
                if (flag && overId) {
                  const specimenId = overId === 'drop-all' ? null : overId.replace('drop-sp-', '');
                  togglePendingOrder(flag, specimenId);
                }
                setActiveDragFlag(null);
                setOverDropId(null);
              }}
            >
            <div className="fm-body">

            {/* Left — pending orders + apply-to with current flags shown per specimen */}
            <div className="fm-left comp-order-left">

              {/* Pending orders */}
              <div className="fm-col-label">
                Pending orders
                {pendingOrders.length > 0 && (
                  <span className="comp-group-count">{pendingOrders.length}</span>
                )}
              </div>
              {pendingOrders.length === 0 ? (
                <div className="fm-no-flags-note">No orders staged yet</div>
              ) : (
                pendingOrders.map(({ flag, specimenId: sid }) => (
                  <div key={flag.id} className="fm-flag-chip">
                    <span className="fm-flag-chip-name">
                      <strong>{flag.lisCode}</strong> — {flag.name}
                      {sid && <span className="comp-order-spec-sub">{specimenLabel(sid)}</span>}
                    </span>
                    <button
                      className="fm-chip-remove-btn"
                      aria-label={`Remove ${flag.name} from pending orders`}
                      onClick={() => setPendingOrders(prev => prev.filter(o => o.flag.id !== flag.id))}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 4h10M6 4V3h4v1M7 7v5M9 7v5M4 4l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}

              <div className="fm-divider" />

              {/* Apply to — with currently ordered flags shown under each target */}
              <div className="fm-col-label">Apply to</div>

              {/* All Specimens (case-level) */}
              {(() => {
                const caseLevelFlags = caseFlags.filter(f => !(f as any).specimenId);
                const isSelected = selectedTarget === null;
                const isOver = overDropId === 'drop-all';
                return (
                  <SpecimenDropZone dropId="drop-all" isOver={isOver}>
                    <div>
                    <div
                      role="button" tabIndex={0}
                      onClick={() => setSelectedTarget(null)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedTarget(null)}
                      className={`comp-order-target-row${isSelected ? ' selected' : ''}${isOver ? ' dropping' : ''}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="comp-order-target-icon">
                        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      <span className="comp-order-target-label">All Specimens</span>
                      {caseLevelFlags.length > 0 && <span className="comp-group-count">{caseLevelFlags.length}</span>}
                      {isOver && activeDragFlag && (
                        <span className="comp-order-drop-hint">Drop to order</span>
                      )}
                    </div>
                    {caseLevelFlags.map(f => {
                      const dotColor = results[f.id]?.status === 'FINAL' ? '#059669' : results[f.id]?.status === 'PRELIMINARY' ? '#f59e0b' : '#0891b2';
                      return (
                        <div key={f.id} className="comp-order-flag-preview">
                          <span className="comp-status-dot" style={{ background: dotColor }} />
                          <span className="comp-order-flag-code">{f.lisCode}</span>
                          <span className="comp-order-flag-name">{f.name}</span>
                          <button
                            className="comp-trash-btn"
                            aria-label={`Cancel ${f.name} order`}
                            onClick={e => { e.stopPropagation(); setCancelTarget(f); }}
                           
                          >
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 4h10M6 4V3h4v1M7 7v5M9 7v5M4 4l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  </SpecimenDropZone>
                );
              })()}

              {/* Per-specimen */}
              {caseSpecimens.map(sp => {
                const spFlags    = caseFlags.filter(f => (f as any).specimenId === sp.id);
                const isSelected = selectedTarget === sp.id;
                const isOver     = overDropId === `drop-sp-${sp.id}`;
                return (
                  <SpecimenDropZone key={sp.id} dropId={`drop-sp-${sp.id}`} isOver={isOver}>
                    <div>
                    <div
                      role="button" tabIndex={0}
                      onClick={() => setSelectedTarget(sp.id)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedTarget(sp.id)}
                      className={`comp-order-target-row comp-order-target-row--specimen${isSelected ? ' selected' : ''}${isOver ? ' dropping' : ''}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="comp-order-target-icon">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
                        <circle cx="8" cy="8" r="2" fill={isSelected || isOver ? '#38bdf8' : 'transparent'} stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      <div className="comp-order-spec-content">
                        <div style={{ fontSize: 12, fontWeight: 600, color: isOver ? '#38bdf8' : isSelected ? '#e2e8f0' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span>{sp.label}:</span>
                          <span style={{ color: isOver ? '#38bdf8' : isSelected ? '#cbd5e1' : '#64748b', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sp.description}</span>
                          {spFlags.length > 0 && <span className="comp-group-count">{spFlags.length}</span>}
                          {isOver && activeDragFlag && (
                            <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700, flexShrink: 0 }}>Drop to order</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {spFlags.map(f => {
                      const dotColor = results[f.id]?.status === 'FINAL' ? '#059669' : results[f.id]?.status === 'PRELIMINARY' ? '#f59e0b' : '#0891b2';
                      return (
                        <div key={f.id} className="comp-order-flag-preview">
                          <span className="comp-status-dot" style={{ background: dotColor }} />
                          <span className="comp-order-flag-code">{f.lisCode}</span>
                          <span className="comp-order-flag-name">{f.name}</span>
                          <button
                            className="comp-trash-btn"
                            aria-label={`Cancel ${f.name} order`}
                            onClick={e => { e.stopPropagation(); setCancelTarget(f); }}
                           
                          >
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 4h10M6 4V3h4v1M7 7v5M9 7v5M4 4l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  </SpecimenDropZone>
                );
              })}
            </div>

            {/* Right — test catalog */}
            <div className="fm-right">

            {/* Search */}
            <div className="fm-search-bar">
              <svg className="fm-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                className="fm-search-input"
                placeholder="Search tests by name or code..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                autoFocus
              />
              {orderSearch && (
                <button className="fm-search-clear" onClick={() => setOrderSearch('')}>✕</button>
              )}
            </div>

            {/* Column header */}
            <div className="comp-order-grid-header">
              <span className="fm-col-label">Code</span>
              <span className="fm-col-label">Test <span className="fm-col-label-note">· suggested protocol</span></span>
            </div>

            {/* Test list */}
            <div className="fm-flag-list">
              {orderableFlags
                .filter(f => !orderSearch ||
                  f.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                  (f.lisCode ?? '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                  (f.description ?? '').toLowerCase().includes(orderSearch.toLowerCase())
                )
                .map(flag => {
                  const isPending = !!pendingOrders.find(o => o.flag.id === flag.id);
                  const isDragging = activeDragFlag?.id === flag.id;
                  const protocolLabel = flag.defaultProtocolIds?.length
                    ? `Suggests: ${flag.defaultProtocolIds.map(id => availableProtocols[id] ?? id).join(', ')}`
                    : flag.description ?? 'No linked protocol';
                  return (
                    <DraggableFlagCard
                      key={flag.id}
                      flag={flag}
                      isPending={isPending}
                      isDragging={isDragging}
                      protocolLabel={protocolLabel}
                      onToggle={() => togglePendingOrder(flag, selectedTarget)}
                    />
                  );
                })
              }
              {orderableFlags.filter(f => !orderSearch ||
                f.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                (f.lisCode ?? '').toLowerCase().includes(orderSearch.toLowerCase())
).length === 0 && (
                <div className="comp-order-empty">
                  No tests match your search.
                </div>
              )}
            </div>

            </div>{/* end fm-right */}
            </div>{/* end fm-body */}

            {/* Drag overlay — ghost chip floating under cursor */}
            <DragOverlay>
              {activeDragFlag && (
                <div style={{
                  padding: '8px 14px', background: '#1e293b',
                  border: '2px solid #38bdf8', borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                  cursor: 'grabbing', opacity: 0.95, pointerEvents: 'none',
                }}>
                  <span className="fm-code-chip">{activeDragFlag.lisCode}</span>
                  <span>{activeDragFlag.name}</span>
                </div>
              )}
            </DragOverlay>
            </DndContext>

            {/* Footer */}
            <div className="comp-order-footer">
              <button className="ps-btn-ghost-dark" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button
                onClick={handlePlaceOrders}
                disabled={pendingOrders.length === 0 || placing}
                style={{
                  padding: '9px 22px', fontSize: 13, fontWeight: 700,
                  background: pendingOrders.length > 0 ? '#0891B2' : 'rgba(8,145,178,0.2)',
                  border: 'none', borderRadius: 8, color: '#fff',
                  cursor: pendingOrders.length > 0 ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  opacity: placing ? 0.7 : 1,
                }}
              >
                {placing ? 'Placing…' : pendingOrders.length > 0 ? `Place ${pendingOrders.length} Order${pendingOrders.length !== 1 ? 's' : ''}` : 'Place Order(s)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel order confirmation modal ── */}
      {cancelTarget && (
        <div className="fm-overlay" style={{ zIndex: 10200 }} onClick={() => !cancelling && setCancelTarget(null)} onKeyDown={e => e.key === 'Escape' && !cancelling && setCancelTarget(null)}>
          <div className="ps-modal-dark" ref={cancelModalRef} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title" onClick={e => e.stopPropagation()} style={{ width: 'min(480px, 90vw)' }}>

            <div className="ps-modal-dark-header">
              <svg width="36" height="34" viewBox="0 0 40 36" fill="none">
                <polygon points="20,2 38,34 2,34" fill="#f59e0b" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round"/>
                <text x="20" y="29" textAnchor="middle" fontSize="17" fontWeight="900" fill="#1c1007" fontFamily="Arial, sans-serif">!</text>
              </svg>
              <span className="ps-modal-dark-title" id="cancel-modal-title">Cancel Order</span>
            </div>

            <div className="fm-flag-card" style={{ cursor: 'default', marginBottom: 4 }}>
              <span className="fm-code-chip">{cancelTarget.lisCode}</span>
              <div className="fm-flag-info">
                <span className="fm-flag-name">{cancelTarget.name}</span>
                <span className="fm-flag-desc">{cancelTarget.description}</span>
              </div>
            </div>

            {/* Messaging differs by order origin */}
            {(cancelTarget as any).orderedVia === 'lis' ? (
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#fbbf24' }}>This order originated in the LIS.</strong><br/>
                PathScribe will notify the laboratory, but you must also cancel this order in your LIS system to prevent the test from being processed.
              </div>
            ) : (
              <p className="ps-modal-dark-body">
                PathScribe will notify the laboratory to cancel this order. The test will be removed from the Computational panel.
              </p>
            )}

            <div className="ps-modal-dark-footer">
              <button className="ps-btn-ghost-dark" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Keep Order
              </button>
              <button
                className="ps-btn-amber"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export default ComputationalPanel;

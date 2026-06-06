// src/pages/FullReportPage.tsx

import React, { useState, useEffect } from "react";
import '../pathscribe.css';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getMockReport, FullReport, MinimalReport } from "../mock/mockReports";
import { useAuth } from "../contexts/AuthContext";
import { internalNoteService } from "../services";
import { PoolClaimModal } from "../components/Worklist/PoolClaimModal";
import InternalNotesDrawer from "../components/InternalNotes/InternalNotesDrawer";
import { VoiceCommandOverlay } from "../components/Voice/VoiceCommandOverlay";
import { VoiceMissPrompt }     from "../components/Voice/VoiceMissPrompt";
import { mockActionRegistryService } from "../services/actionRegistry/mockActionRegistryService";
import { VOICE_CONTEXT } from "../constants/systemActions";

// ─── Shared style tokens ──────────────────────────────────────────────────────

const S = {
  page: {
    position: "relative" as const,
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,
  bg: {
    position: "fixed" as const,
    inset: 0,
    backgroundImage: "url(/main_background.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "brightness(0.25) contrast(1.1)",
    zIndex: 0,
  } as React.CSSProperties,
  bgGrad: {
    position: "fixed" as const,
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, #000 100%)",
    zIndex: 1,
  } as React.CSSProperties,
  content: {
    position: "relative" as const,
    zIndex: 10,
    width: "100%",
    padding: "clamp(16px,3vw,24px) clamp(16px,4vw,40px) 60px",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "16px 20px",
    marginBottom: "0",
    backdropFilter: "blur(12px)",
  } as React.CSSProperties,
  sectionHeading: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "10px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  } as React.CSSProperties,
  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: "4px",
  } as React.CSSProperties,
  value: {
    fontSize: "14px",
    color: "#e2e8f0",
    lineHeight: 1.6,
  } as React.CSSProperties,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullReportPage() {
  const { accession } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [internalNotesOpen, setInternalNotesOpen] = useState(false);

  const fromFilter = (location.state as any)?.fromFilter as string | undefined;

  const handleBack = () => {
    if (fromFilter) {
      navigate('/worklist', { state: { restoreFilter: fromFilter } });
    } else {
      navigate(-1);
    }
  };

  const cleanedAccession = accession?.trim() || "";
  const report = cleanedAccession ? getMockReport(cleanedAccession) : null;
  const isPool = cleanedAccession.endsWith('-POOL');
  const [unreadNoteCount, setUnreadNoteCount] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    if (!cleanedAccession) return;
    internalNoteService.getForCase(cleanedAccession, user?.id ?? 'u1').then(result => {
      if (result.ok) {
        const count = result.data.filter(n => n.authorId !== (user?.id ?? 'u1') && n.visibility === 'shared').length;
        setUnreadNoteCount(count);
      }
    }).catch(() => {});
  }, [cleanedAccession, user?.id]);

  // ── Voice: set CASE_VIEW context — this page is outside AppShell so
  //    it needs its own context setting and voice overlay components.
  useEffect(() => {
    mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.CASE_VIEW);
    return () => mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
  }, []);

  // ── Voice: case navigation and go back/forward ─────────────────────────────
  useEffect(() => {
    const goBack    = () => navigate(-1);
    const goForward = () => navigate(1);
    const nextCase  = () => navigate(1);   // navigate forward in history
    const prevCase  = () => navigate(-1);  // navigate back in history

    window.addEventListener('PATHSCRIBE_GO_BACK',            goBack);
    window.addEventListener('PATHSCRIBE_GO_FORWARD',         goForward);
    window.addEventListener('PATHSCRIBE_NAV_NEXT_CASE',      nextCase);
    window.addEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE',  prevCase);

    return () => {
      window.removeEventListener('PATHSCRIBE_GO_BACK',            goBack);
      window.removeEventListener('PATHSCRIBE_GO_FORWARD',         goForward);
      window.removeEventListener('PATHSCRIBE_NAV_NEXT_CASE',      nextCase);
      window.removeEventListener('PATHSCRIBE_NAV_PREVIOUS_CASE',  prevCase);
    };
  }, [navigate]);

  if (!report) {
    return (
      <div style={S.page}>
        <div style={S.bg} />
        <div style={S.bgGrad} />
        <div style={{ ...S.content, textAlign: "center", paddingTop: "120px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>
            Report Not Found
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>
            Accession <code style={{ color: "#0891B2" }}>{cleanedAccession || "—"}</code> could not be found.
          </p>
          <button
            onClick={handleBack}
            style={{ padding: "10px 24px", background: "#0891B2", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            ← Go Back
          </button>
        </div>
        <VoiceCommandOverlay showSuccess={import.meta.env.DEV} />
        <VoiceMissPrompt />
      </div>
    );
  }

  const isFull = (report as FullReport).synoptic !== undefined;

  return (
    <div style={S.page}>
      <div style={S.bg} />
      <div style={S.bgGrad} />
      <div style={S.content}>

        {/* Back + actions */}
        <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleBack}
            style={{ padding: "8px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            ← Back
          </button>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Claim button — only visible for pool cases */}
            {isPool && (
              <button
                onClick={() => setClaimOpen(true)}
                style={{ padding: "8px 20px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.5)", borderRadius: "8px", color: "#818cf8", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.32)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.2)"}
              >
                ✋ Claim This Case
              </button>
            )}

            <button
              onClick={() => setInternalNotesOpen(true)}
              style={{ padding: "8px 18px", background: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.3)", borderRadius: "8px", color: "#0891B2", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(8,145,178,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(8,145,178,0.12)"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Internal Notes
              {unreadNoteCount > 0 && (
                <span style={{ background: '#F59E0B', color: '#000', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {unreadNoteCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {internalNotesOpen && (
          <InternalNotesDrawer
            accession={cleanedAccession}
            userId={user?.id ?? 'u1'}
            userName={user?.name ?? 'Unknown'}
            onClose={() => setInternalNotesOpen(false)}
          />
        )}

        {/* Header card */}
        <div style={{ ...S.card, borderColor: "rgba(8,145,178,0.3)", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                Pathology Report
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.02em" }} data-phi="accession">
                {report.accession}
              </h1>
              {isFull && (
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                  {(report as FullReport).diagnosis}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={S.label}>Last Updated</div>
              <div style={{ fontSize: "13px", color: "#e2e8f0", fontFamily: "monospace" }}>
                {report.lastUpdated}
              </div>
            </div>
          </div>
        </div>

        {isFull
          ? <FullReportView report={report as FullReport} />
          : <MinimalReportView report={report as MinimalReport} />
        }
      </div>

      {/* Voice overlays — this page is outside AppShell so mounts them directly */}
      <VoiceCommandOverlay showSuccess={import.meta.env.DEV} />
      <VoiceMissPrompt />

      {/* Pool claim modal — shown when pathologist clicks Claim This Case */}
      <PoolClaimModal
        isOpen={claimOpen}
        caseId={cleanedAccession}
        caseSummary={report ? `${(report as FullReport).patientName} — ${(report as FullReport).specimens?.[0]?.type ?? ''}` : cleanedAccession}
        poolName="MFT Pool"
        currentUserId={user?.id ?? 'u1'}
        currentUserName={user?.name ?? 'Unknown'}
        continueToReport={true}
        fromFilter={fromFilter ?? 'pool'}
        onAccepted={() => setClaimOpen(false)}
        onPassed={() => { setClaimOpen(false); navigate('/worklist', { state: { restoreFilter: fromFilter ?? 'pool' } }); }}
        onClose={() => setClaimOpen(false)}
      />
    </div>
  );
}

// ─── Full Report View ─────────────────────────────────────────────────────────

function FullReportView({ report }: { report: FullReport }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "start" }}>

      {/* ── LEFT COLUMN: Specimens + Synoptic ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        <div style={S.card}>
          <div style={S.sectionHeading}>Specimens</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {report.specimens.map(s => (
              <div key={s.id} style={{ display: "flex", gap: "14px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#0891B220", color: "#0891B2", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.id}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", marginBottom: "2px" }}>{s.type}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.sectionHeading}>Synoptic Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Tumor Type",              value: report.synoptic.tumorType },
              { label: "Grade",                   value: report.synoptic.grade },
              { label: "Size",                    value: report.synoptic.size },
              { label: "Margins",                 value: report.synoptic.margins },
              { label: "Lymphovascular Invasion", value: report.synoptic.lymphovascularInvasion },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={S.label}>{label}</div>
                <div style={S.value}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.label, marginBottom: "12px" }}>Biomarkers</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {[
              { label: "ER",    value: report.synoptic.biomarkers.er   },
              { label: "PR",    value: report.synoptic.biomarkers.pr   },
              { label: "HER2",  value: report.synoptic.biomarkers.her2 },
              { label: "Ki-67", value: report.synoptic.biomarkers.ki67 },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 14px", background: "rgba(8,145,178,0.08)", borderRadius: "8px", border: "1px solid rgba(8,145,178,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#0891B2", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── RIGHT COLUMN: Diagnosis + Text sections ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        <div style={S.card}>
          <div style={S.sectionHeading}>Diagnosis</div>
          <p style={{ ...S.value, fontSize: "15px", fontWeight: 500, color: "#f1f5f9" }} data-phi="diagnosis">
            {report.diagnosis}
          </p>
        </div>

        <div style={S.card}>
          <div style={S.sectionHeading}>Gross Description</div>
          <p style={{ ...S.value, lineHeight: 1.8 }}>{report.grossDescription}</p>
        </div>

        <div style={S.card}>
          <div style={S.sectionHeading}>Microscopic Description</div>
          <p style={{ ...S.value, lineHeight: 1.8 }}>{report.microscopicDescription}</p>
        </div>

        <div style={S.card}>
          <div style={S.sectionHeading}>Ancillary Studies</div>
          <p style={{ ...S.value, lineHeight: 1.8 }}>{report.ancillaryStudies}</p>
        </div>

      </div>
    </div>
  );
}

// ─── Minimal Report View ──────────────────────────────────────────────────────

function MinimalReportView({ report }: { report: MinimalReport }) {
  return (
    <>
      <div style={S.card}>
        <div style={S.sectionHeading}>Diagnosis</div>
        <p style={{ ...S.value, fontSize: "15px", fontWeight: 500, color: "#f1f5f9" }} data-phi="diagnosis">
          {report.diagnosis}
        </p>
      </div>

      {report.specimenType && (
        <div style={S.card}>
          <div style={S.sectionHeading}>Specimen Type</div>
          <p style={S.value}>{report.specimenType}</p>
        </div>
      )}

      <div style={{ ...S.card, borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "4px" }}>Limited Data</div>
            <p style={{ ...S.value, color: "#94a3b8", margin: 0 }}>
              This report contains limited data. Additional LIS details may not be available.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

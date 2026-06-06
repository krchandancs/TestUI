import React, { useState } from 'react';
import '../../../pathscribe.css';
import type { CaseData, SpecimenSynoptic, SynopticReportNode, SynopticField, CaseRole } from './synopticTypes';
import { ROLE_META } from './synopticTypes';

const SPEC_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ReportPreviewModal: React.FC<{
  caseData: CaseData;
  onClose: () => void;
}> = ({ caseData, onClose }) => {
  const printRef  = React.useRef<HTMLDivElement>(null);
  const [activeAnchor, setActiveAnchor] = useState<string>('diagnosis');

  const now        = new Date();
  const reportDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const allFinalized = caseData.synoptics.every((s: any) => s.reports.every((r: any) => r.status === 'finalized'));

  // ── Scroll-spy: update active anchor on scroll ─────────────────────────────
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = el.querySelectorAll('[data-anchor]');
      let current = 'diagnosis';
      sections.forEach(sec => {
        const top = (sec as HTMLElement).offsetTop - el.scrollTop - 80;
        if (top <= 0) current = (sec as HTMLElement).dataset.anchor ?? current;
      });
      setActiveAnchor(current);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (anchor: string) => {
    const el = scrollRef.current?.querySelector(`[data-anchor="${anchor}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Derive diagnosis summary line per specimen ─────────────────────────────
  // Uses the first non-empty tumor field value as the primary diagnosis text.
  const getDiagnosisSummary = (specimen: SpecimenSynoptic): string => {
    for (const report of specimen.reports) {
      const primary = report.tumorFields.find((f: any) => f.type !== 'comment' && f.value.trim());
      if (primary) return primary.value;
    }
    return '— pending —';
  };

  // ── Render a single field row ──────────────────────────────────────────────
  const renderFieldRow = (f: SynopticField) => {
    if (f.type === 'comment') return null;
    if (!f.value.trim() && !f.required) return null;
    const empty = !f.value.trim();
    return (
      <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
        <td style={{ padding: '5px 14px 5px 0', fontSize: '12px', color: '#475569', fontWeight: 500, width: '44%', verticalAlign: 'top', lineHeight: 1.4 }}>
          {f.label}{f.required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
        </td>
        <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: empty ? 400 : 600, color: empty ? '#94a3b8' : '#0f172a', verticalAlign: 'top', lineHeight: 1.4 }}>
          {empty ? <em style={{ fontStyle: 'italic', color: '#d97706' }}>not recorded</em> : f.value}
        </td>
      </tr>
    );
  };

  // ── Render a synoptic node (recursive, preserves tree) ────────────────────
  const renderNode = (node: SynopticReportNode, depth = 0): React.ReactNode => {
    const tumorRows     = node.tumorFields.filter((f: any)     => f.type !== 'comment' && (f.value || f.required));
    const marginRows    = node.marginFields.filter((f: any)    => f.type !== 'comment' && (f.value || f.required));
    const biomarkerRows = node.biomarkerFields.filter((f: any) => f.type !== 'comment' && (f.value || f.required));
    const hasAnyField   = tumorRows.length + marginRows.length + biomarkerRows.length > 0;

    // Visual weight scales with depth: depth-0 is a major section, depth-1+ is a subsection
    const headerColor  = depth === 0 ? '#0f172a' : '#475569';
    const headerBorder = depth === 0 ? '2px solid #0891B2' : '1px solid #e2e8f0';
    const headerBg     = depth === 0 ? '#f0f9ff'           : '#fafafa';
    const leftPad      = depth * 20;

    return (
      <div key={node.instanceId} style={{ marginLeft: leftPad, marginBottom: depth === 0 ? '20px' : '14px' }}>
        {/* Node header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: headerBg, border: headerBorder, borderRadius: depth === 0 ? '6px 6px 0 0' : '4px 4px 0 0', fontFamily: 'Inter, sans-serif' }}>
          <span style={{ fontSize: depth === 0 ? '12px' : '11px', fontWeight: 700, color: headerColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {depth > 0 && <span style={{ color: '#94a3b8', marginRight: '6px' }}>↳</span>}
            {node.title}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', fontFamily: 'Inter, sans-serif',
            background: node.status === 'finalized' ? '#d1fae5' : '#fef3c7',
            color:      node.status === 'finalized' ? '#065f46' : '#92400e',
          }}>
            {node.status === 'finalized' ? '✓ FINALIZED' : 'DRAFT'}
          </span>
        </div>

        {/* Fields table */}
        {hasAnyField && (
          <div style={{ border: headerBorder, borderTop: 'none', borderRadius: depth === 0 ? '0 0 6px 6px' : '0 0 4px 4px', padding: '10px 12px', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {tumorRows.length > 0 && (
                  <>
                    {(marginRows.length > 0 || biomarkerRows.length > 0) && (
                      <tr><td colSpan={2} style={{ padding: '2px 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>Tumor</td></tr>
                    )}
                    {tumorRows.map(renderFieldRow)}
                  </>
                )}
                {marginRows.length > 0 && (
                  <>
                    <tr><td colSpan={2} style={{ padding: '10px 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>Margins</td></tr>
                    {marginRows.map(renderFieldRow)}
                  </>
                )}
                {biomarkerRows.length > 0 && (
                  <>
                    <tr><td colSpan={2} style={{ padding: '10px 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>Immunohistochemistry / Biomarkers</td></tr>
                    {biomarkerRows.map(renderFieldRow)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Specimen comment */}
        {node.specimenComment && node.specimenComment !== '<p></p>' && (
          <div style={{ marginTop: '6px', marginLeft: 0, padding: '8px 12px', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Synoptic Comment</div>
            <div dangerouslySetInnerHTML={{ __html: node.specimenComment }} />
          </div>
        )}

        {/* Children — indented, in order */}
        {node.children.map((child: any) => renderNode(child, depth + 1))}
      </div>
    );
  };

  // ── Render diagnostic codes for a specimen ────────────────────────────────
  const renderCodes = (specimen: SpecimenSynoptic) => {
    const codes  = specimen.reports.flatMap((r: any) => r.codes);
    if (!codes.length) return null;
    const snomed = codes.filter((c: any) => c.system === 'SNOMED');
    const icd    = codes.filter((c: any) => c.system === 'ICD');
    return (
      <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Diagnostic Codes</div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {snomed.length > 0 && (
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>SNOMED CT</div>
              {snomed.map((c: any) => (
                <div key={c.id} style={{ fontSize: '11px', color: '#1e293b', marginBottom: '3px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e', flexShrink: 0 }}>{c.code}</span>
                  <span>{c.display}</span>
                </div>
              ))}
            </div>
          )}
          {icd.length > 0 && (
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>ICD-10</div>
              {icd.map((c: any) => (
                <div key={c.id} style={{ fontSize: '11px', color: '#1e293b', marginBottom: '3px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', flexShrink: 0 }}>{c.code}</span>
                  <span>{c.display}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const multiSpecimen = caseData.synoptics.length > 1;

  return (
    <div className="ps-rp-overlay">

      {/* ── Top toolbar ── */}
      <div className="ps-rp-toolbar">
        <div className="ps-rp-toolbar-left">
          {/* Title */}
          <div>
            <div className="ps-rp-title">Report Preview</div>
            <div className="ps-rp-subtitle">{caseData.accession} · {caseData.patient}</div>
          </div>
          {/* Status badge */}
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
            background: allFinalized ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
            color:      allFinalized ? '#4ade80'              : '#fbbf24',
            border:     `1px solid ${allFinalized ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            {allFinalized ? '✓ Finalized' : '⚠ Contains drafts'}
          </span>
        </div>
        <div className="ps-rp-toolbar-right">
          <button onClick={() => window.print()} className="ps-rp-btn">🖨 Print</button>
          <button onClick={onClose} className="ps-rp-close-btn">✕</button>
        </div>
      </div>

      {/* ── Body: left nav + document ── */}
      <div className="ps-rp-body">

        {/* Left navigation rail — shown for multi-specimen cases */}
        {multiSpecimen && (
          <div className="ps-rp-nav">
            <div className="ps-rp-nav-label">Contents</div>

            {/* Diagnosis summary link */}
            <button onClick={() => scrollTo('diagnosis')} style={{ width: '100%', textAlign: 'left', padding: '7px 16px', background: activeAnchor === 'diagnosis' ? 'rgba(8,145,178,0.15)' : 'transparent', border: 'none', borderLeft: `2px solid ${activeAnchor === 'diagnosis' ? '#0891B2' : 'transparent'}`, color: activeAnchor === 'diagnosis' ? '#7dd3fc' : '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s' }}
              onMouseEnter={e => { if (activeAnchor !== 'diagnosis') e.currentTarget.style.color = '#94a3b8'; }}
              onMouseLeave={e => { if (activeAnchor !== 'diagnosis') e.currentTarget.style.color = '#64748b'; }}
            >
              Diagnosis Summary
            </button>

            {/* Specimen links */}
            {caseData.synoptics.map((spec: any, si: number) => {
              const letter  = SPEC_LETTERS[si] ?? `${si + 1}`;
              const anchor  = `spec-${si}`;
              const active  = activeAnchor === anchor;
              const allFin  = spec.reports.every((r: any) => r.status === 'finalized');
              return (
                <div key={spec.specimenId}>
                  <button onClick={() => scrollTo(anchor)} style={{ width: '100%', textAlign: 'left', padding: '7px 16px', background: active ? 'rgba(8,145,178,0.15)' : 'transparent', border: 'none', borderLeft: `2px solid ${active ? '#0891B2' : 'transparent'}`, color: active ? '#7dd3fc' : '#e2e8f0', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.1s' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#f1f5f9'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#e2e8f0'; }}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '3px', background: active ? '#0891B2' : '#334155', color: active ? 'white' : '#94a3b8', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{letter}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '11px' }}>{spec.specimenName}</span>
                    {!allFin && <span style={{ fontSize: '8px', color: '#f59e0b', flexShrink: 0 }}>●</span>}
                  </button>
                  {/* Report sub-links */}
                  {spec.reports.map((r: any, ri: number) => {
                    const rAnchor = `report-${si}-${ri}`;
                    const rActive = activeAnchor === rAnchor;
                    return (
                      <button key={r.instanceId} onClick={() => scrollTo(rAnchor)} style={{ width: '100%', textAlign: 'left', padding: '4px 16px 4px 36px', background: 'transparent', border: 'none', borderLeft: `2px solid ${rActive ? '#0891B2' : 'transparent'}`, color: rActive ? '#7dd3fc' : '#475569', fontSize: '10px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.1s' }}
                        onMouseEnter={e => { if (!rActive) e.currentTarget.style.color = '#64748b'; }}
                        onMouseLeave={e => { if (!rActive) e.currentTarget.style.color = '#475569'; }}
                      >
                        {r.title}
                        {r.children.map(() => null) /* just counts */}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Case comment link */}
            {Object.values(caseData.caseComments).some(v => v && v !== '<p></p>') && (
              <button onClick={() => scrollTo('case-comment')} style={{ width: '100%', textAlign: 'left', padding: '7px 16px', background: activeAnchor === 'case-comment' ? 'rgba(8,145,178,0.15)' : 'transparent', border: 'none', borderLeft: `2px solid ${activeAnchor === 'case-comment' ? '#0891B2' : 'transparent'}`, color: activeAnchor === 'case-comment' ? '#7dd3fc' : '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
                onMouseEnter={e => { if (activeAnchor !== 'case-comment') e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={e => { if (activeAnchor !== 'case-comment') e.currentTarget.style.color = '#64748b'; }}
              >
                Case Comment
              </button>
            )}
          </div>
        )}

        {/* Scrollable document */}
        <div ref={scrollRef} className="ps-rp-scroll">
          <div ref={printRef} className="ps-rp-document">

            {/* DRAFT watermark */}
            {!allFinalized && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '100px', fontWeight: 900, color: 'rgba(245,158,11,0.06)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: '10px', zIndex: 0 }}>DRAFT</div>
            )}

            {/* ── Letterhead ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '3px double #0f172a' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>
                  PathScribe<span style={{ color: '#0891B2', fontSize: '0.55em', verticalAlign: 'super' }}>AI</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter, sans-serif', marginTop: '3px' }}>Department of Anatomic Pathology</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>University Medical Center · (555) 000-1234</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{caseData.accession}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Surgical Pathology Report</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{reportDate} · {reportTime}</div>
              </div>
            </div>

            {/* ── Patient demographics ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', marginBottom: '28px', border: '1.5px solid #334155', borderRadius: '4px', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
              {[
                { label: 'Patient',   value: caseData.patient   },
                { label: 'DOB',       value: caseData.dob       },
                { label: 'Gender',    value: caseData.gender    },
                { label: 'MRN',       value: caseData.mrn       },
                { label: 'Accession', value: caseData.accession },
                { label: 'Protocol',  value: caseData.protocol  },
              ].map((row, i) => (
                <div key={row.label} style={{ padding: '8px 12px', background: i < 3 ? '#f8fafc' : 'white', borderBottom: i < 3 ? '1px solid #e2e8f0' : 'none', borderRight: (i % 3) < 2 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>{row.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* ── DIAGNOSIS SUMMARY ── */}
            <div data-anchor="diagnosis" style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
                Diagnosis
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {caseData.synoptics.map((spec: any, si: number) => {
                    const letter  = SPEC_LETTERS[si] ?? `${si + 1}`;
                    const dx      = getDiagnosisSummary(spec);
                    const isDraft = spec.reports.some((r: any) => r.status === 'draft');
                    return (
                      <tr key={spec.specimenId} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                        <td style={{ padding: '5px 12px 5px 0', fontFamily: 'Inter, sans-serif', width: '28px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{letter}.</span>
                        </td>
                        <td style={{ padding: '5px 12px 5px 0', fontSize: '12px', color: '#475569', fontWeight: 500, fontFamily: 'Inter, sans-serif', width: '180px' }}>
                          {spec.specimenName}
                        </td>
                        <td style={{ padding: '5px 0', fontSize: '13px', fontWeight: 600, color: dx === '— pending —' ? '#94a3b8' : '#0f172a', fontStyle: dx === '— pending —' ? 'italic' : 'normal' }}>
                          {dx}
                          {isDraft && <span style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 700, color: '#d97706', fontFamily: 'Inter, sans-serif', verticalAlign: 'middle' }}>DRAFT</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── SPECIMEN SECTIONS ── */}
            {caseData.synoptics.map((specimen: any, si: number) => {
              const letter = SPEC_LETTERS[si] ?? `${si + 1}`;
              return (
                <div key={specimen.specimenId} data-anchor={`spec-${si}`} style={{ marginBottom: '36px' }}>
                  {/* Specimen header bar */}
                  <div style={{ background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '26px', height: '26px', borderRadius: '4px', background: '#0891B2', color: 'white', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{letter}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{specimen.specimenName}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Specimen {specimen.specimenId} of {caseData.synoptics.length}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700,
                      background: specimen.specimenStatus === 'complete' ? '#065f46' : specimen.specimenStatus === 'alert' ? '#b45309' : '#374151',
                      color: 'white',
                    }}>
                      {specimen.specimenStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Synoptic reports — tree preserved, not flattened */}
                  <div style={{ border: '1.5px solid #0f172a', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '20px 18px 14px' }}>
                    {specimen.reports.map((report: any, ri: number) => (
                      <div key={report.instanceId} data-anchor={`report-${si}-${ri}`}>
                        {renderNode(report, 0)}
                      </div>
                    ))}
                    {renderCodes(specimen)}

                    {/* Specimen-level comment */}
                    {specimen.specimenComment && specimen.specimenComment !== '<p></p>' && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Specimen Comment</div>
                        <div dangerouslySetInnerHTML={{ __html: specimen.specimenComment }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── Case comments ── */}
            {Object.entries(caseData.caseComments).some(([, v]) => v && v !== '<p></p>') && (
              <div data-anchor="case-comment" style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #0f172a', paddingBottom: '4px', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
                  Clinical Comments
                </div>
                {Object.entries(caseData.caseComments).map(([role, html]) => {
                  if (!html || html === '<p></p>') return null;
                  const meta = ROLE_META[role as CaseRole];
                  return (
                    <div key={role} style={{ marginBottom: '12px', border: `1.5px solid ${meta.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ padding: '5px 12px', background: meta.bg, borderBottom: `1px solid ${meta.border}` }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>{meta.label}</span>
                      </div>
                      <div style={{ padding: '10px 12px', fontSize: '13px', color: '#1e293b', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Signature block ── */}
            <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'Inter, sans-serif' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '28px' }}>Electronically signed by</div>
                <div style={{ borderTop: '1px solid #0f172a', width: '240px', paddingTop: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Attending Pathologist</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>MD, FRCPC · Anatomic Pathology</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{reportDate}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{reportTime}</div>
                <div style={{ marginTop: '8px', fontSize: '9px', color: '#94a3b8' }}>PathScribe AI · v1.0.0 · {caseData.protocol}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Save toast ───────────────────────────────────────────────────────────────

export { ReportPreviewModal };

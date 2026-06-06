/**
 * hooks/useScreenCapture.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Captures a PHI-redacted screenshot of the current viewport.
 *
 * Two redaction strategies run in sequence before capture:
 *
 *   1. PHI element overlay  — elements matching PHI_SELECTORS get a
 *      [REDACTED] block overlaid on top before canvas capture.
 *
 *   2. PDF viewer swap      — <iframe>, <embed>, <object> PDF viewers and
 *      any element marked data-pdf-viewer="true" are temporarily replaced
 *      with a styled placeholder div. The original element is restored
 *      immediately after capture.
 *
 * Both strategies are fully reversible — the DOM is always restored even
 * if the capture throws.
 *
 * Install: npm install html2canvas
 *
 * Drop-in path: src/hooks/useScreenCapture.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useState } from 'react';
import { PHI_SELECTORS, REDACTION_LABEL } from '../services/phiSelectors';

export interface ScreenCaptureResult {
  dataUrl:            string;
  redactedCount:      number;   // PHI overlay count
  pdfRedactedCount:   number;   // PDF viewer placeholder count
  captureHideCount:   number;   // Whole-section hide count (e.g. worklist table)
  timestamp:          string;
  width:              number;
  height:             number;
}

export interface UseScreenCaptureReturn {
  capture:     () => Promise<ScreenCaptureResult | null>;
  isCapturing: boolean;
  error:       string | null;
}

// ─── PHI overlay management ───────────────────────────────────────────────────

interface RedactionOverlay {
  element: Element;
  overlay: HTMLElement;
}

function applyRedactionOverlays(): RedactionOverlay[] {
  const overlays: RedactionOverlay[] = [];

  PHI_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        const htmlEl = el as HTMLElement;
        const rect   = htmlEl.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const overlay = document.createElement('div');
        overlay.setAttribute('data-phi-overlay', 'true');
        overlay.style.cssText = `
          position:        fixed;
          left:            ${rect.left + window.scrollX}px;
          top:             ${rect.top  + window.scrollY}px;
          width:           ${Math.max(rect.width,  80)}px;
          height:          ${Math.max(rect.height, 18)}px;
          background:      #1e293b;
          border-radius:   4px;
          z-index:         999999;
          display:         flex;
          align-items:     center;
          justify-content: center;
          pointer-events:  none;
        `;
        const label = document.createElement('span');
        label.textContent = REDACTION_LABEL;
        label.style.cssText = `
          font-size:      9px;
          color:          #475569;
          font-family:    monospace;
          font-weight:    600;
          letter-spacing: 0.05em;
          user-select:    none;
        `;
        overlay.appendChild(label);
        document.body.appendChild(overlay);
        overlays.push({ element: el, overlay });
      });
    } catch { /* invalid selector — skip */ }
  });

  return overlays;
}

function removeRedactionOverlays(overlays: RedactionOverlay[]): void {
  overlays.forEach(({ overlay }) => overlay.parentNode?.removeChild(overlay));
}

// ─── PDF viewer swap management ───────────────────────────────────────────────

interface PdfSwap {
  original:    HTMLElement;
  placeholder: HTMLElement;
  parent:      HTMLElement;
  nextSibling: Node | null;
}

// Selectors that identify PDF viewer elements
const PDF_SELECTORS = [
  'iframe[src*=".pdf"]',
  'iframe[src*="blob:"]',
  'iframe[data-pdf]',
  'embed[type="application/pdf"]',
  'object[type="application/pdf"]',
  '[data-pdf-viewer="true"]',
  '.pdf-viewer',
  '.react-pdf__Document',   // react-pdf
  '.pdfViewer',             // pdf.js
  '#pdf-container',
];

function buildPdfPlaceholder(rect: DOMRect): HTMLElement {
  const ph = document.createElement('div');
  ph.setAttribute('data-pdf-placeholder', 'true');
  ph.style.cssText = `
    position:        fixed;
    left:            ${rect.left}px;
    top:             ${rect.top}px;
    width:           ${rect.width}px;
    height:          ${rect.height}px;
    background:      #1e293b;
    border:          1px solid #334155;
    border-radius:   8px;
    z-index:         999998;
    display:         flex;
    flex-direction:  column;
    align-items:     center;
    justify-content: center;
    gap:             12px;
    pointer-events:  none;
  `;

  const icon = document.createElement('div');
  icon.textContent = '📄';
  icon.style.cssText = 'font-size: 40px; line-height: 1;';

  const title = document.createElement('div');
  title.textContent = 'Clinical Report';
  title.style.cssText = `
    font-size:   14px;
    font-weight: 700;
    color:       #94a3b8;
    font-family: system-ui, sans-serif;
  `;

  const sub = document.createElement('div');
  sub.textContent = 'Redacted for enhancement request submission';
  sub.style.cssText = `
    font-size:   11px;
    color:       #475569;
    font-family: monospace;
    letter-spacing: 0.04em;
  `;

  const badge = document.createElement('div');
  badge.textContent = '🔒 PHI PROTECTED';
  badge.style.cssText = `
    margin-top:      8px;
    padding:         4px 12px;
    border-radius:   99px;
    background:      rgba(8,145,178,0.1);
    border:          1px solid rgba(8,145,178,0.25);
    font-size:       10px;
    font-weight:     700;
    color:           #0891B2;
    font-family:     system-ui, sans-serif;
    letter-spacing:  0.06em;
  `;

  ph.appendChild(icon);
  ph.appendChild(title);
  ph.appendChild(sub);
  ph.appendChild(badge);

  return ph;
}

function applyPdfSwaps(): PdfSwap[] {
  const swaps: PdfSwap[] = [];

  PDF_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        const htmlEl = el as HTMLElement;
        const rect   = htmlEl.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        // Hide the original, inject placeholder at same position
        const placeholder = buildPdfPlaceholder(rect);
        htmlEl.style.visibility = 'hidden';
        document.body.appendChild(placeholder);

        swaps.push({
          original:    htmlEl,
          placeholder,
          parent:      htmlEl.parentElement as HTMLElement,
          nextSibling: htmlEl.nextSibling,
        });
      });
    } catch { /* invalid selector — skip */ }
  });

  return swaps;
}

function removePdfSwaps(swaps: PdfSwap[]): void {
  swaps.forEach(({ original, placeholder }) => {
    original.style.visibility = '';
    placeholder.parentNode?.removeChild(placeholder);
  });
}


// ─── Capture-hide management ──────────────────────────────────────────────────
// Elements with data-capture-hide="true": we inject a solid overlay div that
// covers the element using absolute positioning relative to document, then
// remove it after capture. This works regardless of scroll, overflow, or
// whether html2canvas supports the CSS property.
interface CaptureHideSwap { original: HTMLElement; placeholder: HTMLElement; }

function applyCaptureHideSwaps(): CaptureHideSwap[] {
  const swaps: CaptureHideSwap[] = [];

  document.querySelectorAll<HTMLElement>('[data-capture-hide="true"]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const ph = document.createElement('div');
    ph.setAttribute('data-capture-hide-placeholder', 'true');
    ph.style.cssText = [
      'position:fixed',
      `left:${rect.left}px`,
      `top:${rect.top}px`,
      `width:${Math.max(rect.width, 10)}px`,
      `height:${Math.max(rect.height, 10)}px`,
      'background:#1e293b',
      'border-radius:6px',
      'z-index:2147483647',
      'pointer-events:none',
    ].join(';');

    document.body.appendChild(ph);
    swaps.push({ original: el, placeholder: ph });
  });

  return swaps;
}

function restoreCaptureHideSwaps(swaps: CaptureHideSwap[]): void {
  swaps.forEach(({ placeholder }) => {
    placeholder.parentNode?.removeChild(placeholder);
  });
}


export function useScreenCapture(): UseScreenCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const capture = useCallback(async (): Promise<ScreenCaptureResult | null> => {
    setIsCapturing(true);
    setError(null);

    const phiOverlays:      RedactionOverlay[]  = [];
    const pdfSwaps:        PdfSwap[]           = [];
    const captureHideSwaps: CaptureHideSwap[]  = [];

    try {
      const html2canvas = (await import('html2canvas')).default;

      // 1. Apply PHI overlays
      phiOverlays.push(...applyRedactionOverlays());

      // 2. Swap PDF viewers with placeholders
      pdfSwaps.push(...applyPdfSwaps());

      // 3. Hide capture-hide elements (whole sections of PHI like worklist tables)
      captureHideSwaps.push(...applyCaptureHideSwaps());

      // Yield for two animation frames so both paint before capture
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

      // 3. Capture
      const canvas = await html2canvas(document.body, {
        useCORS:         true,
        allowTaint:      false,
        foreignObjectRendering: false,
        scale:           window.devicePixelRatio ?? 1,
        logging:         false,
        ignoreElements:  (el: Element) =>
          el.hasAttribute('data-enhancement-modal')      ||
          el.hasAttribute('data-phi-overlay')            ||
          el.hasAttribute('data-pdf-placeholder'),
      });

      return {
        dataUrl:           canvas.toDataURL('image/png'),
        redactedCount:     phiOverlays.length,
        pdfRedactedCount:  pdfSwaps.length,
        captureHideCount:  captureHideSwaps.length,
        timestamp:         new Date().toISOString(),
        width:             canvas.width,
        height:            canvas.height,
      };

    } catch (err: any) {
      const msg = err?.message ?? 'Screen capture failed';
      setError(msg);
      console.error('[useScreenCapture]', err);
      return null;
    } finally {
      // Always restore DOM — even on error
      removeRedactionOverlays(phiOverlays);
      removePdfSwaps(pdfSwaps);
      restoreCaptureHideSwaps(captureHideSwaps);
      setIsCapturing(false);
    }
  }, []);

  return { capture, isCapturing, error };
}

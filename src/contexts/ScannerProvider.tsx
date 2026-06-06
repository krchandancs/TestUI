/**
 * ScannerProvider.tsx
 * src/contexts/ScannerProvider.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global barcode / QR scanner listener.
 *
 * HID scanners behave like a keyboard — they fire a rapid burst of characters
 * followed by an Enter keystroke. This provider distinguishes scanner input
 * from normal typing by measuring inter-keystroke timing:
 *
 *   Human typing:  >100ms between keystrokes
 *   Scanner input: <50ms between keystrokes (typically 5–20ms)
 *
 * On a complete scan (Enter received after fast-burst input):
 *   1. Validates the buffer against the accession regex from SystemConfig
 *   2. If accession match → navigate to /case/{accession}/synoptic
 *   3. If MRN match → navigate to worklist filtered by MRN (future)
 *   4. Fires a SCANNER_EVENT custom event so components can react (e.g. flash)
 *
 * No focus required — the listener is global and works anywhere in the app.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemConfig } from './SystemConfigContext';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanType = 'accession' | 'mrn' | 'unknown';

interface ScanEvent {
  raw:      string;
  type:     ScanType;
  matchedAccession?: string;
}

interface ScannerContextValue {
  lastScan: ScanEvent | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ScannerContext = createContext<ScannerContextValue>({ lastScan: null });
export const useScanner = () => useContext(ScannerContext);

// ─── Constants ────────────────────────────────────────────────────────────────

// Max ms between keystrokes to be considered a scanner burst
const SCAN_SPEED_THRESHOLD_MS = 50;
// Minimum characters for a valid scan (avoids misfires on short strings)
const MIN_SCAN_LENGTH = 5;

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate      = useNavigate();
  const { config }    = useSystemConfig();
  const { user }      = useAuth();
  const bufferRef     = useRef<string>('');
  const lastKeyTime   = useRef<number>(0);
  const lastScanRef   = useRef<ScanEvent | null>(null);
  const [lastScan, setLastScan] = React.useState<ScanEvent | null>(null);

  const getPatterns = useCallback(() => {
    const fmt = config?.identifierFormats;
    return {
      accession: fmt?.accessionPattern ? new RegExp(fmt.accessionPattern) : /^[A-Z]{1,4}\d{2}-\d{3,6}/i,
      mrn:       fmt?.mrnPattern       ? new RegExp(fmt.mrnPattern)       : /^\d{5,10}$/,
    };
  }, [config?.identifierFormats]);

  const handleScan = useCallback((raw: string) => {
    const cleaned = raw.trim();
    if (cleaned.length < MIN_SCAN_LENGTH) return;

    const { accession, mrn } = getPatterns();

    let type: ScanType = 'unknown';
    let matchedAccession: string | undefined;

    if (accession.test(cleaned)) {
      type = 'accession';
      matchedAccession = cleaned;
    } else if (mrn.test(cleaned)) {
      type = 'mrn';
    }

    const scanEvent: ScanEvent = { raw: cleaned, type, matchedAccession };
    lastScanRef.current = scanEvent;
    setLastScan(scanEvent);

    // Fire custom event so components can react (e.g. flash the search bar)
    window.dispatchEvent(new CustomEvent('PATHSCRIBE_SCAN', { detail: scanEvent }));

    // Navigate based on scan type
    if (type === 'accession' && matchedAccession) {
      navigate(`/case/${matchedAccession}/synoptic`);
    }
    // MRN: could navigate to worklist filtered by MRN — placeholder for now
    // if (type === 'mrn') navigate(`/worklist?mrn=${cleaned}`);

  }, [getPatterns, navigate]);

  useEffect(() => {
    // Only activate when user is authenticated
    if (!user) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Guard against synthetic/extension key events (Bitwarden, autofill etc.)
      if (!e || !e.key) return;

      // Don't intercept on the login page
     if (window.location.pathname === '/' && !user) return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // If Enter received — check if we have a buffered scan
      if (e.key === 'Enter') {
        const buffer = bufferRef.current;
        bufferRef.current = '';

        // Never consume Enter if a form element has focus — let it propagate
        const active = document.activeElement;
        const inputFocused =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          active instanceof HTMLButtonElement ||
          (active instanceof HTMLElement && active.isContentEditable);

        if (!inputFocused && buffer.length >= MIN_SCAN_LENGTH && timeSinceLastKey < SCAN_SPEED_THRESHOLD_MS * 3) {
          e.preventDefault();
          e.stopPropagation();
          handleScan(buffer);
        }
        return;
      }

      // Ignore modifier keys, function keys, etc.
      if (!e.key || e.key.length !== 1) return;

      // If typing is slow (human), clear the buffer
      if (timeSinceLastKey > SCAN_SPEED_THRESHOLD_MS * 4 && bufferRef.current.length > 0) {
        // Don't clear immediately — scanner might have a slow start
        // Only clear if we've been idle for a while (>500ms)
        if (timeSinceLastKey > 500) {
          bufferRef.current = '';
        }
      }

      // Ignore if an input, textarea or contenteditable has focus
      // (let the focused element handle normal typing)
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      if (isInputFocused && timeSinceLastKey > SCAN_SPEED_THRESHOLD_MS) {
        // Human typing into an input — don't capture
        bufferRef.current = '';
        return;
      }

      // Accumulate the character
      bufferRef.current += e.key;
    };

    const onMouseDown = () => { bufferRef.current = ''; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [handleScan, user]);

  return (
    <ScannerContext.Provider value={{ lastScan }}>
      {children}
    </ScannerContext.Provider>
  );
};

export default ScannerProvider;

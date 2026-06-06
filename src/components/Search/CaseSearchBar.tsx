import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pathscribe.css';
import { useVoice } from '../../contexts/VoiceProvider';

interface CaseSearchBarProps {
  compact?: boolean;
}

// Scan types emitted by ScannerProvider that warrant auto-navigation
const AUTO_NAV_SCAN_TYPES = new Set(['barcode', 'qr']);

const CaseSearchBar: React.FC<CaseSearchBarProps> = ({ compact = false }) => {
  const [caseNumber, setCaseNumber] = useState('');
  const [scanFlash,  setScanFlash]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { phase, transcript } = useVoice();
  const isDictating = phase === 'dictate';

  // ── Scanner events ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScan = (e: CustomEvent) => {
      const { raw, type } = e.detail as { raw: string; type: string };
      const caseNum = raw?.trim().toUpperCase() ?? '';
      setCaseNumber(caseNum);
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 1200);
      // High-confidence scan types navigate automatically
      if (AUTO_NAV_SCAN_TYPES.has(type) && caseNum.length > 3) {
        navigate(`/case/${caseNum}/synoptic`);
      }
    };
    window.addEventListener('PATHSCRIBE_SCAN', onScan as EventListener);
    return () => window.removeEventListener('PATHSCRIBE_SCAN', onScan as EventListener);
  }, [navigate]);

  // ── Voice actions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVoiceAction = (e: any) => {
      const { action, payload } = e.detail;
      if (action === 'FOCUS_SEARCH') {
        inputRef.current?.focus();
        if (payload) {
          setCaseNumber(payload);
          if (payload.length > 3) navigate(`/case/${payload}/synoptic`);
        }
      }
      if (action === 'CLOSE_ALL') {
        inputRef.current?.blur();
        setCaseNumber('');
      }
    };
    window.addEventListener('SYSTEM_ACTION', handleVoiceAction);
    return () => window.removeEventListener('SYSTEM_ACTION', handleVoiceAction);
  }, [navigate]);

  // ── Dictation — populate field from voice transcript ──────────────────────
  useEffect(() => {
    if (isDictating && transcript) {
      setCaseNumber(transcript.toUpperCase().replace(/\s+/g, ''));
    }
  }, [transcript, isDictating]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && caseNumber.trim().length > 3) {
      navigate(`/case/${caseNumber.trim()}/synoptic`);
      setCaseNumber('');
    }
  };

  // ── CSS class composition ─────────────────────────────────────────────────
  const inputClass = [
    'ps-search-input',
    compact       && 'ps-search-input--compact',
    scanFlash     && 'ps-search-input--flash',
    isDictating   && 'ps-search-input--dictate',
  ].filter(Boolean).join(' ');

  const iconClass = [
    'ps-search-icon',
    compact     && 'ps-search-icon--compact',
    scanFlash   && 'ps-search-icon--flash',
    isDictating && 'ps-search-icon--dictate',
  ].filter(Boolean).join(' ');

  const iconSize = compact ? 16 : 20;

  return (
    <div className="ps-search-wrap">
      <input
        ref={inputRef}
        type="text"
        value={caseNumber}
        onChange={e => setCaseNumber(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder={compact ? 'Case / scan…' : 'Enter or scan case number...'}
        aria-label="Search or scan case number"
        className={inputClass}
      />

      {/* Search / scan / dictate icon */}
      <div className={iconClass}>
        {scanFlash ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
      </div>

      {/* Go button — shown when case number is long enough and not mid-scan */}
      {caseNumber.trim().length > 3 && !scanFlash && (
        <button
          onClick={() => { navigate(`/case/${caseNumber.trim()}/synoptic`); setCaseNumber(''); }}
          aria-label="Open case"
          className={`ps-search-go-btn${compact ? ' ps-search-go-btn--compact' : ''}`}
        >
          Go →
        </button>
      )}

      {/* Scan success indicator */}
      {scanFlash && (
        <div className={`ps-search-scanned${compact ? ' ps-search-scanned--compact' : ''}`}>
          ✓ Scanned
        </div>
      )}
    </div>
  );
};

export default CaseSearchBar;

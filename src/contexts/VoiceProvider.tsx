import React, {
  createContext, useContext, useState, useRef, useEffect, useCallback,
} from 'react';
import { mockActionRegistryService } from '../services/actionRegistry/mockActionRegistryService';
import { useSystemConfig } from './SystemConfigContext';

export type VoicePhase = 'standby' | 'ai' | 'local' | 'dictate';

export interface DictationTarget {
  fieldId: string;
  label: string;
  onText: (text: string, isInterim?: boolean) => void;
  onDone?: () => void;
  /** Called when user edits dictated text — enables AI learning from corrections */
  onCorrection?: (original: string, corrected: string) => void;
  /** Context hint for Gemini prompt (e.g. 'gross', 'micro', 'diagnosis') */
  context?: string;
}

export interface VoiceContextType {
  phase: VoicePhase;
  commandPhase: 'ai' | 'local';
  transcript: string;
  isFinal: boolean;
  isListening: boolean;
  isAiEnabled: boolean;
  isProcessing: boolean;
  isRefining: boolean;
  aiAvailable: boolean;
  voiceEnabled: boolean;
  accent: string;
  dictationTarget: DictationTarget | null;
  setAccent: (accent: string) => void;
  startListening: () => void;
  stopListening: () => void;
  setIsAiEnabled: (enabled: boolean) => void;
  toggleVoice: () => void;
  startDictation: (target: DictationTarget) => void;
  stopDictation: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const STOP_PHRASES = ['stop dictation', 'done', 'finish', 'cancel dictation'];
const MISS_CONFIRMATION_WINDOW_MS = 8000;
const GEMINI_TIMEOUT_MS = 2000; // fall back to local if Gemini takes longer

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function parseShortcut(shortcut: string) {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
  return {
    ctrl:  parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt:   parts.includes('alt'),
    meta:  parts.includes('meta'),
    key:   parts.find(p => !['ctrl','shift','alt','meta'].includes(p)) ?? '',
  };
}

// ── Punctuation substitution map ─────────────────────────────────────────────
const PUNCT_MAP: Record<string, string> = {
  'period':              '. ',
  'comma':               ', ',
  'question mark':       '? ',
  'exclamation mark':    '! ',
  'exclamation point':   '! ',
  'colon':               ': ',
  'semicolon':           '; ',
  'new line':            '\n',
  'new paragraph':       '\n\n',
  'open paren':          '(',
  'close paren':         ') ',
  'open parenthesis':    '(',
  'close parenthesis':   ') ',
  'hyphen':              '-',
  'dash':                ' — ',
  'em dash':             ' — ',
  'percent':             '% ',
  'percent sign':        '% ',
  'slash':               '/',
  'backslash':           '\\',
  'open bracket':        '[',
  'close bracket':       '] ',
  'open brace':          '{',
  'close brace':         '} ',
  'equals':              ' = ',
  'plus':                ' + ',
  'asterisk':            '*',
  'at sign':             '@',
  'hash':                '#',
  'ampersand':           '&',
  'tab':                 '\t',
  'space':               ' ',
  'ellipsis':            '… ',
  'dot dot dot':         '… ',
};

/**
 * Apply punctuation substitution + smart capitalization.
 * - Capitalizes the first character of the segment
 * - Capitalizes the character after sentence-ending punctuation (. ? !)
 */
function applyPunctuation(text: string): string {
  const tokens = text.split(/\s+/);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const twoWord = tokens.slice(i, i + 2).join(' ').toLowerCase();
    if (PUNCT_MAP[twoWord] !== undefined) {
      out.push(PUNCT_MAP[twoWord]);
      i += 2;
      continue;
    }
    const oneWord = tokens[i].toLowerCase();
    if (PUNCT_MAP[oneWord] !== undefined) {
      out.push(PUNCT_MAP[oneWord]);
      i++;
      continue;
    }
    out.push(tokens[i]);
    i++;
  }

  let result = out.join(' ').replace(/ {2,}/g, ' ').replace(/ (\n)/g, '$1').replace(/(\n) /g, '$1');

  // Capitalize first character of segment
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Capitalize after sentence-ending punctuation followed by space
  result = result.replace(/([.?!])\s+([a-z])/g, (_, punct, letter) => `${punct} ${letter.toUpperCase()}`);

  return result;
}

// ── Dictation learning store ──────────────────────────────────────────────────
// Simple key→value map: raw transcript → corrected text
// Stored in localStorage, loaded once at module init
const DICTATION_LEARN_KEY = 'ps_dictation_corrections';

function loadDictationCorrections(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DICTATION_LEARN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDictationCorrections(map: Record<string, string>) {
  try { localStorage.setItem(DICTATION_LEARN_KEY, JSON.stringify(map)); } catch {}
}

// Module-level cache — loaded once, updated on corrections
let dictationCorrections: Record<string, string> = loadDictationCorrections();

function applyDictationLearning(rawTranscript: string, localText: string): string {
  const key = norm(rawTranscript);
  return dictationCorrections[key] ?? localText;
}

function recordDictationCorrection(rawTranscript: string, corrected: string) {
  const key = norm(rawTranscript);
  if (!key || !corrected.trim()) return;
  dictationCorrections[key] = corrected;
  saveDictationCorrections(dictationCorrections);
  console.log(`[DictationLearning] Learned: "${key}" → "${corrected}"`);
}

// ── Gemini refinement ─────────────────────────────────────────────────────────
// Lazy-loaded so we don't import GoogleGenerativeAI unless AI phase is active.
// Falls back gracefully if the API key is missing or the call times out.

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? '';

async function refineWithGemini(
  text: string,
  context: string,
  learnedCorrections: Record<string, string>
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  // Build few-shot examples from learned corrections
  const examples = Object.entries(learnedCorrections)
    .slice(0, 5) // limit prompt size
    .map(([raw, corrected]) => `  Raw: "${raw}"\n  Corrected: "${corrected}"`)
    .join('\n');

  const fewShot = examples
    ? `\nLearned corrections from this user (apply similar patterns):\n${examples}\n`
    : '';

  const prompt = `You are an expert Pathology Transcription Assistant.
Refine this raw voice transcript into professional medical text.

RULES:
1. Correct phonetic errors (e.g. "Rose" → "Gross", "Serial" → "Ciliary").
2. Format measurements using 'x' (e.g. "3 x 2 x 1 cm").
3. Use proper pathology staging capitalization (pT2b, pN0, pM0).
4. Capitalize the first word and after sentence-ending punctuation.
5. Preserve punctuation symbols already present (commas, periods etc.).
6. Return ONLY the refined text. No explanation, no quotes.
${fewShot}
Context: ${context}
Raw: "${text}"`;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch (e) {
    console.warn('[VoiceProvider] Gemini refinement failed:', e);
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useSystemConfig();
  const voiceEnabled = config.voiceEnabled ?? true;

  // Dev-only: warn if Gemini key is missing so deployers notice immediately
  useEffect(() => {
    if (!GEMINI_API_KEY && (import.meta as any).env?.DEV) {
      console.warn(
        '[PathScribe] VITE_GEMINI_API_KEY is not set.\n' +
        'AI dictation refinement is disabled — voice will use local mode only.\n' +
        'Set the key in your .env file to enable Gemini-powered transcription.'
      );
    }
  }, []);

  const [phase, setPhase]                     = useState<VoicePhase>('standby');
  const [commandPhase, setCommandPhase]       = useState<'ai' | 'local'>('ai');
  const [transcript, setTranscript]           = useState('');
  const [isFinal, setIsFinal]                 = useState(false);
  const [accent, setAccent]                   = useState('en-US');
  const [dictationTarget, setDictationTarget] = useState<DictationTarget | null>(null);
  const [isRefining, setIsRefining]           = useState(false);
  const [justHeardLiteral, setJustHeardLiteral] = useState(false);
  const justHeardLiteralRef = useRef(false);

  const recognitionRef     = useRef<any>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const dictationTargetRef = useRef<DictationTarget | null>(null);
  const phaseRef           = useRef<VoicePhase>('standby');
  const commandPhaseRef    = useRef<'ai' | 'local'>('ai');
  const pendingMissRef     = useRef<{ id: string; expiresAt: number } | null>(null);
  // Tracks the last raw transcript inserted — used for correction learning
  const lastRawRef         = useRef<string>('');
  const lastLocalTextRef   = useRef<string>('');

  useEffect(() => { dictationTargetRef.current = dictationTarget; }, [dictationTarget]);
  useEffect(() => { justHeardLiteralRef.current = justHeardLiteral; }, [justHeardLiteral]);
  useEffect(() => { phaseRef.current = phase; },               [phase]);
  useEffect(() => { commandPhaseRef.current = commandPhase; }, [commandPhase]);

  const killMic = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) { try { recognition.stop(); } catch {} }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // If admin disables voice mid-session, stop immediately
  useEffect(() => {
    if (!voiceEnabled) {
      killMic();
      setPhase('standby');
      setDictationTarget(null);
      setTranscript('');
    }
  }, [voiceEnabled, killMic]);

  // ── Shortcut confirmation for missed voice commands ───────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const miss = pendingMissRef.current;
      if (!miss || Date.now() > miss.expiresAt) return;
      if (phaseRef.current === 'standby') return;
      const matched = mockActionRegistryService.getActions().find(a => {
        if (!a.shortcut) return false;
        const sc = parseShortcut(a.shortcut);
        return (
          e.ctrlKey  === sc.ctrl  && e.shiftKey === sc.shift &&
          e.altKey   === sc.alt   && e.metaKey  === sc.meta  &&
          e.key.toLowerCase() === sc.key
        );
      });
      if (matched) {
        mockActionRegistryService.confirmMiss(miss.id, matched.id, 'shortcut');
        pendingMissRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  // ── Core dictation handler ────────────────────────────────────────────────
  // Separated so it can be called from onresult cleanly.
  const handleDictationSegment = useCallback(async (text: string) => {
    const normed = norm(text);

    // Stop phrases exit dictation mode
    if (STOP_PHRASES.some(p => normed.includes(p))) {
      dictationTargetRef.current?.onDone?.();
      setDictationTarget(null);
      setJustHeardLiteral(false);
      setPhase(commandPhaseRef.current);
      setTranscript('');
      return;
    }

    // "literal" one-shot flag
    if (normed === 'literal') {
      setJustHeardLiteral(true);
      setTranscript('🔤 Literal…');
      setTimeout(() => setTranscript(''), 1500);
      return;
    }

    // One-shot literal: pass through raw
    if (justHeardLiteralRef.current) {
      setJustHeardLiteral(false);
      dictationTargetRef.current?.onText(text + ' ');
      lastRawRef.current = text;
      lastLocalTextRef.current = text + ' ';
      setTranscript('');
      return;
    }

    // Apply local punctuation + capitalization + learned corrections
    const localExpanded = applyPunctuation(text);
    const localWithLearning = applyDictationLearning(text, localExpanded);

    // Store raw for correction tracking
    lastRawRef.current = text;
    lastLocalTextRef.current = localWithLearning;

    if (commandPhaseRef.current === 'ai' && GEMINI_API_KEY) {
      // ── AI PATH ──────────────────────────────────────────────────────────
      // 1. Insert interim text immediately (muted — caller renders differently)
      dictationTargetRef.current?.onText(localWithLearning, true); // interim=true
      setIsRefining(true);
      setTranscript('✨ Refining…');

      // 2. Race Gemini against timeout
      const context = dictationTargetRef.current?.context ?? 'Pathology Report';
      const geminiPromise = refineWithGemini(text, context, dictationCorrections);
      const timeoutPromise = new Promise<null>(r => setTimeout(() => r(null), GEMINI_TIMEOUT_MS));

      const refined = await Promise.race([geminiPromise, timeoutPromise]);

      setIsRefining(false);
      setTranscript('');

      if (refined && refined !== localWithLearning) {
        // 3. Replace interim with refined version
        // Signal caller to replace the interim text
        dictationTargetRef.current?.onText(refined, false); // final=true, replaces interim
        lastLocalTextRef.current = refined;
      } else {
        // Gemini timed out or returned same — commit the local version
        dictationTargetRef.current?.onText(localWithLearning, false);
      }
    } else {
      // ── LOCAL PATH ───────────────────────────────────────────────────────
      dictationTargetRef.current?.onText(localWithLearning);
      setTranscript('');
    }
  }, []);

  // ── Speech recognition lifecycle ──────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (phase === 'standby') { killMic(); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = accent;

    recognition.onend = () => {
      if (recognitionRef.current === recognition && phaseRef.current !== 'standby') {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      setIsFinal(false);

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text  = event.results[i][0].transcript.trim();
        const final = event.results[i].isFinal;

        if (!final) {
          interim += text + ' ';
          setTranscript(interim.trim());
          continue;
        }

        setIsFinal(true);
        setTranscript(text);
        const currentPhase = phaseRef.current;

        if (currentPhase === 'dictate') {
          void handleDictationSegment(text);
          continue;
        }

        // ── COMMAND ──────────────────────────────────────────────────────
        const action = mockActionRegistryService.findActionByTrigger(text);
        if (action) {
          pendingMissRef.current = null;
          mockActionRegistryService.executeAction(action, text);
          setTranscript(`✔️ ${action.label}`);
          setTimeout(() => setTranscript(''), 1200);
        } else {
          const miss = mockActionRegistryService.recordMiss(text);
          pendingMissRef.current = { id: miss.id, expiresAt: Date.now() + MISS_CONFIRMATION_WINDOW_MS };
          setTimeout(() => {
            if (pendingMissRef.current?.id === miss.id) {
              mockActionRegistryService.dismissMiss(miss.id);
              pendingMissRef.current = null;
            }
          }, MISS_CONFIRMATION_WINDOW_MS);
          setTimeout(() => setTranscript(''), 2000);
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'aborted') console.warn('[VoiceProvider] error:', e.error);
    };

    recognitionRef.current = recognition;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(s => {
        streamRef.current = s;
        setTimeout(() => {
          if (recognitionRef.current === recognition) recognition.start();
        }, 400);
      })
      .catch(() => { recognitionRef.current = null; setPhase('standby'); });

    return () => killMic();
  }, [phase, accent, killMic, handleDictationSegment]);

  // ── Public API ────────────────────────────────────────────────────────────

  const toggleVoice = useCallback(() => {
    if (!voiceEnabled) return; // master switch off
    setPhase(current => {
      if (current === 'standby') {
        // If no Gemini key, skip AI phase entirely — go straight to local
        if (GEMINI_API_KEY) { setCommandPhase('ai'); return 'ai'; }
        else                { setCommandPhase('local'); return 'local'; }
      }
      if (current === 'ai')    { setCommandPhase('local'); return 'local';   }
      if (current === 'local') {                           return 'standby'; }
      // dictate bail-out
      dictationTargetRef.current?.onDone?.();
      setDictationTarget(null);
      setTranscript('');
      return commandPhaseRef.current;
    });
  }, []);

  const startDictation = useCallback((target: DictationTarget) => {
    setDictationTarget(target);
    setTranscript('');
    setPhase('dictate');
  }, []);

  const stopDictation = useCallback(() => {
    dictationTargetRef.current?.onDone?.();
    setDictationTarget(null);
    setTranscript('');
    setIsRefining(false);
    setPhase(commandPhaseRef.current);
  }, []);

  // ── Correction learning — called by field components on blur ─────────────
  // Exposed on window so any field can call it without prop drilling
  useEffect(() => {
    (window as any).__psRecordDictationCorrection = (corrected: string) => {
      if (!lastRawRef.current || !corrected) return;
      if (norm(corrected) === norm(lastLocalTextRef.current)) return; // no change
      recordDictationCorrection(lastRawRef.current, corrected);
      // Also notify the current dictation target if it has onCorrection
      dictationTargetRef.current?.onCorrection?.(lastRawRef.current, corrected);
    };
    return () => { delete (window as any).__psRecordDictationCorrection; };
  }, []);

  const value: VoiceContextType = {
    phase, commandPhase, transcript, isFinal,
    isListening:  phase !== 'standby',
    isAiEnabled:  phase === 'ai' || (phase === 'dictate' && commandPhase === 'ai'),
    isProcessing: false,
    isRefining,
    aiAvailable:  !!GEMINI_API_KEY,
    voiceEnabled,
    accent, dictationTarget,
    setAccent,
    startListening:  () => { setCommandPhase('ai'); setPhase('ai'); },
    stopListening:   () => { setDictationTarget(null); setPhase('standby'); },
    setIsAiEnabled:  () => {},
    toggleVoice, startDictation, stopDictation,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoice = () => useContext(VoiceContext)!;

// ── Utility: call from any field's onBlur to teach the system ────────────────
export function reportDictationCorrection(correctedText: string) {
  (window as any).__psRecordDictationCorrection?.(correctedText);
}

// src/hooks/useFocusTrap.ts
// ─────────────────────────────────────────────────────────────────────────────
// Traps keyboard focus within a container when active.
// Meets WCAG 2.1 SC 2.1.2 (No Keyboard Trap) — focus cycles within the
// dialog, and returns to the trigger element on close.
//
// Usage:
//   const containerRef = useRef<HTMLDivElement>(null);
//   useFocusTrap(containerRef, isOpen);
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean,
) {
  // Remember what had focus before the trap activated so we can restore it
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Move focus into the container — first focusable element
    const el = containerRef.current;
    if (!el) return;

    const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const els = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (els.length === 0) return;

      const first = els[0];
      const last  = els[els.length - 1];

      if (e.shiftKey) {
        // Shift+Tab — wrap to last if on first
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab — wrap to first if on last
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Escape closes — caller handles this via onCancel prop
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger element on cleanup
      previousFocusRef.current?.focus();
    };
  }, [active, containerRef]);
}

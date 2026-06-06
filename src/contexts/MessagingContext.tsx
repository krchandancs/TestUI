/**
 * contexts/MessagingContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides global messaging state (unread count, urgent flag, drawer open)
 * so any page can show the messaging button and badge without duplicating logic.
 *
 * Usage:
 *   1. Wrap your app in <MessagingProvider> (inside AuthProvider in App.tsx)
 *   2. Call useMessaging() in any component to get/set messaging state
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { messageService } from '../services';
import { useAuth } from './AuthContext';
import type { Message } from '../services';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessagingContextType {
  messages:       Message[];
  unreadCount:    number;
  hasUrgent:      boolean;
  portalOpen:     boolean;
  setPortalOpen:  (open: boolean) => void;
  reloadInbox:    () => Promise<void>;
  setMessages:    React.Dispatch<React.SetStateAction<Message[]>>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId   = user?.id ?? '';

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [portalOpen,  setPortalOpenRaw] = useState(
    () => sessionStorage.getItem('ps_drawer_open') === 'true'
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const unreadCount = messages.filter(m => !m.isRead && !m.isDeleted).length;
  const hasUrgent   = messages.some(m => m.isUrgent && !m.isRead && !m.isDeleted);

  const setPortalOpen = (open: boolean) => {
    sessionStorage.setItem('ps_drawer_open', String(open));
    setPortalOpenRaw(open);
  };

  const reloadInbox = useCallback(async () => {
    if (!userId) return;
    const result = await messageService.getInbox(userId);
    if (result.ok) setMessages(result.data);
  }, [userId]);

  // Load on mount and when user changes
  useEffect(() => { reloadInbox(); }, [reloadInbox]);

  // Poll for new messages every 20 seconds — picks up messages sent by other users
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => { reloadInbox(); }, 20000);
    return () => clearInterval(interval);
  }, [userId, reloadInbox]);

  // Also reload when the tab becomes visible again (user switches back to PathScribe)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') reloadInbox(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reloadInbox]);

  // Persist portal state
  useEffect(() => {
    sessionStorage.setItem('ps_drawer_open', String(portalOpen));
  }, [portalOpen]);

  // Urgent audio alert
  useEffect(() => {
    if (hasUrgent) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      }
      audioRef.current.play().catch(() => {});
    }
  }, [hasUrgent]);

  return (
    <MessagingContext.Provider value={{
      messages,
      unreadCount,
      hasUrgent,
      portalOpen,
      setPortalOpen,
      reloadInbox,
      setMessages,
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider');
  return ctx;
}

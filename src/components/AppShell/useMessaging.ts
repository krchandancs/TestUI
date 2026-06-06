import { useState, useEffect, useCallback } from 'react';
// Importing the mock and the types from your verified path
import type { Message } from '../../services/messages/IMessageService';
import { mockMessageService } from '../../services/messages/mockMessageService';


export const useMessaging = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!userId) return;
    const result = await mockMessageService.getInbox(userId);
    if (result.ok) {
      // Sort by timestamp descending so newest is on top
      const sorted = [...result.data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMessages(sorted);
    }
  }, [userId]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleMarkRead = async (id: string) => {
    await mockMessageService.markRead(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  const handleSend = async (text: string, msgId: string, userName: string) => {
    const result = await mockMessageService.reply(msgId, userId, userName, text);
    if (result.ok) {
      // Update the local list with the new thread data returned from mock
      setMessages(prev => prev.map(m => m.id === msgId ? result.data : m));
    }
    return result.ok;
  };

  return { 
    messages, 
    selectedMsgId, 
    setSelectedMsgId, 
    handleMarkRead, 
    handleSend, 
    isListening, 
    setIsListening 
  };
};

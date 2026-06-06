import { ServiceResult, ID } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessageThread {
  sender: string;
  senderId: ID;
  text: string;
  timestamp: Date;
}

export interface Message {
  id: ID;
  senderId: ID;
  senderName: string;
  recipientId: ID;
  recipientName: string;
  subject: string;
  body: string;
  caseNumber?: string;
  configLink?: string;
  timestamp: Date;
  isUrgent: boolean;
  isRead: boolean;
  isDeleted: boolean;
  thread: MessageThread[];
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IMessageService {
  /** Fetch all messages for a given user (inbox + sent) */
  getInbox(userId: ID): Promise<ServiceResult<Message[]>>;

  /** Fetch a single message by ID */
  getById(id: ID): Promise<ServiceResult<Message>>;

  /** Send a new message */
  send(message: Omit<Message, 'id' | 'isRead' | 'isDeleted' | 'thread'>): Promise<ServiceResult<Message>>;

  /** Reply to an existing thread */
  reply(messageId: ID, senderId: ID, senderName: string, text: string): Promise<ServiceResult<Message>>;

  /** Mark a message as read */
  markRead(id: ID): Promise<ServiceResult<Message>>;

  /** Mark all messages as read for a user */
  markAllRead(userId: ID): Promise<ServiceResult<void>>;

  /** Soft-delete (move to Recently Deleted) */
  softDelete(id: ID): Promise<ServiceResult<Message>>;

  /** Restore from Recently Deleted */
  restore(id: ID): Promise<ServiceResult<Message>>;

  /** Permanently delete a message */
  permanentDelete(id: ID): Promise<ServiceResult<void>>;

  /** Permanently delete all deleted messages for a user */
  emptyDeleted(userId: ID): Promise<ServiceResult<void>>;
}

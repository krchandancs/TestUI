import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ServiceResult, ID } from '../types';
import { Message, MessageThread, IMessageService } from './IMessageService';
import { firestoreAuditService } from '../auditlog/firestoreAuditService';

// ─── Audit Helper ─────────────────────────────────────────────────────────────

const audit = (
  event: string,
  detail: string,
  user: string,
  caseId: string | null = null
) => firestoreAuditService.logEvent({ type: 'user', event, detail, user, caseId, confidence: null });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok  = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err = <T>(error: string): ServiceResult<T> => ({ ok: false, error });

const COLLECTION = 'messages';

/** Convert Firestore doc data → Message, handling Timestamp → Date */
const fromDoc = (id: string, data: any): Message => ({
  id,
  senderId:       data.senderId,
  senderName:     data.senderName,
  recipientId:    data.recipientId,
  recipientName:  data.recipientName,
  subject:        data.subject,
  body:           data.body,
  caseNumber:     data.caseNumber ?? undefined,
  configLink:     data.configLink ?? undefined,
  timestamp:      data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
  isUrgent:       data.isUrgent ?? false,
  isRead:         data.isRead ?? false,
  isDeleted:      data.isDeleted ?? false,
  thread:         (data.thread ?? []).map((t: any) => ({
    sender:    t.sender,
    senderId:  t.senderId,
    text:      t.text,
    timestamp: t.timestamp instanceof Timestamp ? t.timestamp.toDate() : new Date(t.timestamp),
  })),
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const firestoreMessageService: IMessageService = {

  async getInbox(userId: ID) {
    try {
      // Fetch messages where the user is the recipient OR the sender
      const [recipientSnap, senderSnap] = await Promise.all([
        getDocs(query(
          collection(db, COLLECTION),
          where('recipientId', '==', userId),
          orderBy('timestamp', 'desc')
        )),
        getDocs(query(
          collection(db, COLLECTION),
          where('senderId', '==', userId),
          orderBy('timestamp', 'desc')
        )),
      ]);

      const seen = new Set<string>();
      const messages: Message[] = [];

      for (const snap of [recipientSnap, senderSnap]) {
        snap.docs.forEach(d => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            messages.push(fromDoc(d.id, d.data()));
          }
        });
      }

      // Sort combined results by timestamp descending
      messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return ok(messages);
    } catch (e: any) {
      return err(e.message ?? 'Failed to fetch inbox');
    }
  },

  async getById(id: ID) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (!snap.exists()) return err(`Message ${id} not found`);
      return ok(fromDoc(snap.id, snap.data()));
    } catch (e: any) {
      return err(e.message ?? 'Failed to fetch message');
    }
  },

  async send(message) {
    try {
      const payload = {
        ...message,
        timestamp: serverTimestamp(),
        isRead: false,
        isDeleted: false,
        thread: [{
          sender:    message.senderName,
          senderId:  message.senderId,
          text:      message.body,
          timestamp: serverTimestamp(),
        }],
      };
      const ref = await addDoc(collection(db, COLLECTION), payload);
      const snap = await getDoc(ref);
      const sent = fromDoc(snap.id, snap.data());
      await audit(
        'MESSAGE_SENT',
        `Message sent to ${message.recipientName} — Subject: "${message.subject}"${message.caseNumber ? ` — Case: ${message.caseNumber}` : ''}${message.isUrgent ? ' [URGENT]' : ''}`,
        message.senderName,
        message.caseNumber ?? null
      );
      return ok(sent);
    } catch (e: any) {
      return err(e.message ?? 'Failed to send message');
    }
  },

  async reply(messageId: ID, senderId: ID, senderName: string, text: string) {
    try {
      const ref = doc(db, COLLECTION, messageId);
      const newThread: MessageThread = {
        sender:    senderName,
        senderId,
        text,
        timestamp: new Date(),
      };
      await updateDoc(ref, {
        body:   text,
        thread: arrayUnion({ ...newThread, timestamp: serverTimestamp() }),
      });
      const snap = await getDoc(ref);
      if (!snap.exists()) return err(`Message ${messageId} not found`);
      const replied = fromDoc(snap.id, snap.data());
      await audit(
        'MESSAGE_REPLIED',
        `Reply sent to ${replied.senderName} — Subject: "${replied.subject}"${replied.caseNumber ? ` — Case: ${replied.caseNumber}` : ''}`,
        senderName,
        replied.caseNumber ?? null
      );
      return ok(replied);
    } catch (e: any) {
      return err(e.message ?? 'Failed to reply to message');
    }
  },

  async markRead(id: ID) {
    try {
      const ref = doc(db, COLLECTION, id);
      await updateDoc(ref, { isRead: true });
      const snap = await getDoc(ref);
      if (!snap.exists()) return err(`Message ${id} not found`);
      return ok(fromDoc(snap.id, snap.data()));
    } catch (e: any) {
      return err(e.message ?? 'Failed to mark message as read');
    }
  },

  async markAllRead(userId: ID) {
    try {
      const snap = await getDocs(query(
        collection(db, COLLECTION),
        where('recipientId', '==', userId),
        where('isRead', '==', false),
      ));
      await Promise.all(
        snap.docs.map(d => updateDoc(d.ref, { isRead: true }))
      );
      return ok(undefined);
    } catch (e: any) {
      return err(e.message ?? 'Failed to mark all messages as read');
    }
  },

  async softDelete(id: ID) {
    try {
      const ref = doc(db, COLLECTION, id);
      const before = await getDoc(ref);
      if (!before.exists()) return err(`Message ${id} not found`);
      const target = fromDoc(before.id, before.data());
      await updateDoc(ref, { isDeleted: true });
      await audit(
        'MESSAGE_DELETED',
        `Message moved to Recently Deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
        target.recipientName,
        target.caseNumber ?? null
      );
      return ok({ ...target, isDeleted: true });
    } catch (e: any) {
      return err(e.message ?? 'Failed to delete message');
    }
  },

  async restore(id: ID) {
    try {
      const ref = doc(db, COLLECTION, id);
      const before = await getDoc(ref);
      if (!before.exists()) return err(`Message ${id} not found`);
      const target = fromDoc(before.id, before.data());
      await updateDoc(ref, { isDeleted: false });
      await audit(
        'MESSAGE_RESTORED',
        `Message restored from Recently Deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
        target.recipientName,
        target.caseNumber ?? null
      );
      return ok({ ...target, isDeleted: false });
    } catch (e: any) {
      return err(e.message ?? 'Failed to restore message');
    }
  },

  async permanentDelete(id: ID) {
    try {
      const ref = doc(db, COLLECTION, id);
      const before = await getDoc(ref);
      const target = before.exists() ? fromDoc(before.id, before.data()) : null;
      await deleteDoc(ref);
      if (target) {
        await audit(
          'MESSAGE_PERMANENTLY_DELETED',
          `Message permanently deleted — Subject: "${target.subject}" from ${target.senderName}${target.caseNumber ? ` — Case: ${target.caseNumber}` : ''}`,
          target.recipientName,
          target.caseNumber ?? null
        );
      }
      return ok(undefined);
    } catch (e: any) {
      return err(e.message ?? 'Failed to permanently delete message');
    }
  },

  async emptyDeleted(userId: ID) {
    try {
      const [recipientSnap, senderSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTION), where('recipientId', '==', userId), where('isDeleted', '==', true))),
        getDocs(query(collection(db, COLLECTION), where('senderId',    '==', userId), where('isDeleted', '==', true))),
      ]);
      const seen = new Set<string>();
      const toDelete: ReturnType<typeof doc>[] = [];
      for (const snap of [recipientSnap, senderSnap]) {
        snap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); toDelete.push(d.ref); } });
      }
      await Promise.all(toDelete.map(ref => deleteDoc(ref)));
      const actor = recipientSnap.docs[0]?.data()?.recipientName ?? userId;
      await audit(
        'INBOX_EMPTIED',
        `Recently Deleted emptied — ${toDelete.length} message(s) permanently removed`,
        actor,
        null
      );
      return ok(undefined);
    } catch (e: any) {
      return err(e.message ?? 'Failed to empty deleted messages');
    }
  },
};

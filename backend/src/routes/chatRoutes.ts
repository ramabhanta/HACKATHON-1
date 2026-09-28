import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { ChatMessage, AppNotification } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const chatRouter = Router();

// GET messages in a conversation
chatRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const recipientId = req.query.recipientId as string;

  if (!recipientId) {
    return res.status(400).json({ error: 'recipientId query parameter is required' });
  }

  const messages = db.find('messages', m =>
    (m.senderId === currentUserId && m.recipientId === recipientId) ||
    (m.senderId === recipientId && m.recipientId === currentUserId)
  );

  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return res.json(messages);
});

// GET conversation threads
chatRouter.get('/conversations', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allMessages = db.find('messages', m => m.senderId === currentUserId || m.recipientId === currentUserId);
  const users = db.getTable('users');

  const partnerIds = new Set<string>();
  allMessages.forEach(m => {
    partnerIds.add(m.senderId === currentUserId ? m.recipientId : m.senderId);
  });

  // Also include default contacts (e.g. Vendor and Expert) if no messages exist yet
  if (partnerIds.size === 0) {
    if (req.user!.role === 'FARMER') {
      partnerIds.add('usr-vendor-1');
      partnerIds.add('usr-expert-1');
    } else if (req.user!.role === 'VENDOR') {
      partnerIds.add('usr-farmer-1');
    }
  }

  const conversations = Array.from(partnerIds).map(pid => {
    const partner = users.find(u => u.id === pid);
    const thread = allMessages.filter(m => (m.senderId === pid && m.recipientId === currentUserId) || (m.senderId === currentUserId && m.recipientId === pid));
    const lastMsg = thread.slice(-1)[0];
    return {
      partnerId: pid,
      partnerName: partner?.name || 'AgriConnect User',
      partnerRole: partner?.role || 'VENDOR',
      lastMessage: lastMsg?.content || 'Tap to start conversation',
      lastMessageTime: lastMsg?.createdAt || new Date().toISOString(),
      unreadCount: thread.filter(m => m.recipientId === currentUserId && !m.isRead).length
    };
  });

  return res.json(conversations);
});

// POST send message
chatRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { recipientId, content, imageUrl, referenceType, referenceId } = req.body;

  if (!recipientId || !content) {
    return res.status(400).json({ error: 'recipientId and content are required' });
  }

  const recipient = db.findById('users', recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient user not found' });
  }

  const convId = [req.user!.id, recipientId].sort().join('_');

  const newMsg: ChatMessage = {
    id: `msg-${uuidv4().substring(0, 8)}`,
    conversationId: convId,
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderRole: req.user!.role,
    recipientId,
    content,
    imageUrl,
    referenceType,
    referenceId,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.insert('messages', newMsg);

  // Notify recipient
  const notif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: recipientId,
    title: `New message from ${req.user!.name}`,
    body: content.length > 60 ? `${content.substring(0, 57)}...` : content,
    category: 'SYSTEM',
    linkUrl: `/chat?with=${req.user!.id}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', notif);

  return res.status(201).json(newMsg);
});

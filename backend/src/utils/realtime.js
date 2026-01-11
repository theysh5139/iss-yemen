/**
 * Real-time update utilities
 * Broadcasts data changes to connected clients
 */

import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 */
export function initRealtime(server) {
  try {
    io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });

      // Join room for specific data types
      socket.on('subscribe', (room) => {
        socket.join(room);
        console.log(`[Socket] Client ${socket.id} joined room: ${room}`);
      });

      socket.on('unsubscribe', (room) => {
        socket.leave(room);
        console.log(`[Socket] Client ${socket.id} left room: ${room}`);
      });
    });

    console.log('[Socket] Real-time server initialized');
    return io;
  } catch (error) {
    console.warn('[Socket] Socket.io not available. Install with: npm install socket.io');
    return null;
  }
}

/**
 * Get Socket.io instance
 */
export function getIO() {
  return io;
}

/**
 * Broadcast event update to all connected clients
 */
export function broadcastEventUpdate(eventData, action = 'updated') {
  if (!io) return;
  io.emit('event:update', { event: eventData, action });
  io.to('events').emit('event:update', { event: eventData, action });
}

/**
 * Broadcast news update
 */
export function broadcastNewsUpdate(newsData, action = 'updated') {
  if (!io) return;
  io.emit('news:update', { news: newsData, action });
  io.to('news').emit('news:update', { news: newsData, action });
}

/**
 * Broadcast announcement update
 */
export function broadcastAnnouncementUpdate(announcementData, action = 'updated') {
  if (!io) return;
  io.emit('announcement:update', { announcement: announcementData, action });
  io.to('announcements').emit('announcement:update', { announcement: announcementData, action });
}

/**
 * Broadcast activity update
 */
export function broadcastActivityUpdate(activityData, action = 'updated') {
  if (!io) return;
  io.emit('activity:update', { activity: activityData, action });
  io.to('activities').emit('activity:update', { activity: activityData, action });
}

/**
 * Broadcast payment receipt update
 */
export function broadcastPaymentReceiptUpdate(receiptData, action = 'updated') {
  if (!io) return;
  io.emit('paymentReceipt:update', { receipt: receiptData, action });
  io.to('payments').emit('paymentReceipt:update', { receipt: receiptData, action });
}

/**
 * Broadcast user registration update for an event
 */
export function broadcastEventRegistrationUpdate(eventId, registrationData) {
  if (!io) return;
  io.emit('event:registration', { eventId, registration: registrationData });
  io.to(`event:${eventId}`).emit('event:registration', { eventId, registration: registrationData });
}

/**
 * Broadcast HOD update
 */
export function broadcastHODUpdate(hodData, action = 'updated') {
  if (!io) return;
  io.emit('hod:update', { hod: hodData, action });
  io.to('hods').emit('hod:update', { hod: hodData, action });
}

/**
 * Broadcast general data refresh
 */
export function broadcastDataRefresh(dataType) {
  if (!io) return;
  io.emit('data:refresh', { type: dataType });
}


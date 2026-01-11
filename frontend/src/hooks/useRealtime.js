import { useEffect, useRef } from 'react';

/**
 * Custom hook for real-time updates
 * Supports both WebSocket (Socket.io) and polling fallback
 */
export function useRealtime(events, onUpdate, options = {}) {
  const {
    enabled = true,
    pollingInterval = 30000, // 30 seconds default
    useWebSocket = true,
    usePolling = true
  } = options;

  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Try WebSocket connection first
    if (useWebSocket) {
      try {
        const io = require('socket.io-client');
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        
        socketRef.current = io(apiBaseUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        socketRef.current.on('connect', () => {
          console.log('[Realtime] WebSocket connected');
          isConnectedRef.current = true;
          
          // Subscribe to events
          if (events) {
            events.forEach(event => {
              socketRef.current.emit('subscribe', event);
            });
          }
        });

        socketRef.current.on('disconnect', () => {
          console.log('[Realtime] WebSocket disconnected');
          isConnectedRef.current = false;
        });

        socketRef.current.on('connect_error', (error) => {
          console.warn('[Realtime] WebSocket connection error:', error.message);
          isConnectedRef.current = false;
        });

        // Listen for data updates
        socketRef.current.on('data:refresh', (data) => {
          console.log('[Realtime] Data refresh received:', data);
          if (onUpdate) {
            onUpdate(data);
          }
        });

        socketRef.current.on('event:update', (data) => {
          console.log('[Realtime] Event update received:', data);
          if (onUpdate) {
            onUpdate({ type: 'event', ...data });
          }
        });

        socketRef.current.on('news:update', (data) => {
          console.log('[Realtime] News update received:', data);
          if (onUpdate) {
            onUpdate({ type: 'news', ...data });
          }
        });

        socketRef.current.on('announcement:update', (data) => {
          console.log('[Realtime] Announcement update received:', data);
          if (onUpdate) {
            onUpdate({ type: 'announcement', ...data });
          }
        });

        socketRef.current.on('activity:update', (data) => {
          console.log('[Realtime] Activity update received:', data);
          if (onUpdate) {
            onUpdate({ type: 'activity', ...data });
          }
        });

        socketRef.current.on('event:registration', (data) => {
          console.log('[Realtime] Event registration update received:', data);
          if (onUpdate) {
            onUpdate({ type: 'registration', ...data });
          }
        });

      } catch (error) {
        console.warn('[Realtime] Socket.io not available, using polling fallback');
        isConnectedRef.current = false;
      }
    }

    // Polling fallback (if WebSocket not available or as backup)
    if (usePolling && (!isConnectedRef.current || usePolling === 'always')) {
      const poll = () => {
        if (onUpdate) {
          onUpdate({ type: 'poll', timestamp: Date.now() });
        }
      };

      // Initial poll
      poll();

      // Set up polling interval
      pollingRef.current = setInterval(poll, pollingInterval);
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        if (events) {
          events.forEach(event => {
            socketRef.current.emit('unsubscribe', event);
          });
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      isConnectedRef.current = false;
    };
  }, [enabled, useWebSocket, usePolling, pollingInterval, events, onUpdate]);

  return {
    isConnected: isConnectedRef.current,
    socket: socketRef.current
  };
}



import { useEffect, useRef, useCallback } from 'react';
import { useRealtime } from './useRealtime.js';

/**
 * Custom hook for auto-refreshing data with real-time updates
 * Combines WebSocket real-time updates with polling fallback
 */
export function useAutoRefresh(fetchFunction, dependencies = [], options = {}) {
  const {
    enabled = true,
    pollingInterval = 30000, // 30 seconds
    useWebSocket = true,
    usePolling = true,
    immediate = true
  } = options;

  const fetchRef = useRef(fetchFunction);
  const isFetchingRef = useRef(false);

  // Update fetch function ref when it changes
  useEffect(() => {
    fetchRef.current = fetchFunction;
  }, [fetchFunction]);

  // Wrapper function to call fetch
  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      await fetchRef.current();
    } catch (error) {
      console.error('[AutoRefresh] Error refreshing data:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((update) => {
    console.log('[AutoRefresh] Real-time update received:', update);
    
    // Refresh data when update is received
    if (update.type === 'data:refresh' || update.type === 'poll') {
      refreshData();
    } else if (update.type === 'event' || update.type === 'news' || 
               update.type === 'announcement' || update.type === 'activity' ||
               update.type === 'registration') {
      // Specific update types - refresh immediately
      refreshData();
    }
  }, [refreshData]);

  // Set up real-time connection
  useRealtime(
    ['events', 'news', 'announcements', 'activities'],
    handleRealtimeUpdate,
    {
      enabled,
      pollingInterval,
      useWebSocket,
      usePolling
    }
  );

  // Initial fetch
  useEffect(() => {
    if (enabled && immediate) {
      refreshData();
    }
  }, [enabled, immediate, ...dependencies]);

  return {
    refresh: refreshData,
    isFetching: isFetchingRef.current
  };
}



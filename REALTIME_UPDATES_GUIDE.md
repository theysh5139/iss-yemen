# Real-Time Updates Guide

This guide explains how to ensure website entries update smoothly in real-time.

## Overview

The system now supports **real-time updates** using multiple methods:

1. **WebSocket (Socket.io)** - True real-time updates (requires installation)
2. **Polling** - Automatic refresh every 30 seconds (works out of the box)
3. **Visibility API** - Refresh when user returns to the page
4. **Custom Events** - Manual refresh triggers

## Current Implementation

### ✅ Already Working (No Setup Required)

**Polling-based Auto-Refresh:**
- Homepage automatically refreshes every 30 seconds
- Admin dashboard refreshes when page becomes visible
- All pages refresh when user switches back to the tab

**Manual Refresh Triggers:**
- After creating/updating/deleting events, news, announcements
- After event registration
- After payment verification

### 🔧 Optional: WebSocket Real-Time (Requires Setup)

For **instant updates** without polling, install Socket.io:

#### Backend Setup:

```bash
cd backend
npm install socket.io
```

The backend is already configured to use Socket.io if available. It will automatically:
- Broadcast updates when data changes
- Fall back to polling if Socket.io is not installed

#### Frontend Setup:

```bash
cd frontend
npm install socket.io-client
```

Then use the `useRealtime` hook in your components (see examples below).

## How It Works

### 1. Polling (Default - No Setup)

**Homepage (`HomePage.jsx`):**
- Fetches data on mount
- Auto-refreshes every 30 seconds
- Refreshes when page becomes visible

**Admin Dashboard (`AdminDashboard.jsx`):**
- Listens for `adminDataUpdated` custom events
- Refreshes when page becomes visible
- Refreshes after create/update/delete operations

### 2. WebSocket (Optional - Requires Installation)

When Socket.io is installed:
- Backend broadcasts updates immediately when data changes
- Frontend receives updates instantly
- No polling needed (more efficient)

### 3. Manual Refresh

After operations like:
- Creating/updating/deleting events
- Creating/updating/deleting news/announcements
- Registering for events
- Verifying payments

The system automatically:
- Dispatches custom events
- Triggers data refresh
- Updates UI immediately

## Usage Examples

### Using Auto-Refresh Hook

```javascript
import { useAutoRefresh } from '../hooks/useAutoRefresh.js';
import { getEvents } from '../api/events.js';

function MyComponent() {
  const [events, setEvents] = useState([]);
  
  const fetchEvents = async () => {
    const data = await getEvents();
    setEvents(data.events);
  };
  
  // Auto-refresh every 30 seconds
  useAutoRefresh(fetchEvents, [], {
    pollingInterval: 30000, // 30 seconds
    enabled: true
  });
  
  return <div>{/* Your component */}</div>;
}
```

### Using Real-Time Hook (WebSocket)

```javascript
import { useRealtime } from '../hooks/useRealtime.js';

function MyComponent() {
  const handleUpdate = (update) => {
    console.log('Real-time update:', update);
    // Refresh your data
    fetchData();
  };
  
  useRealtime(
    ['events', 'news', 'announcements'],
    handleUpdate,
    {
      useWebSocket: true,
      usePolling: true, // Fallback if WebSocket fails
      pollingInterval: 30000
    }
  );
}
```

## Configuration

### Adjust Polling Interval

In `HomePage.jsx` or any component:

```javascript
// Change from 30 seconds to 10 seconds
const pollInterval = setInterval(() => {
  fetchData()
}, 10000) // 10 seconds
```

### Disable Auto-Refresh

```javascript
// In useAutoRefresh hook
useAutoRefresh(fetchData, [], {
  enabled: false // Disable auto-refresh
});
```

## What Gets Updated in Real-Time

✅ **Events** - When created, updated, deleted, or cancelled  
✅ **News** - When created, updated, or deleted  
✅ **Announcements** - When created, updated, or deleted  
✅ **Activities** - When created, updated, or deleted  
✅ **Event Registrations** - When users register/unregister  
✅ **Payment Receipts** - When verified or rejected  

## Performance Considerations

### Polling Interval Recommendations:

- **30 seconds** - Good balance (default)
- **10-15 seconds** - More responsive, higher server load
- **60 seconds** - Less responsive, lower server load
- **Disabled** - Manual refresh only

### WebSocket vs Polling:

- **WebSocket**: Instant updates, lower server load, requires setup
- **Polling**: Works out of the box, higher server load, slight delay

## Troubleshooting

### Updates Not Appearing

1. **Check browser console** for errors
2. **Verify polling is enabled** (check component code)
3. **Check network tab** for API calls
4. **Refresh page manually** to test

### WebSocket Not Working

1. **Install Socket.io**: `npm install socket.io` (backend)
2. **Install Socket.io-client**: `npm install socket.io-client` (frontend)
3. **Check CORS settings** in backend
4. **Check browser console** for connection errors

### Too Many API Calls

1. **Increase polling interval** (e.g., 60 seconds)
2. **Disable polling** on pages that don't need it
3. **Use WebSocket** instead of polling (more efficient)

## Best Practices

1. **Use polling for public pages** (homepage, events list)
2. **Use WebSocket for admin pages** (dashboard, management)
3. **Disable auto-refresh on forms** (prevents data loss)
4. **Use visibility API** to refresh when user returns
5. **Show loading states** during refresh

## Current Status

✅ **Polling**: Implemented and working  
✅ **Visibility API**: Implemented and working  
✅ **Custom Events**: Implemented and working  
⚠️ **WebSocket**: Available but requires Socket.io installation  

The system works smoothly with polling by default. WebSocket is optional for even better performance.



import { useState, useEffect, useRef } from "react"
import { getEvents } from "../api/events.js"
import { useAuth } from "../context/AuthProvider.jsx"
import EventRegistrationModal from "../components/EventRegistrationModal.jsx"
import "../styles/home.css"
import "../styles/all-events.css"

export default function AllEvents() {
  // Get user state from AuthProvider - this is read-only, never modify it here
  // CRITICAL: This page NEVER modifies authentication state or localStorage
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, upcoming, past
  const [categoryFilter, setCategoryFilter] = useState("All") // Category filter
  const [dateFilter, setDateFilter] = useState("All Time") // Date filter
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const processedEventIdRef = useRef(null) // Track processed event IDs to avoid infinite loops

  // Check if user is logged in and is a member (members can register)
  // IMPORTANT: This page NEVER modifies authentication state
  // It only reads the user state from AuthProvider
  // AuthProvider only authenticates if localStorage has a token
  // If user is null, they are NOT logged in - no exceptions
  // CRITICAL: Only check user properties after auth has loaded to prevent errors
  const isMember = !authLoading && user && user.role === 'member'
  const isLoggedIn = !authLoading && !!user // Check if user is logged in (any role) and auth is loaded
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (!authLoading) {
      console.log('[AllEvents] Auth state - user:', user ? user.email : 'null', 'isLoggedIn:', isLoggedIn, 'isMember:', isMember)
      console.log('[AllEvents] localStorage token:', localStorage.getItem('authToken') ? 'exists' : 'none')
    }
  }, [user, authLoading, isLoggedIn, isMember])

  // Fetch events on mount (only once)
  useEffect(() => {
    fetchEvents()
  }, [])

  // Set filter based on auth state and URL params (wait for auth to load)
  useEffect(() => {
    // CRITICAL: Wait for auth to fully load before setting filter
    // This prevents errors when non-logged-in users navigate to the page
    if (authLoading) {
      console.log('[AllEvents] Waiting for auth to load...')
      return // Don't run until auth is loaded
    }
    
    console.log('[AllEvents] Auth loaded - user:', user ? user.email : 'null', 'isLoggedIn:', isLoggedIn)
    
    // Check if URL has filter parameter
    const urlParams = new URLSearchParams(window.location.search)
    const filterParam = urlParams.get('filter')
    
    if (filterParam && ['all', 'upcoming', 'past'].includes(filterParam)) {
      console.log('[AllEvents] Setting filter from URL:', filterParam)
      setFilter(filterParam)
    } else if (!isLoggedIn) {
      // For non-logged-in users, default to "upcoming" if no filter specified
      console.log('[AllEvents] Non-logged-in user, defaulting to "upcoming" filter')
      setFilter("upcoming")
    } else {
      // Logged-in users default to "all"
      console.log('[AllEvents] Logged-in user, defaulting to "all" filter')
      setFilter("all")
    }
    
  }, [authLoading, isLoggedIn, user])

  // Adjust filters to show event if event ID is in URL (runs once when events load)
  useEffect(() => {
    if (events.length > 0 && !loading) {
      const urlParams = new URLSearchParams(window.location.search)
      const eventIdParam = urlParams.get('event')
      
      if (eventIdParam && processedEventIdRef.current !== eventIdParam) {
        // Find the event in the events array
        const targetEvent = events.find(e => e._id === eventIdParam)
        
        if (targetEvent) {
          processedEventIdRef.current = eventIdParam
          
          // If event exists but might be filtered out, adjust filters to show it
          const eventDate = new Date(targetEvent.date)
          const now = new Date()
          const isUpcoming = eventDate >= now
          
          // Adjust date filter if needed to show the event
          if (filter === "upcoming" && !isUpcoming) {
            setFilter("all")
          } else if (filter === "past" && isUpcoming) {
            setFilter("all")
          }
          
          // Adjust category filter if needed
          if (categoryFilter !== "All" && targetEvent.category !== categoryFilter) {
            setCategoryFilter("All")
          }
          
          // Adjust date range filter if needed - check if event matches current date filter
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
          
          let shouldResetDateFilter = false
          if (dateFilter !== "All Time") {
            // Check if event matches current date filter
            const matches = (() => {
              if (dateFilter === "Today") return eventDateOnly.getTime() === today.getTime()
              if (dateFilter === "This Week") {
                const weekStart = new Date(today)
                weekStart.setDate(today.getDate() - today.getDay())
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                return eventDateOnly >= weekStart && eventDateOnly <= weekEnd
              }
              if (dateFilter === "This Month") {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                return eventDateOnly >= monthStart && eventDateOnly <= monthEnd
              }
              if (dateFilter === "Next Month") {
                const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
                const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
                return eventDateOnly >= nextMonthStart && eventDateOnly <= nextMonthEnd
              }
              if (dateFilter === "Next 3 Months") {
                const threeMonthsEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)
                return eventDateOnly >= today && eventDateOnly <= threeMonthsEnd
              }
              if (dateFilter === "Next 6 Months") {
                const sixMonthsEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0)
                return eventDateOnly >= today && eventDateOnly <= sixMonthsEnd
              }
              return true
            })()
            
            if (!matches) {
              shouldResetDateFilter = true
            }
          }
          
          if (shouldResetDateFilter) {
            setDateFilter("All Time")
          }
        }
      }
    }
  }, [events, loading]) // Only depend on events and loading, not on filter states

  // Scroll to event after filters are applied and filtered events are rendered
  useEffect(() => {
    if (events.length > 0 && !loading) {
      const urlParams = new URLSearchParams(window.location.search)
      const eventIdParam = urlParams.get('event')
      
      if (eventIdParam) {
        // Wait a bit for filters to apply and DOM to update
        const scrollTimeout = setTimeout(() => {
          const eventElement = document.getElementById(`event-${eventIdParam}`)
          if (eventElement) {
            eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            eventElement.style.border = '2px solid #1e3a8a'
            eventElement.style.boxShadow = '0 0 20px rgba(30, 58, 138, 0.3)'
            setTimeout(() => {
              eventElement.style.border = ''
              eventElement.style.boxShadow = ''
            }, 3000)
          }
        }, 600)
        
        return () => clearTimeout(scrollTimeout)
      }
    }
  }, [events, loading, filter, categoryFilter, dateFilter]) // Scroll when filters or events change

  async function fetchEvents() {
    try {
      setLoading(true)
      const res = await getEvents()
      if (res.events) {
        // Filter out announcements, activities, and news - only show actual events
        // Backend should already filter, but double-check on frontend
        const eventsOnly = res.events.filter(event => 
          event.type === 'event' && event.category !== 'News'
        )
        // Sort by date (upcoming first)
        const sorted = eventsOnly.sort((a, b) => new Date(a.date) - new Date(b.date))
        setEvents(sorted)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time updates: Auto-refresh every 30 seconds
  useEffect(() => {
    // Set up polling for automatic refresh (30 seconds)
    const pollInterval = setInterval(() => {
      fetchEvents()
    }, 30000) // Poll every 30 seconds

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  function handleEventClick(event) {
    console.log('handleEventClick called with event:', event)
    if (!event || !event._id) {
      console.error('Invalid event passed to handleEventClick:', event)
      return
    }
    
    // CRITICAL: Wait for auth to load before checking
    if (authLoading) {
      console.log('[handleEventClick] Auth still loading, please wait...')
      return
    }
    
    // STRICT CHECK: Only allow logged-in members to open the registration modal
    // This ensures non-logged-in users cannot register
    // Backend also enforces authentication via 'authenticate' middleware
    if (!user || !isLoggedIn || !isMember) {
      console.log('[handleEventClick] User is not logged in or not a member, cannot open registration modal')
      // Redirect to login if user tries to register without being logged in
      if (!isLoggedIn) {
        console.log('[handleEventClick] Redirecting non-logged-in user to login page')
        window.location.href = '/login'
      } else {
        // User is logged in but not a member - show message
        alert('Only members can register for events. Please contact admin if you believe this is an error.')
      }
      return
    }
    console.log('[handleEventClick] Setting selectedEvent and opening modal...')
    setSelectedEvent(event)
    setIsModalOpen(true)
    console.log('[handleEventClick] Modal state updated - selectedEvent:', event._id, 'isModalOpen: true')
  }

  async function handleModalClose() {
    setIsModalOpen(false)
    setSelectedEvent(null)
    // Refresh events after registration changes
    await fetchEvents()
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  function isRegistered(event) {
    // Only check registration for logged-in members
    // Non-logged-in users should never see registered status
    // CRITICAL: Check authLoading first to prevent errors when auth is still loading
    if (authLoading || !isLoggedIn || !isMember || !event.registeredUsers || !user) {
      return false
    }
    return event.registeredUsers.some(regUser => 
      typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
    )
  }

  function getCategoryColor(category) {
    const colors = {
      Cultural: "#4a6fa5",
      Academic: "#5cb85c",
      Social: "#f56565",
      News: "#9b59b6",
      Announcement: "#e67e22",
      Activity: "#3498db"
    }
    return colors[category] || "#7f8c8d"
  }

  // Get unique categories from events
  const getUniqueCategories = () => {
    const categories = new Set()
    events.forEach(event => {
      if (event.category && !event.cancelled) {
        categories.add(event.category)
      }
    })
    return Array.from(categories).sort()
  }

  // Check if event matches date filter
  const matchesDateFilter = (eventDate) => {
    if (dateFilter === "All Time") return true
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    
    switch (dateFilter) {
      case "Today":
        return eventDateOnly.getTime() === today.getTime()
      
      case "This Week": {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
        return eventDateOnly >= weekStart && eventDateOnly <= weekEnd
      }
      
      case "This Month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return eventDateOnly >= monthStart && eventDateOnly <= monthEnd
      }
      
      case "Next Month": {
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return eventDateOnly >= nextMonthStart && eventDateOnly <= nextMonthEnd
      }
      
      case "Next 3 Months": {
        const threeMonthsEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)
        return eventDateOnly >= today && eventDateOnly <= threeMonthsEnd
      }
      
      case "Next 6 Months": {
        const sixMonthsEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0)
        return eventDateOnly >= today && eventDateOnly <= sixMonthsEnd
      }
      
      default:
        return true
    }
  }

  const now = new Date()
  const filteredEvents = events.filter(event => {
    // Skip cancelled events
    if (event.cancelled) return false
    
    const eventDate = new Date(event.date)
    
    // Apply date filter for both non-logged-in users and members
    if (filter === "upcoming" && eventDate < now) return false
    if (filter === "past" && eventDate >= now) return false
    
    // Apply category filter
    if (categoryFilter !== "All" && event.category !== categoryFilter) return false
    
    // Apply date range filter
    if (!matchesDateFilter(eventDate)) return false
    
    return true
  })

  if (loading || authLoading) {
    return (
      <main className="page all-events-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page all-events-page">
        <div className="error-container">
          <p>Error loading events: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page all-events-page">
      <div className="events-page-header">
        <h1 className="page-title">All Events</h1>
        {/* Show different subtitle based on user status - wait for auth to load */}
        {authLoading ? (
          <p className="page-subtitle">Loading...</p>
        ) : isLoggedIn && isMember ? (
          <p className="page-subtitle">Browse and register for events organized by ISS Yemen</p>
        ) : isLoggedIn ? (
          <p className="page-subtitle">View events and activities organized by ISS Yemen</p>
        ) : (
          <p className="page-subtitle">View events and activities organized by ISS Yemen. <a href="/login" style={{ color: 'var(--primary-dark)', textDecoration: 'underline' }}>Login</a> to register for events.</p>
        )}
      </div>

      {/* Filter Section */}
      <div className="events-filters-container">
        <div className="events-filter-row">
          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Filter by Category:</label>
            <select
              id="category-filter"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="date-filter" className="filter-label">Filter by Date:</label>
            <select
              id="date-filter"
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Next Month">Next Month</option>
              <option value="Next 3 Months">Next 3 Months</option>
              <option value="Next 6 Months">Next 6 Months</option>
            </select>
          </div>
          <div className="events-count">
            Showing {filteredEvents.length} of {events.filter(e => !e.cancelled).length} events
          </div>
        </div>
      </div>

      {/* Filter Tabs - Show for both non-logged-in users and members */}
      <div className="events-filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Events
        </button>
        <button
          className={`filter-tab ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
        >
          Past Events
        </button>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="all-events-grid">
          {filteredEvents.map(event => {
            // CRITICAL: Only check registration status if auth is loaded and user is logged in
            // This prevents errors when non-logged-in users view events
            const registered = authLoading ? false : isRegistered(event)
            const eventDate = new Date(event.date)
            const isUpcoming = eventDate >= now

            return (
              <div 
                id={`event-${event._id}`}
                key={event._id} 
                className={`event-card-large card-3d ${event.cancelled ? "cancelled" : ""}`}
                style={{ position: 'relative', scrollMarginTop: '100px' }}
              >
                <div className="event-card-header">
                  <div className="event-title-section">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-badges">
                      <span 
                        className="event-category-badge"
                        style={{ backgroundColor: getCategoryColor(event.category) }}
                      >
                        {event.category}
                      </span>
                      {registered && (
                        <span className="event-badge registered">✓ Registered</span>
                      )}
                      {event.cancelled && (
                        <span className="event-badge cancelled-badge">Cancelled</span>
                      )}
                      {!isUpcoming && !event.cancelled && (
                        <span className="event-badge past">Past</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="detail-icon">📅</span>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="event-detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{event.location}</span>
                  </div>
                  {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
                    <div className="event-detail-item" style={{ 
                      color: '#856404', 
                      fontWeight: '600'
                    }}>
                      <span className="detail-icon">💰</span>
                      <span>RM {(event.paymentAmount || event.fee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(!event.requiresPayment && (!event.paymentAmount || event.paymentAmount === 0) && (!event.fee || event.fee === 0)) && (
                    <div className="event-detail-item" style={{ 
                      color: '#28a745', 
                      fontWeight: '600'
                    }}>
                      <span className="detail-icon">🆓</span>
                      <span>Free</span>
                    </div>
                  )}
                  {event.registeredUsers && (
                    <div className="event-detail-item">
                      <span className="detail-icon">👥</span>
                      <span>{event.registeredUsers.length} registered</span>
                    </div>
                  )}
                </div>

                <p className="event-description">{event.description}</p>

                {!event.cancelled && (
                  <div className="event-actions">
                    {/* REGISTRATION ACCESS CONTROL:
                        - Logged-in Members (role: 'member'): Can register - see "Register" button
                        - Non-logged-in Users: Cannot register - see "Login to Register" link
                        - Logged-in Admins: Can view but register button only shown if isMember is true
                        - CRITICAL: Wait for auth to load before showing buttons
                    */}
                    {authLoading ? (
                      <button className="btn btn-secondary btn-3d" disabled>
                        Loading...
                      </button>
                    ) : isMember ? (
                      registered ? (
                        <button
                          className="btn btn-secondary btn-3d"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          Unregister
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-3d"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Register button clicked!', event)
                            if (event && event._id) {
                              handleEventClick(event)
                            } else {
                              console.error('Event is invalid:', event)
                              alert('Error: Event data is missing. Please refresh the page.')
                            }
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 9999,
                            touchAction: 'manipulation'
                          }}
                        >
                          Register
                        </button>
                      )
                    ) : (
                      /* Non-logged-in Users - View Only, Cannot Register
                         - They can ONLY VIEW events
                         - They CANNOT register
                         - They must login first to register
                         - After login, they will see "Register" button instead
                      */
                      <a 
                        href="/login" 
                        className="btn btn-primary btn-3d"
                        onClick={(e) => {
                          // Store the current page URL so user can return after login
                          const currentUrl = window.location.pathname + window.location.search
                          sessionStorage.setItem('redirectAfterLogin', currentUrl)
                        }}
                      >
                        Login to Register
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No events found matching your filter.</p>
        </div>
      )}

      {/* Registration Modal */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onRegistrationChange={fetchEvents}
        user={user}
      />
    </main>
  )
}


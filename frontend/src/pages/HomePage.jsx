import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import HODCard from "../components/HODCard.jsx"
import HODModal from "../components/HODModal.jsx"
import EventRegistrationModal from "../components/EventRegistrationModal.jsx"
import { getHomepageData, getUpcomingEvents } from "../api/events.js"
import { getHODs } from "../api/hods.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/home.css"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({ news: 0, announcements: 0, activities: 0 })
  const [latestNewsAndAnnouncements, setLatestNewsAndAnnouncements] = useState([])
  const [regularActivities, setRegularActivities] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [hods, setHods] = useState([])
  const [showHODModal, setShowHODModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)

  // Check if user is member or admin - more robust check
  const isMember = user && user.role && (user.role === 'member' || user.role === 'admin')

  // Fetch data function (extracted for reuse)
  const fetchData = async () => {
    try {
      setLoading(true)
      const [homepageData, eventsData, hodsData] = await Promise.all([
        getHomepageData(),
        (user && (user.role === 'member' || user.role === 'admin')) ? getUpcomingEvents() : Promise.resolve({ events: [] }),
        getHODs().catch(() => ({ hods: [] })) // Fetch HODs for all users (members and visitors)
      ])
      
      setSummary(homepageData.summary || { news: 0, announcements: 0, activities: 0 })
      const newsAndAnnouncements = homepageData.latestNewsAndAnnouncements || []
      setLatestNewsAndAnnouncements(newsAndAnnouncements)
      setRegularActivities(homepageData.regularActivities || [])
      
      if (eventsData.events) {
        // Filter out announcements, activities, and news - only show actual events
        const eventsOnly = eventsData.events.filter(event => 
          event.type === 'event' && event.category !== 'News'
        )
        setUpcomingEvents(eventsOnly)
        // Filter events where user is registered
        const registered = eventsOnly.filter(event => 
          event.registeredUsers?.some(regUser => 
            typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
          )
        )
        setRegisteredEvents(registered)
      }
      
      // Set HODs for all users
      if (hodsData && hodsData.hods) {
        setHods(hodsData.hods)
      } else {
        setHods([])
      }
      
      setError(null)
    } catch (err) {
      console.error("Failed to fetch homepage data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {

    fetchData()
  }, [user, isMember])

  // Real-time updates: Auto-refresh every 30 seconds + on visibility change
  useEffect(() => {
    // Set up polling for automatic refresh (30 seconds)
    const pollInterval = setInterval(() => fetchData(), 30000)

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchData()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for HOD updates
    const handleHODUpdate = () => {
      console.log('[HomePage] HOD data updated, refreshing...')
      fetchData()
    }
    window.addEventListener('hodDataUpdated', handleHODUpdate)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('hodDataUpdated', handleHODUpdate)
    }
  }, [user, isMember])

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  async function handleEventClick(event) {
    console.log('Join Event clicked for:', event?.title, event)
    if (!event) {
      console.error('Event is undefined!')
      return
    }
    setSelectedEvent(event)
    setIsRegistrationModalOpen(true)
    console.log('Modal should open now')
  }

  async function handleModalClose() {
    setIsRegistrationModalOpen(false)
    setSelectedEvent(null)
    // Refresh events after registration changes
    const eventsData = await getUpcomingEvents()
    if (eventsData.events) {
      // Filter out announcements, activities, and news - only show actual events
      const eventsOnly = eventsData.events.filter(event => 
        event.type === 'event' && event.category !== 'News'
      )
      setUpcomingEvents(eventsOnly)
      const registered = eventsOnly.filter(event => 
        event.registeredUsers?.some(regUser => 
          typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
        )
      )
      setRegisteredEvents(registered)
    }
  }

  function isRegistered(event) {
    return event.registeredUsers?.some(regUser => 
      typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
    )
  }

  if (loading || authLoading) {
    return (
      <main className="page home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page home-page">
        <div className="error-container">
          <p>Error loading data: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page home-page">
      {/* Hero Section */}
      <section className="hero-card card-3d">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to ISS Yemen</h1>
          <p className="hero-subtitle">Your central hub for news, events and activities for Yemeni students at UTM.</p>
          <div className="hero-actions">
            {user && user.role === 'member' ? (
              <>
                <a className="btn btn-primary btn-3d" href="/all-events">Join Events</a>
                <button 
                  className="btn btn-secondary btn-3d" 
                  onClick={() => setShowHODModal(true)}
                >
                  View HOD profiles
                </button>
              </>
            ) : user && user.role === 'admin' ? (
              <>
                <a className="btn btn-primary btn-3d" href="/all-events">Join Events</a>
                <button 
                  className="btn btn-secondary btn-3d" 
                  onClick={() => setShowHODModal(true)}
                >
                  View HOD profiles
                </button>
              </>
            ) : (
              <>
                <a className="btn btn-primary btn-3d" href="/all-events?filter=upcoming">View Upcoming Events</a>
                <button 
                  className="btn btn-secondary btn-3d" 
                  onClick={() => setShowHODModal(true)}
                >
                  View HOD profiles
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero-metrics">
          <div className="metric metric-3d">
            <div className="metric-value">{summary.news}</div>
            <div className="metric-label">News</div>
          </div>
          <div className="metric metric-3d">
            <div className="metric-value">{summary.announcements}</div>
            <div className="metric-label">Announcements</div>
          </div>
          <div className="metric metric-3d">
            <div className="metric-value">{summary.activities}</div>
            <div className="metric-label">Activities</div>
          </div>
        </div>
      </section>

      {/* Registered Events Section - Visible for all logged-in users */}
      {user && registeredEvents.length > 0 && (
        <section className="registered-events-section">
          <div className="section-card card-3d">
            <div className="section-header">
              <h2 className="section-title">Your Registered Events</h2>
              <span className="badge">{registeredEvents.length}</span>
            </div>
            <div className="events-grid">
              {registeredEvents.map(event => {
                // Check if event has payment receipt for this user
                const hasReceipt = event.registrations?.some(reg => 
                  (typeof reg.user === 'object' ? reg.user._id : reg.user) === user?.id &&
                  reg.paymentReceipt
                )
                const registration = event.registrations?.find(reg => 
                  (typeof reg.user === 'object' ? reg.user._id : reg.user) === user?.id
                )
                
                return (
                  <div key={event._id} className="event-card card-3d">
                    <div className="event-card-header">
                      <h3 className="event-title">{event.title}</h3>
                      <span className="event-badge registered">Registered</span>
                    </div>
                    <div className="event-details">
                      <p className="event-date">📅 {formatDate(event.date)}</p>
                      <p className="event-location">📍 {event.location}</p>
                      {event.requiresPayment && event.paymentAmount > 0 && (
                        <p className="event-payment" style={{ 
                          color: '#856404', 
                          fontWeight: '600',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          💰 Payment Required: RM {event.paymentAmount.toFixed(2)}
                          {registration?.paymentReceipt && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              fontSize: '0.85rem',
                              color: registration.paymentReceipt.paymentStatus === 'Verified' ? '#155724' : 
                                     registration.paymentReceipt.paymentStatus === 'Rejected' ? '#721c24' : '#856404'
                            }}>
                              ({registration.paymentReceipt.paymentStatus})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <p className="event-description">{event.description}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {registration?.paymentReceipt?.receiptUrl ? (
                        <button
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Open proof of payment in new tab
                            const receiptUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${registration.paymentReceipt.receiptUrl}`
                            window.open(receiptUrl, '_blank')
                          }}
                          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                          👁️ View Proof of Payment
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                          No payment proof uploaded
                        </span>
                      )}
                      {registration?.paymentReceipt?.paymentStatus === 'Verified' && (
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                            const downloadUrl = `${API_BASE_URL}/api/receipts/event/${event._id}/download?userId=${user?.id}&format=pdf`
                            window.open(downloadUrl, '_blank')
                          }}
                          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', position: 'relative', zIndex: 10, cursor: 'pointer' }}
                        >
                          📄 Download Official Receipt
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section - Visible for all logged-in users */}
      {user && upcomingEvents.length > 0 && (
        <section className="upcoming-events-section">
          <div className="section-card card-3d">
            <div className="section-header">
              <h2 className="section-title">Upcoming Events</h2>
              <span className="badge">{upcomingEvents.length}</span>
            </div>
            <p className="section-subtitle">
              Register for events directly from this section. Click "Join Event" on any event below to register.
            </p>
            <div className="events-grid">
              {upcomingEvents.slice(0, 4).map(event => {
                const registered = isRegistered(event)
                return (
                  <div 
                    key={event._id} 
                    className="event-card card-3d"
                    style={{ position: 'relative', overflow: 'visible' }}
                  >
                    <div className="event-card-header">
                      <h3 className="event-title">{event.title}</h3>
                      {registered && <span className="event-badge registered">Registered</span>}
                    </div>
                    <div className="event-details">
                      <p className="event-date">📅 {formatDate(event.date)}</p>
                      <p className="event-location">📍 {event.location}</p>
                      {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
                        <p className="event-payment" style={{ 
                          color: '#856404', 
                          fontWeight: '600',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          💰 Payment Required: RM {(event.paymentAmount || event.fee || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="event-description">
                      {event.description && event.description.length > 150 
                        ? `${event.description.substring(0, 150)}...` 
                        : event.description}
                    </p>
                    <div className="event-actions" onClick={(e) => e.stopPropagation()}>
                      {event && event._id ? (
                        <Link
                          to={`/all-events?event=${event._id}`}
                          className="btn btn-primary btn-3d"
                          style={{ 
                            textDecoration: 'none',
                            display: 'inline-block',
                            textAlign: 'center',
                            cursor: 'pointer',
                            width: '100%',
                            position: 'relative',
                            zIndex: 10002,
                            pointerEvents: 'auto',
                            touchAction: 'manipulation',
                            userSelect: 'none'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('View Details clicked for event:', event._id, 'Navigating to:', `/all-events?event=${event._id}`)
                          }}
                        >
                          View Details
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-3d"
                          disabled
                          style={{ 
                            textDecoration: 'none',
                            display: 'inline-block',
                            textAlign: 'center',
                            cursor: 'not-allowed',
                            width: '100%',
                            opacity: 0.6
                          }}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <section className="grid-two-columns">
        <div className="main-column">
          {/* News & Announcements */}
          <div className="section-card card-3d">
            <h2 className="section-title">Latest News & Announcements</h2>
            <p className="section-subtitle">
              Stay informed about what is happening in ISS Yemen.
            </p>
            {latestNewsAndAnnouncements.length > 0 ? (
              <div className="news-list">
                {latestNewsAndAnnouncements.map(item => (
                  <article key={item._id} className="news-item card-3d">
                    {item.imageUrl && (
                      <div className="news-image-container">
                        <img 
                          src={item.imageUrl.startsWith('http') ? item.imageUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${item.imageUrl}`}
                          alt={item.title} 
                          className="news-image"
                          loading="lazy"
                          onError={(e) => {
                            const attemptedUrl = item.imageUrl.startsWith('http') ? item.imageUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${item.imageUrl}`;
                            console.error('Image failed to load:', {
                              originalUrl: item.imageUrl,
                              attemptedUrl: attemptedUrl,
                              itemTitle: item.title
                            });
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', item.imageUrl);
                          }}
                        />
                      </div>
                    )}
                    <div className="news-header">
                      <h3 className="news-title">{item.title}</h3>
                      <span className="news-badge">{item.type === 'announcement' ? 'Announcement' : item.category}</span>
                    </div>
                    <p className="news-meta">
                      📅 {formatDate(item.date)}
                    </p>
                    <p className="news-description">{item.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No news or announcements at this time.</p>
            )}
          </div>

          {/* HOD Profiles Preview (Available for all users) */}
          {hods.length > 0 && (
            <div className="section-card card-3d">
              <div className="section-header">
                <h2 className="section-title">HOD Profiles</h2>
                <button 
                  className="view-all-btn btn-3d"
                  onClick={() => setShowHODModal(true)}
                >
                  View All
                </button>
              </div>
              <div className="hod-grid">
                {hods.slice(0, 3).map(h => (
                  <HODCard key={h._id || h.id} hod={h} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="section-card card-3d sticky-card">
            <div className="section-header">
              <h3 className="section-title">Activities</h3>
              <a href="/activities" className="view-all-btn btn-3d">View All</a>
            </div>
            <p className="section-subtitle">
              Join ongoing programmes and gatherings.
            </p>
            {regularActivities.length > 0 ? (
              <div className="activities-list">
                {regularActivities.slice(0, 2).map(act => (
                  <div key={act._id} className="activity-item card-3d">
                    <div className="activity-icon">🎯</div>
                    <div className="activity-content">
                      <strong className="activity-title">{act.title}</strong>
                      <div className="activity-meta">
                        {act.schedule || formatDate(act.date)} • {act.location}
                      </div>
                      {act.category && (
                        <span className="activity-category">{act.category}</span>
                      )}
                    </div>
                  </div>
                ))}
                {regularActivities.length > 2 && (
                  <a href="/activities" className="link-btn btn-3d">
                    View all {regularActivities.length} activities →
                  </a>
                )}
              </div>
            ) : (
              <>
                <p className="empty-state">No activities scheduled.</p>
                <a href="/activities" className="link-btn btn-3d">View all activities →</a>
              </>
            )}
          </div>
        </aside>
      </section>

      {/* HOD Modal (Available for all users) */}
      <HODModal 
        hods={hods} 
        isOpen={showHODModal} 
        onClose={() => setShowHODModal(false)} 
      />

      {/* Event Registration Modal */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={isRegistrationModalOpen}
        onClose={handleModalClose}
        onRegistrationChange={handleModalClose}
        user={user}
      />
    </main>
  )
}

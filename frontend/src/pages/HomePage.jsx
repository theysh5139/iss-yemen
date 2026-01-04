import { useState, useEffect } from "react"
import HODCard from "../components/HODCard.jsx"
import HODModal from "../components/HODModal.jsx"
import EventRegistrationModal from "../components/EventRegistrationModal.jsx"
import { getHomepageData, getUpcomingEvents } from "../api/events.js"
import { getHODs } from "../api/hods.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/home.css"

export default function HomePage() {
  const { user } = useAuth()
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

  const isMember = user && (user.role === 'member' || user.role === 'admin')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [homepageData, eventsData, hodsData] = await Promise.all([
          getHomepageData(),
          isMember ? getUpcomingEvents() : Promise.resolve({ events: [] }),
          getHODs().catch(() => ({ hods: [] })) // Fetch HODs for all users (members and visitors)
        ])
        
        setSummary(homepageData.summary || { news: 0, announcements: 0, activities: 0 })
        setLatestNewsAndAnnouncements(homepageData.latestNewsAndAnnouncements || [])
        setRegularActivities(homepageData.regularActivities || [])
        
        if (eventsData.events) {
          setUpcomingEvents(eventsData.events)
          // Filter events where user is registered
          const registered = eventsData.events.filter(event => 
            event.registeredUsers?.some(regUser => 
              typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
            )
          )
          setRegisteredEvents(registered)
        }
        
        // Set HODs for all users
        if (hodsData && hodsData.hods) {
          setHods(hodsData.hods)
          console.log(`Loaded ${hodsData.hods.length} HOD profiles for display`)
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
    fetchData()
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
      setUpcomingEvents(eventsData.events)
      const registered = eventsData.events.filter(event => 
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

  if (loading) {
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
            {isMember ? (
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
                <a className="btn btn-primary btn-3d" href="/events">View upcoming events</a>
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

      {/* Registered Events Section (Members Only) */}
      {isMember && registeredEvents.length > 0 && (
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
                      <a href={`/events#${event._id}`} className="event-link">View Details →</a>
                      {hasReceipt && (
                        <>
                          <a 
                            href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/receipts/event/${event._id}/download`}
                            target="_blank"
                            className="event-link"
                            style={{ color: '#1e3a8a' }}
                          >
                            📥 Download Receipt
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section (Members Only) */}
      {isMember && upcomingEvents.length > 0 && (
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
              {upcomingEvents.map(event => {
                const registered = isRegistered(event)
                return (
                  <div 
                    key={event._id} 
                    className="event-card card-3d"
                  >
                    <div className="event-card-header">
                      <h3 className="event-title">{event.title}</h3>
                      {registered && <span className="event-badge registered">Registered</span>}
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
                        </p>
                      )}
                    </div>
                    <p className="event-description">{event.description}</p>
                    <div className="event-actions">
                      {registered ? (
                        <button
                          className="btn btn-secondary btn-3d"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          View Details / Unregister
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-3d"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Join Event button clicked!', event)
                            if (event && event._id) {
                              handleEventClick(event)
                            } else {
                              console.error('Event is invalid:', event)
                              alert('Error: Event data is missing. Please refresh the page.')
                            }
                          }}
                          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                          disabled={!event || !event._id}
                        >
                          Join Event
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
            <h3 className="section-title">Regular Activities</h3>
            <p className="section-subtitle">
              Join ongoing programmes and gatherings.
            </p>
            {regularActivities.length > 0 ? (
              <div className="activities-list">
                {regularActivities.map(act => (
                  <div key={act._id} className="activity-item card-3d">
                    <div className="activity-icon">🎯</div>
                    <div className="activity-content">
                      <strong className="activity-title">{act.title}</strong>
                      <div className="activity-meta">
                        {act.schedule || formatDate(act.date)} • {act.location}
                      </div>
                    </div>
                  </div>
                ))}
                <a href="/events" className="link-btn btn-3d">See all activities & events →</a>
              </div>
            ) : (
              <>
                <p className="empty-state">No regular activities scheduled.</p>
                <a href="/events" className="link-btn btn-3d">See all activities & events →</a>
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

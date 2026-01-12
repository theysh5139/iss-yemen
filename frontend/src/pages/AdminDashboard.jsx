import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getUpcomingEvents, getEvents } from "../api/events.js"
import { getAdminStats, getAllAnnouncements } from "../api/admin.js"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import "../styles/admin-dashboard.css"

export default function AdminDashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    views: 0,
    totalUsers: 0,
    totalEvents: 0,
    activeAnnouncements: 0
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [latestNews, setLatestNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchDashboardData()
    
    // Listen for admin data updates (news, events, etc.)
    const handleDataUpdate = () => {
      console.log("Admin data updated, refreshing dashboard...")
      fetchDashboardData()
    }
    
    window.addEventListener('adminDataUpdated', handleDataUpdate)
    
    // Also refresh when page becomes visible (user returns to dashboard)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('adminDataUpdated', handleDataUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const [statsData, eventsData, announcementsData] = await Promise.all([
        getAdminStats(),
        getUpcomingEvents(),
        getAllAnnouncements()
      ])
      
      if (statsData) {
        setStats(statsData)
      }
      
      if (eventsData?.events) {
        // Filter out announcements - they should not appear in upcoming events
        const eventsOnly = eventsData.events.filter(event => event.type !== 'announcement')
        setUpcomingEvents(eventsOnly.slice(0, 5))
      }

      // Fetch latest news and announcements
      const allEventsData = await getEvents()
      const latestPosts = []
      
      // Get News posts (type='event', category='News')
      if (allEventsData?.events) {
        const news = allEventsData.events
          .filter(e => e.type === 'event' && e.category === 'News')
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
        latestPosts.push(...news)
      }
      
      // Get Announcements (type='announcement')
      if (announcementsData?.announcements) {
        const announcements = announcementsData.announcements
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
        latestPosts.push(...announcements)
      }
      
      // Sort all posts by date (newest first) and take latest 5
      const sortedPosts = latestPosts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
      
      setLatestNews(sortedPosts)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true }) // Redirect to homepage
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      <div className="admin-main-content">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
            <div className="breadcrumbs">
              <span>Dashboard</span>
            </div>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        {/* Main Content */}
        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Dashboard</h1>
              <p>Hello, {user?.name || 'Admin'}</p>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <div className="card-label">Views</div>
                  <div className="card-value">{stats.views.toLocaleString()}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <div className="card-label">Total Users</div>
                  <div className="card-value">{stats.totalUsers}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📅</div>
                <div className="card-content">
                  <div className="card-label">Total Events</div>
                  <div className="card-value">{stats.totalEvents}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📢</div>
                <div className="card-content">
                  <div className="card-label">Active Announcements</div>
                  <div className="card-value">{stats.activeAnnouncements}</div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="content-section">
              <h2 className="section-title">Upcoming Events</h2>
              <div className="events-list">
                {loading ? (
                  <p>Loading events...</p>
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <div key={event._id} className="event-card">
                      <div className="event-info">
                        <h3 className="event-title">Event {upcomingEvents.indexOf(event) + 1}: {event.title}</h3>
                        <div className="event-meta">
                          <span>📅 {formatDate(event.date)}</span>
                          <span>📍 {event.location}</span>
                        </div>
                      </div>
                      <button className="view-btn">View +</button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No upcoming events</p>
                )}
              </div>
            </div>

            {/* Latest News & Announcements Posts */}
            <div className="content-section">
              <h2 className="section-title">Latest News & Announcements</h2>
              <p className="section-subtitle">Recent posts published from News & Announcements</p>
              <div className="news-list">
                {loading ? (
                  <p>Loading news...</p>
                ) : latestNews.length > 0 ? (
                  latestNews.map(post => (
                    <div key={post._id} className="news-card">
                      <div className="news-info">
                        <div className="news-header-row">
                          <h3 className="news-title">{post.title}</h3>
                          <span className="news-type-badge">
                            {(() => {
                              // Check if it's an announcement
                              if (post.type === 'announcement') {
                                return 'Announcement'
                              }
                              // Check if it's a news post (event with News category)
                              if (post.type === 'event' && post.category === 'News') {
                                return 'News'
                              }
                              // Check if displayType is set (from our mapping)
                              if (post.displayType) {
                                return post.displayType
                              }
                              // Default to category or 'News'
                              return post.category || 'News'
                            })()}
                          </span>
                        </div>
                        <p className="news-description">{post.description}</p>
                        <div className="news-meta">
                          <span>📅 {formatDate(post.date)}</span>
                          {post.location && <span>📍 {post.location}</span>}
                          <span>👤 {user?.name || 'Admin'}</span>
                        </div>
                      </div>
                      <button 
                        className="view-btn"
                        onClick={() => navigate('/admin/news')}
                      >
                        Manage +
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No news or announcements posted yet. <a href="/admin/news">Create one now</a></p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="admin-sidebar-right">
            <div className="sidebar-section">
              <h3 className="sidebar-title">Quick Actions</h3>
              <div className="quick-actions">
                <button 
                  className="quick-action-btn" 
                  onClick={() => navigate("/admin/events")}
                >
                  📅 Add New Event +
                </button>
                <button 
                  className="quick-action-btn" 
                  onClick={() => navigate("/admin/news")}
                >
                  📢 Post Announcement +
                </button>
                <button 
                  className="quick-action-btn" 
                  onClick={() => navigate("/admin/users")}
                >
                  👥 Manage Users +
                </button>
                <button 
                  className="quick-action-btn" 
                  onClick={() => navigate("/admin/committees")}
                >
                  👔 Manage Committees +
                </button>
                <button 
                  className="quick-action-btn" 
                  onClick={() => navigate("/admin/aboutus")}
                >
                  📝 Edit About Us +
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">Quick Links</h3>
              <div className="quick-links">
                <a href="https://www.whatsapp.com/channel/0029VaxSoEV7DAWpxM5ucw0l" target="_blank" rel="noopener noreferrer" className="quick-link">
                  <span>📱</span> WhatsApp Community
                </a>
                <a href="https://www.instagram.com/issyemen/" target="_blank" rel="noopener noreferrer" className="quick-link">
                  <span>📷</span> Instagram
                </a>
                <a href="https://linktr.ee/ISS_YEMEN25" target="_blank" rel="noopener noreferrer" className="quick-link">
                  <span>🔗</span> Linktree
                </a>
                <a href="https://my.utm.my/home" target="_blank" rel="noopener noreferrer" className="quick-link">
                  <span>🏢</span> UTM Portal
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="admin-footer">
          <p>© ISS Yemen WebApp by Beta Blockers 2025</p>
        </footer>
      </div>
    </div>
  )
}


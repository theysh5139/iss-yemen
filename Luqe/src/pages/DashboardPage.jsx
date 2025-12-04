import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../store.js'

export default function DashboardPage() {
	const navigate = useNavigate()
	const [announcements, setAnnouncements] = useState([])
	const events = store.getEvents()
	const members = store.getMembers()

	useEffect(() => {
		fetch('/api/news?limit=5')
			.then(res => res.json())
			.then(data => setAnnouncements(data))
			.catch(err => console.error('Failed to fetch news:', err))
	}, [])

	// Calculate metrics
	const totalViews = 7265 // Placeholder
	const totalUsers = members.length
	const totalEvents = events.filter(e => e.status === 'active').length
	const activeAnnouncements = announcements.length

	// Get upcoming events (next 3)
	const upcomingEvents = events
		.filter(e => e.status === 'active')
		.sort((a, b) => new Date(a.date) - new Date(b.date))
		.slice(0, 3)


	return (
		<div className="dashboard-layout">
			<div className="dashboard-topbar">
				<div className="breadcrumbs">Dashboard &gt;</div>
				<div className="topbar-icons">
					<button className="icon-btn">🔔</button>
					<button className="icon-btn">⚙️</button>
					<button className="icon-btn">🔍</button>
				</div>
			</div>

			<div className="dashboard-content">
				<div className="dashboard-main">
					<h1 className="dashboard-title">Dashboard</h1>
					<p className="dashboard-greeting">Hello, Admin</p>

					<div className="metrics-grid">
						<div className="metric-card">
							<div className="metric-header">
								<span>Views</span>
								<span className="metric-icon">📈</span>
							</div>
							<div className="metric-value">{totalViews.toLocaleString()}</div>
						</div>
						<div className="metric-card">
							<div className="metric-header">
								<span>Total Users</span>
								<span className="metric-icon">📈</span>
							</div>
							<div className="metric-value">{totalUsers.toLocaleString()}</div>
						</div>
						<div className="metric-card">
							<div className="metric-header">
								<span>Total Events</span>
								<span className="metric-icon">📈</span>
							</div>
							<div className="metric-value">{totalEvents}</div>
						</div>
						<div className="metric-card">
							<div className="metric-header">
								<span>Active Announcements</span>
								<span className="metric-icon">📈</span>
							</div>
							<div className="metric-value">{activeAnnouncements}</div>
						</div>
					</div>

					<div className="dashboard-section">
						<h2 className="section-heading">Upcoming Events</h2>
						<div className="events-list">
							{upcomingEvents.map((event, idx) => (
								<div key={event.id || idx} className="event-item">
									<div className="event-info">
										<div className="event-title">Event {idx + 1}</div>
										<div className="event-desc">{event.description || 'This event comprises of ISS Yemen\'s...'}</div>
										<div className="event-meta">
											<span>📅 {new Date(event.date).toLocaleDateString('en-GB')}</span>
											<span>📍 {event.location || 'Student Union Building'}</span>
										</div>
									</div>
									<button className="view-btn" onClick={() => navigate('/events')}>View +</button>
								</div>
							))}
							{upcomingEvents.length === 0 && (
								<div className="empty-state">No upcoming events</div>
							)}
						</div>
					</div>

					<div className="dashboard-section">
						<h2 className="section-heading">Latest News Posts</h2>
						<div className="events-list">
							{announcements.slice(0, 5).map((ann, idx) => (
								<div key={ann._id || ann.id || idx} className="event-item">
									<div className="event-info">
										<div className="event-title">{ann.title || `News ${idx + 1}`}</div>
										<div className="event-desc">{ann.body?.substring(0, 100) || 'News description...'}{ann.body?.length > 100 ? '...' : ''}</div>
										<div className="event-meta">
											<span>📅 {new Date(ann.publishDate || ann.createdAt).toLocaleDateString('en-GB')}</span>
											<span>✍️ {ann.author || 'Admin'}</span>
										</div>
									</div>
									<button className="view-btn" onClick={() => navigate('/announcements')}>View +</button>
								</div>
							))}
							{announcements.length === 0 && (
								<div className="empty-state">No news posts yet. Click "Post Announcement +" to create one.</div>
							)}
						</div>
					</div>
				</div>

				<div className="dashboard-sidebar-right">
					<div className="sidebar-section">
						<h3 className="sidebar-heading">Quick Actions</h3>
						<button className="quick-action-btn" onClick={() => navigate('/events')}>
							Add New Event +
						</button>
						<button className="quick-action-btn" onClick={() => navigate('/announcements')}>
							Post Announcement +
						</button>
						<button className="quick-action-btn" onClick={() => navigate('/members')}>
							Manage Users +
						</button>
					</div>

					<div className="sidebar-section">
						<h3 className="sidebar-heading">Quick Links</h3>
						<a href="#" className="quick-link">📱 WhatsApp Community</a>
						<a href="#" className="quick-link">📷 Instagram</a>
						<a href="#" className="quick-link">💼 LinkedIn</a>
						<a href="#" className="quick-link">🏫 UTM Portal</a>
					</div>
				</div>
			</div>
		</div>
	)
}


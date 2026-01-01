import { NavLink, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
	const location = useLocation()

	function crumb() {
		// crude breadcrumb using pathname
		const path = location.pathname.replace(/^\//, '')
		if (!path) return 'Events'
		return path.split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')
	}

	return (
		<div className="layout">
			<aside className="sidebar">
				<div className="logo">ISS YEMEN</div>
				<nav className="menu">
					<NavLink to="/events" className={({ isActive }) => isActive ? 'active-section' : undefined}>Manage Events</NavLink>
					<NavLink to="/registrations" className={({ isActive }) => isActive ? 'active-section' : undefined}>Event Registrations</NavLink>
					<NavLink to="/members" className={({ isActive }) => isActive ? 'active-section' : undefined}>Manage Members</NavLink>
				</nav>
				<div className="admin-info">
					<div className="admin-avatar" />
					<span>Admin<br />admin@graduate.utm.my</span>
				</div>
			</aside>
			<div className="main-content">
				<div className="top-nav">
					<div className="breadcrumb">
						<NavLink to="/events">Dashboard</NavLink> &nbsp;&gt;&nbsp; <span>{crumb()}</span>
					</div>
					<div className="user-actions">
						<span style={{ fontSize: '1.2em', marginRight: 12 }}>🔔</span>
						<span style={{ fontSize: '1.2em' }}>⚙️</span>
					</div>
				</div>
				{children}
			</div>
		</div>
	)
}



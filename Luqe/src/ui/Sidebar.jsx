import { NavLink, useNavigate } from 'react-router-dom'
import { store } from '../store.js'

export default function Sidebar({ activePage }) {
	const navigate = useNavigate()
	const auth = store.getAuth()

	const handleLogout = () => {
		store.logout()
		navigate('/login')
	}

	return (
		<div className="dashboard-sidebar">
			<div className="sidebar-header">
				<span className="sidebar-logo">🎓</span>
				<span className="sidebar-brand">ISS YEMEN</span>
			</div>

			<nav className="sidebar-nav">
				<NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
					<span className="nav-icon">📊</span>
					<span>Dashboard</span>
					<span className="nav-arrow">▲</span>
				</NavLink>
				<NavLink to="/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
					<span className="nav-icon">📅</span>
					<span>Manage Events</span>
					<span className="nav-arrow">▲</span>
				</NavLink>
				<NavLink to="/members" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
					<span className="nav-icon">👥</span>
					<span>Manage Users</span>
					<span className="nav-arrow">▲</span>
				</NavLink>
				<NavLink to="/announcements" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
					<span className="nav-icon">📢</span>
					<span>News & Announcements</span>
					<span className="nav-arrow">▲</span>
				</NavLink>
				<NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
					<span className="nav-icon">⚙️</span>
					<span>Settings & Help</span>
					<span className="nav-arrow">▲</span>
				</NavLink>
			</nav>

			<div className="sidebar-footer">
				<div className="user-profile">
					<div className="user-avatar">👤</div>
					<div className="user-info">
						<div className="user-name">Admin</div>
						<div className="user-email">admin@example.com</div>
					</div>
				</div>
				<button className="logout-btn" onClick={handleLogout}>Logout</button>
			</div>
		</div>
	)
}


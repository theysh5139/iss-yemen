import { NavLink } from 'react-router-dom'

export default function TopBar({ auth, onLogout }) {
	return (
		<header className="topbar">
			<div className="topbar-inner">
				<div className="brand">ISS Yemen Admin Portal</div>
				<nav className="nav">
					<NavLink to="/announcements" className={({ isActive }) => (isActive ? 'active' : undefined)}>Announcements</NavLink>
					<NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : undefined)}>Events</NavLink>
					<NavLink to="/registrations" className={({ isActive }) => (isActive ? 'active' : undefined)}>Registrations</NavLink>
					<NavLink to="/members" className={({ isActive }) => (isActive ? 'active' : undefined)}>Members</NavLink>
					{auth ? (
						<button onClick={onLogout}>Logout</button>
					) : (
						<>
							<NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : undefined)}>Login</NavLink>
							<NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : undefined)}>Register</NavLink>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}



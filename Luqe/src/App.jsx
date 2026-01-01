import { NavLink, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import EventsPage from './pages/EventsPage.jsx'
import RegistrationsPage from './pages/RegistrationsPage.jsx'
import MembersPage from './pages/MembersPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AnnouncementsPage from './pages/AnnouncementsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { store } from './store.js'
import Sidebar from './ui/Sidebar.jsx'
import FooterBar from './ui/FooterBar.jsx'

function RequireAuth({ children }) {
	const location = useLocation()
	const auth = store.getAuth()
	if (!auth) {
		return <Navigate to="/login" replace state={{ from: location }} />
	}
	return children
}

function DashboardLayout({ children }) {
	return (
		<div className="dashboard-wrapper">
			<Sidebar />
			<div className="dashboard-main-wrapper">
				{children}
				<FooterBar />
			</div>
		</div>
	)
}

export default function App() {
	const auth = store.getAuth()
	return (
		<div className="page">
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/dashboard" element={
					<RequireAuth>
						<DashboardLayout>
							<DashboardPage />
						</DashboardLayout>
					</RequireAuth>
				} />
				<Route path="/announcements" element={
					<RequireAuth>
						<DashboardLayout>
							<div className="dashboard-content">
								<div className="dashboard-main">
									<AnnouncementsPage />
								</div>
							</div>
						</DashboardLayout>
					</RequireAuth>
				} />
				<Route path="/events" element={
					<RequireAuth>
						<DashboardLayout>
							<div className="dashboard-content">
								<div className="dashboard-main">
									<EventsPage />
								</div>
							</div>
						</DashboardLayout>
					</RequireAuth>
				} />
				<Route path="/registrations" element={
					<RequireAuth>
						<DashboardLayout>
							<div className="dashboard-content">
								<div className="dashboard-main">
									<RegistrationsPage />
								</div>
							</div>
						</DashboardLayout>
					</RequireAuth>
				} />
				<Route path="/members" element={
					<RequireAuth>
						<DashboardLayout>
							<div className="dashboard-content">
								<div className="dashboard-main">
									<MembersPage />
								</div>
							</div>
						</DashboardLayout>
					</RequireAuth>
				} />
				<Route path="/settings" element={
					<RequireAuth>
						<DashboardLayout>
							<div className="dashboard-content">
								<div className="dashboard-main">
									<SettingsPage />
								</div>
							</div>
						</DashboardLayout>
					</RequireAuth>
				} />
			</Routes>
		</div>
	)
}



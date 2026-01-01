import { Route, Routes, Navigate } from 'react-router-dom'
import EventsPage from './pages/EventsPage.jsx'
import MembersPage from './pages/MembersPage.jsx'
import RegistrationsPage from './pages/RegistrationsPage.jsx'
import Layout from './components/Layout.jsx'

export default function App() {
	return (
		<Layout>
			<Routes>
				<Route path="/" element={<Navigate to="/events" replace />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/members" element={<MembersPage />} />
				<Route path="/registrations" element={<RegistrationsPage />} />
			</Routes>
		</Layout>
	)
}



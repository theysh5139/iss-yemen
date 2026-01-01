import { useMemo, useState } from 'react'
import { store } from '../store.js'

export default function RegistrationsPage() {
	const [events] = useState(() => store.getEvents())
	const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
	const [query, setQuery] = useState('')
	const [refreshKey, setRefreshKey] = useState(0)

	const registrations = useMemo(() => {
		const regs = selectedEventId ? store.getRegistrationsByEvent(selectedEventId) : []
		const q = query.trim().toLowerCase()
		if (!q) return regs
		return regs.filter(r =>
			(r.name || '').toLowerCase().includes(q) ||
			(r.email || '').toLowerCase().includes(q)
		)
	}, [selectedEventId, query, refreshKey])

	function handleDeleteRegistration(regId) {
		if (window.confirm('Remove this registration? This cannot be undone.')) {
			store.deleteRegistration(selectedEventId, regId)
			setRefreshKey(k => k + 1)
		}
	}

	const selectedEvent = events.find(e => e.id === selectedEventId)

	return (
		<div className="stack">
			<section className="card stack">
				<h2 className="section-title">Event Registrations</h2>
				<div className="row" style={{alignItems: 'stretch'}}>
					<label style={{minWidth: 260, flex: 1}}>
						Select event
						<select value={selectedEventId} onChange={(e) => {
							setSelectedEventId(e.target.value)
							setQuery('')
						}}>
							{events.length === 0 ? (
								<option value="">No events available</option>
							) : (
								events.map(e => (
									<option key={e.id} value={e.id}>{e.title} — {e.date}</option>
								))
							)}
						</select>
					</label>
					{selectedEventId && (
						<div className="row" style={{flex: 1}}>
							<input 
								placeholder="Search for registrations" 
								value={query} 
								onChange={e => setQuery(e.target.value)} 
							/>
						</div>
					)}
				</div>
			</section>

			{selectedEventId && (
				<section className="card">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Registered</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{registrations.map(r => (
								<tr key={r.id}>
									<td>{r.name}</td>
									<td>{r.email}</td>
									<td>{new Date(r.registeredAt).toLocaleString()}</td>
									<td>
										<button 
											className="danger" 
											onClick={() => handleDeleteRegistration(r.id)}
										>
											Remove
										</button>
									</td>
								</tr>
							))}
							{registrations.length === 0 && (
								<tr>
									<td colSpan="4" style={{ color: '#666' }}>
										{query ? 'No registrations found matching your search.' : 'No registrations yet for this event.'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
			)}

			{!selectedEventId && events.length > 0 && (
				<section className="card">
					<p style={{ color: '#666' }}>Please select an event to view registrations.</p>
				</section>
			)}

			{events.length === 0 && (
				<section className="card">
					<p style={{ color: '#666' }}>No events available. Create an event first to view registrations.</p>
				</section>
			)}
		</div>
	)
}

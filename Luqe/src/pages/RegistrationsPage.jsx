import { useMemo, useState } from 'react'
import { store } from '../store.js'

export default function RegistrationsPage() {
	const [events] = useState(() => store.getEvents())
	const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
	const [form, setForm] = useState({ name: '', email: '' })

	const registrations = useMemo(() => selectedEventId ? store.getRegistrationsByEvent(selectedEventId) : [], [selectedEventId])

	function addRegistration(e) {
		e.preventDefault()
		if (!selectedEventId || !form.name || !form.email) return
		store.registerUser(selectedEventId, form)
		setForm({ name: '', email: '' })
	}

	return (
		<div className="stack">
			<section className="card stack">
				<h2 className="section-title">Event Registrations</h2>
				<div className="row">
					<label style={{minWidth: 260}}>
						Select event
						<select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
							{events.map(e => (
								<option key={e.id} value={e.id}>{e.title} — {e.date}</option>
							))}
						</select>
					</label>
				</div>
			</section>

			<section className="card stack">
				<h3 className="section-title">Add test registration</h3>
				<form className="row" onSubmit={addRegistration}>
					<label style={{flex: 1}}>
						Name
						<input value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="Full name" />
					</label>
					<label style={{flex: 1}}>
						Email
						<input value={form.email} onChange={e => setForm(v => ({...v, email: e.target.value}))} placeholder="email@example.com" />
					</label>
					<button className="primary" type="submit">Register</button>
				</form>
			</section>

			<section className="card">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Registered</th>
						</tr>
					</thead>
					<tbody>
						{registrations.map(r => (
							<tr key={r.id}>
								<td>{r.name}</td>
								<td>{r.email}</td>
								<td>{new Date(r.registeredAt).toLocaleString()}</td>
							</tr>
						))}
						{registrations.length === 0 && (
							<tr>
								<td colSpan="3" style={{ color: '#9ca3af' }}>No registrations yet.</td>
							</tr>
						)}
					</tbody>
				</table>
			</section>
		</div>
	)
}



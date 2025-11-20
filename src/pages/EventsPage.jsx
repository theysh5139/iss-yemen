import { useMemo, useState } from 'react'
import { store } from '../store.js'
import EventForm from '../ui/EventForm.jsx'

export default function EventsPage() {
	const [events, setEvents] = useState(() => store.getEvents())
	const [editing, setEditing] = useState(null) // event or null
	const [creating, setCreating] = useState(false)
	const [query, setQuery] = useState('')

	function refresh() { setEvents(store.getEvents()) }

	function handleCreate(data) {
		store.createEvent(data)
		refresh()
		setCreating(false)
	}

	function handleUpdate(id, data) {
		store.updateEvent(id, data)
		refresh()
		setEditing(null)
	}

	const activeCount = useMemo(() => events.filter(e => e.status === 'active').length, [events])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return events
		return events.filter(e =>
			(e.title || '').toLowerCase().includes(q) ||
			(e.description || '').toLowerCase().includes(q) ||
			(e.location || '').toLowerCase().includes(q)
		)
	}, [events, query])

	return (
		<div className="stack">
			<section className="card stack">
				<h2 className="section-title">Manage Events</h2>
				<div className="row" style={{alignItems: 'stretch'}}>
					<div className="row" style={{flex: 1}}>
						<input placeholder="Search for events" value={query} onChange={e => setQuery(e.target.value)} />
					</div>
					<button className="primary" onClick={() => { setCreating(true); setEditing(null) }}>Add event +</button>
					<span className="badge gray">Total: {events.length}</span>
					<span className="badge green">Active: {activeCount}</span>
				</div>
			</section>

			{creating && (
				<section className="card">
					<EventForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />
				</section>
			)}

			{editing && (
				<section className="card">
					<EventForm initialValue={editing} onCancel={() => setEditing(null)} onSubmit={(data) => handleUpdate(editing.id, data)} />
				</section>
			)}

			<section className="card">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
							<th>Date</th>
							<th>Location</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map(event => (
							<tr key={event.id}>
								<td>{event.title}</td>
								<td style={{maxWidth: 320}}>{event.description}</td>
								<td>{event.date}</td>
								<td>{event.location}</td>
								<td className="row">
									<button onClick={() => setEditing(event)}>Edit</button>
									<button className="danger" onClick={() => {
										if (window.confirm('Delete this event? This cannot be undone.')) {
											store.deleteEvent(event.id);
											refresh();
										}
									}}>Delete</button>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr><td colSpan="5" style={{ color: '#666' }}>No events found.</td></tr>
						)}
					</tbody>
				</table>
			</section>
		</div>
	)
}



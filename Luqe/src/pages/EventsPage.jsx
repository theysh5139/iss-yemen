import { useMemo, useState } from 'react'
import { store } from '../store.js'
import EventForm from '../ui/EventForm.jsx'

export default function EventsPage() {
	const [events, setEvents] = useState(() => store.getEvents())
	const [editing, setEditing] = useState(null) // event or null
	const [showForm, setShowForm] = useState(false)

	function refresh() { setEvents(store.getEvents()) }

	function handleCreate(data) {
		store.createEvent(data)
		refresh()
		setShowForm(false)
	}

	function handleUpdate(id, data) {
		store.updateEvent(id, data)
		refresh()
		setEditing(null)
	}

	const activeCount = useMemo(() => events.filter(e => e.status === 'active').length, [events])

	return (
		<div className="stack">
			<section className="card">
				<h2 className="section-title">Events</h2>
				<div className="row">
					<button className="primary" onClick={() => { setShowForm(true); setEditing(null) }}>Create Event</button>
					<span className="badge gray">Total: {events.length}</span>
					<span className="badge green">Active: {activeCount}</span>
				</div>
			</section>

			{showForm && (
				<section className="card">
					<EventForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
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
							<th>Title</th>
							<th>Date</th>
							<th>Location</th>
							<th>Status</th>
							<th style={{width: 260}}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{events.map(event => (
							<tr key={event.id}>
								<td>{event.title}</td>
								<td>{event.date}</td>
								<td>{event.location}</td>
								<td>
									<span className={`badge ${event.status === 'active' ? 'green' : 'red'}`}>{event.status}</span>
								</td>
								<td className="row">
									<button onClick={() => setEditing(event)}>Edit</button>
									{event.status === 'active' ? (
										<button className="danger" onClick={() => { store.cancelEvent(event.id); refresh() }}>Cancel</button>
									) : (
										<button className="primary" onClick={() => { store.reactivateEvent(event.id); refresh() }}>Reactivate</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	)
}



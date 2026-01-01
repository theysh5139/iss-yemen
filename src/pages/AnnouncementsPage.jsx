import { useState } from 'react'
import { store } from '../store.js'
import AnnouncementForm from '../ui/AnnouncementForm.jsx'

export default function AnnouncementsPage() {
	const [items, setItems] = useState(() => store.getAnnouncements())
	const [editing, setEditing] = useState(null)
	const [creating, setCreating] = useState(false)

	function refresh() { setItems(store.getAnnouncements()) }

	return (
		<div className="stack">
			<section className="card row">
				<h2 className="section-title" style={{margin: 0, flex: 1}}>Announcements</h2>
				<button className="primary" onClick={() => { setCreating(true); setEditing(null) }}>New Announcement</button>
			</section>

			{creating && (
				<section className="card">
					<AnnouncementForm onCancel={() => setCreating(false)} onSubmit={(data) => { store.createAnnouncement(data); setCreating(false); refresh() }} />
				</section>
			)}

			{editing && (
				<section className="card">
					<AnnouncementForm initialValue={editing} onCancel={() => setEditing(null)} onSubmit={(data) => { store.updateAnnouncement(editing.id, data); setEditing(null); refresh() }} />
				</section>
			)}

			<section className="stack">
				{items.map(a => (
					<article key={a.id} className="card stack">
						<div className="row" style={{justifyContent: 'space-between'}}>
							<h3 style={{margin: 0}}>{a.title}</h3>
							<div className="row">
								<button onClick={() => setEditing(a)}>Edit</button>
								<button className="danger" onClick={() => { store.deleteAnnouncement(a.id); refresh() }}>Delete</button>
							</div>
						</div>
						<p style={{marginTop: 0}}>{a.body}</p>
						<div style={{color: '#9ca3af', fontSize: 12}}>Updated {new Date(a.updatedAt).toLocaleString()}</div>
					</article>
				))}
				{items.length === 0 && (
					<div className="card" style={{color: '#9ca3af'}}>No announcements yet.</div>
				)}
			</section>
		</div>
	)
}




import { useState, useEffect } from 'react'
import { store } from '../store.js'
import AnnouncementForm from '../ui/AnnouncementForm.jsx'

export default function AnnouncementsPage() {
	const [items, setItems] = useState([])
	const [editing, setEditing] = useState(null)
	const [creating, setCreating] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchNews()
	}, [])

	async function fetchNews() {
		try {
			const res = await fetch('/api/news')
			const data = await res.json()
			setItems(data)
			setLoading(false)
		} catch (err) {
			console.error('Failed to fetch news:', err)
			setLoading(false)
		}
	}

	async function handleCreate(data) {
		const token = localStorage.getItem('ap_token')
		try {
			const res = await fetch('/api/news', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(data)
			})
			if (!res.ok) throw new Error('Failed to create news')
			fetchNews()
			setCreating(false)
		} catch (err) {
			alert('Failed to create news: ' + err.message)
		}
	}

	async function handleUpdate(id, data) {
		const token = localStorage.getItem('ap_token')
		try {
			const res = await fetch(`/api/news/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(data)
			})
			if (!res.ok) throw new Error('Failed to update news')
			fetchNews()
			setEditing(null)
		} catch (err) {
			alert('Failed to update news: ' + err.message)
		}
	}

	async function handleDelete(id) {
		if (!confirm('Delete this news post?')) return
		const token = localStorage.getItem('ap_token')
		try {
			const res = await fetch(`/api/news/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (!res.ok) throw new Error('Failed to delete news')
			fetchNews()
		} catch (err) {
			alert('Failed to delete news: ' + err.message)
		}
	}

	return (
		<div className="stack">
			<section className="card row">
				<h2 className="section-title" style={{margin: 0, flex: 1}}>News & Announcements</h2>
				<button className="primary" onClick={() => { setCreating(true); setEditing(null) }}>Post News Update</button>
			</section>

			{creating && (
				<section className="card">
					<AnnouncementForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />
				</section>
			)}

			{editing && (
				<section className="card">
					<AnnouncementForm initialValue={editing} onCancel={() => setEditing(null)} onSubmit={(data) => handleUpdate(editing._id || editing.id, data)} />
				</section>
			)}

			{loading ? (
				<div className="card">Loading...</div>
			) : (
				<section className="stack">
					{items.map(a => (
						<article key={a._id || a.id} className="card stack">
							<div className="row" style={{justifyContent: 'space-between'}}>
								<div style={{flex: 1}}>
									<h3 style={{margin: 0, marginBottom: 8}}>{a.title}</h3>
									<div style={{color: '#6b7280', fontSize: 14, marginBottom: 8}}>
										<span style={{marginRight: 16}}>By {a.author}</span>
										<span>{new Date(a.publishDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
									</div>
								</div>
								<div className="row">
									<button onClick={() => setEditing(a)}>Edit</button>
									<button className="danger" onClick={() => handleDelete(a._id || a.id)}>Delete</button>
								</div>
							</div>
							<p style={{marginTop: 0, whiteSpace: 'pre-wrap'}}>{a.body}</p>
						</article>
					))}
					{items.length === 0 && (
						<div className="card" style={{color: '#9ca3af'}}>No news posts yet. Click "Post News Update" to create one.</div>
					)}
				</section>
			)}
		</div>
	)
}




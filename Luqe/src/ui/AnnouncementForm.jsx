import { useState } from 'react'
import { store } from '../store.js'

export default function AnnouncementForm({ initialValue, onCancel, onSubmit }) {
	const auth = store.getAuth()
	const [form, setForm] = useState(() => {
		if (initialValue) {
			return {
				title: initialValue.title || '',
				body: initialValue.body || '',
				author: initialValue.author || 'Admin',
				publishDate: initialValue.publishDate ? new Date(initialValue.publishDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
			}
		}
		return {
			title: '',
			body: '',
			author: 'Admin',
			publishDate: new Date().toISOString().slice(0, 16)
		}
	})

	function handleChange(e) {
		const { name, value } = e.target
		setForm(prev => ({ ...prev, [name]: value }))
	}

	function submit(e) {
		e.preventDefault()
		if (!form.title || !form.body || !form.author) return
		onSubmit({
			title: form.title,
			body: form.body,
			author: form.author,
			publishDate: new Date(form.publishDate).toISOString()
		})
	}

	return (
		<form className="stack" onSubmit={submit}>
			<h3 className="section-title">{initialValue ? 'Edit News Post' : 'Post News Update'}</h3>
			<label>
				Title
				<input name="title" value={form.title} onChange={handleChange} placeholder="News headline" required />
			</label>
			<label>
				Author
				<input name="author" value={form.author} onChange={handleChange} placeholder="Author name" required />
			</label>
			<label>
				Publish Date
				<input type="datetime-local" name="publishDate" value={form.publishDate} onChange={handleChange} required />
			</label>
			<label>
				Body
				<textarea name="body" rows={4} value={form.body} onChange={handleChange} placeholder="Write the news content..." required />
			</label>
			<div className="row">
				<button type="button" onClick={onCancel}>Cancel</button>
				<button className="primary" type="submit">{initialValue ? 'Save' : 'Publish'}</button>
			</div>
		</form>
	)
}




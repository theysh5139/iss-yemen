import { useState } from 'react'

export default function AnnouncementForm({ initialValue, onCancel, onSubmit }) {
	const [form, setForm] = useState(() => initialValue || { title: '', body: '' })

	function handleChange(e) {
		const { name, value } = e.target
		setForm(prev => ({ ...prev, [name]: value }))
	}

	function submit(e) {
		e.preventDefault()
		if (!form.title || !form.body) return
		onSubmit({ title: form.title, body: form.body })
	}

	return (
		<form className="stack" onSubmit={submit}>
			<h3 className="section-title">{initialValue ? 'Edit Announcement' : 'Create Announcement'}</h3>
			<label>
				Title
				<input name="title" value={form.title} onChange={handleChange} placeholder="Headline" />
			</label>
			<label>
				Body
				<textarea name="body" rows={4} value={form.body} onChange={handleChange} placeholder="Write the announcement..." />
			</label>
			<div className="row">
				<button type="button" onClick={onCancel}>Cancel</button>
				<button className="primary" type="submit">{initialValue ? 'Save' : 'Publish'}</button>
			</div>
		</form>
	)
}




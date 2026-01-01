import { useState } from 'react'

export default function EventForm({ initialValue, onCancel, onSubmit }) {
	const [form, setForm] = useState(() => initialValue || {
		title: '',
		date: '',
		location: '',
		description: '',
	})

	function handleChange(e) {
		const { name, value } = e.target
		setForm(prev => ({ ...prev, [name]: value }))
	}

	function handleSubmit(e) {
		e.preventDefault()
		if (!form.title || !form.date) return
		onSubmit({ title: form.title, date: form.date, location: form.location, description: form.description })
	}

	return (
		<form onSubmit={handleSubmit} className="stack">
			<h3 className="section-title">{initialValue ? 'Edit Event' : 'Create Event'}</h3>
			<div className="row">
				<label style={{flex: 2}}>
					Title
					<input name="title" value={form.title} onChange={handleChange} placeholder="Event title" />
				</label>
				<label>
					Date
					<input type="date" name="date" value={form.date} onChange={handleChange} />
				</label>
				<label>
					Location
					<input name="location" value={form.location} onChange={handleChange} placeholder="Venue or link" />
				</label>
			</div>
			<label>
				Description
				<textarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="What is this event about?" />
			</label>
			<div className="row">
				<button type="button" onClick={onCancel}>Cancel</button>
				<button className="primary" type="submit">{initialValue ? 'Save Changes' : 'Create Event'}</button>
			</div>
		</form>
	)
}



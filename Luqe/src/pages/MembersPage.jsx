import { useState } from 'react'
import { store } from '../store.js'

export default function MembersPage() {
	const [members, setMembers] = useState(() => store.getMembers())
	const [form, setForm] = useState({ name: '', email: '' })

	function refresh() { setMembers(store.getMembers()) }

	function addMember(e) {
		e.preventDefault()
		if (!form.name || !form.email) return
		store.addMember(form)
		setForm({ name: '', email: '' })
		refresh()
	}

	return (
		<div className="stack">
			<section className="card stack">
				<h2 className="section-title">Members</h2>
				<form className="row" onSubmit={addMember}>
					<label style={{flex: 1}}>
						Name
						<input value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="Full name" />
					</label>
					<label style={{flex: 1}}>
						Email
						<input value={form.email} onChange={e => setForm(v => ({...v, email: e.target.value}))} placeholder="email@example.com" />
					</label>
					<button className="primary" type="submit">Add Member</button>
				</form>
			</section>

			<section className="card">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Status</th>
							<th style={{width: 220}}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{members.map(m => (
							<tr key={m.id}>
								<td>{m.name}</td>
								<td>{m.email}</td>
								<td>
									<span className={`badge ${m.status === 'active' ? 'green' : 'red'}`}>{m.status}</span>
								</td>
								<td className="row">
									{m.status === 'active' ? (
										<button className="danger" onClick={() => { store.deactivateMember(m.id); refresh() }}>Deactivate</button>
									) : (
										<button className="primary" onClick={() => { store.reactivateMember(m.id); refresh() }}>Reactivate</button>
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



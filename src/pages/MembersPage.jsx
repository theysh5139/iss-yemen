import { useMemo, useState } from 'react'
import { store } from '../store.js'

export default function MembersPage() {
	const [members, setMembers] = useState(() => store.getMembers())
	const [creating, setCreating] = useState(false)
	const [editing, setEditing] = useState(null) // member or null
	const [query, setQuery] = useState('')
	const [form, setForm] = useState({
		name: '',
		matric: '',
		email: '',
		role: 'USER',
		faculty: '',
		department: '',
	})

	function refresh() { setMembers(store.getMembers()) }
	function resetForm() {
		setForm({ name: '', matric: '', email: '', role: 'USER', faculty: '', department: '' })
	}

	function submitCreate(e) {
		e.preventDefault()
		if (!form.name || !form.email) return
		store.addMember(form)
		resetForm()
		setCreating(false)
		refresh()
	}

	function submitEdit(e) {
		e.preventDefault()
		if (!editing) return
		store.updateMember(editing.id, form)
		resetForm()
		setEditing(null)
		refresh()
	}

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return members
		return members.filter(m =>
			(m.name || '').toLowerCase().includes(q) ||
			(m.email || '').toLowerCase().includes(q) ||
			(m.matric || '').toLowerCase().includes(q) ||
			(m.department || '').toLowerCase().includes(q) ||
			(m.faculty || '').toLowerCase().includes(q)
		)
	}, [members, query])

	function startEdit(m) {
		setEditing(m)
		setCreating(false)
		setForm({
			name: m.name || '',
			matric: m.matric || '',
			email: m.email || '',
			role: m.role || 'USER',
			faculty: m.faculty || '',
			department: m.department || '',
		})
	}

	return (
		<div className="stack">
			<section className="card stack">
				<h2 className="section-title">Manage Users</h2>
				<div className="row" style={{alignItems: 'stretch'}}>
					<div className="row" style={{flex: 1}}>
						<input placeholder="Search for users" value={query} onChange={e => setQuery(e.target.value)} />
					</div>
					<button className="primary" onClick={() => { setCreating(true); setEditing(null); resetForm() }}>Add user +</button>
				</div>
			</section>

			{creating && (
				<section className="card">
					<form className="stack" onSubmit={submitCreate}>
						<h3 className="section-title">Add User</h3>
						<div className="row">
							<label style={{flex: 2}}>
								Name
								<input value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="Full name" />
							</label>
							<label>
								Matrics No.
								<input value={form.matric} onChange={e => setForm(v => ({...v, matric: e.target.value}))} placeholder="A23FK0283" />
							</label>
						</div>
						<div className="row">
							<label style={{flex: 2}}>
								Email Address
								<input value={form.email} onChange={e => setForm(v => ({...v, email: e.target.value}))} placeholder="user@graduate.utm.my" />
							</label>
							<label>
								Role
								<select value={form.role} onChange={e => setForm(v => ({...v, role: e.target.value}))}>
									<option>USER</option>
									<option>ADMIN</option>
								</select>
							</label>
							<label>
								Faculty
								<input value={form.faculty} onChange={e => setForm(v => ({...v, faculty: e.target.value}))} placeholder="FKT" />
							</label>
							<label>
								Department
								<input value={form.department} onChange={e => setForm(v => ({...v, department: e.target.value}))} placeholder="CULTURALS" />
							</label>
						</div>
						<div className="row">
							<button type="button" onClick={() => { setCreating(false); resetForm() }}>Cancel</button>
							<button className="primary" type="submit">Add user</button>
						</div>
					</form>
				</section>
			)}

			{editing && (
				<section className="card">
					<form className="stack" onSubmit={submitEdit}>
						<h3 className="section-title">Edit User</h3>
						<div className="row">
							<label style={{flex: 2}}>
								Name
								<input value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} />
							</label>
							<label>
								Matrics No.
								<input value={form.matric} onChange={e => setForm(v => ({...v, matric: e.target.value}))} />
							</label>
						</div>
						<div className="row">
							<label style={{flex: 2}}>
								Email Address
								<input value={form.email} onChange={e => setForm(v => ({...v, email: e.target.value}))} />
							</label>
							<label>
								Role
								<select value={form.role} onChange={e => setForm(v => ({...v, role: e.target.value}))}>
									<option>USER</option>
									<option>ADMIN</option>
								</select>
							</label>
							<label>
								Faculty
								<input value={form.faculty} onChange={e => setForm(v => ({...v, faculty: e.target.value}))} />
							</label>
							<label>
								Department
								<input value={form.department} onChange={e => setForm(v => ({...v, department: e.target.value}))} />
							</label>
						</div>
						<div className="row">
							<button type="button" onClick={() => { setEditing(null); resetForm() }}>Cancel</button>
							<button className="primary" type="submit">Save Changes</button>
						</div>
					</form>
				</section>
			)}

			<section className="card">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Matric No.</th>
							<th>Email Address</th>
							<th>Role</th>
							<th>Faculty</th>
							<th>Department</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map(m => (
							<tr key={m.id}>
								<td>{m.name}</td>
								<td>{m.matric || ''}</td>
								<td>{m.email}</td>
								<td>{m.role || 'USER'}</td>
								<td>{m.faculty || ''}</td>
								<td>{m.department || ''}</td>
								<td>
									<span className={`badge ${m.status === 'active' ? 'green' : 'red'}`}>{m.status || 'inactive'}</span>
								</td>
								<td className="row">
									<button onClick={() => startEdit(m)}>Edit</button>
									{m.status === 'active' ? (
										<button className="danger" onClick={() => { store.deactivateMember(m.id); refresh() }}>Inactivate</button>
									) : (
										<button className="primary" onClick={() => { store.reactivateMember(m.id); refresh() }}>Reactivate</button>
									)}
									<button className="danger" onClick={() => {
										if (window.confirm('Delete this user? This cannot be undone.')) {
											store.deleteMember(m.id);
											refresh();
										}
									}}>Delete</button>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr><td colSpan="8" style={{ color: '#666' }}>No users found.</td></tr>
						)}
					</tbody>
				</table>
			</section>
		</div>
	)
}



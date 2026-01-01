import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { store } from '../store.js'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const location = useLocation()

	function submit(e) {
		e.preventDefault()
		const ok = store.login(email, password)
		if (!ok) {
			setError('Invalid credentials. Use admin@example.com / admin123')
			return
		}
		const dest = location.state?.from?.pathname || '/announcements'
		navigate(dest, { replace: true })
	}

	return (
		<div className="card" style={{ maxWidth: 480, margin: '40px auto' }}>
			<h2 className="section-title">Admin Login</h2>
			<form className="stack" onSubmit={submit}>
				<label>
					Email
					<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
				</label>
				<label>
					Password
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
				</label>
				{error && <div className="badge red" style={{ width: 'fit-content' }}>{error}</div>}
				<div className="row">
					<button className="primary" type="submit">Sign in</button>
				</div>
			</form>
			<div style={{ color: '#9ca3af', marginTop: 8 }}>Demo creds: admin@example.com / admin123</div>
		</div>
	)
}




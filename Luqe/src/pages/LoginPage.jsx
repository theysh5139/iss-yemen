import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { store } from '../store.js'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const location = useLocation()

	async function submit(e) {
		e.preventDefault()
		setError('')
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.message || 'Login failed')
			}
			const data = await res.json()
			localStorage.setItem('ap_token', data.token)
			const dest = location.state?.from?.pathname || '/dashboard'
			navigate(dest, { replace: true })
		} catch (err) {
			setError(err.message)
		}
	}

	return (
		<div className="login-wrapper">
			<div className="login-card">
				<h2 className="login-title">Log in</h2>
				<form className="login-form" onSubmit={submit}>
					<label className="login-label">
						Email
						<input
							className="login-input"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder=""
							type="email"
							required
						/>
					</label>
					<label className="login-label">
						Your password
						<div className="password-field">
							<input
								className="login-input"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder=""
								type={showPassword ? 'text' : 'password'}
								required
							/>
							<button type="button" className="toggle-password" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
						</div>
					</label>

					{error && <div className="login-error">{error}</div>}

					<button className="login-submit" type="submit">Log in</button>

					<p className="login-terms">
						By continuing, you agree to the <a href="#" className="link">Terms of use</a> and <a href="#" className="link">Privacy Policy</a>.
					</p>

					<div className="login-actions">
						<a href="#" className="link">Forgot your password</a>
					</div>
				</form>

				<div className="login-divider"><span>New to our community</span></div>

				<button className="login-secondary" type="button" onClick={() => navigate('/register')}>Create an account</button>
			</div>

			<footer className="login-footer">© 2025 ISS Yemen Community Club | All Rights Reserved</footer>
		</div>
	)
}




import { apiFetch } from './client.js'

export function signupApi(payload) {
  return apiFetch('/api/auth/signup', { method: 'POST', body: payload })
}

export function verifyEmailApi(params) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/api/auth/verify-email?${q}`)
}

export function loginApi(payload) {
  return apiFetch('/api/auth/login', { method: 'POST', body: payload })
}

export function logoutApi() {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

export function requestPasswordResetApi(payload) {
  return apiFetch('/api/auth/password-reset-request', { method: 'POST', body: payload })
}

export function resetPasswordApi(payload) {
  return apiFetch('/api/auth/password-reset', { method: 'POST', body: payload })
}



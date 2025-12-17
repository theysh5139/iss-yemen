import { apiFetch } from './client.js'

function saveToken(token) {
  if (token) {
      localStorage.setItem('authToken', token);
  }
}

function clearToken() {
  localStorage.removeItem('authToken');
}

export function signupApi(payload) {
  return apiFetch('/api/auth/signup', { method: 'POST', body: payload })
}

export function verifyEmailApi(params) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/api/auth/verify-email?${q}`)
}

export function loginApi(payload) {
  return apiFetch('/api/auth/login', { method: 'POST', body: payload })
  .then(response => {
    // Check if the response includes a token on successful login
    if (response && response.token) {
        saveToken(response.token); // Save the token
    }
    return response;
});
}

export function logoutApi() {
  clearToken();
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

export function requestPasswordResetApi(payload) {
  return apiFetch('/api/auth/password-reset-request', { method: 'POST', body: payload })
}

export function resetPasswordApi(payload) {
  return apiFetch('/api/auth/password-reset', { method: 'POST', body: payload })
}

export function getCurrentUserApi() {
  return apiFetch('/api/auth/me')
}



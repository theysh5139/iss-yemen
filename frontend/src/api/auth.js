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
    // For admin users, the backend doesn't return a token in the response
    // The token is set as a cookie, so we need to handle the response differently
    if (response && response.user && !response.token) {
      // Token is in cookie, but we need to return a format the frontend expects
      // The frontend expects { user, token } but token is in cookie
      // We'll return the response as-is and let the frontend handle it
      return response;
    }
    return response;
  })
  .catch(error => {
    // Re-throw with a more user-friendly message for login errors
    if (error.message && error.message.includes('Authentication required')) {
      // This shouldn't happen during login, but if it does, show a better message
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  });
}

export function verifyOtpApi(payload) {
  return apiFetch('/api/auth/verify-otp', { method: 'POST', body: payload })
}

export function resendOtpApi(payload) {
  return apiFetch('/api/auth/resend-otp', { method: 'POST', body: payload })
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

export function updateProfileApi(payload) {
  return apiFetch('/api/auth/profile', { method: 'PATCH', body: payload })
}



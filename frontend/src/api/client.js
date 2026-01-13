const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  console.log('API Fetch:', method, path, body ? 'with body' : 'no body')
  try {
    // Only get token if it exists - don't trigger any authentication
    const token = localStorage.getItem('authToken');
    // Only send Authorization header if we have a token
    // This prevents sending invalid tokens that might trigger backend authentication
    const authHeaders = token && token !== 'cookie-based-auth' ? { 'Authorization': `Bearer ${token}` } : {};

    // Don't set Content-Type for FormData - let browser handle it
    const isFormData = body instanceof FormData;
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...defaultHeaders,
        ...authHeaders,
        ...(headers || {})
      },
      credentials: 'include',
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
    })

    console.log('API Response:', res.status, res.statusText)

    // Don't show generic auth error for login/signup endpoints - let the actual error message through
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/signup');

    if ((res.status === 401 || res.status === 403) && !isAuthEndpoint) {
      const authError = new Error('Authentication required or session expired.');
      authError.status = res.status;
      throw authError;
    }

    // For auth endpoints with 401/403, let the actual error message from backend come through
    // Don't throw generic error - let the JSON parsing below handle it

    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    if (!res.ok) {
      let message = data?.message || `Request failed with ${res.status}`

      // Handle rate limiting error (429) with user-friendly message
      if (res.status === 429) {
        message = data?.message || 'Too many requests. Please wait a moment and try again.'
      }

      // Include validation details if available
      const errorMessage = data?.details
        ? `${message}: ${Array.isArray(data.details) ? data.details.join(', ') : data.details}`
        : message
      const error = new Error(errorMessage)
      error.data = data // Attach full error data for detailed handling
      error.status = res.status // Attach status code
      throw error
    }
    return data
  } catch (err) {
    // Handle network errors (failed to fetch)
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      const networkError = new Error('Unable to connect to the server. Please make sure the backend server is running on port 5000.')
      networkError.status = 0
      networkError.isNetworkError = true
      throw networkError
    }
    throw err
  }
}



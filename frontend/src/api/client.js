const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  })

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
}



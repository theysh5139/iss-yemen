const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {})
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    })

  if (res.status === 401 || res.status === 403) {
    
        const authError = new Error('Authentication required or session expired.');
        authError.status = res.status;
        throw authError;
      }

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



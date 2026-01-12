import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { getCurrentUserApi } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // STRICT CHECK: Only authenticate if localStorage has a valid token
      // This prevents auto-authentication from stale cookies for non-logged-in users
      // CRITICAL: Check localStorage FIRST before any API calls
      const token = localStorage.getItem('authToken')
      
      // CRITICAL: If no token exists, user is NOT logged in - set to null and return immediately
      // Do NOT make any API calls that might authenticate via cookies
      // This is the key fix: non-logged-in users should NEVER trigger authentication
      // Check for empty string, null, undefined, or invalid values
      // Also check that token is not just whitespace
      const hasValidToken = token && 
                            typeof token === 'string' && 
                            token.trim() !== '' && 
                            token !== 'undefined' && 
                            token !== 'null' &&
                            token.length > 0
      
      if (!hasValidToken) {
        console.log('[AuthProvider] No valid localStorage token found - user is NOT logged in')
        console.log('[AuthProvider] Token value:', token, 'Type:', typeof token)
        // Ensure user is null and loading is false
        // CRITICAL: Clear any stale cookies by ensuring user state is null
        // DO NOT call getCurrentUserApi() - even if cookies exist, we ignore them without localStorage token
        setUser(null)
        setLoading(false)
        // CRITICAL: Return immediately - do NOT call any authentication APIs
        // This prevents non-logged-in users from being authenticated via stale cookies
        // Even if backend has cookies, we don't check them without a localStorage token
        return
      }

      // Only proceed if we have a valid token (either real JWT token or cookie-based-auth flag)
      // Verify the token with the backend
      // NOTE: getCurrentUserApi will send cookies if they exist, but we only call it if we have a localStorage token
      try {
        console.log('[AuthProvider] Valid token found, verifying with backend...')
        const res = await getCurrentUserApi()
        // Only set user if we get a valid response with a user object
        if (res && res.user && res.user.id) {
          console.log('[AuthProvider] Authentication verified, user:', res.user.email)
          setUser(res.user)
        } else {
          // Invalid response, clear token and set user to null
          console.log('[AuthProvider] Invalid response, clearing token')
          localStorage.removeItem('authToken')
          localStorage.removeItem('cookie-based-auth')
          setUser(null)
        }
      } catch (err) {
        // Authentication failed - token expired or invalid
        console.log('[AuthProvider] Authentication failed:', err.message)
        // Clear localStorage token/flag
        localStorage.removeItem('authToken')
        localStorage.removeItem('cookie-based-auth')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const authContextValue = useMemo(() => {
    
    // Function to handle successful login and token storage
    const login = (userData, token) => {
        if (token) {
            localStorage.setItem('authToken', token);
        }
        setUser(userData);
    };

    // Function to handle logout
    const logout = () => {
        // CRITICAL: Clear ALL authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('cookie-based-auth');
        sessionStorage.clear(); // Clear redirect URLs and other session data
        setUser(null);
        console.log('[AuthProvider] User logged out - all auth data cleared');
    };

    return {
        user, 
        loading, 
        login, // Use this in Login.jsx instead of just setUser
        logout,
        setUser // Keep setUser for direct state manipulation if needed
    };
  }, [user, loading]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}



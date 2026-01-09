import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { getCurrentUserApi } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getCurrentUserApi()
        setUser(res.user)
      } catch (err) {
        // Not logged in - user is null
        localStorage.removeItem('authToken')
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
        localStorage.removeItem('authToken');
        setUser(null);
        // Optionally, navigate to the home/login page here
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



"use client"

import { useState, useEffect } from "react"
import { getHODs } from "../api/hods.js"
import "../styles/members.css"

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hods, setHods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchHODs() {
      try {
        setLoading(true)
        const response = await getHODs()
        if (response && response.hods) {
          setHods(response.hods)
        }
      } catch (err) {
        console.error("Failed to fetch HODs:", err)
        setError("Failed to load HOD profiles. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchHODs()
  }, [])

  // Filter HODs based on search
  const filteredHODs = hods.filter(hod => {
    const search = searchTerm.toLowerCase()
    return (
      hod.name?.toLowerCase().includes(search) ||
      hod.designation?.toLowerCase().includes(search)
    )
  })

  const totalCount = filteredHODs.length

  return (
    <div className="members-container animate-fadeInUp">
      <div className="members-header">
        <h1 className="members-title">Our Members</h1>
        <p className="members-subtitle">Meet the Yemeni students at UTM who make our community strong</p>
      </div>

      <div className="members-content">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="members-count">
            {totalCount} {totalCount === 1 ? "member" : "members"} found
          </div>
        </div>

        {/* Heads of Department (HODs) Section - Connected to Admin Manage HOD */}
        {loading ? (
          <div className="members-section">
            <h2 className="section-group-title">Heads of Department</h2>
            <p className="section-description">Loading HOD profiles...</p>
          </div>
        ) : error ? (
          <div className="members-section">
            <h2 className="section-group-title">Heads of Department</h2>
            <div className="error-message" style={{ padding: '1rem', color: '#721c24', background: '#f8d7da', borderRadius: '8px' }}>
              {error}
            </div>
          </div>
        ) : filteredHODs.length > 0 ? (
          <div className="members-section">
            <h2 className="section-group-title">Heads of Department</h2>
            <p className="section-description">Meet our distinguished department heads</p>
            <div className="members-grid">
              {filteredHODs.map((hod) => {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                const photoUrl = hod.photo?.startsWith('http') 
                  ? hod.photo 
                  : hod.photo?.startsWith('/') 
                    ? `${apiBaseUrl}${hod.photo}` 
                    : hod.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(hod.name)}&size=200&background=1e3a8a&color=fff`
                
                return (
                  <div key={hod._id || hod.id} className="member-card committee-head-card animate-scaleIn">
                    <div className="member-avatar" style={{ 
                      backgroundImage: `url(${photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!hod.photo && hod.name?.charAt(0)}
                    </div>
                    <div className="member-info">
                      <h3 className="member-name">{hod.name}</h3>
                      <p className="member-role">{hod.designation}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="members-section">
            <h2 className="section-group-title">Heads of Department</h2>
            <p className="section-description">No HOD profiles available at this time.</p>
          </div>
        )}


        {totalCount === 0 && (
          <div className="no-results">
            <p>No members found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}



"use client"

import { useState, useEffect } from "react"
import { getHODs, getClubMembers } from "../api/hods.js"
import "../styles/members.css"

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hods, setHods] = useState([])
  const [clubMembers, setClubMembers] = useState([])
  const [hodsLoading, setHodsLoading] = useState(true)
  const [clubMembersLoading, setClubMembersLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setHodsLoading(true)
        setClubMembersLoading(true)
        
        const [hodsResponse, clubMembersResponse] = await Promise.all([
          getHODs().catch(() => ({ hods: [] })),
          getClubMembers().catch(() => ({ clubMembers: [] }))
        ])
        
        if (hodsResponse && hodsResponse.hods) {
          setHods(hodsResponse.hods)
        }
        if (clubMembersResponse && clubMembersResponse.clubMembers) {
          setClubMembers(clubMembersResponse.clubMembers)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Failed to load member profiles. Please try again later.")
      } finally {
        setHodsLoading(false)
        setClubMembersLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter based on search
  const filteredHODs = hods.filter(hod => {
    const search = searchTerm.toLowerCase()
    return (
      hod.name?.toLowerCase().includes(search) ||
      hod.designation?.toLowerCase().includes(search)
    )
  })

  const filteredClubMembers = clubMembers.filter(member => {
    const search = searchTerm.toLowerCase()
    return (
      member.name?.toLowerCase().includes(search) ||
      member.position?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search)
    )
  })

  const totalCount = filteredHODs.length + filteredClubMembers.length

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

        {/* Heads of Department (HODs) Section - Main Department */}
        {hodsLoading ? (
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

        {/* Club Members Section - Student Club Members from All Positions */}
        {clubMembersLoading ? (
          <div className="members-section">
            <h2 className="section-group-title">Student Club Members</h2>
            <p className="section-description">Loading club member profiles...</p>
          </div>
        ) : filteredClubMembers.length > 0 ? (
          <div className="members-section">
            <h2 className="section-group-title">Student Club Members</h2>
            <p className="section-description">Meet our club members from all positions</p>
            <div className="members-grid">
              {filteredClubMembers.map((member) => {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                const photoUrl = member.photo?.startsWith('http') 
                  ? member.photo 
                  : member.photo?.startsWith('/') 
                    ? `${apiBaseUrl}${member.photo}` 
                    : member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=4a6fa5&color=fff`
                
                return (
                  <div key={member._id || member.id} className="member-card committee-head-card animate-scaleIn">
                    <div className="member-avatar" style={{ 
                      backgroundImage: `url(${photoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!member.photo && member.name?.charAt(0)}
                    </div>
                    <div className="member-info">
                      <h3 className="member-name">{member.name}</h3>
                      <p className="member-role">{member.position}</p>
                      {member.email && (
                        <p className="member-email" style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="members-section">
            <h2 className="section-group-title">Student Club Members</h2>
            <p className="section-description">No club member profiles available at this time.</p>
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



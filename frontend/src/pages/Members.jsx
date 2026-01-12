"use client"

import { useState, useEffect } from "react"
import {
  getExecutiveMembers,
  getCommittees,
  getCommitteeHeads,
  getCommitteeMembersGrouped
} from "../api/committees.js"
import "../styles/members.css"

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data states
  const [executiveMembers, setExecutiveMembers] = useState([])
  const [committeesData, setCommitteesData] = useState([]) // Will hold { committee, head, members }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Fetch all necessary data in parallel
        const [execRes, committeesRes, headsRes, membersRes] = await Promise.all([
          getExecutiveMembers(),
          getCommittees(),
          getCommitteeHeads(),
          getCommitteeMembersGrouped()
        ])

        // 1. Process Executive Members
        if (execRes?.members) {
          setExecutiveMembers(execRes.members)
        }

        // 2. Process Committees Structure
        const committees = committeesRes?.committees || []
        const heads = headsRes?.heads || []
        const membersGrouped = membersRes?.grouped || []

        // Combine data for each committee
        const processedCommittees = committees
          .sort((a, b) => (a.priority || 999) - (b.priority || 999)) // Sort by priority
          .map(committee => {
            // Find head for this committee
            const head = heads.find(h =>
              (h.committeeId?._id === committee._id) || (h.committeeId === committee._id)
            )

            // Find members for this committee
            const group = membersGrouped.find(g =>
              (g.committee._id === committee._id) || (g.committee === committee._id)
            )
            const members = group ? group.members : []

            return {
              committee,
              head,
              members
            }
          })
        // Filter out empty committees if desired (optional - currently keeping all)

        setCommitteesData(processedCommittees)
      } catch (err) {
        console.error("Failed to fetch members data:", err)
        setError("Failed to load member profiles. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter function
  const filterMember = (member) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      member.name?.toLowerCase().includes(search) ||
      member.role?.toLowerCase().includes(search) ||
      member.designation?.toLowerCase().includes(search)
    )
  }

  // Filtered Data
  const filteredExecutives = executiveMembers.filter(filterMember)

  const filteredCommittees = committeesData.map(data => ({
    ...data,
    // Head matches search OR committee has matching members
    // But simplified: Just filter head and members individually
    head: data.head && filterMember(data.head) ? data.head : null,
    members: data.members.filter(filterMember)
  })).filter(data =>
    // Keep committee if it has a matching head or matching members
    data.head !== null || data.members.length > 0
  )

  const hasResults = filteredExecutives.length > 0 || filteredCommittees.length > 0

  const renderMemberCard = (member, role, isHead = false) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    const photoUrl = member.photo?.startsWith('http')
      ? member.photo
      : member.photo?.startsWith('/')
        ? `${apiBaseUrl}${member.photo}`
        : member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=1e3a8a&color=fff`

    return (
      <div key={member._id} className={`member-card ${isHead ? 'committee-head-card' : ''} animate-scaleIn`}>
        <div className="member-avatar" style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!member.photo && member.name?.charAt(0)}
        </div>
        <div className="member-info">
          <h3 className="member-name">{member.name}</h3>
          <p className="member-role">{role || member.role}</p>

          {/* Display contact info for Executive Members and Committee Heads */}
          {(isHead || member.role) && (
            <div className="member-contact-info">
              {member.email && (
                <a href={`mailto:${member.email}`} className="contact-link" title={member.email}>
                  <span className="contact-icon">📧</span> <span className="contact-text">{member.email}</span>
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className="contact-link" title={member.phone}>
                  <span className="contact-icon">📞</span> <span className="contact-text">{member.phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="members-container animate-fadeInUp">
      <div className="members-header">
        <h1 className="members-title">Our Team</h1>
        <p className="members-subtitle">Meet the Executive Committee and Department Members</p>
      </div>

      <div className="members-content">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profiles...</p>
          </div>
        ) : error ? (
          <div className="error-message-box">
            {error}
          </div>
        ) : !hasResults ? (
          <div className="no-results">
            <p>No members found matching "{searchTerm}"</p>
          </div>
        ) : (
          <>
            {/* 1. Executive Committee Section */}
            {filteredExecutives.length > 0 && (
              <div className="members-section executive-section">
                <h2 className="section-group-title">Executive Committee</h2>
                <div className="members-grid executive-grid">
                  {filteredExecutives.map(exec => renderMemberCard(exec, exec.role, true))}
                </div>
              </div>
            )}

            {/* 2. Committees Sections */}
            {filteredCommittees.map(({ committee, head, members }) => (
              <div key={committee._id} className="members-section committee-section">
                <div className="committee-header">
                  <h2 className="section-group-title">{committee.name}</h2>
                </div>

                {/* Committee Head */}
                {head && (
                  <div className="committee-head-wrapper">
                    <p className="sub-role-title">Head</p>
                    <div className="members-grid head-grid">
                      {renderMemberCard(head, "Committee Head", true)}
                    </div>
                  </div>
                )}

                {/* Committee Members */}
                {members.length > 0 && (
                  <div className="committee-members-wrapper">
                    <p className="sub-role-title">{head ? "Members" : "Team"}</p>
                    <div className="members-grid">
                      {members.map(member => renderMemberCard(member, "Member"))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}



"use client"

import { useState } from "react"
import "../styles/members.css"

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data - replace with API call later
  const executiveCommittee = [
    { id: 1, name: "Ahmed Al-Hashimi", role: "President", email: "ahmed@student.utm.my", year: "2024", major: "Computer Science", bio: "Leading ISS Yemen with passion and dedication" },
    { id: 2, name: "Fatima Al-Mansouri", role: "Vice President", email: "fatima@student.utm.my", year: "2024", major: "Engineering", bio: "Supporting the community and driving initiatives" },
    { id: 3, name: "Amina Al-Sayed", role: "Secretary", email: "amina@student.utm.my", year: "2024", major: "Medicine", bio: "Organizing events and managing communications" },
    { id: 4, name: "Mohammed Al-Zahra", role: "Treasurer", email: "mohammed@student.utm.my", year: "2023", major: "Business", bio: "Managing finances and budgets" },
  ]

  const committeeHeads = [
    { id: 5, name: "Yusuf Al-Qadri", role: "Cultural Committee Head", committee: "cultural", email: "yusuf@student.utm.my", year: "2025", major: "Computer Science", bio: "Promoting Yemeni culture and traditions" },
    { id: 6, name: "Khadija Al-Mutawakel", role: "Academic Committee Head", committee: "academic", email: "khadija@student.utm.my", year: "2023", major: "Engineering", bio: "Supporting academic excellence" },
    { id: 7, name: "Omar Al-Hakim", role: "Sports Committee Head", committee: "sports", email: "omar@student.utm.my", year: "2024", major: "Business", bio: "Organizing sports activities and events" },
    { id: 8, name: "Layla Al-Shami", role: "Social Committee Head", committee: "social", email: "layla@student.utm.my", year: "2025", major: "Medicine", bio: "Fostering social connections" },
    { id: 9, name: "Hassan Al-Awadhi", role: "Media Committee Head", committee: "media", email: "hassan@student.utm.my", year: "2023", major: "Computer Science", bio: "Managing social media and content" },
    { id: 10, name: "Noor Al-Battawi", role: "Logistics Committee Head", committee: "logistics", email: "noor@student.utm.my", year: "2024", major: "Engineering", bio: "Handling event logistics and planning" },
    { id: 11, name: "Rashid Al-Hamdan", role: "YSAG Committee Head", committee: "ysag", email: "rashid@student.utm.my", year: "2024", major: "Science", bio: "Leading academic group initiatives" },
    { id: 12, name: "Mariam Al-Hadi", role: "Women Affairs Committee Head", committee: "womenAffairs", email: "mariam@student.utm.my", year: "2023", major: "Medicine", bio: "Supporting women students' needs" },
  ]

  const committeeMembers = {
    cultural: [
      { id: 13, name: "Bilal Al-Shaibi", email: "bilal@student.utm.my", year: "2024", major: "Arts" },
      { id: 14, name: "Huda Al-Maqtari", email: "huda@student.utm.my", year: "2025", major: "Literature" },
      { id: 15, name: "Tariq Al-Awadhi", email: "tariq@student.utm.my", year: "2023", major: "History" },
    ],
    academic: [
      { id: 16, name: "Sara Al-Hamdani", email: "sara@student.utm.my", year: "2024", major: "Computer Science" },
      { id: 17, name: "Khalid Al-Salami", email: "khalid@student.utm.my", year: "2024", major: "Engineering" },
      { id: 18, name: "Nadia Al-Hajri", email: "nadia@student.utm.my", year: "2025", major: "Science" },
    ],
    sports: [
      { id: 19, name: "Waleed Al-Abdali", email: "waleed@student.utm.my", year: "2023", major: "Sports Science" },
      { id: 20, name: "Salma Al-Rashidi", email: "salma@student.utm.my", year: "2024", major: "Business" },
    ],
    social: [
      { id: 21, name: "Ibrahim Al-Mahdi", email: "ibrahim@student.utm.my", year: "2024", major: "Social Science" },
      { id: 22, name: "Rana Al-Qasimi", email: "rana@student.utm.my", year: "2025", major: "Arts" },
    ],
    media: [
      { id: 23, name: "Adel Al-Shamiri", email: "adel@student.utm.my", year: "2024", major: "Media Studies" },
      { id: 24, name: "Lina Al-Makki", email: "lina@student.utm.my", year: "2023", major: "Communications" },
    ],
    logistics: [
      { id: 25, name: "Zaid Al-Attas", email: "zaid@student.utm.my", year: "2024", major: "Business" },
      { id: 26, name: "Yasmin Al-Hadi", email: "yasmin@student.utm.my", year: "2025", major: "Management" },
    ],
    ysag: [
      { id: 27, name: "Faisal Al-Shami", email: "faisal@student.utm.my", year: "2024", major: "Science" },
      { id: 28, name: "Aisha Al-Salami", email: "aisha@student.utm.my", year: "2023", major: "Engineering" },
    ],
    womenAffairs: [
      { id: 29, name: "Rania Al-Hashimi", email: "rania@student.utm.my", year: "2024", major: "Medicine" },
      { id: 30, name: "Lubna Al-Mansouri", email: "lubna@student.utm.my", year: "2025", major: "Education" },
    ],
  }

  // Helper function to check if item matches search
  const matchesSearch = (item, searchTerm) => {
    const search = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(search) ||
      item.role?.toLowerCase().includes(search) ||
      item.major.toLowerCase().includes(search) ||
      item.committee?.toLowerCase().includes(search) ||
      item.bio?.toLowerCase().includes(search)
    )
  }

  // Filter all members based on search
  const filteredExecutive = executiveCommittee.filter(m => matchesSearch(m, searchTerm))
  const filteredHeads = committeeHeads.filter(m => matchesSearch(m, searchTerm))
  const filteredMembers = Object.entries(committeeMembers).reduce((acc, [committee, members]) => {
    const filtered = members.filter(m => matchesSearch(m, searchTerm))
    if (filtered.length > 0) {
      acc[committee] = filtered
    }
    return acc
  }, {})

  const totalCount = filteredExecutive.length + filteredHeads.length + 
    Object.values(filteredMembers).flat().length

  const committeeNames = {
    cultural: "Cultural Committee",
    academic: "Academic Committee",
    sports: "Sports Committee",
    social: "Social Committee",
    media: "Media Committee",
    logistics: "Logistics Committee",
    ysag: "YSAG (Yemeni Students Academic Group)",
    womenAffairs: "Women Affairs Committee"
  }

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
              placeholder="Search by name, role, committee, or major..."
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

        {/* 1. Executive Committee Section */}
        {filteredExecutive.length > 0 && (
          <div className="members-section executive-section">
            <h2 className="section-group-title">Executive Committee</h2>
            <p className="section-description">The main leaders of ISS Yemen</p>
            <div className="members-grid executive-grid">
              {filteredExecutive.map((member) => (
                <div key={member.id} className="member-card executive-card animate-scaleIn">
                  <div className="member-avatar executive-avatar">
                    {member.name.charAt(0)}
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-role">{member.role}</p>
                    {member.bio && <p className="member-bio">{member.bio}</p>}
                    <div className="member-details">
                      <p className="member-detail">
                        <span className="detail-label">Major:</span> {member.major}
                      </p>
                      <p className="member-detail">
                        <span className="detail-label">Year:</span> {member.year}
                      </p>
                      <p className="member-detail">
                        <span className="detail-label">Email:</span>{" "}
                        <a href={`mailto:${member.email}`} className="member-email">
                          {member.email}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Committee Heads Section */}
        {filteredHeads.length > 0 && (
          <div className="members-section">
            <h2 className="section-group-title">Committee Heads</h2>
            <p className="section-description">Heads of major departments</p>
            <div className="members-grid">
              {filteredHeads.map((member) => (
                <div key={member.id} className="member-card committee-head-card animate-scaleIn">
                  <div className="member-avatar">
                    {member.name.charAt(0)}
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-role">{member.role}</p>
                    {member.bio && <p className="member-bio">{member.bio}</p>}
                    <div className="member-details">
                      <p className="member-detail">
                        <span className="detail-label">Major:</span> {member.major}
                      </p>
                      <p className="member-detail">
                        <span className="detail-label">Year:</span> {member.year}
                      </p>
                      <p className="member-detail">
                        <span className="detail-label">Email:</span>{" "}
                        <a href={`mailto:${member.email}`} className="member-email">
                          {member.email}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Committee Members Section */}
        {Object.keys(filteredMembers).length > 0 && (
          <div className="members-section">
            <h2 className="section-group-title">Committee Members</h2>
            <p className="section-description">Members organized by committee</p>
            {Object.entries(filteredMembers).map(([committee, members]) => (
              <div key={committee} className="committee-group">
                <h3 className="committee-title">{committeeNames[committee]}</h3>
                <div className="members-grid">
                  {members.map((member) => (
                    <div key={member.id} className="member-card animate-scaleIn">
                      <div className="member-avatar">
                        {member.name.charAt(0)}
                      </div>
                      <div className="member-info">
                        <h3 className="member-name">{member.name}</h3>
                        <p className="member-role">Committee Member</p>
                        <div className="member-details">
                          <p className="member-detail">
                            <span className="detail-label">Major:</span> {member.major}
                          </p>
                          <p className="member-detail">
                            <span className="detail-label">Year:</span> {member.year}
                          </p>
                          <p className="member-detail">
                            <span className="detail-label">Email:</span>{" "}
                            <a href={`mailto:${member.email}`} className="member-email">
                              {member.email}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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



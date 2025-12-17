"use client"

import { useState, useEffect } from "react"
import { getAboutUs } from "../api/aboutus.js"
import "../styles/about-us.css"
import utmLogo from "../assets/utm-logo.png"

export default function AboutUs() {
  const [aboutUs, setAboutUs] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAboutUs() {
      try {
        const res = await getAboutUs()
        if (res.aboutUs) {
          setAboutUs(res.aboutUs)
        }
      } catch (err) {
        console.error("Failed to fetch About Us:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAboutUs()
  }, [])

  if (loading) {
    return (
      <div className="about-container">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const content = aboutUs || {
    mission: 'The ISS Yemen club is dedicated to fostering unity, cultural exchange, and academic excellence among Yemeni students at UTM. We aim to create a supportive community that helps students thrive academically, socially, and culturally during their time in Malaysia.',
    vision: 'To be a leading student organization that empowers Yemeni students, preserves our cultural heritage, and builds bridges between Yemen and Malaysia through meaningful engagement, events, and collaborative initiatives.',
    activities: [
      { icon: '🎓', title: 'Academic Support', description: 'Providing academic materials, course resources, past-year papers, summaries, and study support for students from all faculties.' },
      { icon: '🎉', title: 'Cultural Events', description: 'Celebrating Yemeni heritage through cultural nights, festivals, traditional performances, and community cultural activities.' },
      { icon: '🤝', title: 'Community Building', description: 'Creating social programs, gatherings, support activities, and initiatives that strengthen relationships within the ISS Yemen community.' },
      { icon: '🎯', title: 'Student Activities & Engagement', description: 'Coordinating sports events, media and content creation, documentation, and logistical support for all ISS Yemen activities and programs.' }
    ],
    joinUsText: 'Whether you\'re a new student or have been at UTM for a while, we welcome all Yemeni students to join our community. Together, we can build a stronger, more connected student body.'
  }

  return (
    <div className="about-container animate-fadeInUp">
      <div className="about-hero">
        <div className="about-hero-content">
          <div className="about-logo-section">
            <img src={utmLogo} alt="ISS Yemen Logo" className="about-logo" />
            <h1 className="about-title">ISS YEMEN</h1>
            <p className="about-subtitle">Yemeni Students Union at Universiti Teknologi Malaysia</p>
          </div>
        </div>
      </div>

      <div className="about-content">
        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              {content.mission}
            </p>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">Our Vision</h2>
            <p className="section-text">
              {content.vision}
            </p>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">What We Do</h2>
            <div className="activities-grid">
              {content.activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">Join Us</h2>
            <p className="section-text">
              {content.joinUsText}
            </p>
            <div className="cta-buttons">
              <a href="/signup" className="cta-button primary">
                Become a Member
              </a>
              <a href="/members" className="cta-button secondary">
                Meet Our Members
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



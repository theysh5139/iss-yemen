"use client"

import "../styles/about-us.css"
import utmLogo from "../assets/utm-logo.png"

export default function AboutUs() {
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
              The ISS Yemen club is dedicated to fostering unity, cultural exchange, and academic excellence 
              among Yemeni students at UTM. We aim to create a supportive community that helps students 
              thrive academically, socially, and culturally during their time in Malaysia.
            </p>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">Our Vision</h2>
            <p className="section-text">
              To be a leading student organization that empowers Yemeni students, preserves our cultural 
              heritage, and builds bridges between Yemen and Malaysia through meaningful engagement, 
              events, and collaborative initiatives.
            </p>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">What We Do</h2>
            <div className="activities-grid">
              <div className="activity-item">
                <div className="activity-icon">🎓</div>
                <h3>Academic Support</h3>
                <p>Providing academic materials, course resources, past-year papers, summaries, and study support for students from all faculties.</p>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🎉</div>
                <h3>Cultural Events</h3>
                <p>Celebrating Yemeni heritage through cultural nights, festivals, traditional performances, and community cultural activities.</p>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🤝</div>
                <h3>Community Building</h3>
                <p>Creating social programs, gatherings, support activities, and initiatives that strengthen relationships within the ISS Yemen community.</p>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🎯</div>
                <h3>Student Activities & Engagement</h3>
                <p>Coordinating sports events, media and content creation, documentation, and logistical support for all ISS Yemen activities and programs.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="section-card">
            <h2 className="section-title">Join Us</h2>
            <p className="section-text">
              Whether you're a new student or have been at UTM for a while, we welcome all Yemeni students 
              to join our community. Together, we can build a stronger, more connected student body.
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



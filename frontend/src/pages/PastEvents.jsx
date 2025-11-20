"use client"

import "../styles/past-events.css"

export default function PastEvents() {
  // Mock event data - replace with API call later
  const events = [
    {
      id: 1,
      title: "Yemeni Cultural Night 2024",
      date: "2024-11-15",
      location: "UTM Student Center",
      description: "A celebration of Yemeni culture with traditional food, music, and performances.",
      attendees: 150,
      category: "Cultural"
    },
    {
      id: 2,
      title: "Academic Workshop: Research Methods",
      date: "2024-10-20",
      location: "UTM Library",
      description: "Workshop on academic research methods and thesis writing for graduate students.",
      attendees: 45,
      category: "Academic"
    },
    {
      id: 3,
      title: "Networking Meetup",
      date: "2024-09-30",
      location: "UTM Cafeteria",
      description: "Casual meetup for new and existing members to network and socialize.",
      attendees: 80,
      category: "Social"
    },
    {
      id: 4,
      title: "Eid Al-Fitr Celebration",
      date: "2024-04-10",
      location: "UTM Student Center",
      description: "Community celebration of Eid Al-Fitr with prayers, food, and activities.",
      attendees: 200,
      category: "Cultural"
    },
    {
      id: 5,
      title: "Study Group Formation",
      date: "2024-03-15",
      location: "UTM Library",
      description: "Organizing study groups for various majors to support academic success.",
      attendees: 60,
      category: "Academic"
    },
    {
      id: 6,
      title: "Welcome New Students",
      date: "2024-02-01",
      location: "UTM Main Hall",
      description: "Orientation event for new Yemeni students joining UTM.",
      attendees: 120,
      category: "Social"
    }
  ]

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date))

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  function getCategoryColor(category) {
    const colors = {
      Cultural: "#4a6fa5",
      Academic: "#5cb85c",
      Social: "#f56565"
    }
    return colors[category] || "#7f8c8d"
  }

  return (
    <div className="events-container animate-fadeInUp">
      <div className="events-header">
        <h1 className="events-title">Past Events Timeline</h1>
        <p className="events-subtitle">A look back at our recent activities and celebrations</p>
      </div>

      <div className="events-content">
        <div className="timeline">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="timeline-item">
              <div className="timeline-marker" style={{ borderColor: getCategoryColor(event.category) }}>
                <div 
                  className="timeline-dot" 
                  style={{ backgroundColor: getCategoryColor(event.category) }}
                ></div>
              </div>
              <div className="timeline-content">
                <div className="event-card">
                  <div className="event-header">
                    <div className="event-category" style={{ backgroundColor: getCategoryColor(event.category) }}>
                      {event.category}
                    </div>
                    <div className="event-date">{formatDate(event.date)}</div>
                  </div>
                  <h2 className="event-title">{event.title}</h2>
                  <div className="event-details">
                    <div className="event-detail">
                      <span className="detail-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="event-detail">
                      <span className="detail-icon">👥</span>
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                  <p className="event-description">{event.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



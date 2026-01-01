import React from "react"
import "../styles/home.css"

export default function HODCard({ hod }) {
  return (
    <div className="hod-card">
      <div className="hod-photo">
        <img 
          src={hod.photo} 
          alt={hod.name}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hod.name)}&size=200&background=1e3a8a&color=fff`
          }}
        />
      </div>
      <div className="hod-info">
        <div className="hod-name">{hod.name}</div>
        <div className="hod-designation">{hod.designation}</div>
      </div>
    </div>
  )
}
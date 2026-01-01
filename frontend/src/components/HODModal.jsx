import { useEffect } from "react"
import "../styles/hod-modal.css"

export default function HODModal({ hods, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="hod-modal-overlay" onClick={onClose}>
      <div className="hod-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={onClose}>×</button>
        <h2 className="hod-modal-title">Heads of Department</h2>
        <p className="hod-modal-subtitle">Meet our distinguished department heads</p>
        <div className="hod-modal-grid">
          {hods && hods.length > 0 ? (
            hods.map(hod => (
              <div key={hod._id || hod.id} className="hod-modal-card">
                <div className="hod-modal-photo-wrapper">
                  <img 
                    src={hod.photo} 
                    alt={hod.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hod.name)}&size=200&background=1e3a8a&color=fff`
                    }}
                  />
                </div>
                <div className="hod-modal-info">
                  <h3 className="hod-modal-name">{hod.name}</h3>
                  <p className="hod-modal-designation">{hod.designation}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="hod-modal-empty">
              <p>No HOD profiles available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



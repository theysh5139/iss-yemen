import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { getAllEventRegistrations } from "../api/admin.js";
import "../styles/admin-dashboard.css";
import "../styles/admin-forms.css";
import "../styles/theme.css";
import "../styles/admin-sidebar.css";

export default function AdminEventRegistrations() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const onLogout = async () => {
    try {
      await logoutApi();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchRegistrations();
  }, [user, navigate]);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllEventRegistrations();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError(error.message || "Failed to load event registrations. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique events for filter (before filtering)
  const uniqueEvents = [...new Set(registrations.map(r => r.eventTitle))];

  // Calculate real-time stats based on ALL registrations (not filtered)
  // These stats show the total counts regardless of current filters
  const totalRegistrations = registrations.length;
  // Paid registrations = registrations with payment receipts that have been submitted (have receiptUrl and amount > 0)
  const paidRegistrations = registrations.filter(r => {
    const hasPaymentReceipt = r.hasPayment && r.paymentReceipt;
    const hasReceiptUrl = r.paymentReceipt?.receiptUrl;
    const hasAmount = r.paymentReceipt?.amount > 0;
    return hasPaymentReceipt && hasReceiptUrl && hasAmount;
  }).length;
  // Free registrations = registrations without payment receipts OR with zero amount
  const freeRegistrations = registrations.filter(r => {
    return !r.hasPayment || !r.paymentReceipt || !r.paymentReceipt.receiptUrl || (r.paymentReceipt.amount || 0) <= 0;
  }).length;

  // Filter registrations based on selected filters (for display)
  const filteredRegistrations = registrations.filter(reg => {
    // Event filter (by event title)
    if (eventFilter !== 'all' && reg.eventTitle.toLowerCase() !== eventFilter.toLowerCase()) {
      return false;
    }
    
    // Payment filter
    if (paymentFilter === 'paid') {
      // Only show paid registrations (with payment receipts, receiptUrl, and amount > 0)
      const isPaid = reg.hasPayment && 
                     reg.paymentReceipt && 
                     reg.paymentReceipt.receiptUrl && 
                     (reg.paymentReceipt.amount || 0) > 0;
      if (!isPaid) return false;
    }
    if (paymentFilter === 'free') {
      // Only show free registrations (without payment receipts or with zero amount)
      const isFree = !reg.hasPayment || 
                     !reg.paymentReceipt || 
                     !reg.paymentReceipt.receiptUrl || 
                     (reg.paymentReceipt.amount || 0) <= 0;
      if (!isFree) return false;
    }
    
    return true;
  });

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      <div className="admin-main-content">
        <div className="admin-content">
          <div className="main-section">
            {/* Header */}
            <div className="page-title">
              <h1>Event Registrations</h1>
              <p>Manage all event registrations by users. View registration details, payment status, and user information.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Stats Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-icon">📋</div>
                <div className="card-content">
                  <div className="card-label">Total Registrations</div>
                  <div className="card-value">{totalRegistrations}</div>
                </div>
              </div>
              <div className="summary-card" style={{ background: '#5cb85c' }}>
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <div className="card-label">Paid Registrations</div>
                  <div className="card-value">{paidRegistrations}</div>
                </div>
              </div>
              <div className="summary-card" style={{ background: '#5bc0de' }}>
                <div className="card-icon">🆓</div>
                <div className="card-content">
                  <div className="card-label">Free Registrations</div>
                  <div className="card-value">{freeRegistrations}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="content-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <select 
                className="role-select"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="all">All Events</option>
                {uniqueEvents.map(eventTitle => (
                  <option key={eventTitle} value={eventTitle}>{eventTitle}</option>
                ))}
              </select>
              <select 
                className="role-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Registrations</option>
                <option value="paid">Paid Events Only</option>
                <option value="free">Free Events Only</option>
              </select>
            </div>

            {/* Registrations List */}
            <div className="content-section">
              <h2 className="section-title">All Registrations</h2>
              
              {isLoading ? (
                <div className="empty-state">
                  <p>Loading registrations...</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="empty-state">
                  <p>No registrations found.</p>
                </div>
              ) : (
                <div className="admin-list">
                  {filteredRegistrations.map((reg) => (
                    <div 
                      key={reg.id} 
                      className="admin-list-item"
                      style={{ borderLeft: reg.hasPayment ? '4px solid #5cb85c' : '4px solid #5bc0de' }}
                    >
                      <div className="item-content">
                        <div className="item-header">
                          <h3 className="item-title">
                            {reg.eventTitle}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {reg.hasPayment && (
                              <span className="badge verified" style={{ background: '#5cb85c' }}>
                                💰 Paid
                              </span>
                            )}
                            {!reg.hasPayment && (
                              <span className="badge" style={{ background: '#5bc0de' }}>
                                🆓 Free
                              </span>
                            )}
                            {reg.paymentReceipt?.paymentStatus && (
                              <span className={`badge ${
                                reg.paymentReceipt.paymentStatus === 'Verified' ? 'verified' :
                                reg.paymentReceipt.paymentStatus === 'Rejected' ? 'private' :
                                'cancelled-badge'
                              }`}>
                                {reg.paymentReceipt.paymentStatus}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="item-description">
                          <strong>Category:</strong> {reg.eventCategory} | 
                          <strong> Location:</strong> {reg.eventLocation} | 
                          <strong> Event Date:</strong> {formatDate(reg.eventDate)}
                        </div>

                        <div className="item-meta">
                          <span>👤 <strong>User:</strong> {reg.user.name}</span>
                          <span>📧 <strong>Email:</strong> {reg.user.email}</span>
                          {reg.registrationName && reg.registrationName !== reg.user.name && (
                            <span>📝 <strong>Registered As:</strong> {reg.registrationName}</span>
                          )}
                          {reg.matricNumber && (
                            <span>🎓 <strong>Matric:</strong> {reg.matricNumber}</span>
                          )}
                          {reg.phone && (
                            <span>📱 <strong>Phone:</strong> {reg.phone}</span>
                          )}
                          <span>📅 <strong>Registered:</strong> {formatDate(reg.registeredAt)}</span>
                        </div>

                        {reg.notes && (
                          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                            <strong>Notes:</strong> {reg.notes}
                          </div>
                        )}

                        {reg.paymentReceipt && (
                          <div style={{ 
                            marginTop: '1rem', 
                            padding: '1rem', 
                            background: '#f0f9ff', 
                            borderRadius: '8px',
                            border: '1px solid #0b6b63'
                          }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: '#0b6b63', fontSize: '1rem' }}>
                              💳 Payment Details
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.9rem' }}>
                              <span><strong>Receipt Number:</strong></span>
                              <span>{reg.paymentReceipt.receiptNumber}</span>
                              <span><strong>Amount:</strong></span>
                              <span>RM {reg.paymentReceipt.amount?.toFixed(2) || '0.00'}</span>
                              <span><strong>Payment Method:</strong></span>
                              <span>{reg.paymentReceipt.paymentMethod || 'N/A'}</span>
                              <span><strong>Status:</strong></span>
                              <span style={{ 
                                color: reg.paymentReceipt.paymentStatus === 'Verified' ? '#28a745' :
                                       reg.paymentReceipt.paymentStatus === 'Rejected' ? '#dc3545' :
                                       '#ffc107',
                                fontWeight: '600'
                              }}>
                                {reg.paymentReceipt.paymentStatus}
                              </span>
                              {reg.paymentReceipt.verifiedAt && (
                                <>
                                  <span><strong>Verified At:</strong></span>
                                  <span>{formatDate(reg.paymentReceipt.verifiedAt)}</span>
                                </>
                              )}
                              {reg.paymentReceipt.rejectionReason && (
                                <>
                                  <span><strong>Rejection Reason:</strong></span>
                                  <span style={{ color: '#dc3545' }}>{reg.paymentReceipt.rejectionReason}</span>
                                </>
                              )}
                            </div>
                            {reg.paymentReceipt.receiptUrl && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <a 
                                  href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${reg.paymentReceipt.receiptUrl}`}
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="btn-view"
                                  style={{ display: 'inline-block', textDecoration: 'none' }}
                                >
                                  👁️ View Receipt
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


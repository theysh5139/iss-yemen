import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { getAllPaymentReceipts, approvePayment, rejectPayment } from "../api/payments.js";
import { apiFetch } from "../api/client.js";
import "../styles/admin-dashboard.css";
import "../styles/admin-forms.css";
import "../styles/theme.css";
import "../styles/admin-sidebar.css";
import "../styles/admin-verify-payments.css";

export default function AdminVerifyPayments() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logoutApi();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchPayments();
  }, [user, navigate, statusFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching payments with status filter:", statusFilter);
      const data = await getAllPaymentReceipts(statusFilter);
      console.log("Payment data received:", data);
      setPayments(data.receipts || data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      console.error("Error details:", error.message, error.status, error.data);
      setError(error.message || "Failed to load payment receipts. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (payment) => {
    if (!window.confirm("Approve this payment receipt? This action will verify the payment.")) return;
    
    try {
      setError(null);
      await approvePayment(payment.eventId, payment.registrationIndex);
      setSuccess("Payment approved successfully!");
      await fetchPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to approve payment. Please try again.");
    }
  };

  const handleReject = async (payment) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    
    try {
      setError(null);
      setRejectingId(payment.id);
      await rejectPayment(payment.eventId, payment.registrationIndex, rejectReason);
      setSuccess("Payment rejected successfully!");
      setShowRejectModal(null);
      setRejectReason("");
      await fetchPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to reject payment. Please try again.");
    } finally {
      setRejectingId(null);
    }
  };

  // Sort payments: Pending first, then by date
  const sortedPayments = [...payments].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
  });

  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const verifiedCount = payments.filter(p => p.status === 'Verified').length;
  const rejectedCount = payments.filter(p => p.status === 'Rejected').length;

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

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      <div className="admin-main-content">
        <div className="admin-content">
          <div className="main-section">
        {/* --- Top Header Section --- */}
        <div className="page-title">
          <h1>Verify Payments</h1>
          <p>Review, approve, or reject payment receipts for <strong>paid events only</strong> (events with fees). Only registrations with submitted receipts are displayed here. Free events are not shown.</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">🔍</div>
            <div className="card-content">
              <div className="card-label">Pending</div>
              <div className="card-value">{pendingCount}</div>
            </div>
          </div>
          <div className="summary-card" style={{ background: '#5cb85c' }}>
            <div className="card-icon">✅</div>
            <div className="card-content">
              <div className="card-label">Verified</div>
              <div className="card-value">{verifiedCount}</div>
            </div>
          </div>
          <div className="summary-card" style={{ background: '#e74c3c' }}>
            <div className="card-icon">❌</div>
            <div className="card-content">
              <div className="card-label">Rejected</div>
              <div className="card-value">{rejectedCount}</div>
            </div>
          </div>
          <div className="summary-card" style={{ background: '#5bc0de' }}>
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-label">Total</div>
              <div className="card-value">{payments.length}</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="content-actions">
          <select 
            className="role-select"
            value={statusFilter || 'all'}
            onChange={(e) => setStatusFilter(e.target.value || 'all')}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* --- Payment Receipts List --- */}
        <div className="content-section">
          <h2 className="section-title">Payment Receipts</h2>
          
          {isLoading ? (
            <div className="empty-state">
              <p>Loading payment receipts...</p>
            </div>
          ) : sortedPayments.length === 0 ? (
            <div className="empty-state">
              <p>No payment receipts found.</p>
            </div>
          ) : (
            <div className="admin-list">
              {sortedPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className={`admin-list-item ${payment.status === 'Pending' ? '' : ''}`}
                  style={payment.status === 'Pending' ? { borderLeft: '4px solid #f0ad4e' } : {}}
                >
                  <div className="item-content">
                    <div className="item-header">
                      <h3 className="item-title">
                        {payment.event?.title || 'Event Deleted'}
                      </h3>
                      <span className={`badge ${
                        payment.status === 'Pending' ? 'cancelled-badge' :
                        payment.status === 'Verified' ? 'verified' :
                        'private'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    
                    <div className="item-description">
                      <strong>Payment Type:</strong> {payment.paymentType} | 
                      <strong> Amount:</strong> {payment.currency} {payment.amount}
                    </div>

                    <div className="item-meta">
                      <span>👤 {payment.user?.name || 'Unknown User'}</span>
                      <span>📧 {payment.user?.email || 'N/A'}</span>
                      {payment.event?.date && (
                        <span>📅 Event: {formatDate(payment.event.date)}</span>
                      )}
                      {payment.event?.location && (
                        <span>📍 {payment.event.location}</span>
                      )}
                      <span>📤 Submitted: {formatDate(payment.submittedAt)}</span>
                      {payment.verifiedAt && (
                        <span>✅ Verified: {formatDate(payment.verifiedAt)}</span>
                      )}
                      {payment.rejectionReason && (
                        <span style={{ color: '#e74c3c' }}>❌ Reason: {payment.rejectionReason}</span>
                      )}
                    </div>

                    {payment.receiptUrl && (
                      <div className="pt-2">
                        <a 
                          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${payment.receiptUrl}`}
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-view"
                          style={{ display: 'inline-block', textDecoration: 'none' }}
                        >
                          👁️ View Payment Receipt
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="item-actions">
                    {payment.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleApprove(payment)}
                          className="btn-view"
                        >
                          ✅ Approve
                        </button>
                        <button 
                          onClick={() => setShowRejectModal(payment.id)}
                          className="btn-delete"
                        >
                          ❌ Reject
                        </button>
                      </>
                    ) : (
                      <span className="badge verified" style={{ padding: '0.5rem 1rem' }}>
                        {payment.status === 'Verified' ? '✅ Verified' : '❌ Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reject Payment Receipt</h2>
                <button className="modal-close" onClick={() => setShowRejectModal(null)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  const payment = payments.find(p => p.id === showRejectModal);
                  if (payment) {
                    handleReject(payment);
                  }
                }}>
                  <div className="form-group">
                    <label>
                      Rejection Reason <span className="required">*</span>
                    </label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Please provide a reason for rejecting this payment receipt..."
                      className="form-input"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      disabled={rejectingId === showRejectModal}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                      className="btn btn-secondary"
                      disabled={rejectingId === showRejectModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={rejectingId === showRejectModal}
                    >
                      {rejectingId === showRejectModal ? (
                        <>
                          <span className="spinner"></span>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          ❌ Reject Payment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

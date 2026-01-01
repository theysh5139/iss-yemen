import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import AdminSidebar from "../components/AdminSidebar.jsx";
import { getAllPaymentReceipts, approvePayment, rejectPayment } from "../api/payments.js";
import "../styles/admin-dashboard.css";
import "../styles/admin-forms.css";
import "../styles/theme.css";
=======
import { apiFetch } from "../api/client.js";
import AdminSidebar from "../components/AdminSidebar.jsx";
import "../styles/admin-dashboard.css";
import "../styles/admin-sidebar.css";
import "../styles/admin-verify-payments.css";
>>>>>>> origin/LATEST_SPRINT4

export default function AdminVerifyPayments() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
<<<<<<< HEAD

  const onLogout = async () => {
    try {
      await logoutApi();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);
=======
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchPayments();
  }, [user, navigate]);
>>>>>>> origin/LATEST_SPRINT4

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
<<<<<<< HEAD
      const data = await getAllPaymentReceipts(filterStatus);
      setPayments(data.receipts || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to load payment receipts. Please refresh the page.");
=======
      const data = await apiFetch('/api/admin/payments/verify');
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message || "Failed to load payments");
>>>>>>> origin/LATEST_SPRINT4
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this payment receipt? This action will verify the payment.")) return;
    
    try {
      setError(null);
      await approvePayment(id);
      setSuccess("Payment approved successfully!");
      await fetchPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to approve payment. Please try again.");
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    
    try {
      setError(null);
      setRejectingId(id);
      await rejectPayment(id, rejectReason);
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
          <p>Review, approve, or reject payment receipts linked to registered events. Ensure payment records remain accurate.</p>
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
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
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

                    <div className="pt-2">
                      <a 
                        href={payment.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-view"
                        style={{ display: 'inline-block', textDecoration: 'none' }}
                      >
                        👁️ View Payment Receipt
                      </a>
                    </div>
                  </div>

                  <div className="item-actions">
                    {payment.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleApprove(payment.id)}
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
                <form onSubmit={(e) => { e.preventDefault(); handleReject(showRejectModal); }}>
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
=======
  const handleApprove = async (payment) => {
    if (!window.confirm(`Approve payment receipt ${payment.receiptNumber}?`)) return;
    try {
      await apiFetch(`/api/admin/payments/${payment.eventId}/${payment.registrationIndex}/approve`, {
        method: 'POST'
      });
      setSuccessMessage('Payment verified successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchPayments(); // Refresh list
    } catch (err) {
      alert("Error approving payment: " + (err.message || "Unknown error"));
    }
  };

  const handleReject = async (payment) => {
    if (!window.confirm(`Reject payment receipt ${payment.receiptNumber}?`)) return;
    try {
      await apiFetch(`/api/admin/payments/${payment.eventId}/${payment.registrationIndex}/reject`, {
        method: 'POST'
      });
      setSuccessMessage('Payment rejected successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchPayments(); // Refresh list
    } catch (err) {
      alert("Error rejecting payment: " + (err.message || "Unknown error"));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Calculate summary stats
  const stats = {
    pending: payments.filter(p => p.status === 'Pending').length,
    verified: payments.filter(p => p.status === 'Verified').length,
    rejected: payments.filter(p => p.status === 'Rejected').length,
    total: payments.length
  };

  // Filter and sort payments
  const filteredPayments = payments.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.registeredAt) - new Date(a.registeredAt);
  });

  const onLogout = async () => {
    try {
      await logoutApi();
      setUser(null);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      <div className="admin-main-content">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
            <div className="breadcrumbs">
              <span>Dashboard &gt; Verify Payments</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="admin-content">
          <div className="main-section">
            <div className="verify-payments-container">
      {/* --- Top Header Section --- */}
      <div className="verify-payments-header">
        <h1 className="verify-payments-title">Verify Payments</h1>
        <p className="verify-payments-description">Review, approve, or reject payment receipts linked to registered events. Ensure payment records remain accurate.</p>
        
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Summary Cards - Horizontal Grid */}
        <div className="status-cards-grid">
          {/* Pending Card - Dark Blue */}
          <div className="status-card status-card-pending">
            <div className="status-card-content">
              <div className="status-card-number">{stats.pending}</div>
              <div className="status-card-icon">🔍</div>
            </div>
            <div className="status-card-label">Pending</div>
          </div>
          
          {/* Verified Card - Green */}
          <div className="status-card status-card-verified">
            <div className="status-card-content">
              <div className="status-card-number">{stats.verified}</div>
              <div className="status-card-icon">✅</div>
            </div>
            <div className="status-card-label">Verified</div>
          </div>
          
          {/* Rejected Card - Red */}
          <div className="status-card status-card-rejected">
            <div className="status-card-content">
              <div className="status-card-number">{stats.rejected}</div>
              <div className="status-card-icon">❌</div>
            </div>
            <div className="status-card-label">Rejected</div>
          </div>
          
          {/* Total Card - Light Blue */}
          <div className="status-card status-card-total">
            <div className="status-card-content">
              <div className="status-card-number">{stats.total}</div>
              <div className="status-card-icon">📊</div>
            </div>
            <div className="status-card-label">Total</div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="status-filter-container">
          <div className="status-filter-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="status-filter-arrow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* --- Payment Receipts Section --- */}
      <div className="payment-receipts-section">
        <h2 className="payment-receipts-title">Payment Receipts</h2>
        <div className="payment-receipts-divider"></div>

        {/* Cards Layout */}
        <div>
          {isLoading ? (
            <div className="payment-receipts-content">
              <p className="payment-receipts-empty">Loading payment receipts...</p>
            </div>
          ) : sortedPayments.length === 0 ? (
            <div className="payment-receipts-content">
              <p className="payment-receipts-empty">No payment receipts found.</p>
            </div>
          ) : (
            sortedPayments.map((payment) => (
              <div 
                key={payment.id} 
                className={`payment-card ${
                  payment.status === 'Pending' ? 'payment-card-pending' : 
                  payment.status === 'Verified' ? 'payment-card-verified' : 
                  payment.status === 'Rejected' ? 'payment-card-rejected' : ''
                }`}
              >
                {/* Left Content Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-blue-900">
                      {payment.eventName}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wide 
                      ${payment.status === 'Pending' ? 'bg-orange-100 text-orange-700' : ''}
                      ${payment.status === 'Verified' ? 'bg-green-100 text-green-700' : ''}
                      ${payment.status === 'Rejected' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {payment.status}
                    </span>
                  </div>

                  <div className="text-slate-600 flex flex-wrap gap-4 text-sm mt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400">👤</span>
                      {payment.userName}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400">💵</span>
                      RM {payment.amount?.toFixed(2) || '0.00'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">📅</span>
                      Event: {formatDate(payment.eventDate)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">🧾</span>
                      Receipt: {payment.receiptNumber}
                    </div>
                  </div>

                  {/* View Receipt Link */}
                  <div className="pt-2">
                    <a 
                      href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/receipts/event/${payment.eventId}/download?userId=${payment.userId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      <span>👁️</span> View Payment Receipt
                    </a>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-start gap-2 min-w-fit">
                  {payment.status === 'Pending' ? (
                    <>
                      <button 
                        onClick={() => handleApprove(payment)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
                      >
                        <span>✅</span> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(payment)}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
                      >
                        <span>❌</span> Reject
                      </button>
                    </>
                  ) : (
                    <button 
                      disabled 
                      className="bg-slate-100 text-slate-400 px-4 py-2 rounded text-sm font-medium cursor-not-allowed border border-slate-200"
                    >
                      {payment.status === 'Verified' ? '✅ Verified' : '❌ Rejected'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
            </div>
          </div>
>>>>>>> origin/LATEST_SPRINT4
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/LATEST_SPRINT4

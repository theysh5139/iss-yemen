import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import AdminSidebar from "../components/AdminSidebar.jsx";
import "../styles/admin-dashboard.css";
import "../styles/admin-sidebar.css";
import "../styles/admin-verify-payments.css";

export default function AdminVerifyPayments() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
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

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch('/api/admin/payments/verify');
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message || "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

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
        </div>
      </div>
    </div>
  );
}

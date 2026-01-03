import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { getAllRules, createRule, updateRule, deleteRule } from "../api/chatbot.js";
import "../styles/admin-dashboard.css";
import "../styles/admin-forms.css";
import "../styles/theme.css";
import "../styles/admin-sidebar.css";
import "../styles/admin-chatbot.css";

export default function AdminChatbot() {
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
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [faqFilter, setFaqFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null); 
  const [formData, setFormData] = useState({ 
    keyword: "", 
    response: "",
    isFAQ: false,
    relatedKeywords: "",
    category: "general",
    priority: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchRules();
  }, [user, navigate]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllRules();
      setRules(data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      setError("Failed to load chatbot rules. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        keyword: rule.keyword || "",
        response: rule.response || "",
        isFAQ: rule.isFAQ || false,
        relatedKeywords: (rule.relatedKeywords || []).join(", "),
        category: rule.category || "general",
        priority: rule.priority || 0
      });
    } else {
      setEditingRule(null);
      setFormData({
        keyword: "",
        response: "",
        isFAQ: false,
        relatedKeywords: "",
        category: "general",
        priority: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ keyword: "", response: "" });
    setEditingRule(null);
    setError(null);
    setSuccess(null);
    setFormData({ 
      keyword: "", 
      response: "",
      isFAQ: false,
      relatedKeywords: "",
      category: "general",
      priority: 0
    });
    setEditingRule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingRule) {
        // Use update endpoint for instant updates (A15)
        await updateRule(editingRule._id, formData);
        setSuccess("Rule updated successfully!");
      } else {
        await createRule(formData);
        setSuccess("Rule created successfully!");
      }
      
      // Refresh rules immediately for instant updates (A15)
      await fetchRules();
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (error) {
      const errorMessage = error.message || "Error saving rule. Ensure keywords are unique.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rule? This action cannot be undone.")) return;
    
    try {
      setError(null);
      await deleteRule(id);
      setSuccess("Rule deleted successfully!");
      // Refresh rules immediately for instant updates (A15)
      await fetchRules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting rule", error);
      setError("Failed to delete rule. Please try again.");
    }
  };


  // Calculate statistics
  const stats = {
    total: rules.length,
    faqs: rules.filter(r => r.isFAQ).length,
    categories: [...new Set(rules.map(r => r.category || 'general'))].length,
    highPriority: rules.filter(r => r.priority > 5).length
  };

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchQuery ||
      rule.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.response.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter;
    const matchesFAQ = faqFilter === 'all' ||
      (faqFilter === 'faq' && rule.isFAQ) ||
      (faqFilter === 'non-faq' && !rule.isFAQ);
    return matchesSearch && matchesCategory && matchesFAQ;
  });

  // Get unique categories
  const categories = ['all', ...new Set(rules.map(r => r.category || 'general'))];

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
              <span>Dashboard &gt; Chatbot Manager</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="admin-content">
          <div className="main-section">
            <div className="chatbot-container">
              {/* --- Top Header Section --- */}
              <div className="chatbot-header">
                <div className="chatbot-title-section">
                  <h1 className="chatbot-title">Chatbot Manager</h1>
                  <p className="chatbot-description">Create, edit, and manage chatbot rules. Updates reflect instantly without downtime.</p>
                </div>

                {/* Create Button */}
                <div className="chatbot-create-section">
                  <button
                    onClick={() => openModal()}
                    className="create-rule-btn"
                  >
                    <span>➕</span>
                    Create Rules
                  </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="success-message">
                    <span>✅</span>
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Statistics Cards */}
                <div className="chatbot-stats-grid">
                  <div className="stat-card stat-card-primary">
                    <div className="stat-card-content">
                      <div className="stat-card-number">{stats.total}</div>
                      <div className="stat-card-icon">📋</div>
                    </div>
                    <div className="stat-card-label">Total Rules</div>
                  </div>
                  <div className="stat-card stat-card-success">
                    <div className="stat-card-content">
                      <div className="stat-card-number">{stats.faqs}</div>
                      <div className="stat-card-icon">⭐</div>
                    </div>
                    <div className="stat-card-label">FAQs</div>
                  </div>
                  <div className="stat-card stat-card-info">
                    <div className="stat-card-content">
                      <div className="stat-card-number">{stats.categories}</div>
                      <div className="stat-card-icon">📁</div>
                    </div>
                    <div className="stat-card-label">Categories</div>
                  </div>
                  <div className="stat-card stat-card-warning">
                    <div className="stat-card-content">
                      <div className="stat-card-number">{stats.highPriority}</div>
                      <div className="stat-card-icon">🔝</div>
                    </div>
                    <div className="stat-card-label">High Priority</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="chatbot-filter-container">
                  <div className="filter-wrapper">
                    <select
                      className="filter-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                    <span className="filter-arrow">▼</span>
                  </div>
                  <div className="filter-wrapper">
                    <select
                      className="filter-select"
                      value={faqFilter}
                      onChange={(e) => setFaqFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="faq">FAQs Only</option>
                      <option value="non-faq">Non-FAQs</option>
                    </select>
                    <span className="filter-arrow">▼</span>
                  </div>
                </div>
              </div>

              {/* --- Chatbot Rules Section --- */}
              <div className="chatbot-rules-section">
                <h2 className="chatbot-rules-title">Chat bot Rules</h2>
                <div className="chatbot-rules-divider"></div>

                {/* Content Box */}
                <div className="chatbot-rules-content">
                  {/* Search Box */}
                  <div className="chatbot-search-container">
                    <div className="search-box">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Search rules by keyword or response..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          className="search-clear"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rules List */}
                  <div className="rules-list">
                    {isLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading rules...</p>
                      </div>
                    ) : filteredRules.length === 0 ? (
                      <div className="empty-state">
                        No chatbot rules found.
                      </div>
                    ) : (
                      filteredRules.map((rule) => (
                        <div key={rule._id} className="rule-card">
                          <div className="rule-card-content">
                            <div className="rule-main-content">
                              <div className="rule-header">
                                <h3 className="rule-keyword">
                                  {rule.keyword}
                                </h3>
                                {rule.priority > 5 && (
                                  <span className="priority-badge-high">🔝 High Priority</span>
                                )}
                              </div>
                              <p className="rule-response">
                                {rule.response}
                              </p>

                              <div className="rule-badges">
                                <span className="rule-badge badge-auto-reply">
                                  <span>💬</span>
                                  Auto-Reply
                                </span>
                                {rule.isFAQ && (
                                  <span className="rule-badge badge-faq">
                                    <span>⭐</span>
                                    FAQ
                                  </span>
                                )}
                                <span className="rule-badge badge-category">
                                  📁 {rule.category || 'general'}
                                </span>
                                {rule.priority > 0 && (
                                  <span className="rule-badge badge-priority">
                                    🔢 Priority: {rule.priority}
                                  </span>
                                )}
                                {rule.relatedKeywords && rule.relatedKeywords.length > 0 && (
                                  <span className="rule-badge badge-related">
                                    🔗 {rule.relatedKeywords.length} related
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="rule-actions">
                              <button
                                onClick={() => openModal(rule)}
                                className="rule-btn rule-btn-edit"
                                title="Edit rule"
                              >
                                <span>✏️</span> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(rule._id)}
                                className="rule-btn rule-btn-delete"
                                title="Delete rule"
                              >
                                <span>🗑️</span> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* --- Modal Popup --- */}
              {isModalOpen && (
                <div className="chatbot-modal-overlay" onClick={closeModal}>
                  <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="chatbot-modal-header">
                      <h3 className="chatbot-modal-title">
                        {editingRule ? "Edit Rule" : "Create New Rule"}
                      </h3>
                      <button
                        onClick={closeModal}
                        className="chatbot-modal-close"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="chatbot-modal-body">
                      <div className="chatbot-form-group">
                        <label className="chatbot-form-label">
                          Trigger Keyword <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 'membership', 'events', 'contact'"
                          className="chatbot-form-input"
                          value={formData.keyword}
                          onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        />
                        <p className="chatbot-form-hint">
                          <span className="chatbot-form-hint-icon">💡</span>
                          <span>Users must type this exact keyword to trigger the response</span>
                        </p>
                      </div>

                      <div className="chatbot-form-group">
                        <label className="chatbot-form-label">
                          Bot Response <span className="required">*</span>
                        </label>
                        <textarea
                          required
                          rows="5"
                          placeholder="e.g. 'Membership costs RM20 per year. You can register by...'"
                          className="chatbot-form-textarea"
                          value={formData.response}
                          onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                        />
                      </div>

                      <div className="chatbot-form-grid">
                        <div className="chatbot-form-group">
                          <label className="chatbot-form-label">Category</label>
                          <select
                            className="chatbot-form-input"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          >
                            <option value="general">General</option>
                            <option value="events">Events</option>
                            <option value="membership">Membership</option>
                            <option value="payment">Payment</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="chatbot-form-group">
                          <label className="chatbot-form-label">Priority</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="chatbot-form-input"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div className="chatbot-form-group">
                        <label className="chatbot-form-label">Related Keywords</label>
                        <input
                          type="text"
                          placeholder="e.g. 'member, join, signup'"
                          className="chatbot-form-input"
                          value={formData.relatedKeywords}
                          onChange={(e) => setFormData({ ...formData, relatedKeywords: e.target.value })}
                        />
                        <p className="chatbot-form-hint">These help the bot match similar questions</p>
                      </div>

                      <div className="chatbot-form-group">
                        <label className="chatbot-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            id="isFAQ"
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            checked={formData.isFAQ}
                            onChange={(e) => setFormData({ ...formData, isFAQ: e.target.checked })}
                          />
                          <span>Mark as Frequently Asked Question (FAQ)</span>
                        </label>
                      </div>

                      <div className="chatbot-form-footer">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="chatbot-btn chatbot-btn-cancel"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="chatbot-btn chatbot-btn-save"
                        >
                          Save Rule
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

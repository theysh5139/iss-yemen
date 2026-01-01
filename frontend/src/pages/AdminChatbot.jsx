import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider.jsx";
import { logoutApi } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { getAllRules, createRule, updateRule, deleteRule } from "../api/chatbot.js";
import "../styles/admin-dashboard.css";
import "../styles/admin-forms.css";
import "../styles/theme.css";

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
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null); 
  const [formData, setFormData] = useState({ keyword: "", response: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

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
      setFormData({ keyword: rule.keyword, response: rule.response });
    } else {
      setEditingRule(null);
      setFormData({ keyword: "", response: "" });
    }
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ keyword: "", response: "" });
    setEditingRule(null);
    setError(null);
    setSuccess(null);
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

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      <div className="admin-main-content">
        <div className="admin-content">
          <div className="main-section">
        {/* --- Top Header Section --- */}
        <div className="page-title">
          <h1>Chatbot Manager</h1>
          <p>Create, edit, and manage automated responses for the ISS Bot. Changes reflect instantly.</p>
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

        {/* Action Bar */}
        <div className="content-actions">
          <button 
            onClick={() => openModal()} 
            className="btn btn-primary"
          >
            <span className="btn-icon">➕</span>
            Create New Rule
          </button>
        </div>

        {/* --- Rules List --- */}
        <div className="content-section">
          <h2 className="section-title">All Active Rules ({rules.length})</h2>
          
          {isLoading ? (
            <div className="empty-state">
              <p>Loading rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <p>No rules found. Click "Create New Rule" to add your first chatbot response.</p>
            </div>
          ) : (
            <div className="admin-list">
              {rules.map((rule) => (
                <div key={rule._id} className="admin-list-item">
                  <div className="item-content">
                    <div className="item-header">
                      <h3 className="item-title">{rule.keyword}</h3>
                      <span className="badge public">Active</span>
                    </div>
                    <p className="item-description">{rule.response}</p>
                    <div className="item-meta">
                      <span>💬 Auto-Reply Rule</span>
                      {rule.createdAt && (
                        <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => openModal(rule)}
                      className="btn-edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(rule._id)}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* --- Modal Popup --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRule ? "Edit Rule" : "Create New Rule"}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                  <label>
                    Trigger Keyword <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 'membership', 'events', 'contact'"
                    className="form-input"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <div className="form-hint">
                    <span className="hint-icon">💡</span>
                    Users must type this exact keyword to trigger the response
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Bot Response <span className="required">*</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    placeholder="e.g. 'Membership costs RM20 per year. You can register by...'"
                    className="form-input"
                    value={formData.response}
                    onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <div className="form-hint">
                    <span className="hint-icon">💡</span>
                    This message will be sent automatically when the keyword is detected
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">💾</span>
                        {editingRule ? "Update Rule" : "Create Rule"}
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
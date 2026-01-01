# User Stories - Code Highlights

This document highlights the code sections that implement each user story requirement.

---

## User Story 1: Add, Edit, and Delete Chatbot Responses

**Story:** "As an admin, I want to add, edit, and delete chatbot responses easily."

### Frontend Implementation

**File:** `frontend/src/pages/AdminChatbot.jsx`

#### 1. Add/Create Rule
```javascript
// Lines 92-126: Handle form submission for creating/editing rules
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const payload = {
      keyword: formData.keyword,
      response: formData.response,
      isFAQ: formData.isFAQ,
      relatedKeywords: formData.relatedKeywords.split(',').map(k => k.trim()).filter(k => k),
      category: formData.category,
      priority: parseInt(formData.priority) || 0
    };

    if (editingRule) {
      // EDIT: Update existing rule
      await axios.put(
        `${API_BASE_URL}/api/chatbot/rule/${editingRule._id}`,
        payload,
        { withCredentials: true }
      );
    } else {
      // ADD: Create new rule
      await axios.post(
        `${API_BASE_URL}/api/chatbot/rule`,
        payload,
        { withCredentials: true }
      );
    }
    
    closeModal();
    setSuccessMessage(editingRule ? 'Rule updated successfully!' : 'Rule created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchRules(); // Refresh rules list
  } catch (error) {
    alert("Error saving rule: " + (error.response?.data?.message || error.message));
  }
};
```

#### 2. Edit Rule
```javascript
// Lines 54-77: Open modal for editing existing rule
const openModal = (rule = null) => {
  if (rule) {
    // EDIT MODE: Pre-fill form with existing rule data
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
    // CREATE MODE: Empty form
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
```

#### 3. Delete Rule
```javascript
// Lines 128-142: Delete rule functionality
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this rule?")) return;
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    await axios.delete(`${API_BASE_URL}/api/chatbot/rule/${id}`, {
      withCredentials: true,
    });
    setSuccessMessage('Rule deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchRules(); // Refresh rules list after deletion
  } catch (error) {
    console.error("Error deleting rule", error);
    alert("Error deleting rule: " + (error.response?.data?.message || error.message));
  }
};
```

#### 4. UI Components
```javascript
// Lines 200-209: Create Rules Button
<div className="chatbot-create-section">
  <button 
    onClick={() => openModal()} 
    className="create-rule-btn"
  >
    <span>➕</span>
    Create Rules
  </button>
</div>

// Lines 274-289: Edit and Delete buttons on each rule card
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
```

### Backend Implementation

**File:** `backend/src/controllers/chatbot.controller.js`

#### 1. Create Rule (Add)
```javascript
// Lines 52-68: Create new chatbot rule
export const createRule = async (req, res) => {
  try {
    const { keyword, response, isFAQ, relatedKeywords, category, priority } = req.body;
    const newRule = new ChatRule({ 
      keyword, 
      response, 
      isFAQ: isFAQ || false,
      relatedKeywords: relatedKeywords || [],
      category: category || 'general',
      priority: priority || 0
    });
    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### 2. Update Rule (Edit)
```javascript
// Lines 70-95: Update existing chatbot rule
export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, response, isFAQ, relatedKeywords, category, priority } = req.body;
    const updatedRule = await ChatRule.findByIdAndUpdate(
      id,
      { 
        keyword, 
        response, 
        isFAQ,
        relatedKeywords,
        category,
        priority,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    if (!updatedRule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### 3. Delete Rule
```javascript
// Lines 121-128: Delete chatbot rule
export const deleteRule = async (req, res) => {
  try {
    await ChatRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### API Routes

**File:** `backend/src/routes/chatbot.routes.js`

```javascript
// Lines 8-13: Chatbot management routes
router.post('/rule', verifyAdmin, chatbotController.createRule);      // ADD
router.put('/rule/:id', verifyAdmin, chatbotController.updateRule);   // EDIT
router.get('/rules', verifyAdmin, chatbotController.getAllRules);     // GET ALL
router.delete('/rule/:id', verifyAdmin, chatbotController.deleteRule); // DELETE
```

---

## User Story 2: Instant Updates Without Downtime

**Story:** "As an admin, I want the chatbot's updates to reflect instantly without downtime."

### How Instant Updates Work

#### 1. Real-Time Database Queries

**File:** `backend/src/controllers/chatbot.controller.js`

```javascript
// Lines 131-146: Each chat request queries database directly (no cache)
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userMessage = message.toLowerCase().trim();
    
    // Query database directly - always gets latest rules
    let rule = await ChatRule.findOne({ 
      $or: [
        { keyword: { $regex: new RegExp(`^${userMessage}$`, 'i') } },
        { relatedKeywords: { $in: [userMessage] } }
      ]
    });
    
    // If no exact match, query all rules for fuzzy matching
    if (!rule) {
      const allRules = await ChatRule.find(); // Fresh query from DB
      // ... fuzzy matching logic
    }
    // ... rest of handler
  }
};
```

**Key Point:** Every chat request queries MongoDB directly, ensuring latest rules are always used.

#### 2. Frontend Auto-Refresh After Changes

**File:** `frontend/src/pages/AdminChatbot.jsx`

```javascript
// Lines 39-52: Fetch rules from backend
const fetchRules = async () => {
  try {
    setIsLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const res = await axios.get(`${API_BASE_URL}/api/chatbot/rules`, {
      withCredentials: true,
    });
    setRules(res.data); // Update rules state
  } catch (error) {
    console.error("Error fetching rules:", error);
  } finally {
    setIsLoading(false);
  }
};

// Lines 122, 137: Auto-refresh after create/update/delete
const handleSubmit = async (e) => {
  // ... save rule
  fetchRules(); // ✅ Immediately refresh rules list
};

const handleDelete = async (id) => {
  // ... delete rule
  fetchRules(); // ✅ Immediately refresh rules list
};
```

#### 3. No Server Restart Required

**File:** `backend/src/controllers/chatbot.controller.js`

```javascript
// The handleChat function queries database on every request
// No caching mechanism = instant updates
// No need to restart server when rules change
```

**File:** `backend/src/routes/chatbot.routes.js`

```javascript
// Routes are always active
// No server restart needed when rules are added/updated/deleted
// Changes take effect immediately on next chat request
```

### Why It Works Instantly

1. **No Caching:** Each request queries MongoDB directly
2. **Real-Time Queries:** `ChatRule.find()` always gets latest data
3. **Frontend Refresh:** UI updates immediately after save/delete
4. **No Server Restart:** Routes and handlers are always active

---

## User Story 3: Verify Payment Receipts Linked to Events

**Story:** "As an admin, I want to verify that payment receipts are correctly linked to registered events so that payment records remain accurate."

### Database Schema - Payment Receipt Linked to Event Registration

**File:** `backend/src/models/Event.model.js`

```javascript
// Lines 3-24: Registration schema with payment receipt
const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registeredAt: { type: Date, default: Date.now },
  registrationName: { type: String },
  registrationEmail: { type: String },
  phone: { type: String },
  notes: { type: String },
  paymentReceipt: {  // ✅ Payment receipt embedded in registration
    receiptNumber: { type: String },
    receiptUrl: { type: String },
    generatedAt: { type: Date },
    amount: { type: Number },
    paymentMethod: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Rejected'], 
      default: 'Pending' 
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin who verified
  }
}, { _id: false });

// Lines 32: Registrations array in Event schema
const eventSchema = new mongoose.Schema({
  // ... other fields
  registrations: [registrationSchema], // ✅ Array of registrations with payment receipts
  // ... other fields
});
```

### Backend - Payment Verification

**File:** `backend/src/controllers/admin.controller.js`

#### 1. Get All Payments with Event Links

```javascript
// Lines 341-391: Fetch payments linked to events
export const verifyPayments = async (req, res, next) => {
  try {
    const { Event } = await import('../models/Event.model.js');
    const { User } = await import('../models/User.model.js');
    
    // ✅ Fetch events with registrations that have payment receipts
    const events = await Event.find({
      'registrations.paymentReceipt': { $exists: true }
    }).populate('registrations.user', 'name email'); // ✅ Link user info

    const payments = [];

    events.forEach(event => {
      event.registrations.forEach((reg, index) => {
        if (reg.paymentReceipt) {
          const user = reg.user;
          payments.push({
            id: reg._id?.toString() || `${event._id}-${index}`,
            registrationIndex: index, // ✅ Index for lookup
            eventId: event._id.toString(), // ✅ Event ID
            eventName: event.title, // ✅ Event name
            eventDate: event.date, // ✅ Event date
            userId: user?._id?.toString() || reg.user?.toString() || 'Unknown', // ✅ User ID
            userName: user?.name || 'Unknown', // ✅ User name
            userEmail: user?.email || 'Unknown', // ✅ User email
            receiptNumber: reg.paymentReceipt.receiptNumber, // ✅ Receipt number
            receiptUrl: reg.paymentReceipt.receiptUrl,
            amount: reg.paymentReceipt.amount || 0, // ✅ Payment amount
            paymentMethod: reg.paymentReceipt.paymentMethod || 'Online',
            status: reg.paymentReceipt.paymentStatus || 'Pending', // ✅ Payment status
            registeredAt: reg.registeredAt, // ✅ Registration date
            generatedAt: reg.paymentReceipt.generatedAt,
            verifiedAt: reg.paymentReceipt.verifiedAt,
            verifiedBy: reg.paymentReceipt.verifiedBy // ✅ Admin who verified
          });
        }
      });
    });

    // Sort by status (Pending first) then by date
    payments.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.registeredAt) - new Date(a.registeredAt);
    });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
```

#### 2. Approve Payment (Verify)

```javascript
// Lines 393-430: Approve/Verify payment receipt
export const approvePayment = async (req, res, next) => {
  try {
    const { eventId, registrationIndex } = req.params; // ✅ Event ID and registration index
    const adminId = req.user.id; // ✅ Admin who verifies

    const { Event } = await import('../models/Event.model.js');
    const event = await Event.findById(eventId); // ✅ Find event by ID
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const index = parseInt(registrationIndex);
    if (isNaN(index) || index < 0 || index >= event.registrations.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const registration = event.registrations[index]; // ✅ Get specific registration
    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    // ✅ Update payment status and link to admin
    registration.paymentReceipt.paymentStatus = 'Verified';
    registration.paymentReceipt.verifiedAt = new Date();
    registration.paymentReceipt.verifiedBy = adminId; // ✅ Link to admin

    await event.save(); // ✅ Save to database

    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      receipt: registration.paymentReceipt
    });
  } catch (error) {
    next(error);
  }
};
```

#### 3. Reject Payment

```javascript
// Lines 432-469: Reject payment receipt
export const rejectPayment = async (req, res, next) => {
  try {
    const { eventId, registrationIndex } = req.params; // ✅ Event ID and registration index
    const adminId = req.user.id; // ✅ Admin who rejects

    const { Event } = await import('../models/Event.model.js');
    const event = await Event.findById(eventId); // ✅ Find event by ID
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const index = parseInt(registrationIndex);
    if (isNaN(index) || index < 0 || index >= event.registrations.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const registration = event.registrations[index]; // ✅ Get specific registration
    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    // ✅ Update payment status and link to admin
    registration.paymentReceipt.paymentStatus = 'Rejected';
    registration.paymentReceipt.verifiedAt = new Date();
    registration.paymentReceipt.verifiedBy = adminId; // ✅ Link to admin

    await event.save(); // ✅ Save to database

    res.json({ 
      success: true, 
      message: 'Payment rejected',
      receipt: registration.paymentReceipt
    });
  } catch (error) {
    next(error);
  }
};
```

### Frontend - Payment Verification UI

**File:** `frontend/src/pages/AdminVerifyPayments.jsx`

#### 1. Fetch Payments with Event Links

```javascript
// Lines 29-41: Fetch payments linked to events
const fetchPayments = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const data = await apiFetch('/api/admin/payments/verify');
    setPayments(data.payments || []); // ✅ Payments include event and user info
  } catch (err) {
    console.error("Error fetching payments:", err);
    setError(err.message || "Failed to load payments");
  } finally {
    setIsLoading(false);
  }
};
```

#### 2. Approve Payment

```javascript
// Lines 43-55: Approve payment linked to event
const handleApprove = async (payment) => {
  if (!window.confirm(`Approve payment receipt ${payment.receiptNumber}?`)) return;
  try {
    // ✅ Uses eventId and registrationIndex to link payment to event
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
```

#### 3. Display Payment with Event Link

```javascript
// Lines 245-283: Display payment details with event and user links
{payment.eventName && (
  <div className="payment-detail">
    <span className="payment-label">Event:</span>
    <span className="payment-value">{payment.eventName}</span>
  </div>
)}
{payment.eventDate && (
  <div className="payment-detail">
    <span className="payment-label">Event Date:</span>
    <span className="payment-value">{formatDate(payment.eventDate)}</span>
  </div>
)}
{payment.userName && (
  <div className="payment-detail">
    <span className="payment-label">User:</span>
    <span className="payment-value">{payment.userName} ({payment.userEmail})</span>
  </div>
)}
```

### Event Registration - Payment Receipt Creation

**File:** `backend/src/controllers/event.controller.js`

```javascript
// Lines 53-117: Register for event and create payment receipt
export async function registerForEvent(req, res, next) {
  try {
    const { id } = req.params; // Event ID
    const userId = req.user.id; // User ID
    const { name, email, phone, notes, paymentMethod } = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Generate payment receipt if event requires payment
    let receiptData = null;
    if (event.requiresPayment && event.paymentAmount > 0) {
      const { generateReceiptData } = await import('../utils/receipt.js');
      receiptData = generateReceiptData(event, user, event.paymentAmount, paymentMethod);
    }

    // Add to registered users
    event.registeredUsers.push(userId);
    event.attendees = event.registeredUsers.length;

    // ✅ Add detailed registration with payment receipt linked to event
    const registrationData = {
      user: userId, // ✅ Link to user
      registeredAt: new Date(),
      registrationName: name || user.name,
      registrationEmail: email || user.email,
      phone: phone || null,
      notes: notes || null
    };

    if (receiptData) {
      registrationData.paymentReceipt = {
        receiptNumber: receiptData.receiptNumber, // ✅ Receipt number
        generatedAt: receiptData.generatedAt,
        amount: receiptData.amount, // ✅ Payment amount
        paymentMethod: receiptData.paymentMethod, // ✅ Payment method
        paymentStatus: receiptData.paymentStatus // ✅ Status (Pending)
      };
    }

    event.registrations.push(registrationData); // ✅ Add to event's registrations array
    await event.save(); // ✅ Save event with linked payment receipt

    return res.json({ 
      message: 'Successfully registered for event', 
      event,
      receipt: receiptData || null
    });
  } catch (err) {
    next(err);
  }
}
```

### API Routes

**File:** `backend/src/routes/admin.routes.js`

```javascript
// Lines 53-56: Payment verification routes
router.get('/payments/verify', verifyPayments); // ✅ Get all payments with event links
router.post('/payments/:eventId/:registrationIndex/approve', approvePayment); // ✅ Approve payment
router.post('/payments/:eventId/:registrationIndex/reject', rejectPayment); // ✅ Reject payment
```

---

## Summary

### User Story 1: Add, Edit, Delete Chatbot Responses
- **Frontend:** `frontend/src/pages/AdminChatbot.jsx` (Lines 54-142, 200-289)
- **Backend:** `backend/src/controllers/chatbot.controller.js` (Lines 52-128)
- **Routes:** `backend/src/routes/chatbot.routes.js` (Lines 8-13)

### User Story 2: Instant Updates Without Downtime
- **Backend:** `backend/src/controllers/chatbot.controller.js` (Lines 131-146) - Real-time DB queries
- **Frontend:** `frontend/src/pages/AdminChatbot.jsx` (Lines 39-52, 122, 137) - Auto-refresh
- **No caching mechanism** = Instant updates

### User Story 3: Verify Payment Receipts Linked to Events
- **Database Schema:** `backend/src/models/Event.model.js` (Lines 3-24, 32) - Payment receipt in registration
- **Backend:** `backend/src/controllers/admin.controller.js` (Lines 341-469) - Verification logic
- **Backend:** `backend/src/controllers/event.controller.js` (Lines 53-117) - Payment receipt creation
- **Frontend:** `frontend/src/pages/AdminVerifyPayments.jsx` (Lines 29-283) - Verification UI
- **Routes:** `backend/src/routes/admin.routes.js` (Lines 53-56) - Verification endpoints

---

## Key Files Reference

| User Story | Frontend Files | Backend Files |
|------------|---------------|---------------|
| **Story 1** | `frontend/src/pages/AdminChatbot.jsx` | `backend/src/controllers/chatbot.controller.js`<br>`backend/src/routes/chatbot.routes.js` |
| **Story 2** | `frontend/src/pages/AdminChatbot.jsx`<br>`frontend/src/components/Chatbot.jsx` | `backend/src/controllers/chatbot.controller.js` |
| **Story 3** | `frontend/src/pages/AdminVerifyPayments.jsx` | `backend/src/controllers/admin.controller.js`<br>`backend/src/controllers/event.controller.js`<br>`backend/src/models/Event.model.js` |


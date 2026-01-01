# User Stories - Code Highlights

This document highlights the code sections that implement each user story requirement.

---

## User Story 1: Add, Edit, and Delete Chatbot Responses

**Story:** "As an admin, I want to add, edit, and delete chatbot responses easily."

### Frontend Implementation

**File:** `frontend/src/pages/AdminChatbot.jsx`

#### 1. Add/Create Rule

**Explanation:**
This function handles the form submission when an admin creates a new chatbot rule or edits an existing one. It collects all form data (keyword, response, FAQ status, related keywords, category, and priority), formats it properly, and sends it to the backend API. The function intelligently determines whether to create a new rule (POST) or update an existing one (PUT) based on whether `editingRule` is set. After a successful save, it closes the modal, shows a success message, and automatically refreshes the rules list so the admin sees the new/updated rule immediately.

**Key Features:**
- Prevents default form submission behavior
- Formats related keywords from comma-separated string to array
- Converts priority to integer
- Handles both create and update operations in one function
- Provides user feedback with success messages
- Auto-refreshes rules list after save

```javascript
// Lines 92-126: Handle form submission for creating/editing rules
const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent page reload on form submit
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    // Prepare payload with all rule data
    const payload = {
      keyword: formData.keyword, // The trigger keyword users type
      response: formData.response, // The bot's response
      isFAQ: formData.isFAQ, // Whether this is a FAQ
      // Convert comma-separated string to array and clean up
      relatedKeywords: formData.relatedKeywords.split(',').map(k => k.trim()).filter(k => k),
      category: formData.category, // Category for organization
      priority: parseInt(formData.priority) || 0 // Priority level (higher = more important)
    };

    if (editingRule) {
      // EDIT MODE: Update existing rule using PUT request
      await axios.put(
        `${API_BASE_URL}/api/chatbot/rule/${editingRule._id}`, // Include rule ID
        payload,
        { withCredentials: true } // Send authentication cookies
      );
    } else {
      // CREATE MODE: Create new rule using POST request
      await axios.post(
        `${API_BASE_URL}/api/chatbot/rule`,
        payload,
        { withCredentials: true }
      );
    }
    
    closeModal(); // Close the form modal
    setSuccessMessage(editingRule ? 'Rule updated successfully!' : 'Rule created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000); // Hide message after 3 seconds
    fetchRules(); // Refresh rules list to show new/updated rule
  } catch (error) {
    // Show error message if save fails
    alert("Error saving rule: " + (error.response?.data?.message || error.message));
  }
};
```

#### 2. Edit Rule

**Explanation:**
This function opens the modal form for either creating a new rule or editing an existing one. When a rule object is passed as a parameter, it enters "edit mode" by pre-filling the form with the existing rule's data. When no rule is passed (null), it enters "create mode" with an empty form. The function handles data transformation, converting arrays (like relatedKeywords) to comma-separated strings for the form input, and ensures all fields have default values to prevent errors.

**Key Features:**
- Dual mode: create or edit based on parameter
- Pre-fills form data when editing
- Converts array data to string format for form inputs
- Sets default values for all fields
- Opens the modal after setting up the form

```javascript
// Lines 54-77: Open modal for editing existing rule
const openModal = (rule = null) => {
  if (rule) {
    // EDIT MODE: Pre-fill form with existing rule data
    setEditingRule(rule); // Store the rule being edited
    setFormData({ 
      keyword: rule.keyword || "", // Pre-fill keyword
      response: rule.response || "", // Pre-fill response
      isFAQ: rule.isFAQ || false, // Pre-fill FAQ status
      // Convert array to comma-separated string for text input
      relatedKeywords: (rule.relatedKeywords || []).join(", "),
      category: rule.category || "general", // Pre-fill category
      priority: rule.priority || 0 // Pre-fill priority
    });
  } else {
    // CREATE MODE: Empty form for new rule
    setEditingRule(null); // No rule being edited
    setFormData({ 
      keyword: "", // Empty fields
      response: "",
      isFAQ: false,
      relatedKeywords: "",
      category: "general", // Default category
      priority: 0 // Default priority
    });
  }
  setIsModalOpen(true); // Open the modal form
};
```

#### 3. Delete Rule

**Explanation:**
This function handles the deletion of a chatbot rule. It first asks for user confirmation to prevent accidental deletions, then sends a DELETE request to the backend API with the rule's ID. After successful deletion, it shows a success message and automatically refreshes the rules list to remove the deleted rule from the UI. Error handling ensures the user is notified if the deletion fails.

**Key Features:**
- Confirmation dialog to prevent accidental deletion
- Sends DELETE request with rule ID
- Shows success feedback
- Auto-refreshes rules list
- Error handling with user-friendly messages

```javascript
// Lines 128-142: Delete rule functionality
const handleDelete = async (id) => {
  // Ask for confirmation before deleting
  if (!window.confirm("Are you sure you want to delete this rule?")) return;
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    // Send DELETE request to backend
    await axios.delete(`${API_BASE_URL}/api/chatbot/rule/${id}`, {
      withCredentials: true, // Include authentication
    });
    
    // Show success message
    setSuccessMessage('Rule deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000); // Hide after 3 seconds
    
    fetchRules(); // Refresh rules list to remove deleted rule from UI
  } catch (error) {
    console.error("Error deleting rule", error);
    // Show error message to user
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

**Explanation:**
This controller function handles the creation of new chatbot rules. It extracts the rule data from the request body, creates a new ChatRule document with default values for optional fields, saves it to MongoDB, and returns the created rule. The function includes error handling to catch validation errors or database issues. Default values ensure that even if some fields are missing, the rule can still be created with sensible defaults.

**Key Features:**
- Extracts rule data from request body
- Sets default values for optional fields (isFAQ, relatedKeywords, category, priority)
- Creates and saves new rule to MongoDB
- Returns the created rule with 201 status code
- Handles errors gracefully

```javascript
// Lines 52-68: Create new chatbot rule
export const createRule = async (req, res) => {
  try {
    // Extract rule data from request body
    const { keyword, response, isFAQ, relatedKeywords, category, priority } = req.body;
    
    // Create new ChatRule document with defaults for optional fields
    const newRule = new ChatRule({ 
      keyword, // Required: trigger keyword
      response, // Required: bot response
      isFAQ: isFAQ || false, // Default to false if not provided
      relatedKeywords: relatedKeywords || [], // Default to empty array
      category: category || 'general', // Default to 'general'
      priority: priority || 0 // Default to 0 (lowest priority)
    });
    
    // Save to MongoDB database
    await newRule.save();
    
    // Return created rule with 201 (Created) status
    res.status(201).json(newRule);
  } catch (error) {
    // Handle validation errors or database errors
    res.status(500).json({ message: error.message });
  }
};
```

#### 2. Update Rule (Edit)

**Explanation:**
This controller function updates an existing chatbot rule. It takes the rule ID from the URL parameters and the updated data from the request body, then uses MongoDB's `findByIdAndUpdate` to update the rule. The `new: true` option returns the updated document instead of the original, and `runValidators: true` ensures all validation rules are checked. It also automatically sets the `updatedAt` timestamp. If the rule doesn't exist, it returns a 404 error.

**Key Features:**
- Updates rule by ID from URL parameter
- Updates all provided fields
- Automatically sets updatedAt timestamp
- Returns updated document (not original)
- Validates data before saving
- Returns 404 if rule not found

```javascript
// Lines 70-95: Update existing chatbot rule
export const updateRule = async (req, res) => {
  try {
    const { id } = req.params; // Get rule ID from URL
    // Extract updated data from request body
    const { keyword, response, isFAQ, relatedKeywords, category, priority } = req.body;
    
    // Find rule by ID and update it
    const updatedRule = await ChatRule.findByIdAndUpdate(
      id, // Rule ID to find
      { 
        keyword, // Update keyword
        response, // Update response
        isFAQ, // Update FAQ status
        relatedKeywords, // Update related keywords
        category, // Update category
        priority, // Update priority
        updatedAt: new Date() // Set update timestamp
      },
      { 
        new: true, // Return updated document (not original)
        runValidators: true // Run schema validation
      }
    );
    
    // Check if rule was found
    if (!updatedRule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    
    // Return updated rule
    res.status(200).json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### 3. Delete Rule

**Explanation:**
This controller function deletes a chatbot rule from the database. It uses MongoDB's `findByIdAndDelete` method which finds the rule by ID and removes it in a single operation. This is efficient and atomic. After successful deletion, it returns a success message. The function handles errors that might occur if the ID format is invalid or if there's a database connection issue.

**Key Features:**
- Deletes rule by ID from URL parameter
- Atomic operation (find and delete in one step)
- Returns success message
- Handles errors gracefully

```javascript
// Lines 121-128: Delete chatbot rule
export const deleteRule = async (req, res) => {
  try {
    // Find rule by ID and delete it in one atomic operation
    await ChatRule.findByIdAndDelete(req.params.id);
    
    // Return success message
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    // Handle errors (invalid ID format, DB connection issues, etc.)
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

**Explanation:**
This is the core function that handles user chat messages. The key to instant updates is that **every single chat request queries the database directly** - there is no caching mechanism. This means when an admin creates, updates, or deletes a rule, the very next chat message will use the updated rules because it queries MongoDB fresh each time. The function first tries to find an exact match, and if not found, it queries all rules for fuzzy matching. Since it always queries the database, there's no delay or need to clear cache when rules change.

**Key Point:** Every chat request queries MongoDB directly, ensuring latest rules are always used.

**Why This Enables Instant Updates:**
- No caching layer means no stale data
- Each request gets fresh data from database
- Changes take effect immediately on next request
- No server restart needed

```javascript
// Lines 131-146: Each chat request queries database directly (no cache)
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body; // Get user's message
    const userMessage = message.toLowerCase().trim(); // Normalize message
    
    // ✅ FRESH QUERY: Query database directly - always gets latest rules
    // This query happens on EVERY request, ensuring we always have the most up-to-date rules
    let rule = await ChatRule.findOne({ 
      $or: [
        // Try exact keyword match (case-insensitive)
        { keyword: { $regex: new RegExp(`^${userMessage}$`, 'i') } },
        // Or check if message matches any related keywords
        { relatedKeywords: { $in: [userMessage] } }
      ]
    });
    
    // If no exact match, query all rules for fuzzy matching
    if (!rule) {
      // ✅ FRESH QUERY: Get all rules from database (not from cache)
      const allRules = await ChatRule.find(); // Always gets latest data
      // ... fuzzy matching logic to find best match
    }
    // ... rest of handler returns response
  }
};
```

#### 2. Frontend Auto-Refresh After Changes

**File:** `frontend/src/pages/AdminChatbot.jsx`

**Explanation:**
The frontend automatically refreshes the rules list immediately after any create, update, or delete operation. The `fetchRules()` function queries the backend API to get the latest list of rules and updates the React state. This ensures the admin sees their changes reflected in the UI instantly. The function is called right after successful save/delete operations, so the admin doesn't need to manually refresh the page to see their changes.

**Key Features:**
- Fetches latest rules from backend API
- Updates React state with new data
- Automatically called after create/update/delete
- Shows loading state during fetch
- Handles errors gracefully

```javascript
// Lines 39-52: Fetch rules from backend
const fetchRules = async () => {
  try {
    setIsLoading(true); // Show loading indicator
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    // ✅ FRESH FETCH: Get latest rules from backend (always gets current data)
    const res = await axios.get(`${API_BASE_URL}/api/chatbot/rules`, {
      withCredentials: true, // Include authentication
    });
    
    setRules(res.data); // Update React state with latest rules
  } catch (error) {
    console.error("Error fetching rules:", error);
  } finally {
    setIsLoading(false); // Hide loading indicator
  }
};

// Lines 122, 137: Auto-refresh after create/update/delete
const handleSubmit = async (e) => {
  // ... save rule to backend
  fetchRules(); // ✅ Immediately refresh rules list - admin sees new rule right away
};

const handleDelete = async (id) => {
  // ... delete rule from backend
  fetchRules(); // ✅ Immediately refresh rules list - deleted rule disappears instantly
};
```

#### 3. No Server Restart Required

**File:** `backend/src/controllers/chatbot.controller.js`

**Explanation:**
The chatbot handler function is always active and queries the database on every request. There's no caching mechanism, so there's no need to restart the server or clear cache when rules change. The server code remains the same - it's the database content that changes, and since we query the database directly each time, new rules are immediately available.

**Why No Restart is Needed:**
- Server code doesn't change when rules change
- Database queries are dynamic (not compiled into code)
- Routes are always active and listening
- Changes in database are immediately accessible

```javascript
// The handleChat function queries database on every request
// No caching mechanism = instant updates
// No need to restart server when rules change

// Example: When admin creates a new rule:
// 1. Rule is saved to MongoDB database
// 2. Server code remains unchanged
// 3. Next chat request queries database
// 4. New rule is found and returned immediately
// ✅ No restart needed!
```

**File:** `backend/src/routes/chatbot.routes.js`

**Explanation:**
The API routes are always active and listening for requests. When rules are added, updated, or deleted, the routes themselves don't change - they continue to work the same way. The routes simply provide access to the database, and since the database is queried fresh each time, any changes to the data are immediately reflected.

```javascript
// Routes are always active
// No server restart needed when rules are added/updated/deleted
// Changes take effect immediately on next chat request

// Route structure:
router.post('/rule', ...)      // Always active - creates new rules
router.put('/rule/:id', ...)   // Always active - updates existing rules
router.delete('/rule/:id', ...) // Always active - deletes rules
router.get('/rules', ...)      // Always active - gets all rules

// These routes don't change when data changes
// They just provide access to the database
// Database queries are dynamic, so changes are immediate
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

**Explanation:**
The database schema creates a direct link between payment receipts and event registrations by embedding the payment receipt inside each registration object. This design ensures that:
1. **One-to-one relationship**: Each registration can have exactly one payment receipt
2. **Data integrity**: Payment receipt cannot exist without a registration
3. **Easy querying**: Finding payments means finding registrations with payment receipts
4. **Complete linkage**: Payment receipt contains references to both the user (who paid) and the admin (who verified), creating a complete audit trail

The `registrations` array in the Event schema stores all registrations for that event, and each registration can optionally contain a `paymentReceipt` object. This embedded design means when you query an event, you get all its registrations and their payment information in a single query, ensuring data consistency.

**Key Design Decisions:**
- Payment receipt is embedded (not a separate collection) for data integrity
- `verifiedBy` field links to the admin who verified the payment
- `paymentStatus` enum ensures only valid statuses (Pending/Verified/Rejected)
- All payment data is stored with the registration, making queries efficient

```javascript
// Lines 3-24: Registration schema with payment receipt
const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ✅ Link to user
  registeredAt: { type: Date, default: Date.now }, // When user registered
  registrationName: { type: String }, // Name used during registration
  registrationEmail: { type: String }, // Email used during registration
  phone: { type: String }, // Phone from registration form
  notes: { type: String }, // Additional notes
  paymentReceipt: {  // ✅ Payment receipt embedded in registration (ensures link)
    receiptNumber: { type: String }, // Unique receipt identifier
    receiptUrl: { type: String }, // URL for sharing receipt
    generatedAt: { type: Date }, // When receipt was created
    amount: { type: Number }, // Payment amount
    paymentMethod: { type: String }, // How user paid (Online Banking, Credit Card, etc.)
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Rejected'], // ✅ Only valid statuses allowed
      default: 'Pending' // Starts as pending, waiting for admin verification
    },
    verifiedAt: { type: Date }, // When admin verified/rejected
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // ✅ Link to admin who verified
  }
}, { _id: false }); // No separate ID for registration (part of event)

// Lines 32: Registrations array in Event schema
const eventSchema = new mongoose.Schema({
  // ... other event fields (title, date, location, etc.)
  registrations: [registrationSchema], // ✅ Array of registrations with payment receipts
  // This creates the link: Event → Registrations → Payment Receipts
  // ... other fields
});
```

### Backend - Payment Verification

**File:** `backend/src/controllers/admin.controller.js`

#### 1. Get All Payments with Event Links

**Explanation:**
This function retrieves all payment receipts that are linked to event registrations. It uses MongoDB's `$exists` query to find only events that have registrations with payment receipts. The `populate` method automatically fetches user information (name, email) for each registration, creating a complete link chain: Event → Registration → User → Payment Receipt. The function then transforms this nested data into a flat array of payment objects that includes all the linked information (event details, user details, payment details) in one place. This makes it easy for admins to see the complete picture: which user paid for which event, how much, and the current verification status.

**Key Features:**
- Queries events with payment receipts using `$exists`
- Populates user information automatically
- Creates flat payment objects with all linked data
- Sorts payments (Pending first, then by date)
- Provides complete audit trail (who, what, when, how much)

```javascript
// Lines 341-391: Fetch payments linked to events
export const verifyPayments = async (req, res, next) => {
  try {
    const { Event } = await import('../models/Event.model.js');
    const { User } = await import('../models/User.model.js');
    
    // ✅ Query: Find events that have registrations with payment receipts
    // This ensures we only get events with actual payments
    const events = await Event.find({
      'registrations.paymentReceipt': { $exists: true } // Only events with payment receipts
    }).populate('registrations.user', 'name email'); // ✅ Automatically fetch user info for each registration

    const payments = [];

    // Loop through each event
    events.forEach(event => {
      // Loop through each registration in the event
      event.registrations.forEach((reg, index) => {
        if (reg.paymentReceipt) {
          const user = reg.user; // ✅ User info already populated
          
          // ✅ Create payment object with ALL linked information
          payments.push({
            id: reg._id?.toString() || `${event._id}-${index}`,
            registrationIndex: index, // ✅ Index for finding this registration later
            eventId: event._id.toString(), // ✅ Link to event
            eventName: event.title, // ✅ Event name for display
            eventDate: event.date, // ✅ Event date
            userId: user?._id?.toString() || reg.user?.toString() || 'Unknown', // ✅ Link to user
            userName: user?.name || 'Unknown', // ✅ User name for display
            userEmail: user?.email || 'Unknown', // ✅ User email for display
            receiptNumber: reg.paymentReceipt.receiptNumber, // ✅ Receipt identifier
            receiptUrl: reg.paymentReceipt.receiptUrl,
            amount: reg.paymentReceipt.amount || 0, // ✅ Payment amount
            paymentMethod: reg.paymentReceipt.paymentMethod || 'Online',
            status: reg.paymentReceipt.paymentStatus || 'Pending', // ✅ Current status
            registeredAt: reg.registeredAt, // ✅ When user registered
            generatedAt: reg.paymentReceipt.generatedAt, // ✅ When receipt was created
            verifiedAt: reg.paymentReceipt.verifiedAt, // ✅ When admin verified
            verifiedBy: reg.paymentReceipt.verifiedBy // ✅ Which admin verified
          });
        }
      });
    });

    // Sort: Pending payments first (need attention), then by date (newest first)
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

**Explanation:**
This function verifies/approves a payment receipt that is linked to a specific event registration. It uses the event ID and registration index to locate the exact payment receipt in the database. The function validates that the event exists, the registration exists, and the payment receipt exists before updating. When approving, it sets the payment status to 'Verified', records the verification timestamp, and links it to the admin who performed the verification. This creates a complete audit trail showing which admin verified which payment and when. The function saves the updated event document, which includes the updated registration with the verified payment receipt.

**Key Features:**
- Uses eventId and registrationIndex to find exact payment
- Validates event, registration, and receipt exist
- Updates payment status to 'Verified'
- Records verification timestamp
- Links verification to admin (audit trail)
- Saves changes to database

```javascript
// Lines 393-430: Approve/Verify payment receipt
export const approvePayment = async (req, res, next) => {
  try {
    // ✅ Get identifiers from URL: eventId and registrationIndex
    // This ensures we're updating the correct payment linked to the correct event
    const { eventId, registrationIndex } = req.params;
    const adminId = req.user.id; // ✅ Get admin ID from authenticated user (who is verifying)

    const { Event } = await import('../models/Event.model.js');
    
    // ✅ Step 1: Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // ✅ Step 2: Validate registration index
    const index = parseInt(registrationIndex);
    if (isNaN(index) || index < 0 || index >= event.registrations.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // ✅ Step 3: Get the specific registration from the event's registrations array
    const registration = event.registrations[index];
    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    // ✅ Step 4: Update payment receipt status and link to admin
    registration.paymentReceipt.paymentStatus = 'Verified'; // Change status
    registration.paymentReceipt.verifiedAt = new Date(); // Record when verified
    registration.paymentReceipt.verifiedBy = adminId; // ✅ Link to admin (audit trail)

    // ✅ Step 5: Save the event (which includes the updated registration with verified receipt)
    await event.save();

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

**Explanation:**
This function works similarly to the approve function but sets the payment status to 'Rejected' instead. It follows the same validation steps to ensure the event, registration, and payment receipt exist before updating. When rejecting, it records the rejection timestamp and links it to the admin who rejected it, maintaining a complete audit trail. This allows admins to track which payments were rejected, by whom, and when, which is important for record-keeping and dispute resolution.

**Key Features:**
- Same validation as approve function
- Sets payment status to 'Rejected'
- Records rejection timestamp
- Links rejection to admin (audit trail)
- Maintains data integrity

```javascript
// Lines 432-469: Reject payment receipt
export const rejectPayment = async (req, res, next) => {
  try {
    // ✅ Get identifiers: eventId and registrationIndex
    // Same approach as approve - ensures correct payment is updated
    const { eventId, registrationIndex } = req.params;
    const adminId = req.user.id; // ✅ Admin who is rejecting

    const { Event } = await import('../models/Event.model.js');
    
    // ✅ Find event and validate
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // ✅ Validate registration index
    const index = parseInt(registrationIndex);
    if (isNaN(index) || index < 0 || index >= event.registrations.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // ✅ Get the specific registration
    const registration = event.registrations[index];
    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    // ✅ Update payment receipt status to Rejected
    registration.paymentReceipt.paymentStatus = 'Rejected'; // Set to rejected
    registration.paymentReceipt.verifiedAt = new Date(); // Record when rejected
    registration.paymentReceipt.verifiedBy = adminId; // ✅ Link to admin (audit trail)

    // ✅ Save the updated event
    await event.save();

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

**Explanation:**
This function handles event registration and creates the payment receipt link. When a user registers for an event that requires payment, the function:
1. Validates the event and user exist
2. Checks if user is already registered
3. Generates a payment receipt if payment is required
4. Creates a registration object that includes the payment receipt
5. Adds the registration (with embedded payment receipt) to the event's registrations array
6. Saves the event, which automatically saves the linked payment receipt

This design ensures that payment receipts are always linked to both the event and the user registration, creating a complete chain: Event → Registration → Payment Receipt. The payment receipt is embedded within the registration, so they can never become disconnected, ensuring data integrity.

**Key Features:**
- Validates event and user before registration
- Prevents duplicate registrations
- Generates payment receipt automatically if needed
- Embeds payment receipt in registration
- Links everything together in one save operation

```javascript
// Lines 53-117: Register for event and create payment receipt
export async function registerForEvent(req, res, next) {
  try {
    const { id } = req.params; // ✅ Event ID from URL
    const userId = req.user.id; // ✅ User ID from authenticated session
    const { name, email, phone, notes, paymentMethod } = req.body; // Form data
    
    // ✅ Step 1: Validate event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // ✅ Step 2: Check if user already registered
    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // ✅ Step 3: Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Step 4: Generate payment receipt if event requires payment
    let receiptData = null;
    if (event.requiresPayment && event.paymentAmount > 0) {
      const { generateReceiptData } = await import('../utils/receipt.js');
      // Generate receipt with event, user, amount, and payment method
      receiptData = generateReceiptData(event, user, event.paymentAmount, paymentMethod);
    }

    // ✅ Step 5: Add user to registered users list
    event.registeredUsers.push(userId);
    event.attendees = event.registeredUsers.length;

    // ✅ Step 6: Create registration object with payment receipt embedded
    const registrationData = {
      user: userId, // ✅ Link to user
      registeredAt: new Date(), // When registration happened
      registrationName: name || user.name, // Name from form or user profile
      registrationEmail: email || user.email, // Email from form or user profile
      phone: phone || null, // Phone from form
      notes: notes || null // Additional notes
    };

    // ✅ Step 7: Add payment receipt to registration if payment required
    if (receiptData) {
      registrationData.paymentReceipt = {
        receiptNumber: receiptData.receiptNumber, // ✅ Unique receipt ID
        generatedAt: receiptData.generatedAt, // When receipt was created
        amount: receiptData.amount, // ✅ Payment amount
        paymentMethod: receiptData.paymentMethod, // ✅ How user paid
        paymentStatus: receiptData.paymentStatus // ✅ Status (starts as 'Pending')
      };
    }

    // ✅ Step 8: Add registration (with embedded payment receipt) to event
    event.registrations.push(registrationData);
    
    // ✅ Step 9: Save event - this saves the registration and payment receipt together
    // This ensures they are always linked and cannot become disconnected
    await event.save();

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


# FAQ Setup Guide for ISS Yemen Chatbot

## How Admins Can Set 10 FAQs

### Method 1: Through Admin Panel (Recommended)

1. **Login as Admin**
   - Go to `/login` and login with your admin account
   - Navigate to Admin Dashboard

2. **Access Chatbot Manager**
   - In the Admin Dashboard sidebar, click on "Chatbot Manager"
   - Or go directly to `/admin/chatbot`

3. **Create FAQ Rules**
   - Click the "➕ Create Rules" button
   - Fill in the form:
     - **Trigger Keyword**: The question users will ask (e.g., "How do I register for an event?")
     - **Bot Response**: The answer the chatbot will provide
     - **Category**: Select appropriate category (general, events, membership, payment, other)
     - **Priority**: Set a number (higher = shown first in suggestions, recommended: 1-10)
     - **Related Keywords**: Add comma-separated keywords that might trigger this FAQ
     - **✅ Mark as Frequently Asked Question (FAQ)**: **IMPORTANT** - Check this box!
   - Click "Save Rule"

4. **Create 10 FAQs**
   - Repeat step 3 to create exactly 10 FAQs
   - Make sure to check the "Mark as FAQ" checkbox for each one
   - Set priorities (10 = highest priority, will appear first)

5. **Edit/Delete FAQs**
   - Click "✏️ Edit" on any rule to modify it
   - Click "🗑️ Delete" to remove a rule
   - Changes are instant (no downtime)

### Method 2: Using Seed Script (Quick Setup)

1. **Run the seed script**
   ```bash
   cd iss-yemen/backend
   npm run seed-chat-rules
   ```

2. **What it does**
   - Creates 10 pre-defined FAQs related to the website
   - Clears existing rules (optional - can be modified in the script)
   - All FAQs are automatically marked with `isFAQ: true`

3. **Customize the FAQs**
   - Edit `backend/src/scripts/seed-chat-rules.js`
   - Modify the `faqRules` array
   - Run the script again

## The 10 Pre-generated FAQs

The seed script includes these FAQs:

1. **How do I register for an event?** (Priority: 10)
2. **How do I become a member of the ISS Yemen club?** (Priority: 9)
3. **What are the upcoming events?** (Priority: 8)
4. **How do I contact the club administrators?** (Priority: 7)
5. **Who are the Heads of Department (HODs)?** (Priority: 6)
6. **How do I reset my password?** (Priority: 5)
7. **What is the club's mission/vision?** (Priority: 4)
8. **How do I pay for event registration?** (Priority: 8)
9. **Where can I see my registered events?** (Priority: 7)
10. **What activities does ISS Yemen offer?** (Priority: 6)

## Important Notes

- ✅ **Always check the "Mark as FAQ" checkbox** when creating FAQs
- ✅ The chatbot displays the **top 10 FAQs** sorted by priority (highest first)
- ✅ FAQs with `priority > 5` are considered "High Priority"
- ✅ Related keywords help the bot match similar questions
- ✅ Changes in the admin panel are instant (no server restart needed)

## Viewing FAQs

- Users can see FAQs in the chatbot when they first open it
- FAQs are displayed before any messages are sent
- Only FAQs with `isFAQ: true` are shown
- The backend automatically limits to 10 FAQs sorted by priority

## Tips for Creating Good FAQs

1. **Use clear, natural language** for keywords (e.g., "How do I register for an event?")
2. **Keep responses concise** (2-3 sentences recommended)
3. **Add related keywords** to improve matching
4. **Set appropriate priorities** (10 = most important, 1 = less important)
5. **Use appropriate categories** for better organization


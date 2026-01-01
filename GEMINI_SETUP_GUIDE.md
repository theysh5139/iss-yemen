# Gemini AI Chatbot Integration Guide

## Overview
This guide explains how to:
1. **Instant Updates**: How chatbot updates reflect immediately without downtime
2. **Gemini AI Integration**: How to set up and use Google Gemini API for AI-powered responses
3. **Testing**: How to test the chatbot as a user

---

## Part 1: Instant Updates (Already Implemented ✅)

The chatbot already supports instant updates without downtime:

### How It Works:
1. **Frontend**: When admin creates/updates/deletes a rule, the frontend immediately refetches all rules
2. **Backend**: Rules are stored in MongoDB and retrieved in real-time
3. **No Cache**: Each chat request queries the database directly, so new rules are immediately available

### Code Flow:
```
Admin creates rule → Backend saves to DB → Frontend refetches → Rules updated instantly
User sends message → Backend queries latest rules → Returns response
```

**No additional configuration needed** - this already works!

---

## Part 2: Setting Up Gemini AI

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (starts with `AIza...`)

### Step 2: Install Gemini Package

```bash
cd backend
npm install @google/generative-ai
```

### Step 3: Add API Key to Environment

1. Open `backend/.env` file (create if it doesn't exist)
2. Add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### Step 4: Restart Backend Server

```bash
npm run dev
```

You should see: `✅ Gemini AI initialized successfully`

---

## Part 3: How It Works

### Response Priority:
1. **Exact Match**: If user message matches a rule keyword → Return rule response
2. **Fuzzy Match**: If similar to a rule → Return best matching rule
3. **Gemini AI**: If no rule matches AND Gemini is configured → Use AI to generate response
4. **Fallback**: If no match and no AI → Show suggestions

### Gemini AI Features:
- Uses context from existing rules for better responses
- Provides helpful answers even for questions not in the knowledge base
- Maintains ISS Yemen context awareness

---

## Part 4: Testing as a User

### Method 1: Test via Frontend (Recommended)

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open the website:**
   - Go to `http://localhost:5173`
   - You should see a chatbot button (💬) in the bottom right corner

3. **Test the chatbot:**
   - Click the chatbot button
   - Try these questions:
     - "What is ISS Yemen?"
     - "How do I become a member?"
     - "Tell me about events"
     - "What is the membership fee?"
     - "Hello" (should trigger Gemini AI if configured)

### Method 2: Test via API (Direct)

1. **Using curl:**
   ```bash
   curl -X POST http://localhost:5000/api/chatbot/message \
     -H "Content-Type: application/json" \
     -d '{"message": "What is ISS Yemen?"}'
   ```

2. **Using Postman:**
   - Method: POST
   - URL: `http://localhost:5000/api/chatbot/message`
   - Body (JSON):
     ```json
     {
       "message": "How do I register for events?"
     }
     ```

### Method 3: Test with Gemini AI

1. **First, create some rules in Admin Panel:**
   - Login as admin
   - Go to "Chatbot Manager"
   - Create a few rules (e.g., "membership", "events", "contact")

2. **Test exact matches:**
   - Ask: "membership" → Should return rule response

3. **Test Gemini AI (if no rule matches):**
   - Ask: "What is the weather today?" → Should use Gemini AI
   - Ask: "Tell me a joke" → Should use Gemini AI
   - Ask: "What are your office hours?" → Should use Gemini AI

---

## Part 5: Testing Checklist

### ✅ Test Instant Updates:
1. Open chatbot as user
2. In another tab, login as admin
3. Create a new rule (e.g., keyword: "test", response: "This is a test")
4. Go back to chatbot tab
5. Type "test" → Should immediately show the new response (no refresh needed)

### ✅ Test Rule Matching:
- [ ] Exact keyword match works
- [ ] Related keywords work
- [ ] Fuzzy matching works for typos
- [ ] Suggestions appear when no match

### ✅ Test Gemini AI (if configured):
- [ ] AI responds to questions not in rules
- [ ] AI maintains ISS Yemen context
- [ ] AI provides helpful responses
- [ ] Falls back gracefully if AI fails

### ✅ Test Fallback:
- [ ] Shows suggestions when no match
- [ ] Shows FAQs when no match
- [ ] Handles errors gracefully

---

## Troubleshooting

### Gemini AI not working?
1. Check API key is in `.env` file
2. Check backend console for initialization message
3. Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Check API quota/limits

### Chatbot not updating?
1. Check backend is running
2. Check frontend is running
3. Check browser console for errors
4. Hard refresh browser (Ctrl+Shift+R)

### Rules not matching?
1. Check rules are created in admin panel
2. Check keyword spelling matches
3. Try exact keyword first
4. Check related keywords are set

---

## Example Test Scenarios

### Scenario 1: New Rule Instant Update
1. User opens chatbot
2. Admin creates rule: "hello" → "Hi! How can I help you?"
3. User types "hello" → Should see new response immediately

### Scenario 2: Gemini AI Response
1. User asks: "What is the capital of Yemen?"
2. If no rule matches → Gemini AI responds
3. Response should be helpful and relevant

### Scenario 3: Suggestions
1. User asks: "random question xyz"
2. No match found
3. Should see suggestions from FAQs

---

## API Response Format

### Successful Match:
```json
{
  "response": "Rule response text",
  "matched": true,
  "suggestions": ["related question 1", "related question 2"],
  "source": "rule"
}
```

### Gemini AI Response:
```json
{
  "response": "AI generated response",
  "matched": false,
  "suggestions": ["FAQ 1", "FAQ 2"],
  "source": "gemini-ai",
  "fallback": false
}
```

### Fallback Response:
```json
{
  "response": "I'm sorry, I don't understand that yet...",
  "matched": false,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "source": "fallback",
  "fallback": true
}
```

---

## Next Steps

1. ✅ Install Gemini package: `npm install @google/generative-ai`
2. ✅ Add API key to `.env` file
3. ✅ Restart backend server
4. ✅ Test chatbot as user
5. ✅ Create rules in admin panel
6. ✅ Test instant updates
7. ✅ Test Gemini AI responses

Happy testing! 🚀


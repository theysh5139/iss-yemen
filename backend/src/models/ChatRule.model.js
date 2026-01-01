import mongoose from "mongoose";

const ChatRuleSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true },
  response: { type: String, required: true },
  isFAQ: { type: Boolean, default: false }, // Mark as frequently asked question
  relatedKeywords: [{ type: String }], // Related keywords for better matching
  category: { type: String, enum: ['general', 'events', 'membership', 'payment', 'other'], default: 'general' },
  priority: { type: Number, default: 0 }, // Higher priority = shown first in suggestions
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use export default instead of module.exports
const ChatRule = mongoose.model("ChatRule", ChatRuleSchema);
export default ChatRule;
import mongoose from "mongoose";

const ChatRuleSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true },
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Use export default instead of module.exports
const ChatRule = mongoose.model("ChatRule", ChatRuleSchema);
export default ChatRule;
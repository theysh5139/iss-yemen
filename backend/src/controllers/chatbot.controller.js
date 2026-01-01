import ChatRule from '../models/ChatRule.model.js'; // Ensure .js is added

// 1. Create Rule
export const createRule = async (req, res) => {
  try {
    const { keyword, response } = req.body;
    const newRule = new ChatRule({ keyword, response });
    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Rules
export const getAllRules = async (req, res) => {
  try {
    const rules = await ChatRule.find();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update Rule
export const updateRule = async (req, res) => {
  try {
    const { keyword, response } = req.body;
    const rule = await ChatRule.findByIdAndUpdate(
      req.params.id,
      { keyword, response },
      { new: true, runValidators: true }
    );
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json(rule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Keyword already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// 4. Delete Rule
export const deleteRule = async (req, res) => {
  try {
    const rule = await ChatRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Handle Chat
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    // Simple exact match logic
    const rule = await ChatRule.findOne({ keyword: message });
    
    if (rule) {
      res.json({ response: rule.response });
    } else {
      res.json({ response: "I'm sorry, I don't understand that yet." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
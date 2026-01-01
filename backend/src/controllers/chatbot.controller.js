<<<<<<< HEAD
import ChatRule from '../models/ChatRule.model.js'; // Ensure .js is added
=======
import ChatRule from '../models/ChatRule.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI (if API key is provided)
let genAI = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
  }
}

// Helper function for fuzzy matching
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}
>>>>>>> origin/LATEST_SPRINT4

// 1. Create Rule
export const createRule = async (req, res) => {
  try {
<<<<<<< HEAD
    const { keyword, response } = req.body;
    const newRule = new ChatRule({ keyword, response });
=======
    const { keyword, response, isFAQ, relatedKeywords, category, priority } = req.body;
    const newRule = new ChatRule({ 
      keyword, 
      response, 
      isFAQ: isFAQ || false,
      relatedKeywords: relatedKeywords || [],
      category: category || 'general',
      priority: priority || 0
    });
>>>>>>> origin/LATEST_SPRINT4
    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

<<<<<<< HEAD
// 2. Get All Rules
export const getAllRules = async (req, res) => {
  try {
    const rules = await ChatRule.find();
=======
// 2. Update Rule
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

// 3. Get All Rules
export const getAllRules = async (req, res) => {
  try {
    const rules = await ChatRule.find().sort({ priority: -1, createdAt: -1 });
>>>>>>> origin/LATEST_SPRINT4
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

<<<<<<< HEAD
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
=======
// 4. Get Top 10 FAQs
export const getTopFAQs = async (req, res) => {
  try {
    const faqs = await ChatRule.find({ isFAQ: true })
      .sort({ priority: -1, createdAt: -1 })
      .limit(10)
      .select('keyword response category');
    res.status(200).json(faqs);
  } catch (error) {
>>>>>>> origin/LATEST_SPRINT4
    res.status(500).json({ message: error.message });
  }
};

<<<<<<< HEAD
// 4. Delete Rule
export const deleteRule = async (req, res) => {
  try {
    const rule = await ChatRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
=======
// 5. Delete Rule
export const deleteRule = async (req, res) => {
  try {
    await ChatRule.findByIdAndDelete(req.params.id);
>>>>>>> origin/LATEST_SPRINT4
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

<<<<<<< HEAD
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
=======
// 6. Enhanced Handle Chat with Gemini AI fallback
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid message' });
    }

    const userMessage = message.toLowerCase().trim();
    
    // 1. Try exact match first
    let rule = await ChatRule.findOne({ 
      $or: [
        { keyword: { $regex: new RegExp(`^${userMessage}$`, 'i') } },
        { relatedKeywords: { $in: [userMessage] } }
      ]
    });

    // 2. Try fuzzy/partial matching if no exact match
    if (!rule) {
      const allRules = await ChatRule.find();
      let bestMatch = null;
      let bestScore = 0.3; // Minimum similarity threshold

      for (const r of allRules) {
        // Check keyword similarity
        const keywordScore = calculateSimilarity(userMessage, r.keyword.toLowerCase());
        
        // Check related keywords
        let relatedScore = 0;
        if (r.relatedKeywords && r.relatedKeywords.length > 0) {
          const maxRelatedScore = Math.max(
            ...r.relatedKeywords.map(rel => calculateSimilarity(userMessage, rel.toLowerCase()))
          );
          relatedScore = maxRelatedScore;
        }

        // Check if message contains keyword or vice versa
        const containsKeyword = userMessage.includes(r.keyword.toLowerCase()) || 
                               r.keyword.toLowerCase().includes(userMessage);
        const containsScore = containsKeyword ? 0.6 : 0;

        const totalScore = Math.max(keywordScore, relatedScore, containsScore);
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMatch = r;
        }
      }

      if (bestMatch) {
        rule = bestMatch;
      }
    }

    // 3. If match found, return response with related suggestions
    if (rule) {
      // Get related questions from same category
      const relatedQuestions = await ChatRule.find({
        category: rule.category,
        _id: { $ne: rule._id }
      })
        .limit(3)
        .select('keyword');

      return res.json({
        response: rule.response,
        matched: true,
        suggestions: relatedQuestions.map(q => q.keyword),
        source: 'rule'
      });
    }

    // 4. No rule match found - Try Gemini AI if available
    if (genAI) {
      try {
        // Get context from existing rules for better AI responses
        const contextRules = await ChatRule.find()
          .limit(10)
          .select('keyword response category');
        
        const context = contextRules.map(r => 
          `Q: ${r.keyword}\nA: ${r.response}`
        ).join('\n\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const prompt = `You are a helpful assistant for ISS Yemen (International Student Society Yemen). 
        
Context from our knowledge base:
${context}

User question: ${message}

Provide a helpful, concise answer (2-3 sentences max). If the question is about ISS Yemen events, membership, or activities, use the context above. Otherwise, provide a general helpful response.`;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // Get fallback suggestions
        const topFAQs = await ChatRule.find({ isFAQ: true })
          .sort({ priority: -1 })
          .limit(5)
          .select('keyword');

        return res.json({
          response: aiResponse,
          matched: false,
          suggestions: topFAQs.map(f => f.keyword),
          source: 'gemini-ai',
          fallback: false
        });
      } catch (aiError) {
        console.error('Gemini AI error:', aiError);
        // Fall through to default fallback
      }
    }

    // 5. No match and no AI - provide fallback suggestions
    const topFAQs = await ChatRule.find({ isFAQ: true })
      .sort({ priority: -1 })
      .limit(5)
      .select('keyword category');

    const words = userMessage.split(/\s+/).filter(w => w.length > 2);
    const wordBasedSuggestions = await ChatRule.find({
      $or: [
        { keyword: { $regex: new RegExp(words.join('|'), 'i') } },
        { relatedKeywords: { $in: words } }
      ]
    })
      .limit(3)
      .select('keyword');

    const allSuggestions = [
      ...topFAQs.map(f => f.keyword),
      ...wordBasedSuggestions.map(s => s.keyword)
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

    return res.json({
      response: "I'm sorry, I don't understand that yet. Here are some questions I can help with:",
      matched: false,
      suggestions: allSuggestions.length > 0 ? allSuggestions : [
        "What is ISS Yemen?",
        "How do I register for events?",
        "How do I become a member?",
        "What are the upcoming events?",
        "How do I contact the admin?"
      ],
      source: 'fallback',
      fallback: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
>>>>>>> origin/LATEST_SPRINT4

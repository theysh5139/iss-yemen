import { useState, useEffect, useRef } from "react";
import { sendChatMessage, getTopFAQs } from "../api/chatbot.js";
import "../styles/chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load top FAQs on mount
    loadFAQs();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadFAQs = async () => {
    try {
      const data = await getTopFAQs();
      setFaqs(data || []);
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      
      // Add bot response
      setMessages(prev => [...prev, {
        type: "bot",
        content: response.response,
        suggestions: response.suggestions || [],
        matched: response.matched,
        showSuggestions: false
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        error: true,
        showSuggestions: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = async (faq) => {
    // Clear existing messages and show FAQ question as user message
    setMessages([{ type: "user", content: faq.keyword }]);
    setLoading(true);
    
    try {
      const response = await sendChatMessage(faq.keyword);
      setMessages([
        { type: "user", content: faq.keyword },
        {
          type: "bot",
          content: response.response,
          suggestions: response.suggestions || [],
          matched: response.matched,
          showSuggestions: false
        }
      ]);
    } catch (err) {
      setMessages([
        { type: "user", content: faq.keyword },
        {
          type: "bot",
          content: "Sorry, I'm having trouble connecting. Please try again later.",
          error: true,
          showSuggestions: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    // Add suggestion as user message and get response
    const userMessage = suggestion;
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, {
        type: "bot",
        content: response.response,
        suggestions: response.suggestions || [],
        matched: response.matched,
        showSuggestions: false
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        error: true,
        showSuggestions: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestions = (index) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, showSuggestions: true } : msg
    ));
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chatbot"
      >
        <span className="chatbot-icon">💬</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <h3 className="chatbot-title">ISS Yemen AI Assistant</h3>
              <p className="chatbot-subtitle">Ask me anything!</p>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              X
            </button>
          </div>

          <div className="chatbot-body">
            {/* Top FAQs Section - Show exactly 10 FAQs by default */}
            {messages.length === 0 && (
              <div className="chatbot-faqs">
                <h4 className="faq-title">Frequently Asked Questions:</h4>
                <div className="faq-list">
                  {faqs.length > 0 ? (
                    faqs.slice(0, 10).map((faq, index) => (
                      <button
                        key={index}
                        className="faq-item"
                        onClick={() => handleFAQClick(faq)}
                      >
                        {faq.keyword}
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                      Loading FAQs...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chatbot-message ${msg.type}`}>
                  <div className="message-content">
                    {msg.content}
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && !msg.showSuggestions && (
                    <button
                      className="see-suggestions-btn"
                      onClick={() => toggleSuggestions(index)}
                    >
                      See related questions
                    </button>
                  )}
                  {msg.suggestions && msg.suggestions.length > 0 && msg.showSuggestions && (
                    <div className="message-suggestions">
                      <p className="suggestions-label">
                        {msg.matched === false ? "Here are some questions I can help with:" : "Related questions:"}
                      </p>
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="suggestion-btn"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chatbot-message bot">
                  <div className="message-content">
                    <span className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}


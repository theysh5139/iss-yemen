import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import ChatRule from '../models/ChatRule.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

const faqRules = [
  {
    keyword: "How do I register for an event?",
    response: "To register for an event, log in to your account, go to the Events page, find the event you want to attend, and click the 'Register' button. You'll receive a confirmation email once registered.",
    isFAQ: true,
    relatedKeywords: ["register", "event", "join", "attend", "signup", "participate"],
    category: "events",
    priority: 10
  },
  {
    keyword: "How do I become a member of the ISS Yemen club?",
    response: "To become a member, visit the Members page and click 'Join Club'. Fill out the membership form and submit it. An admin will review your application and approve it.",
    isFAQ: true,
    relatedKeywords: ["member", "membership", "join club", "become member", "apply"],
    category: "membership",
    priority: 9
  },
  {
    keyword: "What are the upcoming events?",
    response: "You can view all upcoming events on the Events page or the homepage. Events include cultural nights, workshops, networking meetups, and more. Check regularly for updates!",
    isFAQ: true,
    relatedKeywords: ["upcoming", "events", "what events", "next event", "schedule"],
    category: "events",
    priority: 8
  },
  {
    keyword: "How do I contact the club administrators?",
    response: "You can contact us through the About Us page or by emailing admin@issyemen.com. For urgent matters, reach out to any of our HODs listed on the homepage.",
    isFAQ: true,
    relatedKeywords: ["contact", "email", "phone", "reach", "administrator", "support"],
    category: "general",
    priority: 7
  },
  {
    keyword: "Who are the Heads of Department (HODs)?",
    response: "Our HODs are listed on the homepage. They include the President, Vice President, Secretary, Treasurer, and Academic Coordinator. Each plays a vital role in club operations.",
    isFAQ: true,
    relatedKeywords: ["hod", "head", "department", "leadership", "team", "officers"],
    category: "general",
    priority: 6
  },
  {
    keyword: "How do I reset my password?",
    response: "Go to the Login page and click 'Forgot Password'. Enter your email address, and you'll receive a reset link. Follow the instructions to create a new password.",
    isFAQ: true,
    relatedKeywords: ["password", "reset", "forgot", "change password", "login issue"],
    category: "general",
    priority: 5
  },
  {
    keyword: "What is the club's mission/vision?",
    response: "The ISS Yemen club aims to support Yemeni students at UTM, promote cultural exchange, provide academic support, and foster community among Yemeni students. Visit the About Us page for more details.",
    isFAQ: true,
    relatedKeywords: ["mission", "vision", "about", "purpose", "goal", "objectives"],
    category: "general",
    priority: 4
  },
  {
    keyword: "How do I post an announcement? (Admin only)",
    response: "As an admin, log in and go to the Admin Dashboard > News & Announcements. Click 'Post Announcement' and fill in the title, content, and date. Only admins can create announcements.",
    isFAQ: true,
    relatedKeywords: ["announcement", "post", "news", "admin", "create announcement", "publish"],
    category: "other",
    priority: 3
  },
  {
    keyword: "How do I manage users? (Admin only)",
    response: "As an admin, go to Admin Dashboard > Manage Users. You can view all users, change their roles (visitor/member/admin), activate/deactivate accounts, and manage memberships.",
    isFAQ: true,
    relatedKeywords: ["manage users", "user management", "admin", "users", "roles"],
    category: "other",
    priority: 2
  },
  {
    keyword: "How do I update my profile?",
    response: "Go to your Dashboard and click on 'Profile'. You can update your personal information, contact details, and preferences there.",
    isFAQ: true,
    relatedKeywords: ["profile", "update", "edit", "change info", "personal info"],
    category: "general",
    priority: 1
  }
];

async function seedChatRules() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing rules
    await ChatRule.deleteMany({});
    console.log('Cleared existing chat rules');

    // Insert FAQ rules
    const rules = await ChatRule.insertMany(faqRules);
    console.log(`Seeded ${rules.length} chat rules`);

    console.log('Chat rules seeding completed successfully');
  } catch (error) {
    console.error('Error seeding chat rules:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedChatRules();
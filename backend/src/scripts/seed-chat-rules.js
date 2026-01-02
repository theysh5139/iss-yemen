import mongoose from 'mongoose';
import ChatRule from '../models/ChatRule.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss-yemen';

// 10 FAQs related to ISS Yemen website
const faqRules = [
  {
    keyword: "How do I register for an event?",
    response: "To register for an event, you need to be a member first. Go to the 'All Events' page, find the event you want to join, and click the 'Register' button. Fill in your details (name, email, matric number, phone), upload payment proof if required, and submit the registration form.",
    isFAQ: true,
    relatedKeywords: ["register event", "join event", "event registration", "sign up event", "event signup"],
    category: "events",
    priority: 10
  },
  {
    keyword: "How do I become a member of the ISS Yemen club?",
    response: "To become a member, you need to sign up on the website. Go to the Sign Up page, fill in your information, and create an account. Once your account is verified, you'll have member access to register for events and access member-only features.",
    isFAQ: true,
    relatedKeywords: ["become member", "join club", "membership", "sign up", "register member", "member registration"],
    category: "membership",
    priority: 9
  },
  {
    keyword: "What are the upcoming events?",
    response: "You can view all upcoming events on the 'All Events' page. The page shows events with their dates, locations, descriptions, and registration fees. Members can register directly from this page.",
    isFAQ: true,
    relatedKeywords: ["upcoming events", "events", "event schedule", "future events", "next events"],
    category: "events",
    priority: 8
  },
  {
    keyword: "How do I contact the club administrators?",
    response: "You can contact the club administrators through the 'Members' page where you can find contact information for Heads of Departments (HODs). You can also view HOD profiles on the homepage to see their roles and contact details.",
    isFAQ: true,
    relatedKeywords: ["contact admin", "admin contact", "contact club", "administrator", "get help", "support"],
    category: "general",
    priority: 7
  },
  {
    keyword: "Who are the Heads of Department (HODs)?",
    response: "Heads of Department (HODs) are the leaders of different departments within ISS Yemen. You can view all HOD profiles on the homepage by clicking 'View HOD profiles' button. Each HOD profile shows their name, department, role, and contact information.",
    isFAQ: true,
    relatedKeywords: ["HOD", "heads of department", "department heads", "leaders", "executives", "committee"],
    category: "general",
    priority: 6
  },
  {
    keyword: "How do I reset my password?",
    response: "If you've forgotten your password, go to the Login page and click on 'Forgot Password'. Enter your email address, and you'll receive instructions to reset your password via email.",
    isFAQ: true,
    relatedKeywords: ["forgot password", "password reset", "change password", "recover password", "lost password"],
    category: "general",
    priority: 5
  },
  {
    keyword: "What is the club's mission/vision?",
    response: "ISS Yemen's mission is to foster unity, cultural exchange, and academic excellence among Yemeni students at UTM. Our vision is to be a leading student organization that empowers Yemeni students, preserves cultural heritage, and builds bridges between Yemen and Malaysia. Visit the 'About Us' page for more details.",
    isFAQ: true,
    relatedKeywords: ["mission", "vision", "purpose", "goals", "objectives", "about us", "what we do"],
    category: "general",
    priority: 4
  },
  {
    keyword: "How do I pay for event registration?",
    response: "When registering for a paid event, you'll see a QR code and account number on the registration form. You can scan the QR code or transfer the registration fee to the provided account number. After payment, upload your transaction proof (PDF or image) in the registration form before submitting.",
    isFAQ: true,
    relatedKeywords: ["payment", "pay event", "event fee", "registration fee", "payment method", "how to pay"],
    category: "payment",
    priority: 8
  },
  {
    keyword: "Where can I see my registered events?",
    response: "Once you've registered for events, you can view them on your Dashboard or Profile page. Both pages show all your registered events with details like event date, location, payment status, and a link to view your receipt if available.",
    isFAQ: true,
    relatedKeywords: ["my events", "registered events", "my registrations", "event list", "dashboard", "profile"],
    category: "events",
    priority: 7
  },
  {
    keyword: "What activities does ISS Yemen offer?",
    response: "ISS Yemen offers various activities including: Academic Support (study materials, resources), Cultural Events (cultural nights, festivals), Community Building (social programs, gatherings), and Student Activities (sports events, media creation). Visit the 'About Us' page to learn more about our activities.",
    isFAQ: true,
    relatedKeywords: ["activities", "programs", "what we do", "services", "events", "initiatives"],
    category: "general",
    priority: 6
  }
];

async function seedChatRules() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing rules (optional - comment out if you want to keep existing rules)
    await ChatRule.deleteMany({});
    console.log('🧹 Cleared existing chat rules');

    // Insert FAQ rules
    const rules = await ChatRule.insertMany(faqRules);
    console.log(`✅ Seeded ${rules.length} chat rules (all marked as FAQs)`);

    // Verify FAQs
    const faqCount = await ChatRule.countDocuments({ isFAQ: true });
    console.log(`📊 Total FAQs in database: ${faqCount}`);

    console.log('✅ Chat rules seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding chat rules:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedChatRules();

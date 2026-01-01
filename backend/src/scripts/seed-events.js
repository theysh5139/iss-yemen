import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

const sampleEvents = [
  {
    title: "Yemeni Cultural Night 2025",
    description: "Join us for an evening celebrating Yemeni culture with traditional food, music, dance performances, and cultural exhibitions. Experience the rich heritage of Yemen through interactive displays and live entertainment.",
    date: new Date('2025-02-15T18:00:00'),
    location: "UTM Student Center, Main Hall",
    category: "Cultural",
    type: "event",
    isPublic: true,
    isRecurring: false,
    requiresPayment: true,
    paymentAmount: 25.00
  },
  {
    title: "Academic Workshop: Research Methods & Thesis Writing",
    description: "A comprehensive workshop for graduate students covering research methodologies, academic writing, thesis structure, and citation styles. Perfect for students working on their dissertations.",
    date: new Date('2025-02-20T14:00:00'),
    location: "UTM Library, Seminar Room 3",
    category: "Academic",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Networking Meetup for New Members",
    description: "Casual meetup for new and existing members to network, socialize, and build connections. Light refreshments will be provided. Great opportunity to meet fellow Yemeni students at UTM.",
    date: new Date('2025-02-25T17:00:00'),
    location: "UTM Cafeteria, Second Floor",
    category: "Social",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Eid Al-Fitr Community Celebration",
    description: "Community celebration of Eid Al-Fitr with prayers, traditional Yemeni breakfast, family activities, and cultural performances. All members and their families are welcome.",
    date: new Date('2025-03-31T08:00:00'),
    location: "UTM Student Center, Grand Hall",
    category: "Cultural",
    type: "event",
    isPublic: true,
    isRecurring: false,
    requiresPayment: true,
    paymentAmount: 20.00
  },
  {
    title: "Study Group Formation Session",
    description: "Organizing study groups for various majors to support academic success. Find study partners, form groups by subject, and enhance your learning experience through collaborative study.",
    date: new Date('2025-03-10T15:00:00'),
    location: "UTM Library, Study Room 5",
    category: "Academic",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Welcome New Students Orientation",
    description: "Orientation event for new Yemeni students joining UTM. Learn about campus resources, club activities, academic support services, and meet current members. Essential for newcomers!",
    date: new Date('2025-03-01T10:00:00'),
    location: "UTM Main Hall, Auditorium",
    category: "Social",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Yemeni Traditional Cooking Class",
    description: "Learn to cook authentic Yemeni dishes including Mandi, Saltah, and traditional desserts. Hands-on cooking experience with ingredients provided. Limited spots available!",
    date: new Date('2025-03-15T16:00:00'),
    location: "UTM Culinary Lab, Building B",
    category: "Cultural",
    type: "event",
    isPublic: true,
    isRecurring: false,
    requiresPayment: true,
    paymentAmount: 30.00
  },
  {
    title: "Career Development Seminar",
    description: "Professional development workshop covering resume writing, interview skills, networking strategies, and career planning. Guest speakers from various industries will share insights.",
    date: new Date('2025-03-22T13:00:00'),
    location: "UTM Career Center, Conference Room",
    category: "Academic",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Monthly Social Gathering",
    description: "Regular monthly gathering for all ISS Yemen members. Casual atmosphere with games, discussions, and community bonding. Food and drinks provided.",
    date: new Date('2025-03-28T18:00:00'),
    location: "UTM Student Center, Lounge Area",
    category: "Social",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Arabic Language Exchange Program",
    description: "Practice Arabic and English in a friendly language exchange setting. Open to all proficiency levels. Great way to maintain your Arabic skills and help others learn.",
    date: new Date('2025-04-05T16:00:00'),
    location: "UTM Language Center, Room 201",
    category: "Academic",
    type: "activity",
    schedule: "Every Saturday, 4:00 PM",
    isRecurring: true,
    isPublic: true
  },
  {
    title: "Yemeni History & Heritage Exhibition",
    description: "Explore Yemen's rich history through artifacts, photographs, and interactive displays. Learn about ancient civilizations, architecture, and cultural traditions of Yemen.",
    date: new Date('2025-04-12T11:00:00'),
    location: "UTM Cultural Center, Exhibition Hall",
    category: "Cultural",
    type: "event",
    isPublic: true,
    isRecurring: false
  },
  {
    title: "Sports Day: Football Tournament",
    description: "Friendly football tournament for ISS Yemen members. Teams will be formed on the day. All skill levels welcome. Refreshments and prizes for winners!",
    date: new Date('2025-04-19T09:00:00'),
    location: "UTM Sports Complex, Football Field",
    category: "Social",
    type: "event",
    isPublic: true,
    isRecurring: false
  }
];

async function seedEvents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    // Clear existing events (optional - comment out if you want to keep existing events)
    // await Event.deleteMany({});
    // console.log('[INFO] Cleared existing events');

    // Check which events already exist
    const existingTitles = new Set();
    const existingEvents = await Event.find({}, 'title');
    existingEvents.forEach(e => existingTitles.add(e.title));

    let created = 0;
    let skipped = 0;

    for (const eventData of sampleEvents) {
      if (existingTitles.has(eventData.title)) {
        console.log(`[SKIP] Event "${eventData.title}" already exists`);
        skipped++;
        continue;
      }

      const event = await Event.create(eventData);
      console.log(`[CREATED] ${event.title} - ${event.date.toLocaleDateString()}`);
      created++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`[SUCCESS] Seeding completed!`);
    console.log(`Created: ${created} events`);
    console.log(`Skipped: ${skipped} events (already exist)`);
    console.log('='.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to seed events:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedEvents();



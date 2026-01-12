import { Event } from '../models/Event.model.js';
import { Payment } from '../models/Payment.model.js';
import { Receipt } from '../models/Receipt.model.js';
import { generateRandomToken } from '../utils/tokens.js';

// Get all events (public events for non-logged-in users, all for logged-in users)
// Only returns actual events (type === 'event'), excludes announcements, activities, and news
export async function getEvents(req, res, next) {
  try {
    const userRole = req.user?.role;
    const query = {
      type: 'event', // Only show actual events, not announcements or activities
      category: { $ne: 'News' } // Exclude news items (they have type: 'event' but category: 'News')
    };

    // Non-logged-in users can only see public events
    if (!userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .populate('registeredUsers', 'name email')
      .populate('registrations.user', 'name email')
      .lean();

    return res.json({ events });
  } catch (err) {
    next(err);
  }
}

// Get a single event by ID
export async function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    const event = await Event.findById(id)
      .populate('registeredUsers', 'name email')
      .populate('registrations.user', 'name email')
      .lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if non-logged-in user can access this event
    if (!userRole && !event.isPublic) {
      return res.status(403).json({ message: 'Access denied. This event is for members only.' });
    }

    return res.json({ event });
  } catch (err) {
    next(err);
  }
}

// Register for an event (any logged-in user)
export async function registerForEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, email, matricNumber, phone, notes, paymentMethod } = req.body;
    const User = (await import('../models/User.model.js')).User;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Get user details for receipt
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use form data if provided, otherwise use user data
    const registrationName = name || user.name;
    const registrationEmail = email || user.email;
    const selectedPaymentMethod = paymentMethod || 'Online Banking';

    // Handle uploaded receipt file
    let receiptUrl = null;
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    // Add to registered users
    event.registeredUsers.push(userId);
    event.attendees = event.registeredUsers.length;

    // Generate payment receipt if event requires payment
    let receiptData = null;
    let receiptNumber = null;
    let paymentDoc = null;
    let receiptDoc = null;
    // Check payment requirement: use paymentAmount if set, otherwise fallback to fee
    const paymentAmount = event.paymentAmount || event.fee || 0;
    const requiresPayment = (event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0);
    
    if (requiresPayment && paymentAmount > 0) {
      const { generateReceiptNumber } = await import('../utils/receipt.js');
      receiptNumber = generateReceiptNumber();
      
      // Generate unique transaction ID
      const transactionId = `TXN-${Date.now()}-${generateRandomToken(8).toUpperCase()}`;
      
      // Create Payment document in MongoDB
      try {
        paymentDoc = await Payment.create({
          userId: userId,
          eventId: event._id,
          amount: parseFloat(paymentAmount),
          currency: 'MYR',
          transactionId: transactionId,
          status: 'pending', // Starts as pending until admin verifies
          paymentMethod: selectedPaymentMethod.toLowerCase().replace(/\s+/g, '_'),
          paymentDate: new Date()
        });
        
        // Create Receipt document in MongoDB
        receiptDoc = await Receipt.create({
          receiptId: receiptNumber,
          paymentId: paymentDoc._id,
          userId: userId,
          eventId: event._id,
          amount: paymentDoc.amount,
          currency: paymentDoc.currency,
          transactionId: paymentDoc.transactionId,
          userName: registrationName,
          eventName: event.title,
          eventDate: event.date,
          paymentDate: paymentDoc.paymentDate
        });
        
        console.log(`[registerForEvent] Created Payment and Receipt documents: Payment ID: ${paymentDoc._id}, Receipt ID: ${receiptDoc._id}`);
      } catch (paymentError) {
        console.error('[registerForEvent] Error creating Payment/Receipt documents:', paymentError);
        // Continue with registration even if Payment/Receipt creation fails
        // The embedded receipt data will still be saved in the Event document
      }
      
      receiptData = {
        receiptNumber: receiptNumber,
        generatedAt: new Date(),
        amount: paymentAmount,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'Pending',
        registrationName: registrationName,
        registrationEmail: registrationEmail,
        matricNumber: matricNumber || null,
        phone: phone || null,
        transactionId: transactionId
      };
      
      // If user uploaded a receipt, use that URL
      if (receiptUrl) {
        receiptData.receiptUrl = receiptUrl;
      }
    }

    // Add detailed registration with receipt and form data
    const registrationData = {
      user: userId,
      registeredAt: new Date(),
      registrationName: registrationName,
      registrationEmail: registrationEmail,
      matricNumber: matricNumber || null,
      phone: phone || null,
      notes: notes || null
    };

    if (receiptData) {
      registrationData.paymentReceipt = {
        receiptNumber: receiptData.receiptNumber,
        receiptUrl: receiptData.receiptUrl || receiptUrl,
        generatedAt: receiptData.generatedAt,
        amount: receiptData.amount,
        paymentMethod: receiptData.paymentMethod,
        paymentStatus: receiptData.paymentStatus || 'Pending'
      };
    } else if (receiptUrl) {
      // If receipt was uploaded but no receipt data generated (free event with receipt upload?)
      const { generateReceiptNumber } = await import('../utils/receipt.js');
      registrationData.paymentReceipt = {
        receiptNumber: generateReceiptNumber(),
        receiptUrl: receiptUrl,
        generatedAt: new Date(),
        amount: paymentAmount || 0,
        paymentStatus: 'Pending'
      };
    }

    event.registrations.push(registrationData);
    await event.save();

    // Also save to separate eventregistrations collection if it exists
    try {
      const mongoose = await import('mongoose');
      const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (collectionNames.includes('eventregistrations')) {
        const registrationsCollection = db.collection('eventregistrations');
        const registrationIndex = event.registrations.length - 1;
        
        await registrationsCollection.insertOne({
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          eventCategory: event.category,
          registrationIndex: registrationIndex,
          user: userId,
          registeredAt: registrationData.registeredAt,
          registrationName: registrationData.registrationName,
          registrationEmail: registrationData.registrationEmail,
          matricNumber: registrationData.matricNumber,
          phone: registrationData.phone,
          notes: registrationData.notes,
          paymentReceipt: registrationData.paymentReceipt || null,
          createdAt: registrationData.registeredAt,
          updatedAt: new Date()
        });
        console.log(`[registerForEvent] Synced registration to eventregistrations collection`);
      }
    } catch (syncError) {
      // Don't fail registration if sync to separate collection fails
      console.warn('[registerForEvent] Could not sync to eventregistrations collection:', syncError.message);
    }

    // Generate official PDF receipt for paid events
    let pdfReceiptGenerated = false;
    if (requiresPayment && paymentAmount > 0 && registrationData.paymentReceipt) {
      try {
        const { generateReceiptPDF } = await import('../utils/pdfGenerator.js');
        const { generateRandomToken } = await import('../utils/tokens.js');
        
        // Generate transaction ID if not exists
        const transactionId = `TXN-${Date.now()}-${generateRandomToken(8).toUpperCase()}`;
        
        // Generate PDF receipt
        const pdfBuffer = await generateReceiptPDF({
          receiptId: registrationData.paymentReceipt.receiptNumber,
          userName: registrationName,
          eventName: event.title,
          eventDate: event.date,
          paymentDate: new Date(),
          amount: paymentAmount,
          currency: 'MYR',
          transactionId: transactionId
        });
        
        // Store PDF receipt (optional - can also generate on-demand)
        // For now, we'll generate on-demand via the receipt download endpoint
        // But mark that receipt is ready for PDF generation
        pdfReceiptGenerated = true;
        
        // Update registration with transaction ID
        const lastRegistration = event.registrations[event.registrations.length - 1];
        if (lastRegistration.paymentReceipt) {
          lastRegistration.paymentReceipt.transactionId = transactionId;
          await event.save();
        }
      } catch (pdfError) {
        console.error('Failed to generate PDF receipt:', pdfError);
        // Don't fail registration if PDF generation fails - receipt data is still saved
      }
    }

    // Return receipt data from registration
    const returnReceipt = registrationData.paymentReceipt || null;
    if (returnReceipt) {
      returnReceipt.pdfGenerated = pdfReceiptGenerated;
    }

    return res.json({ 
      message: 'Successfully registered for event', 
      event,
      receipt: returnReceipt
    });
  } catch (err) {
    next(err);
  }
}

// Unregister from an event (members only)
export async function unregisterFromEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find the registration index before removing
    const registrationIndex = event.registrations.findIndex(
      reg => reg.user && reg.user.toString() === userId.toString()
    );

    event.registeredUsers = event.registeredUsers.filter(
      (uid) => uid.toString() !== userId
    );
    event.attendees = event.registeredUsers.length;
    
    // Remove from registrations array
    if (registrationIndex !== -1) {
      event.registrations.splice(registrationIndex, 1);
    }
    
    await event.save();

    // Also remove from separate eventregistrations collection if it exists
    if (registrationIndex !== -1) {
      try {
        const mongoose = await import('mongoose');
        const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        if (collectionNames.includes('eventregistrations')) {
          const registrationsCollection = db.collection('eventregistrations');
          await registrationsCollection.deleteOne({
            eventId: event._id.toString(),
            registrationIndex: registrationIndex
          });
          console.log(`[unregisterFromEvent] Removed registration from eventregistrations collection`);
        }
      } catch (syncError) {
        // Don't fail unregistration if sync fails
        console.warn('[unregisterFromEvent] Could not sync deletion to eventregistrations collection:', syncError.message);
      }
    }

    return res.json({ message: 'Successfully unregistered from event', event });
  } catch (err) {
    next(err);
  }
}

// Get upcoming events
export async function getUpcomingEvents(req, res, next) {
  try {
    const userRole = req.user?.role;
    const query = { 
      date: { $gte: new Date() },
      type: 'event', // Only show actual events, not announcements or activities
      category: { $ne: 'News' } // Exclude news items
    };

    if (!userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(10)
      .populate('registeredUsers', 'name email')
      .populate('registrations.user', 'name email')
      .lean();

    return res.json({ events });
  } catch (err) {
    next(err);
  }
}

// Get events by category/type (for homepage)
export async function getEventsByType(req, res, next) {
  try {
    const { type } = req.params; // 'event', 'announcement', 'activity'
    const userRole = req.user?.role;
    const query = { type };

    if (!userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .limit(10)
      .lean();

    return res.json({ events });
  } catch (err) {
    next(err);
  }
}

// Get past events (chronological timeline)
// Only returns actual events (type === 'event'), excludes announcements, activities, and news
export async function getPastEvents(req, res, next) {
  try {
    const userRole = req.user?.role;
    const query = { 
      date: { $lt: new Date() },
      cancelled: { $ne: true },
      type: 'event', // Only show actual events, not announcements or activities
      category: { $ne: 'News' } // Exclude news items
    };

    // Non-logged-in users can only see public events
    if (!userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: -1 }) // Most recent first
      .populate('registeredUsers', 'name email')
      .lean();

    return res.json({ events });
  } catch (err) {
    next(err);
  }
}

// Helper function to query from both Event model and separate collections
async function queryNewsAndAnnouncements(publicQuery) {
  const mongoose = await import('mongoose');
  const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
  
  // Check if separate collections exist
  let hasNewsCollection = false;
  let hasAnnouncementsCollection = false;
  let hasActivitiesCollection = false;
  
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    hasNewsCollection = collectionNames.includes('news');
    hasAnnouncementsCollection = collectionNames.includes('announcements');
    hasActivitiesCollection = collectionNames.includes('activities');
  } catch (err) {
    console.warn('[queryNewsAndAnnouncements] Could not list collections:', err.message);
  }
  
  let news = [];
  let announcements = [];
  let activities = [];
  
  // Query from Event model (events collection)
  try {
    const eventNews = await Event.find({ type: 'event', category: 'News', ...publicQuery }).lean();
    const eventAnnouncements = await Event.find({ type: 'announcement', ...publicQuery }).lean();
    const eventActivities = await Event.find({ type: 'activity', ...publicQuery }).lean();
    
    news.push(...eventNews);
    announcements.push(...eventAnnouncements);
    activities.push(...eventActivities);
  } catch (err) {
    console.warn('[queryNewsAndAnnouncements] Error querying Event model:', err.message);
  }
  
  // Query from separate collections if they exist
  if (hasNewsCollection) {
    try {
      const newsCollection = db.collection('news');
      const separateNews = await newsCollection.find(publicQuery).toArray();
      news.push(...separateNews);
    } catch (err) {
      console.warn('[queryNewsAndAnnouncements] Error querying news collection:', err.message);
    }
  }
  
  if (hasAnnouncementsCollection) {
    try {
      const announcementsCollection = db.collection('announcements');
      const separateAnnouncements = await announcementsCollection.find(publicQuery).toArray();
      announcements.push(...separateAnnouncements);
    } catch (err) {
      console.warn('[queryNewsAndAnnouncements] Error querying announcements collection:', err.message);
    }
  }
  
  if (hasActivitiesCollection) {
    try {
      const activitiesCollection = db.collection('activities');
      const separateActivities = await activitiesCollection.find(publicQuery).toArray();
      activities.push(...separateActivities);
    } catch (err) {
      console.warn('[queryNewsAndAnnouncements] Error querying activities collection:', err.message);
    }
  }
  
  // Remove duplicates based on _id (convert all _id to strings for comparison)
  const uniqueNews = Array.from(new Map(news.map(item => {
    const id = item._id?.toString() || String(item._id);
    return [id, item];
  })).values());
  const uniqueAnnouncements = Array.from(new Map(announcements.map(item => {
    const id = item._id?.toString() || String(item._id);
    return [id, item];
  })).values());
  const uniqueActivities = Array.from(new Map(activities.map(item => {
    const id = item._id?.toString() || String(item._id);
    return [id, item];
  })).values());
  
  return {
    news: uniqueNews,
    announcements: uniqueAnnouncements,
    activities: uniqueActivities
  };
}

// Get all activities (public endpoint for users)
export async function getAllActivities(req, res, next) {
  try {
    const userRole = req.user?.role;
    const publicQuery = !userRole ? { isPublic: true } : {};

    // Query activities from both sources
    const { activities: allActivities } = await queryNewsAndAnnouncements(publicQuery);

    // Filter out incomplete activities (missing required fields like title)
    const validActivities = allActivities.filter(activity => {
      return activity && activity.title && activity.title.trim() !== '';
    });

    // Sort by date (newest first)
    validActivities.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.date || b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    return res.json({ activities: validActivities });
  } catch (err) {
    next(err);
  }
}

// Get homepage summary data
export async function getHomepageData(req, res, next) {
  try {
    const userRole = req.user?.role;
    const publicQuery = !userRole ? { isPublic: true } : {};

    // Query news, announcements, and activities from both sources
    const { news: allNews, announcements: allAnnouncements, activities: allActivities } = 
      await queryNewsAndAnnouncements(publicQuery);

    // Get counts
    const newsCount = allNews.length;
    const announcementsCount = allAnnouncements.length;
    const activitiesCount = allActivities.length;

    // Get upcoming events (only from Event model, not from separate collections)
    const upcomingEvents = await Event.find({ 
      type: 'event', 
      date: { $gte: new Date() }, 
      category: { $ne: 'News' },
      ...publicQuery 
    })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    // Combine news and announcements, sort by date, and limit
    const latestNewsAndAnnouncements = [...allNews, ...allAnnouncements]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 4);

    // Get all activities (not just recurring) - show at least 2
    const allValidActivities = allActivities
      .filter(activity => activity && activity.title && activity.title.trim() !== '')
      .sort((a, b) => new Date(b.date || b.createdAt || b.updatedAt || 0) - new Date(a.date || a.createdAt || a.updatedAt || 0));
    
    // Show at least 2 activities (prioritize recurring, but include all)
    const regularActivities = allValidActivities.slice(0, Math.max(2, allValidActivities.length));

    return res.json({
      summary: {
        news: newsCount,
        announcements: announcementsCount,
        activities: activitiesCount
      },
      latestNewsAndAnnouncements,
      regularActivities,
      upcomingEvents
    });
  } catch (err) {
    next(err);
  }
}


import { User } from '../models/User.model.js';
import { Event } from '../models/Event.model.js';
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
//commit testing
//testing

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ===============================
   DASHBOARD
================================ */
export async function getAdminStats(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate announcements collection exists
    let hasAnnouncementsCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasAnnouncementsCollection = collectionNames.includes('announcements');
    } catch (err) {
      console.warn('[getAdminStats] Could not list collections:', err.message);
    }
    
    // Count active announcements from Event model
    // Active means: type='announcement' OR (type='event' AND category='News'), not cancelled, and (no date or date in future or past but still relevant)
    // For announcements, we consider them active if they're not cancelled, regardless of date (announcements can be ongoing)
    const eventAnnouncementsCount = await Event.countDocuments({ 
      $or: [
        { type: 'announcement' },
        { type: 'event', category: 'News' }
      ],
      cancelled: { $ne: true }
      // Removed date restriction - announcements are active if not cancelled
    });
    
    // Count from separate announcements collection if it exists
    let separateAnnouncementsCount = 0;
    if (hasAnnouncementsCollection) {
      try {
        const announcementsCollection = db.collection('announcements');
        separateAnnouncementsCount = await announcementsCollection.countDocuments({
          cancelled: { $ne: true }
          // Removed date restriction - announcements are active if not cancelled
        });
      } catch (err) {
        console.warn('[getAdminStats] Error counting separate announcements:', err.message);
      }
    }
    
    // Also count news items from separate news collection if they exist (news items are also announcements)
    let newsAnnouncementsCount = 0;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      if (collectionNames.includes('news')) {
        const newsCollection = db.collection('news');
        newsAnnouncementsCount = await newsCollection.countDocuments({
          cancelled: { $ne: true }
        });
      }
    } catch (err) {
      console.warn('[getAdminStats] Error counting news announcements:', err.message);
    }
    
    const activeAnnouncements = eventAnnouncementsCount + separateAnnouncementsCount + newsAnnouncementsCount;
    
    const [totalUsers, totalEvents] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ type: 'event' })
    ]);

    res.json({
      views: 7265,
      totalUsers,
      totalEvents,
      activeAnnouncements
    });
  } catch (err) {
    next(err);
  }
}

/* ===============================
   USERS
================================ */
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      users: users.map(u => ({
        ...u,
        emailVerified: Boolean(u.emailVerifiedAt),
        isActive: u.isActive ?? true
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate MongoDB ObjectId format
    const mongoose = await import('mongoose');
    if (!mongoose.default.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Convert both IDs to strings for proper comparison
    const currentUserId = String(req.user.id);
    const targetUserId = String(userId);
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }

    // Find the specific user by ID - this ensures we only get one user
    // Using findOne with _id to be explicit about the query
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle active status for this specific user only
    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
}

/* ===============================
   ANNOUNCEMENTS
================================ */
export async function createAnnouncement(req, res, next) {
  try {
    // If category is "News", set type to 'event' so it's counted in news counter
    // Otherwise, set type to 'announcement'
    const eventType = req.body.category === 'News' ? 'event' : (req.body.type || 'announcement');
    
    // Determine image URL based on storage method
    let imageUrl = undefined;
    if (req.file) {
      // Check if GridFS is being used (file has gridfsId)
      if (req.file.gridfsId) {
        imageUrl = req.file.gridfsUrl; // GridFS URL: /api/images/gridfs/{fileId}
      } else {
        imageUrl = `/uploads/images/${req.file.filename}`; // Filesystem URL
      }
    }
    
    const event = await Event.create({
      ...req.body,
      type: eventType,
      date: req.body.date || new Date(),
      isPublic: req.body.isPublic ?? true,
      imageUrl: imageUrl
    });

    // Broadcast real-time update
    try {
      const { broadcastNewsUpdate, broadcastAnnouncementUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      if (eventType === 'event' && req.body.category === 'News') {
        broadcastNewsUpdate(event, 'created');
      } else if (eventType === 'announcement') {
        broadcastAnnouncementUpdate(event, 'created');
      }
      broadcastDataRefresh('announcements');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    // Allow updating announcements and news (events with category 'News')
    if (!event || (event.type !== 'announcement' && !(event.type === 'event' && event.category === 'News'))) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Handle image upload - support both GridFS and filesystem
    if (req.file) {
      // Check if GridFS is being used (file has gridfsId)
      if (req.file.gridfsId) {
        req.body.imageUrl = req.file.gridfsUrl; // GridFS URL: /api/images/gridfs/{fileId}
      } else {
        req.body.imageUrl = `/uploads/images/${req.file.filename}`; // Filesystem URL
      }
    }

    // If category is "News", ensure type is 'event' so it's counted in news counter
    // Otherwise, keep type as 'announcement' if it was an announcement
    if (req.body.category === 'News') {
      req.body.type = 'event';
    } else if (event.type === 'announcement' && !req.body.type) {
      // Keep as announcement if it was originally an announcement and type not specified
      req.body.type = 'announcement';
    }

    // Handle image upload
    if (req.file) {
      req.body.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    Object.assign(event, req.body);
    await event.save();

    // Broadcast real-time update
    try {
      const { broadcastNewsUpdate, broadcastAnnouncementUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      if (event.type === 'event' && event.category === 'News') {
        broadcastNewsUpdate(event, 'updated');
      } else if (event.type === 'announcement') {
        broadcastAnnouncementUpdate(event, 'updated');
      }
      broadcastDataRefresh('announcements');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    await Event.findByIdAndDelete(req.params.id);
    
    // Broadcast real-time update
    try {
      const { broadcastNewsUpdate, broadcastAnnouncementUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      if (event) {
        if (event.type === 'event' && event.category === 'News') {
          broadcastNewsUpdate(event, 'deleted');
        } else if (event.type === 'announcement') {
          broadcastAnnouncementUpdate(event, 'deleted');
        }
      }
      broadcastDataRefresh('announcements');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/* ===============================
   EVENTS
================================ */


export async function createEvent(req, res, next) {
  try {
    const fee = Number(req.body.fee) || 0;
    const requiresPayment = fee > 0;
    const paymentAmount = fee;

    const event = await Event.create({
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),  // cast to Date
      location: req.body.location,
      category: req.body.category,
      type: req.body.type,
      schedule: req.body.schedule,
      isRecurring: req.body.isRecurring === 'true' || req.body.isRecurring === true,
      isPublic: req.body.isPublic === 'true' || req.body.isPublic === true,
      fee: fee,
      requiresPayment: requiresPayment,
      paymentAmount: paymentAmount,
      qrCodeUrl: req.file ? `/uploads/qr/${req.file.filename}` : undefined
    });

    // Broadcast real-time update
    try {
      const { broadcastEventUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastEventUpdate(event, 'created');
      broadcastDataRefresh('events');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
}


export async function updateEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const { title, description, date, location, category, type, schedule, isRecurring, isPublic, fee } = req.body

    const feeAmount = Number(fee) || 0;
    const requiresPayment = feeAmount > 0;
    const paymentAmount = feeAmount;

    event.title = title
    event.description = description
    event.date = new Date(date)
    event.location = location
    event.category = category
    event.type = type
    event.schedule = schedule
    event.isRecurring = Boolean(isRecurring)
    event.isPublic = Boolean(isPublic)
    event.fee = feeAmount
    event.requiresPayment = requiresPayment
    event.paymentAmount = paymentAmount

    if (req.file) {
      const uploadDir = path.join(__dirname, '../uploads/qr')
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      event.qrCodeUrl = `/uploads/qr/${req.file.filename}`
    }

    await event.save()
    
    // Broadcast real-time update
    try {
      const { broadcastEventUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastEventUpdate(event, 'updated');
      broadcastDataRefresh('events');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    res.json({ success: true, event })
  } catch (err) {
    next(err)
  }
}

export async function cancelEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    event.cancelled = true
    await event.save()
    
    // Broadcast real-time update
    try {
      const { broadcastEventUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastEventUpdate(event, 'updated');
      broadcastDataRefresh('events');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    
    await Event.findByIdAndDelete(req.params.id)
    
    // Broadcast real-time update
    try {
      const { broadcastEventUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastEventUpdate(event, 'deleted');
      broadcastDataRefresh('events');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getAllAnnouncements(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate collections exist
    let hasNewsCollection = false;
    let hasAnnouncementsCollection = false;
    
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasNewsCollection = collectionNames.includes('news');
      hasAnnouncementsCollection = collectionNames.includes('announcements');
    } catch (err) {
      console.warn('[getAllAnnouncements] Could not list collections:', err.message);
    }
    
    let allAnnouncements = [];
    
    // Query from Event model (events collection)
    try {
      const eventAnnouncements = await Event.find({ 
        $or: [
          { type: 'announcement' },
          { type: 'event', category: 'News' }
        ]
      }).sort({ createdAt: -1, updatedAt: -1, date: -1 }).lean(); // Sort by creation date first
      
      allAnnouncements.push(...eventAnnouncements);
    } catch (err) {
      console.warn('[getAllAnnouncements] Error querying Event model:', err.message);
    }
    
    // Query from separate collections if they exist
    if (hasAnnouncementsCollection) {
      try {
        const announcementsCollection = db.collection('announcements');
        const separateAnnouncements = await announcementsCollection.find({})
          .sort({ createdAt: -1, updatedAt: -1, date: -1 }) // Sort by creation date first
          .toArray();
        allAnnouncements.push(...separateAnnouncements);
      } catch (err) {
        console.warn('[getAllAnnouncements] Error querying announcements collection:', err.message);
      }
    }
    
    if (hasNewsCollection) {
      try {
        const newsCollection = db.collection('news');
        const separateNews = await newsCollection.find({})
          .sort({ createdAt: -1, updatedAt: -1, date: -1 }) // Sort by creation date first
          .toArray();
        allAnnouncements.push(...separateNews);
      } catch (err) {
        console.warn('[getAllAnnouncements] Error querying news collection:', err.message);
      }
    }
    
    // Remove duplicates based on _id and sort by creation date (newest first)
    const uniqueAnnouncements = Array.from(
      new Map(allAnnouncements.map(item => {
        const id = item._id?.toString() || String(item._id);
        return [id, item];
      })).values()
    ).sort((a, b) => {
      // Prioritize createdAt, then updatedAt, then date
      const dateA = new Date(a.createdAt || a.updatedAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || b.date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    res.json({ announcements: uniqueAnnouncements });
  } catch (err) {
    next(err);
  }
}

export async function getAllEvents(req, res, next) {
  try {
    // Only return actual events, exclude announcements, activities, and news
    const events = await Event.find({ 
      type: 'event', // Only actual events
      category: { $ne: 'News' } // Exclude news items
    })
      .sort({ createdAt: -1, updatedAt: -1, date: -1 }) // Sort by creation date first, then update date, then event date
      .populate('registeredUsers', 'name email')

    res.json({ events })
  } catch (err) {
    next(err)
  }
}

// Get all activities
// Queries both separate 'activities' collection AND Event model to ensure all data is synchronized
export async function getAllActivities(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate activities collection exists
    let hasActivitiesCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasActivitiesCollection = collectionNames.includes('activities');
    } catch (err) {
      console.warn('[getAllActivities] Could not list collections:', err.message);
    }
    
    let activities = [];
    
    // Primary: Query from separate activities collection if it exists
    if (hasActivitiesCollection) {
      try {
        const activitiesCollection = db.collection('activities');
        const separateActivities = await activitiesCollection.find({})
          .sort({ createdAt: -1, updatedAt: -1, date: -1 })
          .toArray();
        activities.push(...separateActivities);
        console.log(`[getAllActivities] Found ${separateActivities.length} activities in separate collection`);
      } catch (err) {
        console.warn('[getAllActivities] Error querying activities collection:', err.message);
      }
    }
    
    // ALWAYS also query from Event model to ensure synchronization
    // This ensures activities stored in Event model are also included
    try {
      const eventActivities = await Event.find({ 
        type: 'activity'
      })
        .sort({ createdAt: -1, updatedAt: -1, date: -1 })
        .lean();
      activities.push(...eventActivities);
      console.log(`[getAllActivities] Found ${eventActivities.length} activities in Event model`);
    } catch (err) {
      console.warn('[getAllActivities] Error querying Event model:', err.message);
    }
    
    // Remove duplicates based on _id
    const uniqueActivities = activities.filter((activity, index, self) =>
      index === self.findIndex(a => a._id.toString() === activity._id.toString())
    );
    
    // Filter out incomplete activities (missing required fields like title)
    const validActivities = uniqueActivities.filter(activity => {
      // Ensure activity has required fields
      return activity && activity.title && activity.title.trim() !== '';
    });
    
    // Log if any activities were filtered out
    if (uniqueActivities.length !== validActivities.length) {
      console.log(`[getAllActivities] Filtered out ${uniqueActivities.length - validActivities.length} incomplete activities`);
    }
    
    // Sort by creation date (newest first), then by update date, then by event date
    validActivities.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || b.date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    console.log(`[getAllActivities] Returning ${validActivities.length} valid activities`);
    res.json({ activities: validActivities });
  } catch (err) {
    next(err);
  }
}

// Create activity
// Stores directly in 'activities' collection if it exists, otherwise uses Event model
export async function createActivity(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate activities collection exists
    let hasActivitiesCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasActivitiesCollection = collectionNames.includes('activities');
    } catch (err) {
      console.warn('[createActivity] Could not list collections:', err.message);
    }
    
    // Determine image URL based on storage method
    let imageUrl = undefined;
    if (req.file) {
      // Check if GridFS is being used (file has gridfsId)
      if (req.file.gridfsId) {
        imageUrl = req.file.gridfsUrl; // GridFS URL: /api/images/gridfs/{fileId}
      } else {
        imageUrl = `/uploads/images/${req.file.filename}`; // Filesystem URL
      }
    }
    
    const activityData = {
      ...req.body,
      type: 'activity',
      date: req.body.date ? new Date(req.body.date) : new Date(),
      isPublic: req.body.isPublic === 'true' || req.body.isPublic === true || req.body.isPublic === undefined,
      imageUrl: imageUrl,
      isRecurring: req.body.isRecurring === 'true' || req.body.isRecurring === true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let activity;
    
    // Primary: Store directly in separate activities collection if it exists
    if (hasActivitiesCollection) {
      try {
        const activitiesCollection = db.collection('activities');
        const result = await activitiesCollection.insertOne(activityData);
        activity = { ...activityData, _id: result.insertedId };
        console.log(`[createActivity] Stored directly in activities collection`);
      } catch (collectionError) {
        console.warn('[createActivity] Failed to store in activities collection, falling back to Event model:', collectionError.message);
        // Fallback to Event model
        activity = await Event.create(activityData);
      }
    } else {
      // Fallback: Use Event model if separate collection doesn't exist
      activity = await Event.create(activityData);
      console.log(`[createActivity] Stored in Event model (activities collection not found)`);
    }

    // Broadcast real-time update
    try {
      const { broadcastActivityUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastActivityUpdate(activity, 'created');
      broadcastDataRefresh('activities');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.status(201).json({ success: true, activity });
  } catch (err) {
    next(err);
  }
}

// Update activity
// Updates in 'activities' collection if it exists, otherwise updates Event model
export async function updateActivity(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate activities collection exists
    let hasActivitiesCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasActivitiesCollection = collectionNames.includes('activities');
    } catch (err) {
      console.warn('[updateActivity] Could not list collections:', err.message);
    }
    
    // Handle image upload - support both GridFS and filesystem
    if (req.file) {
      // Check if GridFS is being used (file has gridfsId)
      if (req.file.gridfsId) {
        req.body.imageUrl = req.file.gridfsUrl; // GridFS URL: /api/images/gridfs/{fileId}
      } else {
        req.body.imageUrl = `/uploads/images/${req.file.filename}`; // Filesystem URL
      }
    }

    // Ensure type remains 'activity'
    req.body.type = 'activity';
    req.body.updatedAt = new Date();
    
    // Handle boolean fields
    if (req.body.isRecurring !== undefined) {
      req.body.isRecurring = req.body.isRecurring === 'true' || req.body.isRecurring === true;
    }
    if (req.body.isPublic !== undefined) {
      req.body.isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;
    }
    
    // Handle date field
    if (req.body.date) {
      req.body.date = new Date(req.body.date);
    }

    let activity;
    
    // Primary: Update in separate activities collection if it exists
    if (hasActivitiesCollection) {
      try {
        const activitiesCollection = db.collection('activities');
        const activityId = mongoose.default.Types.ObjectId.isValid(req.params.id) 
          ? new mongoose.default.Types.ObjectId(req.params.id) 
          : req.params.id;
        const existingActivity = await activitiesCollection.findOne({ _id: activityId });
        
        if (!existingActivity) {
          return res.status(404).json({ message: 'Activity not found' });
        }
        
        await activitiesCollection.updateOne(
          { _id: activityId },
          { $set: req.body }
        );
        
        activity = { ...existingActivity, ...req.body };
        console.log(`[updateActivity] Updated in activities collection`);
      } catch (collectionError) {
        console.warn('[updateActivity] Failed to update in activities collection, trying Event model:', collectionError.message);
        // Fallback to Event model
        activity = await Event.findById(req.params.id);
        if (!activity || activity.type !== 'activity') {
          return res.status(404).json({ message: 'Activity not found' });
        }
        Object.assign(activity, req.body);
        await activity.save();
      }
    } else {
      // Fallback: Update in Event model if separate collection doesn't exist
      activity = await Event.findById(req.params.id);
      if (!activity || activity.type !== 'activity') {
        return res.status(404).json({ message: 'Activity not found' });
      }
      Object.assign(activity, req.body);
      await activity.save();
      console.log(`[updateActivity] Updated in Event model (activities collection not found)`);
    }

    // Broadcast real-time update
    try {
      const { broadcastActivityUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastActivityUpdate(activity, 'updated');
      broadcastDataRefresh('activities');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
}

// Delete activity
// Deletes from 'activities' collection if it exists, otherwise deletes from Event model
export async function deleteActivity(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate activities collection exists
    let hasActivitiesCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasActivitiesCollection = collectionNames.includes('activities');
    } catch (err) {
      console.warn('[deleteActivity] Could not list collections:', err.message);
    }
    
    let activity;
    
    // Primary: Delete from separate activities collection if it exists
    if (hasActivitiesCollection) {
      try {
        const activitiesCollection = db.collection('activities');
        const activityId = mongoose.default.Types.ObjectId.isValid(req.params.id) 
          ? new mongoose.default.Types.ObjectId(req.params.id) 
          : req.params.id;
        activity = await activitiesCollection.findOne({ _id: activityId });
        
        if (!activity) {
          // Try Event model as fallback
          activity = await Event.findById(req.params.id);
          if (!activity || activity.type !== 'activity') {
            return res.status(404).json({ message: 'Activity not found' });
          }
          await Event.deleteOne({ _id: req.params.id });
          console.log(`[deleteActivity] Deleted from Event model (not found in activities collection)`);
        } else {
          await activitiesCollection.deleteOne({ _id: activityId });
          console.log(`[deleteActivity] Deleted from activities collection`);
          
          // Also delete from Event model if it exists there (cleanup)
          try {
            await Event.deleteOne({ _id: req.params.id });
          } catch (err) {
            // Ignore if not found in Event model
          }
        }
      } catch (collectionError) {
        console.warn('[deleteActivity] Failed to delete from activities collection, trying Event model:', collectionError.message);
        // Fallback to Event model
        activity = await Event.findById(req.params.id);
        if (!activity || activity.type !== 'activity') {
          return res.status(404).json({ message: 'Activity not found' });
        }
        await Event.deleteOne({ _id: req.params.id });
      }
    } else {
      // Fallback: Delete from Event model if separate collection doesn't exist
      activity = await Event.findById(req.params.id);
      if (!activity || activity.type !== 'activity') {
        return res.status(404).json({ message: 'Activity not found' });
      }
      await Event.deleteOne({ _id: req.params.id });
      console.log(`[deleteActivity] Deleted from Event model (activities collection not found)`);
    }

    // Broadcast real-time update
    try {
      const { broadcastActivityUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastActivityUpdate(activity, 'deleted');
      broadcastDataRefresh('activities');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Sync payment fields for all existing events (migration function)
export async function syncEventPaymentFields(req, res, next) {
  try {
    const events = await Event.find({ type: 'event', category: { $ne: 'News' } })
    
    let updated = 0
    for (const event of events) {
      const fee = event.fee || 0
      const requiresPayment = fee > 0
      const paymentAmount = fee
      
      // Only update if fields are not already synchronized
      if (event.requiresPayment !== requiresPayment || event.paymentAmount !== paymentAmount) {
        event.requiresPayment = requiresPayment
        event.paymentAmount = paymentAmount
        await event.save()
        updated++
      }
    }
    
    res.json({ 
      success: true, 
      message: `Synchronized payment fields for ${updated} events`,
      updated 
    })
  } catch (err) {
    next(err)
  }
}

/* ===============================
   PAYMENTS (FIXED)
================================ */
// Get all event registrations (for admin management)
// Checks both events.registrations and separate eventregistrations collection
export async function getAllEventRegistrations(req, res, next) {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.default.connection?.db || mongoose.default.connection.getClient().db();
    
    // Check if separate eventregistrations collection exists
    let hasRegistrationsCollection = false;
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      hasRegistrationsCollection = collectionNames.includes('eventregistrations');
    } catch (err) {
      console.warn('[getAllEventRegistrations] Could not list collections:', err.message);
    }

    const registrations = [];

    // Query from separate eventregistrations collection if it exists
    if (hasRegistrationsCollection) {
      try {
        const registrationsCollection = db.collection('eventregistrations');
        const separateRegistrations = await registrationsCollection.find({})
          .sort({ registeredAt: -1 })
          .toArray();
        
        // Populate user info for separate collection registrations
        const User = (await import('../models/User.model.js')).User;
        for (const reg of separateRegistrations) {
          let user = null;
          if (reg.user) {
            try {
              user = await User.findById(reg.user).select('name email').lean();
            } catch (err) {
              console.warn(`[getAllEventRegistrations] Could not populate user ${reg.user}:`, err.message);
            }
          }
          
          registrations.push({
            id: reg._id.toString(),
            eventId: reg.eventId?.toString() || reg.eventId,
            eventTitle: reg.eventTitle,
            eventDate: reg.eventDate,
            eventLocation: reg.eventLocation,
            eventCategory: reg.eventCategory,
            registrationIndex: reg.registrationIndex,
            user: user ? {
              id: user._id.toString(),
              name: user.name || reg.registrationName || 'Unknown',
              email: user.email || reg.registrationEmail || 'N/A'
            } : {
              id: reg.user?.toString() || reg.user,
              name: reg.registrationName || 'Unknown',
              email: reg.registrationEmail || 'N/A'
            },
            registrationName: reg.registrationName,
            registrationEmail: reg.registrationEmail,
            matricNumber: reg.matricNumber,
            phone: reg.phone,
            notes: reg.notes,
            registeredAt: reg.registeredAt,
            hasPayment: !!reg.paymentReceipt,
            paymentReceipt: reg.paymentReceipt || null
          });
        }
      } catch (err) {
        console.warn('[getAllEventRegistrations] Error querying eventregistrations collection:', err.message);
      }
    }

    // Also query from Event model (events.registrations) for backward compatibility
    // Only if separate collection doesn't exist, or to get any new registrations not yet migrated
    if (!hasRegistrationsCollection) {
      // No separate collection - get all from events
      const events = await Event.find({
        'registrations': { $exists: true, $ne: [] }
      })
      .populate('registrations.user', 'name email')
      .populate('registeredUsers', 'name email')
      .sort({ date: -1 })
      .lean();
      
      for (const event of events) {
      if (!event.registrations || event.registrations.length === 0) continue;
      
      for (let index = 0; index < event.registrations.length; index++) {
        const reg = event.registrations[index];
        const user = reg.user && typeof reg.user === 'object' ? reg.user : 
                     event.registeredUsers?.find(u => 
                       (typeof u === 'object' ? u._id : u).toString() === (typeof reg.user === 'object' ? reg.user._id : reg.user)?.toString()
                     );
        
        registrations.push({
          id: `${event._id}-${index}`,
          eventId: event._id.toString(),
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          eventCategory: event.category,
          registrationIndex: index,
          user: user ? {
            id: typeof user === 'object' ? user._id : user,
            name: typeof user === 'object' ? user.name : 'Unknown',
            email: typeof user === 'object' ? user.email : 'N/A'
          } : {
            id: reg.user,
            name: reg.registrationName || 'Unknown',
            email: reg.registrationEmail || 'N/A'
          },
          registrationName: reg.registrationName,
          registrationEmail: reg.registrationEmail,
          matricNumber: reg.matricNumber,
          phone: reg.phone,
          notes: reg.notes,
          registeredAt: reg.registeredAt,
          hasPayment: !!reg.paymentReceipt,
          paymentReceipt: reg.paymentReceipt ? {
            receiptNumber: reg.paymentReceipt.receiptNumber,
            receiptUrl: reg.paymentReceipt.receiptUrl,
            amount: reg.paymentReceipt.amount,
            paymentMethod: reg.paymentReceipt.paymentMethod,
            paymentStatus: reg.paymentReceipt.paymentStatus,
            generatedAt: reg.paymentReceipt.generatedAt,
            verifiedAt: reg.paymentReceipt.verifiedAt,
            rejectionReason: reg.paymentReceipt.rejectionReason
          } : null
        });
      }
    }
    } // End of if (!hasRegistrationsCollection)
    
    // Sort by registration date (newest first)
    registrations.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    
    console.log(`[getAllEventRegistrations] Returning ${registrations.length} registrations (${hasRegistrationsCollection ? 'from separate collection' : 'from events only'})`);
    
    res.json({ registrations });
  } catch (err) {
    next(err);
  }
}

export const verifyPayments = async (req, res, next) => {
  try {
    const statusFilter = req.query.status || null;
    
    console.log('[verifyPayments] Fetching payments with status filter:', statusFilter);
    console.log('[verifyPayments] Request query:', req.query);
    
    // CRITICAL: Only fetch PAID events (events with fees > 0)
    // Paid events = events where paymentAmount > 0 OR fee > 0
    // Free events (paymentAmount = 0 AND fee = 0) should NOT appear in verify payments
    // Also only include registrations with submitted receipts (receiptUrl exists)
    const events = await Event.find({
      $or: [
        { paymentAmount: { $gt: 0 } },
        { fee: { $gt: 0 } }
      ],
      'registrations.paymentReceipt': { $exists: true },
      'registrations.paymentReceipt.receiptUrl': { $exists: true, $ne: null, $ne: '' }
    }).lean();

    console.log('[verifyPayments] Found paid events with submitted payment receipts:', events.length);
    
    if (!events || events.length === 0) {
      console.log('[verifyPayments] No paid events with submitted payment receipts found');
      return res.json({ receipts: [] });
    }

    const payments = [];

    for (const event of events) {
      // Double-check: Only process events that are actually paid events (have fees > 0)
      const paymentAmount = event.paymentAmount || event.fee || 0;
      const isPaidEvent = paymentAmount > 0;
      
      if (!isPaidEvent) {
        console.log(`[verifyPayments] Skipping free event (no fees): ${event.title}`);
        continue; // Skip free events - they should not appear in verify payments
      }
      
      for (let index = 0; index < event.registrations.length; index++) {
        const reg = event.registrations[index];
        // Only include registrations with payment receipts that have been submitted (have receiptUrl)
        if (!reg.paymentReceipt || !reg.paymentReceipt.receiptUrl || reg.paymentReceipt.receiptUrl.trim() === '') {
          continue; // Skip registrations without submitted receipts
        }
        
        // Ensure the receipt has an amount > 0 (paid registration)
        const receiptAmount = reg.paymentReceipt.amount || 0;
        if (receiptAmount <= 0) {
          console.log(`[verifyPayments] Skipping registration with zero amount: ${event.title}`);
          continue; // Skip registrations with zero payment amount
        }
        
        // Apply status filter if provided
        if (statusFilter && statusFilter !== 'all' && reg.paymentReceipt.paymentStatus !== statusFilter) {
          continue;
        }

        // Populate user info if user ID exists
        let userName = reg.registrationName || 'Unknown User';
        let userEmail = reg.registrationEmail || 'N/A';
        let userId = null;
        
        if (reg.user) {
          try {
            const User = (await import('../models/User.model.js')).User;
            const user = await User.findById(reg.user).select('name email').lean();
            if (user) {
              userName = user.name || userName;
              userEmail = user.email || userEmail;
              userId = user._id.toString();
            }
          } catch (userError) {
            console.error('[verifyPayments] Error populating user:', userError);
          }
        }

        payments.push({
          id: `${event._id}-${index}`,
          eventId: event._id.toString(),
          registrationIndex: index,
          event: {
            _id: event._id.toString(),
            title: event.title,
            date: event.date,
            location: event.location
          },
          user: {
            name: userName,
            email: userEmail,
            _id: userId
          },
          receiptUrl: reg.paymentReceipt.receiptUrl,
          amount: reg.paymentReceipt.amount,
          currency: 'RM',
          paymentType: reg.paymentReceipt.paymentMethod || 'QR Code / Bank Transfer',
          status: reg.paymentReceipt.paymentStatus || 'Pending',
          submittedAt: reg.registeredAt || reg.paymentReceipt.generatedAt,
          verifiedAt: reg.paymentReceipt.verifiedAt,
          verifiedBy: reg.paymentReceipt.verifiedBy,
          rejectionReason: reg.paymentReceipt.rejectionReason,
          receiptNumber: reg.paymentReceipt.receiptNumber,
          createdAt: reg.paymentReceipt.generatedAt
        });
      }
    }

    console.log('[verifyPayments] Returning payments:', payments.length);
    res.json({ receipts: payments });
  } catch (err) {
    console.error('[verifyPayments] Error:', err);
    next(err);
  }
};

export const approvePayment = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const reg = event.registrations[req.params.registrationIndex];
    if (!reg || !reg.paymentReceipt) {
      return res.status(404).json({ message: 'Registration or payment receipt not found' });
    }

    // Update payment status to Verified
    reg.paymentReceipt.paymentStatus = 'Verified';
    reg.paymentReceipt.verifiedAt = new Date();
    reg.paymentReceipt.verifiedBy = req.user.id;

    // Generate official receipt only if not already generated (prevent regeneration on refresh)
    if (!reg.paymentReceipt.officialReceiptGenerated) {
      try {
        const { generateReceiptPDF } = await import('../utils/pdfGenerator.js');
        const User = (await import('../models/User.model.js')).User;
        
        // Get user details for receipt
        const user = await User.findById(reg.user);
        if (!user) {
          console.error('User not found for receipt generation');
        } else {
          // Generate transaction ID if not exists
          const transactionId = reg.paymentReceipt.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // Generate PDF receipt with all required fields
          const pdfBuffer = await generateReceiptPDF({
            receiptId: reg.paymentReceipt.receiptNumber,
            userName: reg.registrationName || user.name || user.email,
            eventName: event.title,
            eventDate: event.date,
            paymentDate: reg.paymentReceipt.generatedAt || reg.registeredAt || new Date(),
            amount: reg.paymentReceipt.amount || event.paymentAmount || 0,
            currency: 'MYR',
            transactionId: transactionId,
            matricNumber: reg.matricNumber || null,
            userEmail: reg.registrationEmail || user.email,
            paymentMethod: reg.paymentReceipt.paymentMethod || 'QR Code / Bank Transfer',
            registrationDate: reg.registeredAt || new Date(),
            paymentStatus: 'Verified'
          });
          
          // Mark official receipt as generated (prevent regeneration)
          reg.paymentReceipt.officialReceiptGenerated = true;
          reg.paymentReceipt.officialReceiptGeneratedAt = new Date();
          
          // Store transaction ID if not exists
          if (!reg.paymentReceipt.transactionId) {
            reg.paymentReceipt.transactionId = transactionId;
          }
          
          console.log(`Official receipt generated for registration: ${reg.paymentReceipt.receiptNumber}`);
        }
      } catch (receiptError) {
        console.error('Failed to generate official receipt:', receiptError);
        // Don't fail the approval if receipt generation fails - payment is still verified
      }
    }

    await event.save();

    // Also update Payment and Receipt documents in MongoDB if they exist
    try {
      const { Payment } = await import('../models/Payment.model.js');
      const { Receipt } = await import('../models/Receipt.model.js');

      // Find Payment by eventId and userId
      const payment = await Payment.findOne({
        eventId: event._id,
        userId: reg.user
      });

      if (payment) {
        payment.status = 'paid';
        await payment.save();

        // Update Receipt if it exists
        const receipt = await Receipt.findOne({ paymentId: payment._id });
        if (receipt) {
          // Receipt model doesn't have paymentStatus, but we can add metadata if needed
          console.log(`[approvePayment] Updated Payment ${payment._id} to 'paid' status`);
        }
      }
    } catch (paymentUpdateError) {
      console.error('[approvePayment] Error updating Payment/Receipt documents:', paymentUpdateError);
      // Don't fail the request if Payment/Receipt update fails
    }

    res.json({ success: true, message: 'Payment verified and official receipt generated' });
  } catch (err) {
    next(err);
  }
};

export const rejectPayment = async (req, res, next) => {
  try {
    const { eventId, registrationIndex } = req.params;
    const { reason } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const reg = event.registrations[registrationIndex];
    if (!reg || !reg.paymentReceipt) {
      return res.status(404).json({ message: 'Registration or payment receipt not found' });
    }

    reg.paymentReceipt.paymentStatus = 'Rejected';
    reg.paymentReceipt.verifiedAt = new Date();
    reg.paymentReceipt.verifiedBy = req.user.id;
    reg.paymentReceipt.rejectionReason = reason || 'No reason provided';

    await event.save();
    
    // Broadcast real-time update
    try {
      const { broadcastPaymentReceiptUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastPaymentReceiptUpdate({ eventId: event._id, registration: reg }, 'updated');
      broadcastDataRefresh('payments');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    // Also update Payment document in MongoDB if it exists
    try {
      const { Payment } = await import('../models/Payment.model.js');
      
      // Find Payment by eventId and userId
      const payment = await Payment.findOne({
        eventId: event._id,
        userId: reg.user
      });
      
      if (payment) {
        payment.status = 'failed';
        if (payment.metadata) {
          payment.metadata.rejectionReason = reason || 'No reason provided';
        } else {
          payment.metadata = { rejectionReason: reason || 'No reason provided' };
        }
        await payment.save();
        console.log(`[rejectPayment] Updated Payment ${payment._id} to 'failed' status`);
      }
    } catch (paymentUpdateError) {
      console.error('[rejectPayment] Error updating Payment document:', paymentUpdateError);
      // Don't fail the request if Payment update fails
    }
    
    res.json({ success: true, message: 'Payment rejected successfully' });
  } catch (err) {
    next(err);
  }
};

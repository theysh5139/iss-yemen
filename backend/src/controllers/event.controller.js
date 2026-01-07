import { Event } from '../models/Event.model.js';

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
    // Check payment requirement: use paymentAmount if set, otherwise fallback to fee
    const paymentAmount = event.paymentAmount || event.fee || 0;
    const requiresPayment = (event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0);
    
    if (requiresPayment && paymentAmount > 0) {
      const { generateReceiptNumber } = await import('../utils/receipt.js');
      receiptNumber = generateReceiptNumber();
      receiptData = {
        receiptNumber: receiptNumber,
        generatedAt: new Date(),
        amount: paymentAmount,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'Pending',
        registrationName: registrationName,
        registrationEmail: registrationEmail,
        matricNumber: matricNumber || null,
        phone: phone || null
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

    // Return receipt data from registration
    const returnReceipt = registrationData.paymentReceipt || null;

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

    event.registeredUsers = event.registeredUsers.filter(
      (uid) => uid.toString() !== userId
    );
    event.attendees = event.registeredUsers.length;
    await event.save();

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

// Get homepage summary data
export async function getHomepageData(req, res, next) {
  try {
    const userRole = req.user?.role;
    const publicQuery = !userRole ? { isPublic: true } : {};

    const [news, announcements, activities, upcomingEvents] = await Promise.all([
      Event.countDocuments({ type: 'event', category: 'News', ...publicQuery }),
      Event.countDocuments({ type: 'announcement', ...publicQuery }),
      Event.countDocuments({ type: 'activity', ...publicQuery }),
      Event.find({ type: 'event', date: { $gte: new Date() }, ...publicQuery })
        .sort({ date: 1 })
        .limit(5)
        .lean()
    ]);

    const latestNewsAndAnnouncements = await Event.find({
      $or: [{ type: 'event', category: 'News' }, { type: 'announcement' }],
      ...publicQuery
    })
      .sort({ date: -1 })
      .limit(4)
      .lean();

    const regularActivities = await Event.find({
      type: 'activity',
      isRecurring: true,
      ...publicQuery
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    return res.json({
      summary: {
        news: news,
        announcements: announcements,
        activities: activities
      },
      latestNewsAndAnnouncements,
      regularActivities,
      upcomingEvents
    });
  } catch (err) {
    next(err);
  }
}


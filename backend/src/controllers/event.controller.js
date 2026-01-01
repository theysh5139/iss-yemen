import { Event } from '../models/Event.model.js';

// Get all events (public events for visitors, all for members)
export async function getEvents(req, res, next) {
  try {
    const userRole = req.user?.role;
    const query = {};

    // Visitors can only see public events
    if (userRole === 'visitor' || !userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .populate('registeredUsers', 'name email')
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
      .lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if visitor can access this event
    if ((userRole === 'visitor' || !userRole) && !event.isPublic) {
      return res.status(403).json({ message: 'Access denied. This event is for members only.' });
    }

    return res.json({ event });
  } catch (err) {
    next(err);
  }
}

// Register for an event (members only)
export async function registerForEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    event.registeredUsers.push(userId);
    event.attendees = event.registeredUsers.length;
    await event.save();

    return res.json({ message: 'Successfully registered for event', event });
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
    const query = { date: { $gte: new Date() } };

    if (userRole === 'visitor' || !userRole) {
      query.isPublic = true;
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(10)
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

    if (userRole === 'visitor' || !userRole) {
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
export async function getPastEvents(req, res, next) {
  try {
    const userRole = req.user?.role;
    const query = { 
      date: { $lt: new Date() },
      cancelled: { $ne: true }
    };

    // Visitors can only see public events
    if (userRole === 'visitor' || !userRole) {
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
    const publicQuery = userRole === 'visitor' || !userRole ? { isPublic: true } : {};

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


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
    const [totalUsers, totalEvents, activeAnnouncements] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ type: 'event' }),
      Event.countDocuments({ type: 'announcement', date: { $gte: new Date() } })
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
        emailVerified: Boolean(u.emailVerifiedAt)
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
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Deactivate user by deleting their account
    // Don't set role to 'visitor' - visitors don't have accounts
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true });
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
    
    const event = await Event.create({
      ...req.body,
      type: eventType,
      date: req.body.date || new Date(),
      isPublic: req.body.isPublic ?? true,
      imageUrl: req.file ? `/uploads/images/${req.file.filename}` : undefined
    });

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

    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    await Event.findByIdAndDelete(req.params.id);
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
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteEvent(req, res, next) {
  try {
    await Event.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getAllAnnouncements(req, res, next) {
  try {
    // Return both announcements and news items (events with category 'News')
    const announcements = await Event.find({ 
      $or: [
        { type: 'announcement' },
        { type: 'event', category: 'News' }
      ]
    }).sort({ date: -1 });
    res.json({ announcements });
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
      .sort({ date: -1 })
      .populate('registeredUsers', 'name email')

    res.json({ events })
  } catch (err) {
    next(err)
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
export const verifyPayments = async (req, res, next) => {
  try {
    const statusFilter = req.query.status || null;
    
    console.log('[verifyPayments] Fetching payments with status filter:', statusFilter);
    console.log('[verifyPayments] Request query:', req.query);
    
    const events = await Event.find({
      'registrations.paymentReceipt': { $exists: true }
    }).lean();

    console.log('[verifyPayments] Found events with payments:', events.length);
    
    if (!events || events.length === 0) {
      console.log('[verifyPayments] No events with payment receipts found');
      return res.json({ receipts: [] });
    }

    const payments = [];

    for (const event of events) {
      for (let index = 0; index < event.registrations.length; index++) {
        const reg = event.registrations[index];
        if (!reg.paymentReceipt) continue;
        
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
    const reg = event.registrations[req.params.registrationIndex];

    reg.paymentReceipt.paymentStatus = 'Verified';
    reg.paymentReceipt.verifiedAt = new Date();
    reg.paymentReceipt.verifiedBy = req.user.id;

    await event.save();
    res.json({ success: true });
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
    res.json({ success: true, message: 'Payment rejected successfully' });
  } catch (err) {
    next(err);
  }
};

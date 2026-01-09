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
    // Delete user account (non-logged-in users don't have accounts)
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

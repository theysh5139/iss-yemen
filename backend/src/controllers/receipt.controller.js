import { Event } from '../models/Event.model.js';
import { User } from '../models/User.model.js';
import { generateReceiptHTML } from '../utils/receipt.js';

// Get receipt for a user's event registration
export async function getReceipt(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find user's registration
    const registration = event.registrations.find(
      reg => reg.user.toString() === userId
    );

    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Receipt not found for this registration' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const receiptData = {
      ...registration.paymentReceipt,
      eventTitle: event.title,
      eventDate: event.date,
      userName: user.name,
      userEmail: user.email
    };

    return res.json({ receipt: receiptData });
  } catch (err) {
    next(err);
  }
}

// Download receipt as HTML/PDF
export async function downloadReceipt(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id || req.query.userId; // Allow userId in query for admin viewing
    const format = req.query.format || 'html'; // html or pdf
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registration = event.registrations.find(
      reg => reg.user.toString() === userId
    );

    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const receiptData = {
      ...registration.paymentReceipt,
      eventTitle: event.title,
      eventDate: event.date,
      userName: user.name,
      userEmail: user.email
    };

    const receiptHTML = generateReceiptHTML(receiptData);

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.receiptNumber}.html"`);
      return res.send(receiptHTML);
    }

    // For PDF, you would need a library like puppeteer or pdfkit
    // For now, return HTML which can be printed as PDF
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.receiptNumber}.html"`);
    return res.send(receiptHTML);
  } catch (err) {
    next(err);
  }
}

// Share receipt (generate shareable link)
export async function shareReceipt(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registration = event.registrations.find(
      reg => reg.user.toString() === userId
    );

    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Generate a shareable token (in production, use a more secure method)
    const shareToken = Buffer.from(`${eventId}:${userId}:${registration.paymentReceipt.receiptNumber}`).toString('base64');
    const shareUrl = `${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/receipt/${shareToken}`;

    return res.json({ 
      shareUrl,
      shareToken,
      message: 'Receipt shareable link generated'
    });
  } catch (err) {
    next(err);
  }
}

// View shared receipt (public endpoint with token)
export async function viewSharedReceipt(req, res, next) {
  try {
    const { token } = req.params;

    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [eventId, userId, receiptNumber] = decoded.split(':');

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const registration = event.registrations.find(
      reg => reg.user.toString() === userId && 
             reg.paymentReceipt?.receiptNumber === receiptNumber
    );

    if (!registration || !registration.paymentReceipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const receiptData = {
      ...registration.paymentReceipt,
      eventTitle: event.title,
      eventDate: event.date,
      userName: user.name,
      userEmail: user.email
    };

    const receiptHTML = generateReceiptHTML(receiptData);
    res.setHeader('Content-Type', 'text/html');
    return res.send(receiptHTML);
  } catch (err) {
    next(err);
  }
}

// Get all receipts for a user
export async function getUserReceipts(req, res, next) {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      'registrations.user': userId,
      'registrations.paymentReceipt': { $exists: true }
    }).select('title date registrations');

    const receipts = [];
    events.forEach(event => {
      const registration = event.registrations.find(
        reg => reg.user.toString() === userId && reg.paymentReceipt
      );
      if (registration) {
        receipts.push({
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          receipt: registration.paymentReceipt,
          registeredAt: registration.registeredAt
        });
      }
    });

    return res.json({ receipts });
  } catch (err) {
    next(err);
  }
}


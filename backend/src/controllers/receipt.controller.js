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
    const format = req.query.format || 'pdf'; // html or pdf (default to PDF)
    
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
      userName: user.name || registration.registrationName || user.email,
      userEmail: user.email || registration.registrationEmail
    };

    // Generate transaction ID if not exists
    const transactionId = receiptData.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Generate PDF receipt (preferred format) - only if payment is verified
    if (format === 'pdf' || !format) {
      // Check if payment is verified before generating official receipt
      if (receiptData.paymentStatus !== 'Verified') {
        return res.status(400).json({ 
          message: 'Official receipt can only be generated after payment verification. Current status: ' + (receiptData.paymentStatus || 'Pending')
        });
      }
      
      try {
        const { generateReceiptPDF } = await import('../utils/pdfGenerator.js');
        
        const pdfBuffer = await generateReceiptPDF({
          receiptId: receiptData.receiptNumber,
          userName: receiptData.userName || registration.registrationName || user.name,
          matricNumber: registration.matricNumber || null,
          userEmail: receiptData.userEmail || registration.registrationEmail || user.email,
          eventName: event.title,
          eventDate: event.date,
          paymentDate: receiptData.generatedAt || registration.registeredAt || new Date(),
          registrationDate: registration.registeredAt || new Date(),
          amount: receiptData.amount || 0,
          currency: 'MYR',
          transactionId: transactionId || receiptData.transactionId,
          paymentMethod: receiptData.paymentMethod || 'QR Code / Bank Transfer',
          paymentStatus: receiptData.paymentStatus || 'Verified'
        });

        // Set headers for PDF download
        const fileName = `Receipt-${receiptData.receiptNumber}-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        return res.send(pdfBuffer);
      } catch (pdfError) {
        console.error('PDF generation failed, falling back to HTML:', pdfError);
        // Fall through to HTML generation
      }
    }

    // Generate HTML receipt (fallback or if format=html)
    const receiptHTML = generateReceiptHTML(receiptData);
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


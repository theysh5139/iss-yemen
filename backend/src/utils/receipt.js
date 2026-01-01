import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique receipt number
 * Format: REC-YYYYMMDD-XXXXXX
 */
export function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // Use Node's built-in crypto.randomUUID if available, otherwise fall back to uuid v4
  const uuid = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
  const random = uuid.substring(0, 6).toUpperCase().replace(/-/g, '');
  return `REC-${year}${month}${day}-${random}`;
}

/**
 * Generate receipt data for an event registration
 */
export function generateReceiptData(event, user, amount = null, paymentMethod = 'Online Banking') {
  const receiptNumber = generateReceiptNumber();
  const receiptAmount = amount || event.paymentAmount || 0;

  return {
    receiptNumber,
    generatedAt: new Date(),
    amount: receiptAmount,
    paymentMethod: paymentMethod || 'Online Banking',
    paymentStatus: 'Pending',
    eventId: event._id,
    eventTitle: event.title,
    eventDate: event.date,
    userId: user._id || user.id,
    userName: user.name,
    userEmail: user.email
  };
}

/**
 * Generate receipt HTML for display/download
 */
export function generateReceiptHTML(receiptData) {
  const { receiptNumber, generatedAt, amount, eventTitle, eventDate, userName, userEmail } = receiptData;

  const formattedDate = new Date(generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${receiptNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .receipt-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e3a8a;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .receipt-number {
      text-align: right;
      margin-bottom: 20px;
      color: #666;
      font-size: 14px;
    }
    .receipt-details {
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: 600;
      color: #333;
    }
    .detail-value {
      color: #666;
    }
    .amount-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 30px 0;
      text-align: center;
    }
    .amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    .status-verified {
      background: #d4edda;
      color: #155724;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>ISS YEMEN</h1>
      <p>Official Payment Receipt</p>
    </div>

    <div class="receipt-number">
      Receipt No: <strong>${receiptNumber}</strong>
    </div>

    <div class="receipt-details">
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value">${eventTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event Date:</span>
        <span class="detail-value">${eventDateFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Member Name:</span>
        <span class="detail-value">${userName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${userEmail}</span>
      </div>
    </div>

    <div class="amount-section">
      <div class="amount-label">Total Amount</div>
      <div class="amount-value">RM ${amount.toFixed(2)}</div>
    </div>

    <div class="footer">
      <p>This is an official receipt issued by ISS Yemen.</p>
      <p>For inquiries, please contact the admin.</p>
      <p>Generated on ${formattedDate}</p>
    </div>
  </div>
</body>
</html>
  `;
}

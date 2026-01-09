import PDFDocument from 'pdfkit';

/**
 * Generate a PDF receipt for a payment
 * @param {Object} receiptData - Receipt data
 * @param {string} receiptData.receiptId - Receipt ID (unique receipt number)
 * @param {string} receiptData.userName - User name
 * @param {string} receiptData.matricNumber - Matric number (optional)
 * @param {string} receiptData.userEmail - User email
 * @param {string} receiptData.eventName - Event name
 * @param {Date} receiptData.eventDate - Event date
 * @param {Date} receiptData.paymentDate - Payment date
 * @param {Date} receiptData.registrationDate - Registration date
 * @param {number} receiptData.amount - Payment amount
 * @param {string} receiptData.currency - Currency code
 * @param {string} receiptData.transactionId - Transaction ID
 * @param {string} receiptData.paymentMethod - Payment method
 * @param {string} receiptData.paymentStatus - Payment verification status
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with ISS Yemen branding
      doc
        .fontSize(24)
        .fillColor('#1a5490')
        .text('ISS YEMEN', 50, 50, { align: 'center' })
        .fontSize(14)
        .fillColor('#666')
        .text('International Students Society - Yemen', 50, 80, { align: 'center' })
        .text('Universiti Teknologi Malaysia (UTM)', 50, 100, { align: 'center' })
        .moveDown(1.5);

      // Receipt title
      doc
        .fontSize(20)
        .fillColor('#000')
        .text('OFFICIAL REGISTRATION RECEIPT', 50, 140, { align: 'center' })
        .moveDown();

      // Receipt ID and Date
      doc
        .fontSize(12)
        .fillColor('#333')
        .text(`Receipt Number: ${receiptData.receiptId || 'N/A'}`, 50, 190)
        .text(`Date: ${formatDate(receiptData.paymentDate || receiptData.registrationDate)}`, 50, 210)
        .moveDown();

      // Line separator
      doc
        .moveTo(50, 250)
        .lineTo(550, 250)
        .strokeColor('#ccc')
        .lineWidth(1)
        .stroke()
        .moveDown();

      // Registration & Payment details
      const startY = 270;
      doc
        .fontSize(12)
        .fillColor('#000')
        .text('Registration & Payment Details', 50, startY, { bold: true })
        .moveDown(0.5);

      const details = [
        { label: 'Name:', value: receiptData.userName || 'N/A' },
        { label: 'Matric Number:', value: receiptData.matricNumber || 'N/A' },
        { label: 'Email:', value: receiptData.userEmail || 'N/A' },
        { label: 'Event:', value: receiptData.eventName || 'N/A' },
        { label: 'Event Date:', value: formatDate(receiptData.eventDate) },
        { label: 'Registration Date:', value: formatDate(receiptData.registrationDate || receiptData.paymentDate) },
        { label: 'Payment Method:', value: receiptData.paymentMethod || 'N/A' },
        { label: 'Transaction ID:', value: receiptData.transactionId || 'N/A' },
        { label: 'Payment Status:', value: receiptData.paymentStatus === 'Verified' ? '✅ Verified' : receiptData.paymentStatus || 'Pending' }
      ];

      let currentY = startY + 30;
      details.forEach((detail) => {
        doc
          .fontSize(11)
          .fillColor('#666')
          .text(detail.label, 70, currentY)
          .fillColor('#000')
          .text(detail.value, 200, currentY);
        currentY += 22;
      });

      // Amount box
      const amountBoxY = startY + 30;
      doc
        .rect(350, amountBoxY, 200, 120)
        .strokeColor('#1a5490')
        .lineWidth(2)
        .stroke()
        .fontSize(14)
        .fillColor('#1a5490')
        .text('Total Amount Paid', 360, amountBoxY + 15, { bold: true })
        .fontSize(24)
        .text(`${receiptData.currency || 'MYR'} ${(receiptData.amount || 0).toFixed(2)}`, 360, amountBoxY + 45, { bold: true })
        .fontSize(10)
        .fillColor('#666')
        .text('Payment Verified', 360, amountBoxY + 85, { bold: true });

      // Footer
      const footerY = 700;
      doc
        .fontSize(10)
        .fillColor('#999')
        .text('Thank you for your registration!', 50, footerY, { align: 'center' })
        .text('This is an official receipt issued by ISS Yemen', 50, footerY + 15, { align: 'center' })
        .text('For inquiries, please contact us at info@issyemen.org', 50, footerY + 30, { align: 'center' });

      // End PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}


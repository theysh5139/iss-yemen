import PDFDocument from 'pdfkit';

/**
 * Generate a PDF receipt for a payment
 * @param {Object} receiptData - Receipt data
 * @param {string} receiptData.receiptId - Receipt ID
 * @param {string} receiptData.userName - User name
 * @param {string} receiptData.eventName - Event name
 * @param {Date} receiptData.eventDate - Event date
 * @param {Date} receiptData.paymentDate - Payment date
 * @param {number} receiptData.amount - Payment amount
 * @param {string} receiptData.currency - Currency code
 * @param {string} receiptData.transactionId - Transaction ID
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
        .text('ISS Yemen', 50, 50, { align: 'center' })
        .fontSize(14)
        .fillColor('#666')
        .text('International Students Society - Yemen', 50, 80, { align: 'center' })
        .moveDown(2);

      // Receipt title
      doc
        .fontSize(20)
        .fillColor('#000')
        .text('OFFICIAL RECEIPT', 50, 130, { align: 'center' })
        .moveDown();

      // Receipt ID
      doc
        .fontSize(12)
        .fillColor('#333')
        .text(`Receipt ID: ${receiptData.receiptId}`, 50, 180)
        .text(`Date: ${formatDate(receiptData.paymentDate)}`, 50, 200)
        .moveDown();

      // Line separator
      doc
        .moveTo(50, 240)
        .lineTo(550, 240)
        .strokeColor('#ccc')
        .lineWidth(1)
        .stroke()
        .moveDown();

      // Payment details
      const startY = 260;
      doc
        .fontSize(12)
        .fillColor('#000')
        .text('Payment Details', 50, startY, { bold: true })
        .moveDown(0.5);

      const details = [
        { label: 'Paid By:', value: receiptData.userName },
        { label: 'Event:', value: receiptData.eventName },
        { label: 'Event Date:', value: formatDate(receiptData.eventDate) },
        { label: 'Transaction ID:', value: receiptData.transactionId },
        { label: 'Amount:', value: `${receiptData.currency} ${receiptData.amount.toFixed(2)}` }
      ];

      let currentY = startY + 30;
      details.forEach((detail) => {
        doc
          .fontSize(11)
          .fillColor('#666')
          .text(detail.label, 70, currentY)
          .fillColor('#000')
          .text(detail.value, 200, currentY);
        currentY += 25;
      });

      // Amount box
      doc
        .rect(350, startY + 30, 200, 100)
        .strokeColor('#1a5490')
        .lineWidth(2)
        .stroke()
        .fontSize(14)
        .fillColor('#1a5490')
        .text('Total Amount', 360, startY + 40, { bold: true })
        .fontSize(18)
        .text(`${receiptData.currency} ${receiptData.amount.toFixed(2)}`, 360, startY + 65, { bold: true });

      // Footer
      const footerY = 700;
      doc
        .fontSize(10)
        .fillColor('#999')
        .text('Thank you for your payment!', 50, footerY, { align: 'center' })
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


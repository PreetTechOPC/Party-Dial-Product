const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Only' : 'Only';
  return str.trim();
}

/**
 * Generates a professional PDF Invoice
 * @param {Object} data - Invoice data
 * @returns {Promise<Buffer>} - PDF Buffer
 */
exports.generateInvoicePDF = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            const {
                invoiceNumber,
                invoiceDate,
                venueName,
                billingDetails = "{}",
                planName,
                totalAmount,
                status = "Paid",
                paymentDate
            } = data;

            let clientDetails = {};
            try {
                clientDetails = typeof billingDetails === 'string' ? JSON.parse(billingDetails) : billingDetails;
            } catch (e) {}

            const pageWidth = 595.28;

            // ─── LOGO & HEADER ───
            const logoPath = path.join(__dirname, '../../vendor/public/PREET LOGO FILE (1).png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 30, { width: 120 });
            } else {
                doc.fillColor('#3B82F6').fontSize(24).text('PREET', 40, 50, { continued: true })
                   .fillColor('#1E293B').text(' TECH');
            }

            // Top Right Meta Box
            doc.fontSize(10).fillColor('#1E293B');
            doc.font('Helvetica-Bold').text('Invoice No.', 350, 45);
            doc.font('Helvetica').text(invoiceNumber || '—', 430, 45, { lineBreak: false });
            
            doc.font('Helvetica-Bold').text('Invoice Date:', 350, 60);
            doc.font('Helvetica').text(invoiceDate || '—', 430, 60, { lineBreak: false });
            
            doc.font('Helvetica-Bold').text('Status:', 350, 75);
            doc.font('Helvetica').text(status, 430, 75, { lineBreak: false });
            
            doc.font('Helvetica-Bold').text('Paid Date:', 350, 90);
            doc.font('Helvetica').text(paymentDate || '—', 430, 90, { lineBreak: false });

            // Blue horizontal line
            doc.moveTo(40, 105).lineTo(pageWidth - 40, 105).lineWidth(1.5).stroke('#3B82F6');

            // ─── TAX INVOICE ───
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(20).text('TAX INVOICE', 40, 140);

            // ─── FROM / BILL TO TABLE ───
            const boxY = 160;
            const boxHeight = 120;
            const center = pageWidth / 2;
            
            // Outer box and divider
            doc.rect(40, boxY, pageWidth - 80, boxHeight).lineWidth(1).stroke('#CBD5E1');
            doc.moveTo(center, boxY).lineTo(center, boxY + boxHeight).stroke('#CBD5E1');
            doc.moveTo(40, boxY + 25).lineTo(pageWidth - 40, boxY + 25).stroke('#CBD5E1');

            // Headers background
            doc.rect(40.5, boxY + 0.5, center - 41, 24).fill('#F8FAFC');
            doc.rect(center + 0.5, boxY + 0.5, (pageWidth - 80) / 2 - 1, 24).fill('#F8FAFC');

            // Header Texts
            doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold');
            doc.text('FROM', 50, boxY + 8);
            doc.text('BILL TO', center + 10, boxY + 8);

            // From Content
            doc.fillColor('#1E293B').font('Helvetica-Bold');
            doc.text('PREET TECH (OPC) PRIVATE LIMITED', 50, boxY + 35);
            doc.font('Helvetica').fontSize(9);
            doc.text('GSTIN: 05AAQCP8357E1Z1', 50, boxY + 50);
            doc.text('Address: 3/118 GURUNANAKPURA, Nainital Road, Near\nKrishna Hospital, Haldwani, Nainital, Uttarakhand - 263139', 50, boxY + 65, { width: center - 60 });
            doc.text('Phone: +91 8679933302', 50, boxY + 95);
            doc.text('Email: info@preettech.com', 50, boxY + 110);

            // Bill To Content
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text(clientDetails.name || venueName || '—', center + 10, boxY + 35);
            doc.font('Helvetica').fontSize(9);
            let toY = boxY + 50;
            if (clientDetails.gstNumber) {
                doc.text(`GSTIN: ${clientDetails.gstNumber}`, center + 10, toY);
                toY += 15;
            }
            let toAddress = clientDetails.address || '—';
            if (clientDetails.city) toAddress += `, ${clientDetails.city}`;
            if (clientDetails.state) toAddress += `, ${clientDetails.state}`;
            if (clientDetails.pincode) toAddress += ` - ${clientDetails.pincode}`;
            
            doc.text(`Address: ${toAddress}`, center + 10, toY, { width: center - 60 });
            
            const afterAddrY = doc.y + 5;
            if (clientDetails.mobile || mobile) doc.text(`Phone: ${clientDetails.mobile || mobile}`, center + 10, afterAddrY);
            if (clientDetails.email || email) doc.text(`Email: ${clientDetails.email || email}`, center + 10, doc.y);

            // ─── ITEMS TABLE ───
            const amt = Number(totalAmount || 0);
            const subtotal = amt / 1.18;
            const gst = subtotal * 0.09;

            const formatCurrency = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const tableY = 300;
            doc.rect(40, tableY, pageWidth - 80, 25).fill('#3B82F6');
            
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
            doc.text('#', 50, tableY + 8);
            doc.text('Description', 90, tableY + 8);
            doc.text('SAC Code', 300, tableY + 8);
            doc.text('Qty', 370, tableY + 8);
            doc.text('Rate', 420, tableY + 8, { width: 50, align: 'right' });
            doc.text('Amount', 490, tableY + 8, { width: 50, align: 'right' });

            // Table Row
            doc.rect(40, tableY + 25, pageWidth - 80, 35).lineWidth(1).stroke('#CBD5E1');
            doc.fillColor('#1E293B').font('Helvetica').fontSize(9);
            
            doc.text('1', 50, tableY + 35);
            doc.text(`${planName || 'Service'}\nAs per selected service package`, 90, tableY + 35);
            doc.text('998365', 300, tableY + 35);
            doc.text('1', 370, tableY + 35);
            doc.text(formatCurrency(subtotal), 420, tableY + 35, { width: 50, align: 'right' });
            doc.text(formatCurrency(subtotal), 490, tableY + 35, { width: 50, align: 'right' });

            const finalY = tableY + 60;
            const rightX1 = 350;
            const rightX2 = 490;
            const w = 50;

            // ─── TOTALS SECTION ───
            doc.font('Helvetica').text('Subtotal', rightX1, finalY + 20)
               .text(formatCurrency(subtotal), rightX2, finalY + 20, { width: w, align: 'right' });
            doc.text('CGST @ 9%', rightX1, finalY + 40)
               .text(formatCurrency(gst), rightX2, finalY + 40, { width: w, align: 'right' });
            doc.text('SGST @ 9%', rightX1, finalY + 60)
               .text(formatCurrency(gst), rightX2, finalY + 60, { width: w, align: 'right' });
            doc.font('Helvetica-Bold').text('Total Tax', rightX1, finalY + 80)
               .text(formatCurrency(gst * 2), rightX2, finalY + 80, { width: w, align: 'right' });

            doc.moveTo(40, finalY + 95).lineTo(pageWidth - 40, finalY + 95).stroke('#CBD5E1');
            doc.rect(40, finalY + 95, pageWidth - 80, 25).fill('#F8FAFC');
            
            doc.fillColor('#1E293B').fontSize(10);
            doc.text('GRAND TOTAL', rightX1, finalY + 103);
            doc.text(formatCurrency(amt), rightX2, finalY + 103, { width: w, align: 'right' });
            
            doc.moveTo(40, finalY + 120).lineTo(pageWidth - 40, finalY + 120).stroke('#CBD5E1');

            // ─── AMOUNT IN WORDS ───
            doc.font('Helvetica-Bold').text('Amount in Words:', 40, finalY + 140, { continued: true, width: 90 })
               .font('Helvetica').text(` Rupees ${numberToWords(Math.round(amt))}.`);

            // ─── PAYMENT & NOTES ───
            const notesY = finalY + 170;
            doc.rect(40, notesY, pageWidth - 80, 75).fillAndStroke('#F8FAFC', '#E2E8F0'); // increased height by 10

            doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(9).text('Payment & Notes', 50, notesY + 10);
            doc.fillColor('#475569').font('Helvetica').text(`The total invoice value of ${formatCurrency(amt)} is inclusive of 18% GST.`, 50, notesY + 30);
            doc.text('Payment terms: As mutually agreed.', 50, notesY + 43);
            doc.text(`Payment Method: ${data.paymentMethod || 'Online'}`, 50, notesY + 56);
            doc.text('Service: Venue Promotion & Lead Generation Services', 50, notesY + 69);

            // ─── FOOTER ───
            const footerY = doc.page.height - 60;
            doc.fillColor('#64748B').fontSize(8);
            doc.text('This is a computer-generated invoice and does not require a signature.', 0, footerY, { align: 'center', width: pageWidth });
            doc.text('Thank you for choosing Partydial.', 0, footerY + 12, { align: 'center', width: pageWidth });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

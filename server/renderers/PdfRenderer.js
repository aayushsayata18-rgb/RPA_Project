const PDFDocument = require('pdfkit');

/**
 * Module 27: PdfRenderer
 * Generates standardized hospital documents in PDF format
 * (27_DOCUMENT_GENERATION.md Section 48-50)
 */
class PdfRenderer {
  /**
   * Render document data into a PDF Buffer
   * @param {Object} options
   * @param {Object} options.document - GeneratedDocument or document metadata
   * @param {Object} options.hospitalConfig - Hospital header/contact details
   * @param {Object} options.template - DocumentTemplate
   * @param {Object} options.data - Data payload / variables
   * @returns {Promise<Buffer>}
   */
  static async renderToBuffer({ document, hospitalConfig = {}, template = {}, data = {} }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: document.title || 'Hospital Document',
            Author: hospitalConfig.name || 'Hospital Administration',
            Subject: document.documentType || 'Official Document',
            Keywords: `${document.documentId || ''}, ${document.documentType || ''}`
          }
        });

        const buffers = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', err => reject(err));

        // 1. HOSPITAL HEADER (Section 49)
        const hospitalName = hospitalConfig.name || 'CITY GENERAL HOSPITAL & MEDICAL RESEARCH CENTER';
        const hospitalAddress = hospitalConfig.address || '100 Healthcare Boulevard, Metro City, India';
        const hospitalContact = hospitalConfig.phone
          ? `Tel: ${hospitalConfig.phone} | Email: ${hospitalConfig.email || 'info@hospital.local'}`
          : 'Tel: +91 11 2345 6789 | Email: contact@hospital.local | Web: www.hospital.local';

        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(hospitalName, { align: 'center' });
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(hospitalAddress, { align: 'center' });
        doc.fontSize(8).text(hospitalContact, { align: 'center' });
        doc.moveDown(0.5);

        // Header Accent Line
        doc.strokeColor('#0284c7').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // 2. DOCUMENT TITLE & METADATA BAR
        const docTitle = (document.title || document.documentType || 'OFFICIAL DOCUMENT').toUpperCase();
        doc.fillColor('#0369a1').fontSize(14).font('Helvetica-Bold').text(docTitle, { align: 'center' });
        doc.moveDown(0.5);

        const currentY = doc.y;
        doc.roundedRect(40, currentY, 515, 60, 4).fillAndStroke('#f8fafc', '#cbd5e1');

        // Document Meta Details (2 columns)
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        const col1X = 52;
        const col2X = 310;
        const row1Y = currentY + 10;
        const row2Y = currentY + 25;
        const row3Y = currentY + 40;

        doc.font('Helvetica-Bold').text('Document ID: ', col1X, row1Y, { continued: true })
           .font('Helvetica').text(document.documentId || 'DRAFT');

        doc.font('Helvetica-Bold').text('Date & Time: ', col2X, row1Y, { continued: true })
           .font('Helvetica').text(new Date(document.generatedAt || Date.now()).toLocaleString());

        doc.font('Helvetica-Bold').text('Document Type: ', col1X, row2Y, { continued: true })
           .font('Helvetica').text(document.documentType || 'GENERAL');

        doc.font('Helvetica-Bold').text('Status: ', col2X, row2Y, { continued: true })
           .font('Helvetica').text(document.status || 'GENERATED');

        const entityInfo = document.entityReference
          ? `${document.entityReference.entityType || 'Entity'}: ${document.entityReference.entityId || 'N/A'}`
          : (document.entityType ? `${document.entityType}: ${document.entityId}` : 'N/A');

        doc.font('Helvetica-Bold').text('Reference: ', col1X, row3Y, { continued: true })
           .font('Helvetica').text(entityInfo);

        doc.font('Helvetica-Bold').text('Version: ', col2X, row3Y, { continued: true })
           .font('Helvetica').text(`v${document.version || 1}`);

        doc.y = currentY + 75;

        // 3. PATIENT / RECIPIENT INFORMATION (If Available)
        const patientName = data.patientName || document.patientName;
        const patientId = data.patientId || document.patientId;
        if (patientName || patientId) {
          doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Patient Information');
          doc.moveDown(0.3);

          const pY = doc.y;
          doc.rect(40, pY, 515, 32).fillAndStroke('#f1f5f9', '#e2e8f0');
          doc.fillColor('#334155').fontSize(9);

          doc.font('Helvetica-Bold').text('Patient Name: ', 52, pY + 10, { continued: true })
             .font('Helvetica').text(patientName || 'N/A');

          doc.font('Helvetica-Bold').text('Patient ID: ', 240, pY + 10, { continued: true })
             .font('Helvetica').text(patientId || 'N/A');

          if (data.age || data.gender) {
            doc.font('Helvetica-Bold').text('Demographics: ', 400, pY + 10, { continued: true })
               .font('Helvetica').text(`${data.gender || ''} ${data.age ? `(${data.age} yrs)` : ''}`);
          }

          doc.y = pY + 45;
        }

        // 4. STRUCTURED DATA SECTIONS
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Document Details');
        doc.moveDown(0.3);

        // Render key-value pairs or tabular entries
        const excludedKeys = new Set(['patientName', 'patientId', 'age', 'gender', 'hospitalName', 'hospitalAddress']);
        const entries = Object.entries(data).filter(([k]) => !excludedKeys.has(k));

        if (entries.length > 0) {
          let tableY = doc.y;
          // Table Header
          doc.rect(40, tableY, 515, 20).fill('#e2e8f0');
          doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
          doc.text('Attribute / Field', 52, tableY + 5);
          doc.text('Value / Particulars', 240, tableY + 5);
          tableY += 20;

          entries.forEach(([key, val], idx) => {
            // Check for page overflow
            if (tableY > 700) {
              doc.addPage();
              tableY = 40;
            }

            const isEven = idx % 2 === 0;
            doc.rect(40, tableY, 515, 20).fill(isEven ? '#ffffff' : '#f8fafc');
            doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(40, tableY, 515, 20).stroke();

            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();

            let displayVal = val;
            if (typeof val === 'object' && val !== null) {
              displayVal = JSON.stringify(val);
            } else if (typeof val === 'number') {
              displayVal = val.toLocaleString();
            } else {
              displayVal = String(val || '-');
            }

            doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text(formattedKey, 52, tableY + 5, { width: 180, ellipsis: true });
            doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(displayVal, 240, tableY + 5, { width: 300, ellipsis: true });

            tableY += 20;
          });

          doc.y = tableY + 15;
        }

        // 5. NOTES OR SUMMARY (If provided)
        if (template.headerText || template.description) {
          if (doc.y > 680) doc.addPage();
          doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique')
             .text(template.description || template.headerText || '', 40, doc.y, { width: 515 });
          doc.moveDown(1);
        }

        // 6. AUTHORIZATION / SIGNATURE BLOCK
        if (doc.y > 680) doc.addPage();
        const sigY = Math.max(doc.y + 20, 680);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(380, sigY).lineTo(540, sigY).stroke();
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold')
           .text('Authorized Signatory', 380, sigY + 5, { width: 160, align: 'center' });
        doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
           .text('Digitally Verified & Certified Document', 380, sigY + 16, { width: 160, align: 'center' });

        // 7. FOOTER (Section 50)
        doc.strokeColor('#0284c7').lineWidth(1).moveTo(40, 770).lineTo(555, 770).stroke();
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
        const footerText = template.footerText || 'Confidential & Proprietary Hospital Document - Unauthorized Duplication Prohibited';
        doc.text(footerText, 40, 775, { width: 350 });
        doc.text(`Page 1 of 1 | Doc ID: ${document.documentId || 'DRAFT'}`, 400, 775, { width: 155, align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PdfRenderer;

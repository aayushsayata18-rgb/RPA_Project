const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

/**
 * Module 28: ReportExportService
 * Multi-format export engine (CSV, JSON, PDF) with SHA-256 integrity verification
 * (28_REPORTS_ANALYTICS.md Section 74, 91, 126-127)
 */
class ReportExportService {
  static getStorageDirectory() {
    const dir = path.resolve(__dirname, '../storage/documents/reporting');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Convert array of JSON records to CSV string
   */
  static convertToCSV(data = [], columns = null) {
    if (!data || data.length === 0) return '';

    const headers = columns && columns.length > 0
      ? columns.map((c) => (typeof c === 'string' ? c : c.key))
      : Object.keys(data[0]);

    const headerLabels = columns && columns.length > 0
      ? columns.map((c) => (typeof c === 'string' ? c : c.label || c.key))
      : headers;

    const csvRows = [];
    csvRows.push(headerLabels.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Export report execution data to specified format
   */
  static async exportData({ executionId, reportName, format = 'CSV', data = [], columns = null, summary = {} }) {
    const storageDir = this.getStorageDirectory();
    const cleanExt = format.toLowerCase();
    const fileName = `${executionId}_${Date.now()}.${cleanExt}`;
    const filePath = path.join(storageDir, fileName);

    let fileBuffer;

    if (format === 'CSV') {
      const csvStr = this.convertToCSV(data, columns);
      fileBuffer = Buffer.from(csvStr, 'utf8');
      await fs.promises.writeFile(filePath, fileBuffer);
    } else if (format === 'JSON') {
      const jsonStr = JSON.stringify({ executionId, reportName, summary, rowCount: data.length, data }, null, 2);
      fileBuffer = Buffer.from(jsonStr, 'utf8');
      await fs.promises.writeFile(filePath, fileBuffer);
    } else if (format === 'PDF') {
      fileBuffer = await this.generatePdfReport({ executionId, reportName, data, columns, summary });
      await fs.promises.writeFile(filePath, fileBuffer);
    } else {
      // Default to JSON
      const jsonStr = JSON.stringify(data, null, 2);
      fileBuffer = Buffer.from(jsonStr, 'utf8');
      await fs.promises.writeFile(filePath, fileBuffer);
    }

    // Compute SHA-256 checksum
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      fileName,
      filePath,
      format,
      fileSizeBytes: fileBuffer.length,
      fileChecksum: hash
    };
  }

  /**
   * Simple tabular PDF report generator using PDFKit
   */
  static generatePdfReport({ executionId, reportName, data = [], columns = null, summary = {} }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fillColor('#0284c7').fontSize(18).text(reportName || 'Hospital Administrative Report', { bold: true });
        doc.fillColor('#64748b').fontSize(9).text(`Execution ID: ${executionId} | Generated At: ${new Date().toISOString()}`);
        doc.moveDown(1);

        // Summary box
        if (summary && Object.keys(summary).length > 0) {
          doc.fillColor('#1e293b').fontSize(11).text('Key Metrics Summary', { underline: true });
          doc.moveDown(0.3);
          const summaryEntries = Object.entries(summary).slice(0, 6);
          for (const [k, v] of summaryEntries) {
            doc.fontSize(9).fillColor('#334155').text(`${k}: ${v}`);
          }
          doc.moveDown(1);
        }

        // Table Data Preview (first 25 rows)
        doc.fillColor('#1e293b').fontSize(11).text(`Detailed Data Rows (Total: ${data.length})`, { underline: true });
        doc.moveDown(0.5);

        const previewData = data.slice(0, 30);
        const headers = columns && columns.length > 0
          ? columns.map((c) => (typeof c === 'string' ? c : c.label || c.key)).slice(0, 5)
          : Object.keys(data[0] || {}).slice(0, 5);

        const colKeys = columns && columns.length > 0
          ? columns.map((c) => (typeof c === 'string' ? c : c.key)).slice(0, 5)
          : headers;

        doc.fontSize(8).fillColor('#0f172a').text(headers.join('  |  '), { bold: true });
        doc.text('-------------------------------------------------------------------------------------------------');

        for (const row of previewData) {
          const rowVals = colKeys.map((k) => String(row[k] || '').slice(0, 20));
          doc.fontSize(8).fillColor('#475569').text(rowVals.join('  |  '));
        }

        if (data.length > 30) {
          doc.moveDown(0.5);
          doc.fontSize(8).fillColor('#94a3b8').text(`... and ${data.length - 30} more rows. Full export available in CSV.`);
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ReportExportService;

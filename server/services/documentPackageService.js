const DocumentPackage = require('../models/DocumentPackage');
const GeneratedDocument = require('../models/GeneratedDocument');
const IdGeneratorService = require('./IdGeneratorService');
const storage = require('../storage/storageImplementation');
const AuditService = require('./AuditService');
const PDFDocument = require('pdfkit');

/**
 * Module 27: DocumentPackageService
 * Bundling multiple hospital documents into a validated package
 * (27_DOCUMENT_GENERATION.md Section 58-61, 75, 94, 95)
 */
class DocumentPackageService {
  /**
   * Create and compile a Document Package
   */
  static async createPackage({
    packageType = 'INSURANCE_CLAIM_PACKAGE',
    title,
    description = '',
    documentIds = [],
    entityReference = {},
    patientId = null,
    patientName = null,
    user = {}
  }) {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('At least one document ID is required to create a document package');
    }

    // 1. Validate requested documents (Section 95)
    const docs = await GeneratedDocument.find({
      documentId: { $in: documentIds }
    }).lean();

    if (docs.length !== documentIds.length) {
      const foundIds = new Set(docs.map(d => d.documentId));
      const missing = documentIds.filter(id => !foundIds.has(id));
      throw new Error(`Package generation failed: Missing documents: ${missing.join(', ')}`);
    }

    // Verify all documents are in valid state (RELEASED or GENERATED)
    for (const d of docs) {
      if (d.status !== 'RELEASED' && d.status !== 'GENERATED') {
        throw new Error(`Cannot package document ${d.documentId}: Status must be RELEASED or GENERATED (current: ${d.status})`);
      }
    }

    const packageId = await IdGeneratorService.generateDocumentPackageId();
    const pkgTitle = title || `${packageType.replace(/_/g, ' ')} - ${packageId}`;

    // Sort documents matching request order
    const orderedDocs = documentIds.map((id, index) => {
      const found = docs.find(d => d.documentId === id);
      return {
        documentId: found.documentId,
        title: found.title,
        documentType: found.documentType,
        order: index + 1,
        status: found.status
      };
    });

    // 2. Generate Package Dossier / Summary PDF
    const pdfBuffer = await this._renderPackagePdf({
      packageId,
      packageType,
      title: pkgTitle,
      orderedDocs,
      patientId: patientId || docs[0]?.patientId,
      patientName: patientName || docs[0]?.patientName,
      entityReference
    });

    // 3. Store in storage
    const fileName = `${packageId}.pdf`;
    const stored = await storage.upload({
      fileName,
      buffer: pdfBuffer,
      mimeType: 'application/pdf',
      subDir: 'packages'
    });

    const docPkg = new DocumentPackage({
      packageId,
      packageType,
      title: pkgTitle,
      description,
      entityReference: {
        entityType: entityReference.entityType || 'Package',
        entityId: entityReference.entityId || packageId,
        module: entityReference.module || 'GENERAL'
      },
      patientId: patientId || docs[0]?.patientId || null,
      patientName: patientName || docs[0]?.patientName || null,
      documents: orderedDocs,
      status: 'RELEASED',
      storage: {
        provider: stored.provider,
        path: stored.path,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        size: stored.size,
        checksum: stored.checksum
      },
      manifest: {
        totalDocuments: orderedDocs.length,
        includedTypes: [...new Set(orderedDocs.map(d => d.documentType))],
        generatedAt: new Date()
      },
      createdBy: user.username || user.userId || 'SYSTEM'
    });

    await docPkg.save();

    await AuditService.logEvent({
      userId: user.username || 'SYSTEM',
      action: 'PACKAGE_GENERATED',
      module: 'DOCUMENTS',
      entityType: 'DocumentPackage',
      entityId: packageId,
      details: `Generated package ${packageId} with ${orderedDocs.length} documents`
    });

    return docPkg;
  }

  /**
   * Render package summary / manifest cover PDF
   */
  static async _renderPackagePdf({ packageId, packageType, title, orderedDocs, patientId, patientName, entityReference }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', err => reject(err));

        // Header
        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
           .text('CITY GENERAL HOSPITAL & MEDICAL RESEARCH CENTER', { align: 'center' });
        doc.fillColor('#64748b').fontSize(9).font('Helvetica')
           .text('Official Hospital Document Package & Claim Dossier', { align: 'center' });
        doc.moveDown(0.5);

        doc.strokeColor('#0284c7').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        doc.fillColor('#0369a1').fontSize(14).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'center' });
        doc.moveDown(0.5);

        // Metadata box
        const currentY = doc.y;
        doc.roundedRect(40, currentY, 515, 60, 4).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#334155').fontSize(9);

        doc.font('Helvetica-Bold').text('Package ID: ', 52, currentY + 12, { continued: true })
           .font('Helvetica').text(packageId);

        doc.font('Helvetica-Bold').text('Date: ', 310, currentY + 12, { continued: true })
           .font('Helvetica').text(new Date().toLocaleString());

        doc.font('Helvetica-Bold').text('Package Type: ', 52, currentY + 28, { continued: true })
           .font('Helvetica').text(packageType);

        doc.font('Helvetica-Bold').text('Total Items: ', 310, currentY + 28, { continued: true })
           .font('Helvetica').text(`${orderedDocs.length} documents`);

        if (patientName || patientId) {
          doc.font('Helvetica-Bold').text('Patient: ', 52, currentY + 44, { continued: true })
             .font('Helvetica').text(`${patientName || ''} (${patientId || 'N/A'})`);
        }

        doc.y = currentY + 75;

        // Table Manifest
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Package Manifest (Included Documents)');
        doc.moveDown(0.3);

        let tableY = doc.y;
        doc.rect(40, tableY, 515, 20).fill('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
        doc.text('#', 50, tableY + 5);
        doc.text('Document ID', 75, tableY + 5);
        doc.text('Type', 210, tableY + 5);
        doc.text('Title / Description', 340, tableY + 5);
        doc.text('Status', 485, tableY + 5);
        tableY += 20;

        orderedDocs.forEach((d, idx) => {
          if (tableY > 700) {
            doc.addPage();
            tableY = 40;
          }

          const isEven = idx % 2 === 0;
          doc.rect(40, tableY, 515, 20).fill(isEven ? '#ffffff' : '#f8fafc');
          doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(40, tableY, 515, 20).stroke();

          doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(String(d.order), 50, tableY + 5);
          doc.font('Helvetica-Bold').text(d.documentId, 75, tableY + 5, { width: 130 });
          doc.font('Helvetica').text(d.documentType, 210, tableY + 5, { width: 125, ellipsis: true });
          doc.text(d.title || '-', 340, tableY + 5, { width: 140, ellipsis: true });
          doc.fillColor('#059669').font('Helvetica-Bold').text(d.status, 485, tableY + 5);

          tableY += 20;
        });

        // Footer
        doc.strokeColor('#0284c7').lineWidth(1).moveTo(40, 770).lineTo(555, 770).stroke();
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
        doc.text('Official Certified Hospital Package - Individual documents stored in central document repository', 40, 775);
        doc.text(`Pkg ID: ${packageId}`, 400, 775, { width: 155, align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * List packages
   */
  static async listPackages(query = {}) {
    const filter = {};
    if (query.packageType) filter.packageType = query.packageType;
    if (query.patientId) filter.patientId = query.patientId;
    if (query.status) filter.status = query.status;
    return DocumentPackage.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get package by ID
   */
  static async getPackageById(packageId) {
    const pkg = await DocumentPackage.findOne({ packageId }).lean();
    if (!pkg) {
      throw new Error(`Document package ${packageId} not found`);
    }
    return pkg;
  }
}

module.exports = DocumentPackageService;

const DocumentPackageService = require('../services/documentPackageService');
const storage = require('../storage/storageImplementation');

/**
 * Module 27: DocumentPackageController
 * Packaging and multi-document dossier APIs
 * (27_DOCUMENT_GENERATION.md Section 75)
 */

// @desc    Create a new Document Package (POST /api/document-packages)
exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await DocumentPackageService.createPackage({
      ...req.body,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Document package created successfully',
      data: pkg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List document packages (GET /api/document-packages)
exports.listPackages = async (req, res, next) => {
  try {
    const packages = await DocumentPackageService.listPackages(req.query);
    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get package details (GET /api/document-packages/:packageId)
exports.getPackage = async (req, res, next) => {
  try {
    const pkg = await DocumentPackageService.getPackageById(req.params.packageId);
    res.json({
      success: true,
      data: pkg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download package dossier PDF (GET /api/document-packages/:packageId/download)
exports.downloadPackage = async (req, res, next) => {
  try {
    const pkg = await DocumentPackageService.getPackageById(req.params.packageId);
    if (!pkg.storage?.path) {
      return res.status(404).json({ success: false, message: 'Package file not found in storage' });
    }

    const downloaded = await storage.download(pkg.storage.path);

    res.setHeader('Content-Type', pkg.storage.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pkg.storage.fileName || `${pkg.packageId}.pdf`}"`);
    res.setHeader('Content-Length', downloaded.size);

    return res.send(downloaded.buffer);
  } catch (error) {
    next(error);
  }
};

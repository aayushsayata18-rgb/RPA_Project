const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const StorageProvider = require('./StorageProvider');

/**
 * Module 27: LocalStorageProvider
 * Secure Local Filesystem implementation with SHA-256 Checksums
 * (27_DOCUMENT_GENERATION.md Section 36-40)
 */
class LocalStorageProvider extends StorageProvider {
  constructor(baseDir = null) {
    super();
    this.providerName = 'LOCAL';
    // Base storage root: server/storage/documents
    this.baseDir = baseDir || path.join(__dirname, 'documents');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Calculate SHA-256 checksum of a buffer
   */
  calculateChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Upload / write buffer to local storage
   */
  async upload({ fileName, buffer, mimeType = 'application/pdf', subDir = '' }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      if (typeof buffer === 'string') {
        buffer = Buffer.from(buffer, 'utf-8');
      } else {
        throw new Error('Storage upload requires a valid Buffer or string data');
      }
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetDir = subDir ? path.join(this.baseDir, subDir) : this.baseDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullFilePath = path.join(targetDir, safeName);
    await fs.promises.writeFile(fullFilePath, buffer);

    const checksum = this.calculateChecksum(buffer);
    const relativePath = path.relative(this.baseDir, fullFilePath).replace(/\\/g, '/');

    return {
      provider: this.providerName,
      path: relativePath,
      fileName: safeName,
      mimeType,
      size: buffer.length,
      checksum
    };
  }

  /**
   * Download / read file buffer
   */
  async download(relativePath) {
    const fullFilePath = this._resolveSafePath(relativePath);
    if (!fs.existsSync(fullFilePath)) {
      throw new Error(`File not found in storage: ${relativePath}`);
    }

    const buffer = await fs.promises.readFile(fullFilePath);
    const checksum = this.calculateChecksum(buffer);

    return {
      buffer,
      size: buffer.length,
      checksum,
      fullPath: fullFilePath
    };
  }

  /**
   * Check if file exists
   */
  async exists(relativePath) {
    const fullFilePath = this._resolveSafePath(relativePath);
    return fs.existsSync(fullFilePath);
  }

  /**
   * Delete file from local storage
   */
  async delete(relativePath) {
    const fullFilePath = this._resolveSafePath(relativePath);
    if (fs.existsSync(fullFilePath)) {
      await fs.promises.unlink(fullFilePath);
      return true;
    }
    return false;
  }

  /**
   * Get file metadata
   */
  async getMetadata(relativePath) {
    const fullFilePath = this._resolveSafePath(relativePath);
    if (!fs.existsSync(fullFilePath)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    const stats = await fs.promises.stat(fullFilePath);
    const buffer = await fs.promises.readFile(fullFilePath);
    const checksum = this.calculateChecksum(buffer);

    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      checksum
    };
  }

  /**
   * Ensure relative path doesn't escape baseDir
   */
  _resolveSafePath(relativePath) {
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.baseDir, safePath);
  }
}

module.exports = LocalStorageProvider;

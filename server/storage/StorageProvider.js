/**
 * Module 27: StorageProvider (Abstract Interface)
 * Section 35: Storage Abstraction
 */
class StorageProvider {
  /**
   * Upload / write file buffer or stream to storage
   * @param {Object} params - { fileName, buffer, mimeType, subDir }
   * @returns {Promise<{ path: String, fileName: String, mimeType: String, size: Number, checksum: String }>}
   */
  async upload(params) {
    throw new Error('upload() must be implemented by storage provider subclass');
  }

  /**
   * Download / retrieve file buffer or stream from storage
   * @param {String} filePath
   * @returns {Promise<{ buffer: Buffer, mimeType: String, size: Number }>}
   */
  async download(filePath) {
    throw new Error('download() must be implemented by storage provider subclass');
  }

  /**
   * Check if file exists
   * @param {String} filePath
   * @returns {Promise<Boolean>}
   */
  async exists(filePath) {
    throw new Error('exists() must be implemented by storage provider subclass');
  }

  /**
   * Delete file from storage
   * @param {String} filePath
   * @returns {Promise<Boolean>}
   */
  async delete(filePath) {
    throw new Error('delete() must be implemented by storage provider subclass');
  }

  /**
   * Get metadata / stats of file
   * @param {String} filePath
   * @returns {Promise<{ size: Number, modifiedAt: Date, checksum: String }>}
   */
  async getMetadata(filePath) {
    throw new Error('getMetadata() must be implemented by storage provider subclass');
  }
}

module.exports = StorageProvider;

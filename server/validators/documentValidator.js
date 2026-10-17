/**
 * Module 27: DocumentValidator
 * Validates document generation requests, variables, uploads, and lifecycle rules
 * (27_DOCUMENT_GENERATION.md Section 16, 44, 45, 108)
 */
class DocumentValidator {
  /**
   * Validate required template variables against provided data (Section 16)
   */
  static validateTemplateVariables(template, data = {}) {
    if (!template || !Array.isArray(template.variables)) {
      return { isValid: true, missingVariables: [] };
    }

    const missingVariables = [];
    for (const v of template.variables) {
      if (v.required) {
        const val = data[v.name];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          missingVariables.push(v.name);
        }
      }
    }

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Validate document generation request payload (Section 17, 108)
   */
  static validateGenerationRequest(body) {
    const errors = [];
    if (!body.documentType) {
      errors.push('documentType is required');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate uploaded file metadata and payload (Section 44, 45)
   */
  static validateUpload({ fileName, mimeType, size, buffer, entityReference, documentType }) {
    const errors = [];
    const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB default limit (Section 45)

    if (!fileName) {
      errors.push('fileName is required for uploaded document');
    }
    if (!documentType) {
      errors.push('documentType is required');
    }

    // Supported extensions & MIME types (Section 41)
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv', '.txt'];
    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/octet-stream'
    ];

    if (fileName) {
      const extMatch = fileName.toLowerCase().match(/\.[0-9a-z]+$/);
      if (!extMatch || !allowedExtensions.includes(extMatch[0])) {
        errors.push(`File extension ${extMatch ? extMatch[0] : 'unknown'} is not supported.`);
      }
    }

    if (mimeType && !allowedMimeTypes.includes(mimeType.toLowerCase())) {
      errors.push(`MIME type ${mimeType} is not permitted.`);
    }

    if (size && size > MAX_UPLOAD_SIZE) {
      errors.push(`File size exceeds maximum permitted limit of 25MB.`);
    }

    if (buffer && buffer.length > MAX_UPLOAD_SIZE) {
      errors.push(`Buffer size exceeds maximum permitted limit of 25MB.`);
    }

    // Malware signature heuristics / check
    if (buffer && Buffer.isBuffer(buffer)) {
      const hexSnippet = buffer.slice(0, 50).toString('hex').toLowerCase();
      // Heuristic detection of common executable headers (.exe '4d5a' or suspicious scripts)
      if (hexSnippet.startsWith('4d5a')) {
        errors.push('Security scan failed: Executable binaries are strictly prohibited.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DocumentValidator;

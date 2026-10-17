const RendererFactory = require('../renderers/rendererFactory');
const HospitalConfiguration = require('../models/HospitalConfiguration');

/**
 * Module 27: RenderingService
 * Coordinates template markup, hospital branding, and PDF rendering
 * (27_DOCUMENT_GENERATION.md Section 47, 48, 49)
 */
class RenderingService {
  /**
   * Fetch active hospital branding / configuration
   */
  static async getHospitalConfig() {
    try {
      if (HospitalConfiguration) {
        const config = await HospitalConfiguration.findOne({ isActive: true }).lean();
        if (config) {
          return {
            name: config.hospitalName || config.name || 'CITY GENERAL HOSPITAL',
            address: config.address || '100 Healthcare Boulevard, Metro City, India',
            phone: config.phone || '+91 11 2345 6789',
            email: config.email || 'info@hospital.local',
            logoUrl: config.logoUrl || null
          };
        }
      }
    } catch (e) {
      // Fallback if model not available or empty
    }

    return {
      name: 'CITY GENERAL HOSPITAL & RESEARCH CENTER',
      address: '100 Healthcare Boulevard, Metro City, India',
      phone: '+91 11 2345 6789',
      email: 'info@hospital.local'
    };
  }

  /**
   * Render template HTML string with data variables
   */
  static interpolateHtml(templateHtml, data = {}) {
    if (!templateHtml) return '';
    let html = templateHtml;
    for (const [key, val] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const replacement = val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
      html = html.replace(regex, replacement);
    }
    return html;
  }

  /**
   * Render PDF buffer and HTML string
   */
  static async renderDocument({ document, template = {}, data = {}, format = 'PDF' }) {
    const hospitalConfig = await this.getHospitalConfig();
    const renderer = RendererFactory.getRenderer(format);

    // Generate real PDF Buffer using renderer
    const pdfBuffer = await renderer.renderToBuffer({
      document,
      hospitalConfig,
      template,
      data
    });

    // Also produce rendered HTML representation for web preview
    const interpolatedHtml = this.interpolateHtml(template.content || template.templateHtml, data);

    return {
      pdfBuffer,
      htmlContent: interpolatedHtml
    };
  }
}

module.exports = RenderingService;

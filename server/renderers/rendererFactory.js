const PdfRenderer = require('./PdfRenderer');

/**
 * Module 27: Renderer Factory
 * Section 47 & 76: Factory resolving format renderers
 */
class RendererFactory {
  static getRenderer(format = 'PDF') {
    const normalized = String(format).toUpperCase();
    switch (normalized) {
      case 'PDF':
        return PdfRenderer;
      default:
        return PdfRenderer;
    }
  }
}

module.exports = RendererFactory;

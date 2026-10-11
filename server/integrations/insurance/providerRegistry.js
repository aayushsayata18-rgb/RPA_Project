const StarHealthAdapter = require('./api/StarHealthAdapter');
const MediShieldAdapter = require('./api/MediShieldAdapter');
const PortalRpaAdapter = require('./portal/PortalRpaAdapter');

/**
 * Provider Registry
 * Conforms to 09_INSURANCE_VERIFICATION.md Section 18 & Section 55
 */
class ProviderRegistry {
  constructor() {
    this.adapters = new Map();
    this.portalAdapter = new PortalRpaAdapter();

    // Register built-in adapters
    this.register('STAR_HEALTH', new StarHealthAdapter());
    this.register('MEDI_SHIELD', new MediShieldAdapter());
    this.register('PORTAL_RPA', this.portalAdapter);
  }

  register(code, adapterInstance) {
    this.adapters.set(code.toUpperCase(), adapterInstance);
  }

  /**
   * Resolve appropriate adapter by provider code or name
   * Preferred order (Section 2): 1. Official API, 2. Portal RPA, 3. Manual
   * @param {string} providerCode
   * @param {string} integrationPreference 'API' | 'PORTAL' | 'ANY'
   */
  getProvider(providerCode = '', integrationPreference = 'ANY') {
    const normalized = (providerCode || '').toUpperCase().trim();

    // If explicit portal request
    if (integrationPreference === 'PORTAL' || normalized.includes('PORTAL')) {
      return this.portalAdapter;
    }

    // Direct lookup
    if (this.adapters.has(normalized)) {
      return this.adapters.get(normalized);
    }

    // Provider name heuristic matching
    if (normalized.includes('STAR')) {
      return this.adapters.get('STAR_HEALTH');
    }
    if (normalized.includes('SHIELD') || normalized.includes('MEDI')) {
      return this.adapters.get('MEDI_SHIELD');
    }

    // If API unavailable, fallback to Portal RPA adapter
    return this.portalAdapter;
  }

  listRegisteredProviders() {
    return Array.from(this.adapters.keys());
  }
}

module.exports = new ProviderRegistry();

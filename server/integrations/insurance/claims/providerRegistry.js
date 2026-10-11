const StarHealthClaimsAdapter = require('./api/StarHealthClaimsAdapter');
const MediShieldClaimsAdapter = require('./api/MediShieldClaimsAdapter');
const PortalRpaClaimsAdapter = require('./portal/PortalRpaClaimsAdapter');

/**
 * Claims Provider Registry
 * Conforms to 10_INSURANCE_CLAIMS.md Section 27 & 65
 */
class ClaimsProviderRegistry {
  constructor() {
    this.adapters = new Map();
    this.portalAdapter = new PortalRpaClaimsAdapter();

    this.register('STAR_HEALTH', new StarHealthClaimsAdapter());
    this.register('MEDI_SHIELD', new MediShieldClaimsAdapter());
    this.register('PORTAL_RPA', this.portalAdapter);
  }

  register(code, adapterInstance) {
    this.adapters.set(code.toUpperCase(), adapterInstance);
  }

  /**
   * Resolve appropriate claims adapter by provider code/name and preference
   */
  getProvider(providerCode = '', integrationPreference = 'ANY') {
    const normalized = (providerCode || '').toUpperCase().trim();

    if (integrationPreference === 'PORTAL' || normalized.includes('PORTAL')) {
      return this.portalAdapter;
    }

    if (this.adapters.has(normalized)) {
      return this.adapters.get(normalized);
    }

    if (normalized.includes('STAR')) {
      return this.adapters.get('STAR_HEALTH');
    }
    if (normalized.includes('MEDI') || normalized.includes('SHIELD')) {
      return this.adapters.get('MEDI_SHIELD');
    }

    // Default to portal RPA adapter if no official API matches
    return this.portalAdapter;
  }

  listRegisteredProviders() {
    return Array.from(this.adapters.keys());
  }
}

module.exports = new ClaimsProviderRegistry();

const Vendor = require('../../models/Vendor');

class DuplicateDetectionService {
  /**
   * Normalize company name by stripping common corporate suffixes and punctuation
   */
  static normalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/(\b(private|pvt|limited|ltd|inc|incorporated|corp|corporation|llc|gmbh|co)\b|\.|\,)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check for possible duplicate vendors
   * Criteria from Section 18:
   * - Legal Name (exact or normalized)
   * - Registration Number
   * - Tax ID
   * - Business Registration Number
   * - Primary Email
   * - Phone
   */
  static async checkDuplicate(vendorData, excludeVendorId = null) {
    const {
      legalName,
      displayName,
      registrationNumber,
      taxIdentificationNumber,
      businessRegistrationNumber,
      email,
      phone
    } = vendorData;

    const query = {
      $or: []
    };

    if (excludeVendorId) {
      query.vendorId = { $ne: excludeVendorId };
    }

    if (legalName) {
      query.$or.push({ legalName: new RegExp(`^${legalName.trim()}$`, 'i') });
    }
    if (displayName) {
      query.$or.push({ displayName: new RegExp(`^${displayName.trim()}$`, 'i') });
    }
    if (registrationNumber && registrationNumber.trim()) {
      query.$or.push({ registrationNumber: registrationNumber.trim() });
    }
    if (taxIdentificationNumber && taxIdentificationNumber.trim()) {
      query.$or.push({ taxIdentificationNumber: taxIdentificationNumber.trim() });
    }
    if (businessRegistrationNumber && businessRegistrationNumber.trim()) {
      query.$or.push({ businessRegistrationNumber: businessRegistrationNumber.trim() });
    }
    if (email && email.trim()) {
      query.$or.push({ email: email.trim().toLowerCase() });
    }
    if (phone && phone.trim()) {
      query.$or.push({ phone: phone.trim() });
    }

    if (query.$or.length === 0) {
      return { isDuplicate: false, matches: [] };
    }

    const candidates = await Vendor.find(query).lean();
    if (candidates.length === 0) {
      // Also check normalized legal name match
      if (legalName) {
        const normInput = this.normalizeName(legalName);
        const allVendors = await Vendor.find(
          excludeVendorId ? { vendorId: { $ne: excludeVendorId } } : {}
        )
          .select('vendorId legalName displayName registrationNumber taxIdentificationNumber email phone status')
          .limit(200)
          .lean();

        const fuzzyMatches = [];
        for (const v of allVendors) {
          const normExisting = this.normalizeName(v.legalName);
          if (normInput && normExisting && normInput === normExisting) {
            fuzzyMatches.push({
              vendor: v,
              matchedFields: ['legalName (normalized)'],
              matchType: 'POSSIBLE_DUPLICATE_NAME'
            });
          }
        }

        if (fuzzyMatches.length > 0) {
          return {
            isDuplicate: true,
            hasExactMatch: false,
            matches: fuzzyMatches,
            message: 'Possible duplicate vendor detected by normalized legal name.'
          };
        }
      }
      return { isDuplicate: false, matches: [] };
    }

    const matches = candidates.map((cand) => {
      const matchedFields = [];
      if (legalName && cand.legalName?.toLowerCase() === legalName.trim().toLowerCase()) matchedFields.push('legalName');
      if (displayName && cand.displayName?.toLowerCase() === displayName.trim().toLowerCase()) matchedFields.push('displayName');
      if (registrationNumber && cand.registrationNumber === registrationNumber.trim()) matchedFields.push('registrationNumber');
      if (taxIdentificationNumber && cand.taxIdentificationNumber === taxIdentificationNumber.trim()) matchedFields.push('taxIdentificationNumber');
      if (businessRegistrationNumber && cand.businessRegistrationNumber === businessRegistrationNumber.trim()) matchedFields.push('businessRegistrationNumber');
      if (email && cand.email?.toLowerCase() === email.trim().toLowerCase()) matchedFields.push('email');
      if (phone && cand.phone === phone.trim()) matchedFields.push('phone');

      return {
        vendor: cand,
        matchedFields,
        matchType: matchedFields.length > 1 ? 'HIGH_CONFIDENCE_DUPLICATE' : 'POSSIBLE_DUPLICATE'
      };
    });

    return {
      isDuplicate: true,
      hasExactMatch: matches.some((m) => m.matchedFields.includes('registrationNumber') || m.matchedFields.includes('taxIdentificationNumber')),
      matches,
      message: `Duplicate check flagged ${matches.length} existing vendor record(s).`
    };
  }
}

module.exports = DuplicateDetectionService;

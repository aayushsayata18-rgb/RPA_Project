/**
 * Helper to normalize and validate phone numbers
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  // Remove spaces, hyphens, parentheses, and leading +91 or 0
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Validate and sanitize Patient Registration / Update payload
 */
const validatePatientPayload = (data, isUpdate = false) => {
  const errors = [];
  const sanitized = {};

  // First Name
  if (!isUpdate || data.firstName !== undefined) {
    if (!data.firstName || typeof data.firstName !== 'string' || !data.firstName.trim()) {
      errors.push('First name is required.');
    } else if (data.firstName.trim().length < 2 || data.firstName.trim().length > 50) {
      errors.push('First name must be between 2 and 50 characters.');
    } else {
      sanitized.firstName = data.firstName.trim();
    }
  }

  // Middle Name
  if (data.middleName !== undefined) {
    sanitized.middleName = typeof data.middleName === 'string' ? data.middleName.trim() : '';
  }

  // Last Name
  if (!isUpdate || data.lastName !== undefined) {
    if (!data.lastName || typeof data.lastName !== 'string' || !data.lastName.trim()) {
      errors.push('Last name is required.');
    } else if (data.lastName.trim().length < 1 || data.lastName.trim().length > 50) {
      errors.push('Last name must be between 1 and 50 characters.');
    } else {
      sanitized.lastName = data.lastName.trim();
    }
  }

  // Date of Birth
  if (!isUpdate || data.dateOfBirth !== undefined) {
    if (!data.dateOfBirth) {
      errors.push('Date of birth is required.');
    } else {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Date of birth must be a valid date.');
      } else if (dob > new Date()) {
        errors.push('Date of birth cannot be a future date.');
      } else {
        sanitized.dateOfBirth = dob;
      }
    }
  }

  // Gender
  if (!isUpdate || data.gender !== undefined) {
    const validGenders = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'];
    const gender = (data.gender || '').toUpperCase();
    if (!gender || !validGenders.includes(gender)) {
      errors.push(`Gender must be one of: ${validGenders.join(', ')}`);
    } else {
      sanitized.gender = gender;
    }
  }

  // Blood Group
  if (data.bloodGroup !== undefined) {
    const validBloods = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN', ''];
    const blood = (data.bloodGroup || '').toUpperCase();
    if (blood && !validBloods.includes(blood)) {
      errors.push(`Invalid blood group. Permitted values: ${validBloods.filter(Boolean).join(', ')}`);
    } else {
      sanitized.bloodGroup = blood || 'UNKNOWN';
    }
  }

  // Mobile Number
  if (!isUpdate || data.mobile !== undefined) {
    const cleanedMobile = normalizePhone(data.mobile);
    if (!cleanedMobile) {
      errors.push('Mobile number is required.');
    } else if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      errors.push('Mobile number must be a valid 10-digit Indian mobile number.');
    } else {
      sanitized.mobile = cleanedMobile;
    }
  }

  // Email
  if (data.email !== undefined && data.email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Email format is invalid.');
    } else {
      sanitized.email = data.email.trim().toLowerCase();
    }
  } else if (!isUpdate) {
    sanitized.email = '';
  }

  // Address
  if (data.address) {
    sanitized.address = {
      line1: typeof data.address.line1 === 'string' ? data.address.line1.trim() : '',
      line2: typeof data.address.line2 === 'string' ? data.address.line2.trim() : '',
      city: typeof data.address.city === 'string' ? data.address.city.trim() : '',
      state: typeof data.address.state === 'string' ? data.address.state.trim() : '',
      country: typeof data.address.country === 'string' ? data.address.country.trim() : 'India',
      postalCode: typeof data.address.postalCode === 'string' ? data.address.postalCode.trim() : ''
    };
  }

  // Emergency Contact
  if (data.emergencyContact) {
    const ecMobile = normalizePhone(data.emergencyContact.mobile);
    sanitized.emergencyContact = {
      name: typeof data.emergencyContact.name === 'string' ? data.emergencyContact.name.trim() : '',
      relationship: typeof data.emergencyContact.relationship === 'string' ? data.emergencyContact.relationship.trim() : '',
      mobile: ecMobile
    };

    if (sanitized.mobile && ecMobile && sanitized.mobile === ecMobile) {
      // Allowed if specifically desired, but let's ensure non-empty
    }
  }

  // Identity Documents
  if (Array.isArray(data.identityDocuments)) {
    sanitized.identityDocuments = data.identityDocuments.map((doc) => ({
      type: (doc.type || 'OTHER').toUpperCase(),
      reference: String(doc.reference || '').trim(),
      verified: Boolean(doc.verified)
    }));
  }

  // Communication Preferences
  if (data.communicationPreferences) {
    sanitized.communicationPreferences = {
      sms: data.communicationPreferences.sms !== false,
      email: data.communicationPreferences.email !== false,
      whatsapp: Boolean(data.communicationPreferences.whatsapp)
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

module.exports = {
  validatePatientPayload,
  normalizePhone
};

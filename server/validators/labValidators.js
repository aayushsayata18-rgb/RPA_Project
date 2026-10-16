const validateTestCreation = (data) => {
  const errors = [];
  if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
    errors.push('Test code is required.');
  }
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Test name is required.');
  }
  if (!data.specimenType || typeof data.specimenType !== 'string') {
    errors.push('Specimen type is required.');
  }
  if (data.priceReference === undefined || data.priceReference === null || isNaN(Number(data.priceReference)) || Number(data.priceReference) < 0) {
    errors.push('Price reference must be a valid non-negative number.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateOrderCreation = (data) => {
  const errors = [];
  if (!data.patientId && !data.patientCode) {
    errors.push('Patient ID or Patient Code is required.');
  }
  if (!data.orderingDoctorId) {
    errors.push('Ordering Doctor ID is required.');
  }
  if (!data.testIds || !Array.isArray(data.testIds) || data.testIds.length === 0) {
    errors.push('At least one laboratory test must be selected.');
  }
  if (data.priority && !['NORMAL', 'ROUTINE', 'URGENT', 'STAT'].includes(data.priority)) {
    errors.push('Priority must be NORMAL, ROUTINE, URGENT, or STAT.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateSampleRejection = (data) => {
  const errors = [];
  const allowedReasons = [
    'INSUFFICIENT_SAMPLE',
    'WRONG_CONTAINER',
    'MISSING_LABEL',
    'LABEL_MISMATCH',
    'LEAKED_CONTAINER',
    'DAMAGED_CONTAINER',
    'SAMPLE_NOT_RECEIVED',
    'SAMPLE_STABILITY_EXCEEDED',
    'DUPLICATE_SAMPLE',
    'HEMOLYZED',
    'CLOTTED',
    'LIPEMIC',
    'ICTERIC',
    'OTHER'
  ];
  if (!data.rejectionReason || !allowedReasons.includes(data.rejectionReason)) {
    errors.push(`Valid rejection reason is required (${allowedReasons.join(', ')}).`);
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateResultEntry = (data) => {
  const errors = [];
  const hasResultValue = data.resultValue !== undefined && data.resultValue !== null && String(data.resultValue).trim().length > 0;
  const hasParameters = Array.isArray(data.parameters) && data.parameters.length > 0 && data.parameters.some(p => 
    (p.resultValue !== undefined && String(p.resultValue).trim().length > 0) ||
    (p.value !== undefined && String(p.value).trim().length > 0)
  );

  if (!hasResultValue && !hasParameters && !data.resultText) {
    errors.push('At least one result value or parameter result must be entered.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateResultAmendment = (data) => {
  const errors = [];
  if (!data.amendmentReason || typeof data.amendmentReason !== 'string' || !data.amendmentReason.trim()) {
    errors.push('An authorized amendment reason is required to modify or amend verified results.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateTestCreation,
  validateOrderCreation,
  validateSampleRejection,
  validateResultEntry,
  validateResultAmendment
};

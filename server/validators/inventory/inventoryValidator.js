/**
 * Input validators for Medical Inventory API requests
 */

const validateItemPayload = (req, res, next) => {
  const { name, category, unitOfMeasure } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Item name is required.' }
    });
  }
  if (!category || typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Category is required.' }
    });
  }
  next();
};

const validateBatchPayload = (req, res, next) => {
  const { batchNumber, expiryDate } = req.body;
  if (!batchNumber || typeof batchNumber !== 'string' || batchNumber.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Batch number is required.' }
    });
  }
  if (!expiryDate) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Expiry date is mandatory.' }
    });
  }
  next();
};

const validateReservationPayload = (req, res, next) => {
  const { inventoryItemId, quantity, reservedForType } = req.body;
  if (!inventoryItemId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'inventoryItemId is required.' }
    });
  }
  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Reservation quantity must be a positive number.' }
    });
  }
  if (!reservedForType) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'reservedForType is required.' }
    });
  }
  next();
};

const validateIssuePayload = (req, res, next) => {
  const { inventoryItemId, quantity } = req.body;
  if (!inventoryItemId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'inventoryItemId is required.' }
    });
  }
  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Issue quantity must be greater than 0.' }
    });
  }
  next();
};

const validateTransferPayload = (req, res, next) => {
  const { sourceLocationId, destinationLocationId, items } = req.body;
  if (!sourceLocationId || !destinationLocationId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'sourceLocationId and destinationLocationId are required.' }
    });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'At least one item must be specified for transfer.' }
    });
  }
  next();
};

const validateAdjustmentPayload = (req, res, next) => {
  const { inventoryItemId, batchId, physicalQuantity } = req.body;
  if (!inventoryItemId || !batchId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'inventoryItemId and batchId are required.' }
    });
  }
  if (physicalQuantity === undefined || physicalQuantity === null || isNaN(Number(physicalQuantity))) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid physicalQuantity is required.' }
    });
  }
  next();
};

module.exports = {
  validateItemPayload,
  validateBatchPayload,
  validateReservationPayload,
  validateIssuePayload,
  validateTransferPayload,
  validateAdjustmentPayload
};

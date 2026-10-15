const Medicine = require('../../models/Medicine');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');

class MedicineService {
  /**
   * Create a new Medicine in catalog
   */
  static async createMedicine(data, actorUser = null) {
    const {
      genericName,
      brandName = '',
      strength,
      dosageForm,
      unit = 'Tablet',
      unitPrice = 0,
      manufacturer = '',
      category = 'General',
      barcode = '',
      sku = '',
      prescriptionRequired = true,
      controlledMedicine = false,
      storageRequirements = 'Room Temperature',
      status = 'ACTIVE',
      description = '',
      reorderLevel = 100
    } = data;

    if (!genericName || !strength || !dosageForm) {
      throw new Error('genericName, strength, and dosageForm are required fields.');
    }

    // Duplicate detection rule (Section 9 Rule 2)
    const existing = await Medicine.findOne({
      genericName: new RegExp(`^${genericName.trim()}$`, 'i'),
      strength: new RegExp(`^${strength.trim()}$`, 'i'),
      dosageForm: new RegExp(`^${dosageForm.trim()}$`, 'i'),
      manufacturer: new RegExp(`^${(manufacturer || '').trim()}$`, 'i')
    });

    if (existing) {
      // Log exception case for duplicate medicine creation attempt
      await ExceptionService.raiseException({
        module: 'PHARMACY',
        entityType: 'Medicine',
        entityId: existing.medicineId,
        exceptionType: 'DUPLICATE_MEDICINE_DETECTED',
        description: `Potential duplicate medicine detected: ${genericName} ${strength} (${dosageForm}) by ${manufacturer}`,
        severity: 'MEDIUM',
        source: 'MANUAL',
        metadata: { genericName, strength, dosageForm, manufacturer, existingId: existing.medicineId }
      });

      throw new Error(`Duplicate medicine: ${genericName} ${strength} (${dosageForm}) already exists with ID ${existing.medicineId}.`);
    }

    const medicineId = data.medicineId || (await IdGeneratorService.generateMedicineId());

    const medicine = new Medicine({
      medicineId,
      genericName: genericName.trim(),
      brandName: brandName.trim(),
      strength: strength.trim(),
      dosageForm: dosageForm.trim(),
      unit: unit.trim(),
      unitPrice: Math.max(0, Number(unitPrice || 0)),
      manufacturer: manufacturer.trim(),
      category: category.trim(),
      barcode: barcode ? barcode.trim() : undefined,
      sku: sku ? sku.trim() : undefined,
      prescriptionRequired: Boolean(prescriptionRequired),
      controlledMedicine: Boolean(controlledMedicine),
      storageRequirements,
      status,
      description,
      reorderLevel: Number(reorderLevel) || 100,
      createdBy: actorUser?.userId || 'SYSTEM',
      updatedBy: actorUser?.userId || 'SYSTEM'
    });

    await medicine.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'MEDICINE_CREATED',
      module: 'PHARMACY',
      entityType: 'Medicine',
      entityId: medicineId,
      newValue: { medicineId, genericName, brandName, strength, dosageForm, unitPrice },
      details: `Medicine ${medicineId} (${genericName} ${strength}) created in catalog.`
    });

    return medicine;
  }

  /**
   * Search / filter medicine catalog
   */
  static async getMedicines({ search, category, status, controlledMedicine, page = 1, limit = 50 }) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (controlledMedicine !== undefined && controlledMedicine !== null && controlledMedicine !== '') {
      query.controlledMedicine = String(controlledMedicine) === 'true';
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { medicineId: regex },
        { genericName: regex },
        { brandName: regex },
        { barcode: regex },
        { sku: regex },
        { manufacturer: regex },
        { category: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [medicines, total] = await Promise.all([
      Medicine.find(query).sort({ genericName: 1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      Medicine.countDocuments(query)
    ]);

    return {
      medicines,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get single medicine by ID or barcode
   */
  static async getMedicineById(medicineId) {
    const medicine = await Medicine.findOne({
      $or: [{ medicineId }, { barcode: medicineId }, { sku: medicineId }]
    }).lean();

    if (!medicine) {
      throw new Error(`Medicine '${medicineId}' not found in catalog.`);
    }

    return medicine;
  }

  /**
   * Update medicine details
   */
  static async updateMedicine(medicineId, updateData, actorUser = null) {
    const medicine = await Medicine.findOne({ medicineId });
    if (!medicine) {
      throw new Error(`Medicine '${medicineId}' not found.`);
    }

    const oldValue = medicine.toObject();

    const allowedFields = [
      'brandName',
      'strength',
      'dosageForm',
      'unit',
      'unitPrice',
      'manufacturer',
      'category',
      'barcode',
      'sku',
      'prescriptionRequired',
      'controlledMedicine',
      'storageRequirements',
      'status',
      'description',
      'reorderLevel'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        medicine[field] = updateData[field];
      }
    }

    medicine.updatedBy = actorUser?.userId || 'SYSTEM';
    await medicine.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'MEDICINE_UPDATED',
      module: 'PHARMACY',
      entityType: 'Medicine',
      entityId: medicineId,
      oldValue,
      newValue: medicine.toObject(),
      details: `Medicine ${medicineId} updated.`
    });

    return medicine;
  }

  /**
   * Update medicine status (e.g. ACTIVE -> DISCONTINUED)
   */
  static async updateMedicineStatus(medicineId, status, actorUser = null) {
    const validStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_REVIEW'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.updateMedicine(medicineId, { status }, actorUser);
  }
}

module.exports = MedicineService;

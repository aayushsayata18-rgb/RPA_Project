const Prescription = require('../../models/Prescription');
const Medicine = require('../../models/Medicine');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Visit = require('../../models/Visit');
const Admission = require('../../models/Admission');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ExceptionService = require('../ExceptionService');
const PharmacyOrderService = require('./pharmacyOrderService');

class PrescriptionService {
  /**
   * Create prescription by Doctor
   */
  static async createPrescription({
    patientId,
    visitId = null,
    admissionId = null,
    doctorId,
    doctorName = '',
    departmentId = '',
    departmentName = '',
    items = [],
    instructions = '',
    diagnosis = '',
    validityDays = 30,
    actorUser = null
  }) {
    if (!patientId || !doctorId || !items || items.length === 0) {
      throw new Error('patientId, doctorId, and at least one item are required.');
    }

    // 1. Verify Patient exists
    const patient = await Patient.findOne({ patientId }).lean();
    if (!patient) {
      await ExceptionService.raiseException({
        module: 'PHARMACY',
        entityType: 'Prescription',
        entityId: 'NEW',
        exceptionType: 'PATIENT_NOT_FOUND',
        description: `Prescription creation failed: Patient ${patientId} not found.`,
        severity: 'HIGH',
        source: 'MANUAL',
        metadata: { patientId, doctorId }
      });
      throw new Error(`Patient '${patientId}' not found.`);
    }

    // 2. Verify Doctor exists
    const doctor = await Doctor.findOne({ doctorId }).lean();
    const resolvedDoctorName = doctorName || (doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : 'Attending Doctor');

    // 3. Verify Visit or Admission if provided
    if (visitId) {
      const visit = await Visit.findOne({ visitId }).lean();
      if (!visit) {
        throw new Error(`Visit '${visitId}' not found.`);
      }
    }

    if (admissionId) {
      const admission = await Admission.findOne({ admissionId }).lean();
      if (!admission) {
        throw new Error(`Admission '${admissionId}' not found.`);
      }
    }

    // 4. Validate items and snapshot details
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = it.quantity !== undefined ? it.quantity : it.quantityPrescribed;
      if (!it.medicineId || !qty || qty <= 0) {
        throw new Error(`Item ${i + 1}: medicineId and quantity > 0 are required.`);
      }
      it.quantity = qty;

      const medicine = await Medicine.findOne({ medicineId: it.medicineId }).lean();
      if (!medicine) {
        throw new Error(`Medicine '${it.medicineId}' not found in catalog.`);
      }

      if (['INACTIVE', 'DISCONTINUED'].includes(medicine.status)) {
        await ExceptionService.raiseException({
          module: 'PHARMACY',
          entityType: 'Prescription',
          entityId: 'NEW',
          exceptionType: 'MEDICINE_INACTIVE',
          description: `Prescription contains inactive/discontinued medicine: ${medicine.genericName} (${medicine.medicineId}).`,
          severity: 'HIGH',
          source: 'MANUAL',
          metadata: { medicineId: medicine.medicineId, status: medicine.status }
        });
        throw new Error(`Medicine '${medicine.genericName}' (${medicine.medicineId}) is ${medicine.status} and cannot be prescribed.`);
      }

      const pItemId = `RXI-${Date.now()}-${i + 1}`;

      validatedItems.push({
        prescriptionItemId: pItemId,
        medicineId: medicine.medicineId,
        medicineNameSnapshot: medicine.genericName + (medicine.brandName ? ` (${medicine.brandName})` : ''),
        strengthSnapshot: medicine.strength,
        dosageFormSnapshot: medicine.dosageForm,
        unitPriceSnapshot: medicine.unitPrice || 0,
        dose: it.dose || 'As Directed',
        route: it.route || 'ORAL',
        frequency: it.frequency || 'TWICE_DAILY',
        duration: it.duration || '5 DAYS',
        quantity: Math.max(1, parseInt(it.quantity, 10)),
        dispensedQuantity: 0,
        unit: it.unit || medicine.unit || 'Tablet',
        instructions: it.instructions || '',
        refillAllowed: Boolean(it.refillAllowed),
        status: 'PENDING'
      });
    }

    const prescriptionId = await IdGeneratorService.generatePrescriptionId();
    const prescriptionDate = new Date();
    const validUntil = new Date(prescriptionDate.getTime() + (parseInt(validityDays, 10) || 30) * 24 * 60 * 60 * 1000);

    const prescription = new Prescription({
      prescriptionId,
      patientId,
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      visitId,
      admissionId,
      doctorId,
      doctorName: resolvedDoctorName,
      departmentId: departmentId || doctor?.departmentId || '',
      departmentName: departmentName || doctor?.departmentName || '',
      diagnosis,
      prescriptionDate,
      validUntil,
      items: validatedItems,
      instructions,
      status: 'ISSUED',
      createdBy: actorUser?.userId || doctorId,
      updatedBy: actorUser?.userId || doctorId,
      correlationId: prescriptionId
    });

    await prescription.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || doctorId,
      role: actorUser?.role || 'DOCTOR',
      action: 'PRESCRIPTION_CREATED',
      module: 'PHARMACY',
      entityType: 'Prescription',
      entityId: prescriptionId,
      patientId,
      details: `Prescription ${prescriptionId} created by Dr. ${resolvedDoctorName} with ${validatedItems.length} items.`
    });

    return prescription;
  }

  /**
   * Send prescription to pharmacy (generates PharmacyOrder)
   */
  static async sendToPharmacy(prescriptionId, orderType = 'OUTPATIENT', priority = 'NORMAL', actorUser = null) {
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }

    // Check expiry
    if (new Date(prescription.validUntil) < new Date()) {
      prescription.status = 'EXPIRED';
      await prescription.save();
      throw new Error(`Prescription '${prescriptionId}' has expired on ${prescription.validUntil.toISOString().slice(0, 10)}.`);
    }

    if (['CANCELLED', 'REJECTED'].includes(prescription.status)) {
      throw new Error(`Cannot send ${prescription.status} prescription to pharmacy.`);
    }

    const order = await PharmacyOrderService.createOrderFromPrescription({
      prescriptionId,
      orderType,
      priority,
      actorUser
    });

    prescription.status = 'SENT_TO_PHARMACY';
    prescription.updatedBy = actorUser?.userId || 'SYSTEM';
    await prescription.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'DOCTOR',
      action: 'PRESCRIPTION_SENT_TO_PHARMACY',
      module: 'PHARMACY',
      entityType: 'Prescription',
      entityId: prescriptionId,
      details: `Prescription ${prescriptionId} routed to Pharmacy as Order ${order.pharmacyOrderId}.`
    });

    return { prescription, order };
  }

  /**
   * Validate prescription by Pharmacist
   */
  static async validatePrescription(prescriptionId, actorUser = null) {
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }

    // Check expiry
    if (new Date(prescription.validUntil) < new Date()) {
      prescription.status = 'EXPIRED';
      await prescription.save();

      await ExceptionService.raiseException({
        module: 'PHARMACY',
        entityType: 'Prescription',
        entityId: prescriptionId,
        exceptionType: 'PRESCRIPTION_EXPIRED',
        description: `Prescription ${prescriptionId} expired on ${prescription.validUntil.toISOString().slice(0, 10)}.`,
        severity: 'MEDIUM',
        source: 'MANUAL',
        metadata: { prescriptionId, validUntil: prescription.validUntil }
      });

      throw new Error(`Prescription ${prescriptionId} has expired and cannot be validated.`);
    }

    if (['CANCELLED', 'REJECTED'].includes(prescription.status)) {
      throw new Error(`Cannot validate ${prescription.status} prescription.`);
    }

    prescription.status = 'VALIDATED';
    prescription.items.forEach((it) => {
      if (it.status === 'PENDING') it.status = 'VALIDATED';
    });
    prescription.updatedBy = actorUser?.userId || 'SYSTEM';
    await prescription.save();

    // Also update order status if exists
    const order = await PharmacyOrderService.getOrders({ prescriptionId, limit: 1 });
    if (order.orders && order.orders.length > 0) {
      await PharmacyOrderService.receiveOrder(order.orders[0].pharmacyOrderId, actorUser);
    }

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'PRESCRIPTION_VALIDATED',
      module: 'PHARMACY',
      entityType: 'Prescription',
      entityId: prescriptionId,
      details: `Pharmacist ${actorUser?.name || actorUser?.userId || 'Staff'} validated Prescription ${prescriptionId}.`
    });

    return prescription;
  }

  /**
   * Hold prescription
   */
  static async holdPrescription(prescriptionId, reason, actorUser = null) {
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }

    prescription.status = 'ON_HOLD';
    prescription.holdReason = reason || 'Held by pharmacy for clarification';
    prescription.updatedBy = actorUser?.userId || 'SYSTEM';
    await prescription.save();

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'PHARMACIST',
      action: 'PRESCRIPTION_HELD',
      module: 'PHARMACY',
      entityType: 'Prescription',
      entityId: prescriptionId,
      details: `Prescription ${prescriptionId} placed ON_HOLD: ${reason}`
    });

    return prescription;
  }

  /**
   * Cancel prescription (Doctor or authorized staff only)
   */
  static async cancelPrescription(prescriptionId, reason, actorUser = null) {
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }

    if (['DISPENSED', 'PARTIALLY_DISPENSED'].includes(prescription.status)) {
      throw new Error(`Cannot cancel prescription ${prescriptionId}: already dispensed or partially dispensed.`);
    }

    prescription.status = 'CANCELLED';
    prescription.cancellationReason = reason || 'Cancelled by clinician';
    prescription.cancelledAt = new Date();
    prescription.cancelledBy = actorUser?.userId || 'SYSTEM';
    prescription.updatedBy = actorUser?.userId || 'SYSTEM';
    await prescription.save();

    // Also cancel any associated pending pharmacy order
    const PharmacyOrder = require('../../models/PharmacyOrder');
    await PharmacyOrder.updateMany(
      { prescriptionId, status: { $in: ['NEW', 'RECEIVED', 'VALIDATING', 'ON_HOLD', 'READY_FOR_DISPENSING'] } },
      { status: 'CANCELLED', cancellationReason: `Prescription cancelled: ${reason}` }
    );

    await AuditService.logEvent({
      userId: actorUser?.userId || 'SYSTEM',
      role: actorUser?.role || 'DOCTOR',
      action: 'PRESCRIPTION_CANCELLED',
      module: 'PHARMACY',
      entityType: 'Prescription',
      entityId: prescriptionId,
      details: `Prescription ${prescriptionId} CANCELLED: ${reason}`
    });

    return prescription;
  }

  /**
   * Search / filter prescriptions
   */
  static async getPrescriptions({ patientId, doctorId, status, search = '', page = 1, limit = 50 }) {
    const query = {};

    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { prescriptionId: regex },
        { patientId: regex },
        { patientName: regex },
        { doctorName: regex },
        { diagnosis: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [prescriptions, total] = await Promise.all([
      Prescription.find(query).sort({ prescriptionDate: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      Prescription.countDocuments(query)
    ]);

    return {
      prescriptions,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Get prescription by ID
   */
  static async getPrescriptionById(prescriptionId) {
    const prescription = await Prescription.findOne({ prescriptionId }).lean();
    if (!prescription) {
      throw new Error(`Prescription '${prescriptionId}' not found.`);
    }
    return prescription;
  }
}

module.exports = PrescriptionService;

const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');

class BedManagementService {
  /**
   * List all wards with current occupancy stats
   */
  static async listWards(filter = {}) {
    const wards = await Ward.find(filter).sort({ wardId: 1 }).lean();
    return wards;
  }

  /**
   * List all beds with optional filtering by ward, bedType, status
   */
  static async listBeds(filters = {}) {
    const query = {};
    if (filters.wardId) query.wardId = filters.wardId;
    if (filters.bedType) query.bedType = filters.bedType;
    if (filters.status) query.status = filters.status;
    if (filters.isIsolationCapable !== undefined) query.isIsolationCapable = filters.isIsolationCapable;

    const beds = await Bed.find(query).sort({ wardId: 1, bedNumber: 1 }).lean();
    return beds;
  }

  /**
   * Find suitable beds based on Clinical Requirement and Patient Preference
   * CRITICAL RULE: Clinical requirement takes precedence.
   * If preferred category is not available, DO NOT automatically downgrade to general ward.
   */
  static async findSuitableBeds({ clinicalRequirementCategory, accommodationPreference, wardId = null }) {
    // Check if clinical category is strict (e.g. ICU or EMERGENCY_BED)
    const isStrictClinical = ['ICU', 'EMERGENCY_BED'].includes(clinicalRequirementCategory);

    // Target category: clinical requirement if strict, or preference if clinical allows
    const targetCategory = isStrictClinical ? clinicalRequirementCategory : (accommodationPreference || clinicalRequirementCategory || 'GENERAL_WARD');

    const query = {
      status: 'AVAILABLE'
    };

    if (wardId) {
      query.wardId = wardId;
    }

    if (targetCategory) {
      query.bedType = targetCategory;
    }

    let availableBeds = await Bed.find(query).sort({ bedNumber: 1 }).lean();

    // Check if preferred category had 0 availability
    const preferredAvailable = availableBeds.length > 0;

    // Also fetch all available categories across hospital for complete desk visibility
    const allAvailableCategories = await Bed.aggregate([
      { $match: { status: 'AVAILABLE' } },
      { $group: { _id: '$bedType', count: { $sum: 1 } } }
    ]);

    return {
      targetCategory,
      isStrictClinical,
      preferredAvailable,
      availableBeds,
      allAvailableCategories: allAvailableCategories.map((c) => ({ category: c._id, count: c.count }))
    };
  }

  /**
   * Concurrency-safe Bed Reservation
   * Atomically transitions bed from AVAILABLE to RESERVED
   */
  static async reserveBed({ bedId, patientId, admissionRequestId, reservationDurationMinutes = 60, actorUser, correlationId }) {
    const expiresAt = new Date(Date.now() + reservationDurationMinutes * 60 * 1000);

    const updatedBed = await Bed.findOneAndUpdate(
      {
        bedId,
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            reservationExpiresAt: { $lt: new Date() } // Expired reservations can be reclaimed
          },
          {
            status: 'RESERVED',
            reservedForAdmissionRequestId: admissionRequestId // Idempotent re-reservation
          }
        ]
      },
      {
        status: 'RESERVED',
        reservedForPatientId: patientId,
        reservedForAdmissionRequestId: admissionRequestId,
        reservationExpiresAt: expiresAt,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (!updatedBed) {
      throw new Error(`Bed ${bedId} is no longer available for reservation.`);
    }

    // Update ward count
    await this.refreshWardCounts(updatedBed.wardId);

    await AuditService.logEvent({
      action: 'ADMISSION_BED_RESERVED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId, bedNumber: updatedBed.bedNumber, wardId: updatedBed.wardId, admissionRequestId, expiresAt },
      correlationId
    });

    return updatedBed;
  }

  /**
   * Release reserved bed back to AVAILABLE
   */
  static async releaseBedReservation({ bedId, admissionRequestId, actorUser, correlationId }) {
    const bed = await Bed.findOne({ bedId });
    if (!bed) return null;

    if (bed.status === 'RESERVED') {
      bed.status = 'AVAILABLE';
      bed.reservedForPatientId = null;
      bed.reservedForAdmissionRequestId = null;
      bed.reservationExpiresAt = null;
      bed.lastStatusChange = new Date();
      await bed.save();

      await this.refreshWardCounts(bed.wardId);

      await AuditService.logEvent({
        action: 'ADMISSION_BED_RELEASED',
        category: 'BED',
        actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
        actorRole: actorUser?.role || 'SYSTEM',
        details: { bedId, admissionRequestId },
        correlationId
      });
    }

    return bed;
  }

  /**
   * Assign and Occupy Bed (atomic transition to OCCUPIED)
   */
  static async occupyBed({ bedId, patientId, patientName, admissionId, admissionRequestId, actorUser, correlationId }) {
    const updatedBed = await Bed.findOneAndUpdate(
      {
        bedId,
        $or: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedForPatientId: patientId },
          { status: 'RESERVED', reservedForAdmissionRequestId: admissionRequestId },
          { status: 'OCCUPIED', currentAdmissionId: admissionId } // Idempotency
        ]
      },
      {
        status: 'OCCUPIED',
        currentPatientId: patientId,
        currentPatientName: patientName,
        currentAdmissionId: admissionId,
        reservedForPatientId: null,
        reservedForAdmissionRequestId: null,
        reservationExpiresAt: null,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (!updatedBed) {
      throw new Error(`Failed to occupy bed ${bedId}. It may already be occupied or reserved for another patient.`);
    }

    await this.refreshWardCounts(updatedBed.wardId);

    await AuditService.logEvent({
      action: 'ADMISSION_BED_ASSIGNED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId, bedNumber: updatedBed.bedNumber, wardId: updatedBed.wardId, admissionId },
      correlationId
    });

    return updatedBed;
  }

  /**
   * Release bed upon discharge / transfer
   */
  static async vacateBed({ bedId, newStatus = 'CLEANING', actorUser, correlationId }) {
    const bed = await Bed.findOneAndUpdate(
      { bedId },
      {
        status: newStatus,
        currentPatientId: null,
        currentPatientName: '',
        currentAdmissionId: null,
        reservedForPatientId: null,
        reservedForAdmissionRequestId: null,
        reservationExpiresAt: null,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (bed) {
      await this.refreshWardCounts(bed.wardId);
    }
    return bed;
  }

  /**
   * Recompute Ward statistics
   */
  static async refreshWardCounts(wardId) {
    const totalBeds = await Bed.countDocuments({ wardId });
    const availableBeds = await Bed.countDocuments({ wardId, status: 'AVAILABLE' });
    const occupiedBeds = await Bed.countDocuments({ wardId, status: 'OCCUPIED' });
    const reservedBeds = await Bed.countDocuments({ wardId, status: 'RESERVED' });

    await Ward.findOneAndUpdate(
      { wardId },
      { totalBeds, availableBeds, occupiedBeds, reservedBeds }
    );
  }
}

module.exports = BedManagementService;

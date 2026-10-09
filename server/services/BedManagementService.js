const Ward = require('../models/Ward');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const AccommodationCategory = require('../models/AccommodationCategory');
const BedAssignment = require('../models/BedAssignment');
const BedReservation = require('../models/BedReservation');
const BedStatusHistory = require('../models/BedStatusHistory');
const BedWaitingList = require('../models/BedWaitingList');
const HousekeepingTask = require('../models/HousekeepingTask');
const Admission = require('../models/Admission');
const AdmissionRequest = require('../models/AdmissionRequest');
const Patient = require('../models/Patient');
const ExceptionCase = require('../models/ExceptionCase');
const AuditService = require('./AuditService');
const ExceptionService = require('./ExceptionService');
const NotificationService = require('./NotificationService');
const IdGeneratorService = require('./IdGeneratorService');

class BedManagementService {
  // ==========================================
  // 1. ACCOMMODATION CATEGORIES & WARDS & ROOMS
  // ==========================================

  static async listCategories(filter = {}) {
    return await AccommodationCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async getCategoryById(id) {
    return await AccommodationCategory.findById(id).lean();
  }

  static async createCategory(data, actorUser) {
    const category = new AccommodationCategory(data);
    await category.save();

    await AuditService.logEvent({
      action: 'ACCOMMODATION_CATEGORY_CREATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { code: category.code, name: category.name, categoryType: category.categoryType }
    });

    return category;
  }

  static async updateCategory(id, data, actorUser) {
    const category = await AccommodationCategory.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw new Error('Accommodation Category not found');

    await AuditService.logEvent({
      action: 'ACCOMMODATION_CATEGORY_UPDATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { categoryId: id, code: category.code, updates: data }
    });

    return category;
  }

  static async listWards(filter = {}) {
    return await Ward.find(filter).sort({ wardId: 1 }).lean();
  }

  static async getWardById(id) {
    return await Ward.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { wardId: id }] }).lean();
  }

  static async createWard(data, actorUser) {
    if (!data.wardId && data.wardCode) data.wardId = data.wardCode;
    if (!data.wardName && data.name) data.wardName = data.name;
    const ward = new Ward(data);
    await ward.save();

    await AuditService.logEvent({
      action: 'WARD_CREATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { wardId: ward.wardId, wardName: ward.wardName, wardType: ward.wardType }
    });

    return ward;
  }

  static async updateWard(id, data, actorUser) {
    const ward = await Ward.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { wardId: id }] },
      data,
      { new: true }
    );
    if (!ward) throw new Error('Ward not found');

    await AuditService.logEvent({
      action: 'WARD_UPDATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { wardId: ward.wardId, updates: data }
    });

    return ward;
  }

  static async listRooms(filter = {}) {
    return await Room.find(filter).sort({ wardId: 1, roomNumber: 1 }).lean();
  }

  static async createRoom(data, actorUser) {
    const room = new Room(data);
    await room.save();

    await AuditService.logEvent({
      action: 'ROOM_CREATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { roomNumber: room.roomNumber, wardId: room.wardId }
    });

    return room;
  }

  static async updateRoom(id, data, actorUser) {
    const room = await Room.findByIdAndUpdate(id, data, { new: true });
    if (!room) throw new Error('Room not found');
    return room;
  }

  // ==========================================
  // 2. PHYSICAL BED INVENTORY & SEARCH
  // ==========================================

  static async listBeds(filters = {}) {
    const query = {};
    if (filters.wardId) query.wardId = filters.wardId;
    if (filters.roomId) query.roomId = filters.roomId;
    if (filters.bedType) query.bedType = filters.bedType;
    if (filters.status) query.status = filters.status;
    if (filters.genderPolicy && filters.genderPolicy !== 'ANY') {
      query.$or = [{ genderPolicy: 'ANY' }, { genderPolicy: filters.genderPolicy }];
    }
    if (filters.isIsolationCapable !== undefined) {
      query.isIsolationCapable = filters.isIsolationCapable === 'true' || filters.isIsolationCapable === true;
    }
    if (filters.active !== undefined) {
      query.active = filters.active === 'true' || filters.active === true;
    }

    const beds = await Bed.find(query).sort({ wardId: 1, bedNumber: 1 }).lean();
    return beds;
  }

  static async getBedById(bedId) {
    return await Bed.findOne({
      $or: [{ _id: bedId.match(/^[0-9a-fA-F]{24}$/) ? bedId : null }, { bedId }]
    }).lean();
  }

  static async createBed(data, actorUser) {
    const bed = new Bed(data);
    await bed.save();

    await this.recordStatusHistory({
      bedId: bed.bedId,
      bedRef: bed._id,
      bedNumber: bed.bedNumber,
      previousStatus: null,
      newStatus: bed.status || 'AVAILABLE',
      reason: 'Physical bed inventory creation',
      referenceType: 'OTHER',
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User'
    });

    await this.refreshWardCounts(bed.wardId);

    await AuditService.logEvent({
      action: 'BED_CREATED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId: bed.bedId, bedNumber: bed.bedNumber, wardId: bed.wardId, bedType: bed.bedType }
    });

    return bed;
  }

  static async updateBed(bedId, data, actorUser) {
    const bed = await Bed.findOneAndUpdate(
      { $or: [{ _id: bedId.match(/^[0-9a-fA-F]{24}$/) ? bedId : null }, { bedId }] },
      data,
      { new: true }
    );
    if (!bed) throw new Error('Bed not found');
    await this.refreshWardCounts(bed.wardId);
    return bed;
  }

  /**
   * Deterministic Bed Search Engine (Rules 2.1, 2.2, 3, 4, 5, 17, 21)
   * Clinical Requirement STRICTLY overrides preference.
   * If preferred category is unavailable, DO NOT silently downgrade.
   */
  static async searchBeds({
    patientId = null,
    admissionId = null,
    clinicalRequirement = {},
    accommodationPreference = {},
    gender = null,
    wardId = null
  }) {
    // 1. Expire outdated reservations first to ensure live inventory accuracy
    await this.cleanupExpiredReservations();

    const requiredCategory = clinicalRequirement?.requiredCategory || clinicalRequirement?.category;
    const isStrictClinical = Boolean(
      requiredCategory &&
      (requiredCategory === 'ICU' ||
        requiredCategory === 'HDU' ||
        requiredCategory === 'ISOLATION' ||
        requiredCategory === 'EMERGENCY_BED' ||
        clinicalRequirement?.strictClinicalRequirement === true)
    );

    const preferredCategory = accommodationPreference?.category || accommodationPreference?.categoryId || requiredCategory || 'GENERAL_WARD';

    // Target category selection: strict clinical overrides preference; otherwise preference is respected
    const targetCategory = isStrictClinical ? requiredCategory : preferredCategory;

    const query = {
      status: 'AVAILABLE',
      active: true
    };

    if (wardId) {
      query.wardId = wardId;
    }

    if (targetCategory) {
      query.bedType = targetCategory;
    }

    if (clinicalRequirement?.isolationRequired || clinicalRequirement?.isIsolationCapable) {
      query.isIsolationCapable = true;
    }

    if (clinicalRequirement?.isOxygenSupported) {
      query.isOxygenSupported = true;
    }

    if (clinicalRequirement?.isVentilatorSupported) {
      query.isVentilatorSupported = true;
    }

    if (gender && gender !== 'OTHER') {
      const gPolicy = gender.toUpperCase() === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';
      query.$or = [{ genderPolicy: 'ANY' }, { genderPolicy: gPolicy }];
    }

    const availableBeds = await Bed.find(query).sort({ bedNumber: 1 }).lean();

    // Check all categories summary for hospital visibility
    const allAvailableCategories = await Bed.aggregate([
      { $match: { status: 'AVAILABLE', active: true } },
      { $group: { _id: '$bedType', count: { $sum: 1 } } }
    ]);

    const isAvailable = availableBeds.length > 0;

    // Build alternative categories if requested category has 0 availability
    let alternatives = [];
    if (!isAvailable) {
      alternatives = allAvailableCategories
        .filter((c) => c._id !== targetCategory)
        .map((c) => ({
          category: c._id,
          availableCount: c.count
        }));
    }

    return {
      status: isAvailable ? 'SUCCESS' : 'CATEGORY_UNAVAILABLE',
      requestedCategory: targetCategory,
      isStrictClinical,
      clinicalRequirementSatisfied: isAvailable,
      availableCount: availableBeds.length,
      beds: availableBeds,
      alternatives,
      requiresStaffAction: !isAvailable,
      allAvailableCategories: allAvailableCategories.map((c) => ({ category: c._id, count: c.count }))
    };
  }

  // Alias for backward compatibility
  static async findSuitableBeds(params) {
    const searchRes = await this.searchBeds({
      clinicalRequirement: { requiredCategory: params.clinicalRequirementCategory },
      accommodationPreference: { category: params.accommodationPreference },
      wardId: params.wardId
    });
    return {
      targetCategory: searchRes.requestedCategory,
      isStrictClinical: searchRes.isStrictClinical,
      preferredAvailable: searchRes.availableCount > 0,
      availableBeds: searchRes.beds,
      allAvailableCategories: searchRes.allAvailableCategories
    };
  }

  // ==========================================
  // 3. CONCURRENCY-SAFE BED RESERVATION (Rule 7, 14, 15, 25, 26)
  // ==========================================

  static async reserveBed({
    bedId,
    patientId,
    patientName = '',
    admissionId = null,
    admissionRequestId = null,
    reservationReason = 'INITIAL_ADMISSION',
    reservationDurationMinutes = 60,
    actorUser,
    correlationId = null
  }) {
    if (!bedId) throw new Error('Bed ID is required for reservation.');
    if (!patientId) throw new Error('Patient ID is required for reservation.');

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const expiresAt = new Date(Date.now() + reservationDurationMinutes * 60 * 1000);
    const reservationId = await IdGeneratorService.generateReservationId();

    const orConditions = [
      { status: 'AVAILABLE' },
      { status: 'RESERVED', reservationExpiresAt: { $lt: new Date() } }
    ];
    if (admissionRequestId) {
      orConditions.push({ status: 'RESERVED', reservedForAdmissionRequestId: admissionRequestId });
    }
    if (patientId) {
      orConditions.push({ status: 'RESERVED', reservedForPatientId: patientId });
    }

    // Atomic find-and-update to prevent double booking race conditions
    const updatedBed = await Bed.findOneAndUpdate(
      {
        bedId,
        $or: orConditions
      },
      {
        status: 'RESERVED',
        reservationId,
        reservedForPatientId: patientId,
        reservedForAdmissionRequestId: admissionRequestId,
        currentPatientName: patientName,
        reservationExpiresAt: expiresAt,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (!updatedBed) {
      throw new Error(`Bed ${bedId} is no longer available. Another user or process may have reserved it.`);
    }

    // Create BedReservation record
    const reservation = new BedReservation({
      reservationId,
      bedId: updatedBed.bedId,
      bedRef: updatedBed._id,
      bedNumber: updatedBed.bedNumber,
      patientId,
      patientName: patientName || updatedBed.currentPatientName,
      admissionId,
      admissionRequestId,
      reservationReason,
      reservedAt: new Date(),
      expiresAt,
      status: 'ACTIVE',
      createdByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      correlationId: corrId
    });
    await reservation.save();

    await this.recordStatusHistory({
      bedId: updatedBed.bedId,
      bedRef: updatedBed._id,
      bedNumber: updatedBed.bedNumber,
      previousStatus: 'AVAILABLE',
      newStatus: 'RESERVED',
      reason: `Bed reserved for patient ${patientId} (Expires: ${expiresAt.toLocaleTimeString()})`,
      referenceType: admissionRequestId ? 'ADMISSION_REQUEST' : 'ADMISSION',
      referenceId: admissionRequestId || admissionId,
      patientId,
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User',
      correlationId: corrId
    });

    await this.refreshWardCounts(updatedBed.wardId);

    await AuditService.logEvent({
      action: 'BED_RESERVED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId, bedNumber: updatedBed.bedNumber, wardId: updatedBed.wardId, reservationId, expiresAt },
      correlationId: corrId
    });

    return { bed: updatedBed, reservation };
  }

  static async cancelReservation({ reservationId, bedId, cancellationReason = 'Cancelled by staff', actorUser, correlationId }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const query = reservationId ? { reservationId } : { bedId, status: 'ACTIVE' };
    const reservation = await BedReservation.findOne(query);

    if (reservation) {
      reservation.status = 'CANCELLED';
      reservation.cancelledByUserId = actorUser?.id || actorUser?.userId || 'SYSTEM';
      reservation.cancellationReason = cancellationReason;
      await reservation.save();
    }

    const targetBedId = reservation?.bedId || bedId;
    const bed = await Bed.findOne({ bedId: targetBedId });
    if (bed && bed.status === 'RESERVED') {
      const prevStatus = bed.status;
      bed.status = 'AVAILABLE';
      bed.reservationId = null;
      bed.reservedForPatientId = null;
      bed.reservedForAdmissionRequestId = null;
      bed.reservationExpiresAt = null;
      bed.lastStatusChange = new Date();
      await bed.save();

      await this.recordStatusHistory({
        bedId: bed.bedId,
        bedRef: bed._id,
        bedNumber: bed.bedNumber,
        previousStatus: prevStatus,
        newStatus: 'AVAILABLE',
        reason: cancellationReason,
        referenceType: 'OTHER',
        referenceId: reservation?.reservationId,
        changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
        changedByUserName: actorUser?.name || 'System User',
        correlationId: corrId
      });

      await this.refreshWardCounts(bed.wardId);
    }

    return { success: true, bed };
  }

  // Alias for backward compatibility
  static async releaseBedReservation({ bedId, admissionRequestId, actorUser, correlationId }) {
    const res = await this.cancelReservation({
      bedId,
      cancellationReason: `Reservation released for request ${admissionRequestId}`,
      actorUser,
      correlationId
    });
    return res.bed;
  }

  // ==========================================
  // 4. CONCURRENCY-SAFE BED ASSIGNMENT (Rule 1, 6, 7, 27, 84, 85)
  // ==========================================

  static async assignBed({
    bedId,
    patientId,
    patientName = '',
    admissionId,
    admissionRequestId = null,
    visitId = null,
    assignmentType = 'INITIAL_ADMISSION',
    idempotencyKey = null,
    actorUser,
    correlationId = null
  }) {
    if (!bedId) throw new Error('Bed ID is required for assignment.');
    if (!patientId) throw new Error('Patient ID is required for assignment.');
    if (!admissionId) throw new Error('Admission ID is required for assignment.');

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    // Idempotency check: if assignment already created for this key, return it
    if (idempotencyKey) {
      const existingAssignment = await BedAssignment.findOne({ idempotencyKey, status: 'ACTIVE' });
      if (existingAssignment) {
        const existingBed = await Bed.findOne({ bedId: existingAssignment.bedId });
        return { bed: existingBed, assignment: existingAssignment, isIdempotentReplay: true };
      }
    }

    // Rule 7: Prevent duplicate active assignment for the same patient
    const existingActiveAssignment = await BedAssignment.findOne({
      patientId,
      status: 'ACTIVE',
      admissionId: { $ne: admissionId }
    });
    if (existingActiveAssignment && assignmentType !== 'TRANSFER') {
      throw new Error(`Patient ${patientId} is already assigned to active Bed ${existingActiveAssignment.bedNumber} in another episode.`);
    }

    const assignmentId = await IdGeneratorService.generateAssignmentId();

    const orConditions = [
      { status: 'AVAILABLE' },
      { status: 'RESERVED', reservationExpiresAt: { $lt: new Date() } }
    ];
    if (patientId) {
      orConditions.push({ status: 'RESERVED', reservedForPatientId: patientId });
    }
    if (admissionRequestId) {
      orConditions.push({ status: 'RESERVED', reservedForAdmissionRequestId: admissionRequestId });
    }
    if (admissionId) {
      orConditions.push({ status: 'OCCUPIED', currentAdmissionId: admissionId });
    }

    // Concurrency-safe atomic bed occupation
    const updatedBed = await Bed.findOneAndUpdate(
      {
        bedId,
        $or: orConditions
      },
      {
        status: 'OCCUPIED',
        currentAssignmentId: assignmentId,
        currentPatientId: patientId,
        currentPatientName: patientName,
        currentAdmissionId: admissionId,
        reservationId: null,
        reservedForPatientId: null,
        reservedForAdmissionRequestId: null,
        reservationExpiresAt: null,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (!updatedBed) {
      throw new Error(`Bed ${bedId} is no longer available for assignment. It may have been occupied by another patient.`);
    }

    // Close any previous active reservation for this bed
    await BedReservation.updateMany(
      { bedId, status: 'ACTIVE' },
      { status: 'CONVERTED' }
    );

    // Create BedAssignment record
    const assignment = new BedAssignment({
      assignmentId,
      bedId: updatedBed.bedId,
      bedRef: updatedBed._id,
      bedNumber: updatedBed.bedNumber,
      wardId: updatedBed.wardId,
      roomId: updatedBed.roomId,
      accommodationCategoryCode: updatedBed.bedType,
      patientId,
      patientName: patientName || updatedBed.currentPatientName,
      admissionId,
      visitId,
      assignedAt: new Date(),
      assignmentType,
      status: 'ACTIVE',
      assignedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      assignedByUserName: actorUser?.name || 'System User',
      source: 'MERN_PORTAL',
      idempotencyKey,
      correlationId: corrId
    });
    await assignment.save();

    // Link assignment reference on bed
    updatedBed.currentAssignmentRef = assignment._id;
    await updatedBed.save();

    // Update Admission episode with physical bed assignment info
    await Admission.findOneAndUpdate(
      { admissionId },
      {
        assignedBedId: updatedBed.bedId,
        assignedBedNumber: updatedBed.bedNumber,
        assignedWardId: updatedBed.wardId,
        assignedWardName: updatedBed.wardName,
        status: 'ADMITTED'
      }
    );

    await this.recordStatusHistory({
      bedId: updatedBed.bedId,
      bedRef: updatedBed._id,
      bedNumber: updatedBed.bedNumber,
      previousStatus: 'AVAILABLE',
      newStatus: 'OCCUPIED',
      reason: `Patient ${patientId} physically assigned (Admission: ${admissionId})`,
      referenceType: 'ADMISSION',
      referenceId: admissionId,
      patientId,
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User',
      correlationId: corrId
    });

    await this.refreshWardCounts(updatedBed.wardId);

    // Centralized Notification
    await NotificationService.sendNotification({
      event: 'BED_ASSIGNED',
      recipientUserId: actorUser?.id,
      patientId,
      title: 'Bed Assigned',
      message: `Bed ${updatedBed.bedNumber} in ${updatedBed.wardName} assigned to patient ${patientName || patientId}.`,
      data: { bedId: updatedBed.bedId, bedNumber: updatedBed.bedNumber, wardId: updatedBed.wardId, admissionId }
    });

    await AuditService.logEvent({
      action: 'BED_ASSIGNMENT_CREATED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId: updatedBed.bedId, bedNumber: updatedBed.bedNumber, wardId: updatedBed.wardId, admissionId, assignmentId },
      correlationId: corrId
    });

    return { bed: updatedBed, assignment };
  }

  // Alias for backward compatibility
  static async occupyBed(params) {
    const res = await this.assignBed(params);
    return res.bed;
  }

  // ==========================================
  // 5. SAFE BED TRANSFER (Rule 28, 29, 30, 97)
  // Rule 29: NEVER release old bed before successfully securing new bed.
  // ==========================================

  static async transferPatientBed({
    patientId,
    admissionId,
    fromBedId,
    toBedId,
    transferReason = 'Clinical / Accommodation transfer',
    actorUser,
    correlationId = null
  }) {
    if (!patientId) throw new Error('Patient ID is required for bed transfer.');
    if (!fromBedId) throw new Error('Current Bed ID (fromBedId) is required.');
    if (!toBedId) throw new Error('Destination Bed ID (toBedId) is required.');
    if (fromBedId === toBedId) throw new Error('Source and destination beds cannot be identical.');

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const currentBed = await Bed.findOne({ bedId: fromBedId });
    if (!currentBed) throw new Error(`Current bed ${fromBedId} not found.`);

    const destinationBed = await Bed.findOne({ bedId: toBedId });
    if (!destinationBed) throw new Error(`Destination bed ${toBedId} not found.`);

    if (destinationBed.status !== 'AVAILABLE') {
      throw new Error(`Destination bed ${toBedId} is not available (Current status: ${destinationBed.status}). Transfer aborted.`);
    }

    // Step 1: Secure destination bed FIRST
    const newAssignmentId = await IdGeneratorService.generateAssignmentId();
    const securedNewBed = await Bed.findOneAndUpdate(
      { bedId: toBedId, status: 'AVAILABLE' },
      {
        status: 'OCCUPIED',
        currentAssignmentId: newAssignmentId,
        currentPatientId: patientId,
        currentPatientName: currentBed.currentPatientName,
        currentAdmissionId: admissionId,
        reservationId: null,
        reservedForPatientId: null,
        lastStatusChange: new Date()
      },
      { new: true }
    );

    if (!securedNewBed) {
      await ExceptionService.createException({
        exceptionType: 'BED_TRANSFER_FAILED',
        module: 'BED_MANAGEMENT',
        severity: 'HIGH',
        referenceType: 'BED',
        referenceId: toBedId,
        description: `Transfer for patient ${patientId} from ${fromBedId} to ${toBedId} failed because destination was locked.`,
        correlationId: corrId
      });
      throw new Error(`Failed to secure destination bed ${toBedId}. Source bed ${fromBedId} remains occupied.`);
    }

    // Step 2: Destination secured! Now close active assignment for old bed
    const activeOldAssignment = await BedAssignment.findOne({ bedId: fromBedId, patientId, status: 'ACTIVE' });
    if (activeOldAssignment) {
      activeOldAssignment.status = 'TRANSFERRED';
      activeOldAssignment.releasedAt = new Date();
      activeOldAssignment.releasedByUserId = actorUser?.id || actorUser?.userId || 'SYSTEM';
      activeOldAssignment.releaseReason = `Transferred to ${toBedId}: ${transferReason}`;
      await activeOldAssignment.save();
    }

    // Step 3: Vacate old bed and set to CLEANING_REQUIRED (Rule 8, 28)
    currentBed.status = 'CLEANING_REQUIRED';
    currentBed.cleaningRequired = true;
    currentBed.currentAssignmentId = null;
    currentBed.currentPatientId = null;
    currentBed.currentPatientName = '';
    currentBed.currentAdmissionId = null;
    currentBed.lastStatusChange = new Date();
    await currentBed.save();

    await this.recordStatusHistory({
      bedId: currentBed.bedId,
      bedRef: currentBed._id,
      bedNumber: currentBed.bedNumber,
      previousStatus: 'OCCUPIED',
      newStatus: 'CLEANING_REQUIRED',
      reason: `Patient transferred to ${toBedId}. Bed requires sanitization.`,
      referenceType: 'TRANSFER',
      referenceId: admissionId,
      patientId,
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User',
      correlationId: corrId
    });

    // Step 4: Automatically spawn Housekeeping cleaning task (Rule 31, 32)
    const housekeepingTaskId = await IdGeneratorService.generateHousekeepingTaskId();
    const hkTask = new HousekeepingTask({
      taskId: housekeepingTaskId,
      taskType: 'BED_CLEANING',
      bedId: currentBed.bedId,
      bedRef: currentBed._id,
      bedNumber: currentBed.bedNumber,
      roomId: currentBed.roomId,
      roomNumber: currentBed.roomNumber,
      wardId: currentBed.wardId,
      wardName: currentBed.wardName,
      trigger: 'TRANSFER',
      status: 'PENDING',
      priority: 'URGENT',
      requestedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      notes: `Turnover cleaning after patient transfer to ${toBedId}`,
      correlationId: corrId
    });
    await hkTask.save();

    // Step 5: Record new BedAssignment
    const newAssignment = new BedAssignment({
      assignmentId: newAssignmentId,
      bedId: securedNewBed.bedId,
      bedRef: securedNewBed._id,
      bedNumber: securedNewBed.bedNumber,
      wardId: securedNewBed.wardId,
      roomId: securedNewBed.roomId,
      accommodationCategoryCode: securedNewBed.bedType,
      patientId,
      patientName: currentBed.currentPatientName,
      admissionId,
      assignedAt: new Date(),
      assignmentType: 'TRANSFER',
      status: 'ACTIVE',
      previousBedId: fromBedId,
      assignedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      assignedByUserName: actorUser?.name || 'System User',
      source: 'MERN_PORTAL',
      correlationId: corrId,
      notes: transferReason
    });
    await newAssignment.save();

    // Step 6: Update Admission with new physical bed
    await Admission.findOneAndUpdate(
      { admissionId },
      {
        assignedBedId: securedNewBed.bedId,
        assignedBedNumber: securedNewBed.bedNumber,
        assignedWardId: securedNewBed.wardId,
        assignedWardName: securedNewBed.wardName
      }
    );

    await this.recordStatusHistory({
      bedId: securedNewBed.bedId,
      bedRef: securedNewBed._id,
      bedNumber: securedNewBed.bedNumber,
      previousStatus: 'AVAILABLE',
      newStatus: 'OCCUPIED',
      reason: `Patient transferred from ${fromBedId}: ${transferReason}`,
      referenceType: 'TRANSFER',
      referenceId: admissionId,
      patientId,
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User',
      correlationId: corrId
    });

    // Refresh occupancy statistics for both wards
    await this.refreshWardCounts(currentBed.wardId);
    if (currentBed.wardId !== securedNewBed.wardId) {
      await this.refreshWardCounts(securedNewBed.wardId);
    }

    // Notifications
    await NotificationService.sendNotification({
      event: 'BED_TRANSFERRED',
      recipientUserId: actorUser?.id,
      patientId,
      title: 'Bed Transfer Completed',
      message: `Patient ${patientId} successfully transferred from Bed ${currentBed.bedNumber} to Bed ${securedNewBed.bedNumber}.`,
      data: { fromBedId, toBedId, admissionId }
    });

    await AuditService.logEvent({
      action: 'BED_TRANSFER_COMPLETED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { fromBedId, toBedId, admissionId, newAssignmentId, housekeepingTaskId },
      correlationId: corrId
    });

    return {
      success: true,
      previousBed: currentBed,
      newBed: securedNewBed,
      newAssignment,
      housekeepingTaskId
    };
  }

  // ==========================================
  // 6. DISCHARGE & RELEASE (Rule 8, 31, 32, 56, 89)
  // ==========================================

  static async releaseBedOnDischarge({ bedId, admissionId, releaseReason = 'Patient Discharged', actorUser, correlationId = null }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const bed = await Bed.findOne({ bedId });
    if (!bed) throw new Error(`Bed ${bedId} not found.`);

    const prevStatus = bed.status;

    // Close any active assignment
    const activeAssignment = await BedAssignment.findOne({
      bedId,
      ...(admissionId ? { admissionId } : {}),
      status: 'ACTIVE'
    });

    if (activeAssignment) {
      activeAssignment.status = 'RELEASED';
      activeAssignment.releasedAt = new Date();
      activeAssignment.releasedByUserId = actorUser?.id || actorUser?.userId || 'SYSTEM';
      activeAssignment.releaseReason = releaseReason;
      await activeAssignment.save();
    }

    // Rule 8: Transition bed to CLEANING_REQUIRED, never directly to AVAILABLE
    bed.status = 'CLEANING_REQUIRED';
    bed.cleaningRequired = true;
    bed.currentAssignmentId = null;
    bed.currentPatientId = null;
    bed.currentPatientName = '';
    bed.currentAdmissionId = null;
    bed.reservationId = null;
    bed.reservedForPatientId = null;
    bed.lastStatusChange = new Date();
    await bed.save();

    await this.recordStatusHistory({
      bedId: bed.bedId,
      bedRef: bed._id,
      bedNumber: bed.bedNumber,
      previousStatus: prevStatus,
      newStatus: 'CLEANING_REQUIRED',
      reason: releaseReason,
      referenceType: 'DISCHARGE',
      referenceId: admissionId,
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'System User',
      correlationId: corrId
    });

    // Create Housekeeping task
    const housekeepingTaskId = await IdGeneratorService.generateHousekeepingTaskId();
    const hkTask = new HousekeepingTask({
      taskId: housekeepingTaskId,
      taskType: 'BED_CLEANING',
      bedId: bed.bedId,
      bedRef: bed._id,
      bedNumber: bed.bedNumber,
      roomId: bed.roomId,
      roomNumber: bed.roomNumber,
      wardId: bed.wardId,
      wardName: bed.wardName,
      trigger: 'DISCHARGE',
      status: 'PENDING',
      priority: 'ROUTINE',
      requestedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      notes: `Sanitization turnover required after discharge (Admission: ${admissionId || 'N/A'})`,
      correlationId: corrId
    });
    await hkTask.save();

    await this.refreshWardCounts(bed.wardId);

    await AuditService.logEvent({
      action: 'BED_ASSIGNMENT_RELEASED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId: bed.bedId, admissionId, releaseReason, housekeepingTaskId },
      correlationId: corrId
    });

    return {
      status: 'CLEANING_REQUIRED',
      housekeepingTaskCreated: true,
      housekeepingTaskId,
      bed
    };
  }

  // Alias for backward compatibility
  static async vacateBed({ bedId, newStatus = 'CLEANING_REQUIRED', actorUser, correlationId }) {
    return await this.releaseBedOnDischarge({ bedId, releaseReason: 'Bed vacated', actorUser, correlationId });
  }

  // ==========================================
  // 7. HOUSEKEEPING & MAINTENANCE WORKFLOWS (Rule 8, 9, 32, 33, 34, 35)
  // ==========================================

  static async completeHousekeepingCleaning({ taskId, bedId, actorUser, correlationId = null }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();

    const taskQuery = taskId ? { taskId } : { bedId, status: { $in: ['PENDING', 'IN_PROGRESS'] } };
    const task = await HousekeepingTask.findOne(taskQuery);

    if (task) {
      task.status = 'COMPLETED';
      task.completedAt = new Date();
      task.checklistCompleted = true;
      if (task.startedAt) {
        task.durationMinutes = Math.round((task.completedAt - task.startedAt) / (1000 * 60));
      }
      await task.save();
    }

    const targetBedId = task?.bedId || bedId;
    const bed = await Bed.findOne({ bedId: targetBedId });
    if (!bed) throw new Error(`Bed ${targetBedId} not found.`);

    if (bed.status === 'CLEANING_REQUIRED' || bed.status === 'CLEANING') {
      const prevStatus = bed.status;
      bed.status = 'AVAILABLE';
      bed.cleaningRequired = false;
      bed.lastStatusChange = new Date();
      await bed.save();

      await this.recordStatusHistory({
        bedId: bed.bedId,
        bedRef: bed._id,
        bedNumber: bed.bedNumber,
        previousStatus: prevStatus,
        newStatus: 'AVAILABLE',
        reason: 'Housekeeping cleaning certified complete.',
        referenceType: 'HOUSEKEEPING',
        referenceId: task?.taskId,
        changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
        changedByUserName: actorUser?.name || 'Housekeeping Staff',
        correlationId: corrId
      });

      await this.refreshWardCounts(bed.wardId);

      await AuditService.logEvent({
        action: 'BED_CLEANING_COMPLETED',
        category: 'BED',
        actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
        actorRole: actorUser?.role || 'SYSTEM',
        details: { bedId: bed.bedId, taskId: task?.taskId },
        correlationId: corrId
      });
    }

    return { success: true, bed, task };
  }

  /**
   * Controlled Bed State Machine (Section 10, 11, 12, 58)
   */
  static async updateBedStatus({ bedId, newStatus, reason = '', actorUser, correlationId = null }) {
    const validStatuses = [
      'AVAILABLE',
      'RESERVED',
      'OCCUPIED',
      'CLEANING_REQUIRED',
      'CLEANING',
      'MAINTENANCE',
      'OUT_OF_SERVICE',
      'BLOCKED'
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid bed status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
    }

    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const bed = await Bed.findOne({ bedId });
    if (!bed) throw new Error(`Bed ${bedId} not found.`);

    const currentStatus = bed.status;

    // Rule 12 & 34: Reject invalid state transitions
    if (currentStatus === 'OCCUPIED' && newStatus === 'MAINTENANCE') {
      throw new Error('Cannot put an OCCUPIED bed directly into MAINTENANCE. Patient must be transferred or discharged first.');
    }
    if (currentStatus === 'OCCUPIED' && newStatus === 'AVAILABLE') {
      throw new Error('Cannot transition an OCCUPIED bed directly to AVAILABLE without cleaning.');
    }
    if (currentStatus === 'MAINTENANCE' && newStatus === 'OCCUPIED') {
      throw new Error('Cannot directly occupy a bed under MAINTENANCE. It must first be restored to AVAILABLE.');
    }

    bed.status = newStatus;
    bed.lastStatusChange = new Date();

    if (newStatus === 'MAINTENANCE') {
      bed.maintenanceStatus = 'IN_PROGRESS';
      bed.maintenanceReason = reason;
    } else if (newStatus === 'AVAILABLE' && currentStatus === 'MAINTENANCE') {
      bed.maintenanceStatus = 'COMPLETED';
      bed.maintenanceReason = '';
    }

    if (newStatus === 'BLOCKED') {
      bed.blockReason = reason;
    } else if (newStatus === 'AVAILABLE' && currentStatus === 'BLOCKED') {
      bed.blockReason = '';
    }

    if (newStatus === 'CLEANING_REQUIRED' || newStatus === 'CLEANING') {
      bed.cleaningRequired = true;
    } else if (newStatus === 'AVAILABLE') {
      bed.cleaningRequired = false;
    }

    await bed.save();

    await this.recordStatusHistory({
      bedId: bed.bedId,
      bedRef: bed._id,
      bedNumber: bed.bedNumber,
      previousStatus: currentStatus,
      newStatus,
      reason,
      referenceType: newStatus === 'MAINTENANCE' ? 'MAINTENANCE' : newStatus === 'BLOCKED' ? 'ADMIN_BLOCK' : 'OTHER',
      changedByUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      changedByUserName: actorUser?.name || 'Staff User',
      correlationId: corrId
    });

    await this.refreshWardCounts(bed.wardId);

    await AuditService.logEvent({
      action: 'BED_STATUS_CHANGED',
      category: 'BED',
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { bedId: bed.bedId, previousStatus: currentStatus, newStatus, reason },
      correlationId: corrId
    });

    return bed;
  }

  // ==========================================
  // 8. DASHBOARD & AVAILABILITY METRICS (Section 36, 37, 38, 59, 92, 93)
  // ==========================================

  static async getAvailabilityDashboard() {
    await this.cleanupExpiredReservations();

    const [totalBeds, availableBeds, reservedBeds, occupiedBeds, cleaningBeds, maintenanceBeds, blockedBeds, outOfServiceBeds] =
      await Promise.all([
        Bed.countDocuments({ active: true }),
        Bed.countDocuments({ active: true, status: 'AVAILABLE' }),
        Bed.countDocuments({ active: true, status: 'RESERVED' }),
        Bed.countDocuments({ active: true, status: 'OCCUPIED' }),
        Bed.countDocuments({ active: true, status: { $in: ['CLEANING_REQUIRED', 'CLEANING'] } }),
        Bed.countDocuments({ active: true, status: 'MAINTENANCE' }),
        Bed.countDocuments({ active: true, status: 'BLOCKED' }),
        Bed.countDocuments({ active: true, status: 'OUT_OF_SERVICE' })
      ]);

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const availableRate = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    // Breakdown by Category
    const categoryBreakdown = await Bed.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$bedType',
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'OCCUPIED'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'RESERVED'] }, 1, 0] } },
          cleaning: { $sum: { $cond: [{ $in: ['$status', ['CLEANING_REQUIRED', 'CLEANING']] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', 'MAINTENANCE'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Breakdown by Ward
    const wardBreakdown = await Ward.find({ active: true }).sort({ wardId: 1 }).lean();

    return {
      summary: {
        total: totalBeds,
        available: availableBeds,
        reserved: reservedBeds,
        occupied: occupiedBeds,
        cleaningRequired: cleaningBeds,
        maintenance: maintenanceBeds,
        blocked: blockedBeds,
        outOfService: outOfServiceBeds,
        occupancyRate,
        availableRate
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        total: c.total,
        available: c.available,
        occupied: c.occupied,
        reserved: c.reserved,
        cleaning: c.cleaning,
        maintenance: c.maintenance
      })),
      wardBreakdown
    };
  }

  // ==========================================
  // 9. WAITING LIST MANAGEMENT (Section 44, 45)
  // ==========================================

  static async addToWaitingList({ patientId, admissionId = null, admissionRequestId = null, requestedCategoryCode, clinicalRequirementReference = '', priorityReference = 'NORMAL', actorUser, correlationId = null }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const waitingListId = await IdGeneratorService.generateWaitingListId();

    const patient = await Patient.findOne({ patientId });

    const waitingItem = new BedWaitingList({
      waitingListId,
      patientId,
      patientRef: patient?._id,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      admissionId,
      admissionRequestId,
      requestedCategoryCode,
      clinicalRequirementReference,
      priorityReference,
      status: 'WAITING',
      correlationId: corrId
    });
    await waitingItem.save();

    await AuditService.logEvent({
      action: 'BED_WAITING_LIST_ADDED',
      category: 'BED',
      patientId,
      actorUserId: actorUser?.id || actorUser?.userId || 'SYSTEM',
      actorRole: actorUser?.role || 'SYSTEM',
      details: { waitingListId, requestedCategoryCode, priorityReference },
      correlationId: corrId
    });

    return waitingItem;
  }

  static async listWaitingList(filter = {}) {
    return await BedWaitingList.find(filter).sort({ createdAt: 1 }).lean();
  }

  // ==========================================
  // 10. RECONCILIATION & AUDIT HISTORY HELPERS
  // ==========================================

  static async recordStatusHistory(data) {
    try {
      const history = new BedStatusHistory(data);
      await history.save();
    } catch (err) {
      console.error('[BedStatusHistory Error]:', err.message);
    }
  }

  static async getBedHistory(bedId) {
    const [statusHistory, assignments, reservations] = await Promise.all([
      BedStatusHistory.find({ bedId }).sort({ timestamp: -1 }).lean(),
      BedAssignment.find({ bedId }).sort({ assignedAt: -1 }).lean(),
      BedReservation.find({ bedId }).sort({ reservedAt: -1 }).lean()
    ]);

    return {
      bedId,
      statusHistory,
      assignments,
      reservations
    };
  }

  static async reconcileWithExternalSystem({ legacyInventory = [], actorUser, correlationId = null }) {
    const corrId = correlationId || IdGeneratorService.generateCorrelationId();
    const mismatches = [];

    for (const item of legacyInventory) {
      const mernBed = await Bed.findOne({ bedId: item.bedId });
      if (!mernBed) {
        mismatches.push({
          bedId: item.bedId,
          type: 'BED_NOT_FOUND_IN_MERN',
          legacyStatus: item.status,
          mernStatus: null
        });
        continue;
      }

      if (mernBed.status !== item.status) {
        mismatches.push({
          bedId: item.bedId,
          type: 'STATUS_MISMATCH',
          legacyStatus: item.status,
          mernStatus: mernBed.status,
          bedNumber: mernBed.bedNumber,
          wardId: mernBed.wardId
        });

        // Rule 71: Create ExceptionCase without blindly overwriting MERN authoritative state
        await ExceptionService.createException({
          exceptionType: 'BED_STATE_MISMATCH',
          module: 'BED_MANAGEMENT',
          severity: 'HIGH',
          referenceType: 'BED',
          referenceId: mernBed.bedId,
          description: `Discrepancy detected during RPA sync: MERN Bed ${mernBed.bedId} is '${mernBed.status}', but legacy external system reports '${item.status}'.`,
          correlationId: corrId
        });
      }
    }

    return {
      totalCompared: legacyInventory.length,
      mismatchCount: mismatches.length,
      mismatches
    };
  }

  static async cleanupExpiredReservations() {
    const now = new Date();
    const expiredReservations = await BedReservation.find({
      status: 'ACTIVE',
      expiresAt: { $lt: now }
    });

    for (const res of expiredReservations) {
      res.status = 'EXPIRED';
      await res.save();

      const bed = await Bed.findOne({ bedId: res.bedId, status: 'RESERVED' });
      if (bed) {
        bed.status = 'AVAILABLE';
        bed.reservationId = null;
        bed.reservedForPatientId = null;
        bed.reservedForAdmissionRequestId = null;
        bed.reservationExpiresAt = null;
        bed.lastStatusChange = new Date();
        await bed.save();

        await this.recordStatusHistory({
          bedId: bed.bedId,
          bedRef: bed._id,
          bedNumber: bed.bedNumber,
          previousStatus: 'RESERVED',
          newStatus: 'AVAILABLE',
          reason: 'Reservation time window expired automatically',
          referenceType: 'OTHER',
          referenceId: res.reservationId
        });

        await this.refreshWardCounts(bed.wardId);
      }
    }
  }

  static async refreshWardCounts(wardId) {
    if (!wardId) return;
    const totalBeds = await Bed.countDocuments({ wardId, active: true });
    const availableBeds = await Bed.countDocuments({ wardId, status: 'AVAILABLE', active: true });
    const occupiedBeds = await Bed.countDocuments({ wardId, status: 'OCCUPIED', active: true });
    const reservedBeds = await Bed.countDocuments({ wardId, status: 'RESERVED', active: true });
    const cleaningBeds = await Bed.countDocuments({ wardId, status: { $in: ['CLEANING_REQUIRED', 'CLEANING'] }, active: true });
    const maintenanceBeds = await Bed.countDocuments({ wardId, status: 'MAINTENANCE', active: true });
    const blockedBeds = await Bed.countDocuments({ wardId, status: 'BLOCKED', active: true });

    await Ward.findOneAndUpdate(
      { wardId },
      {
        totalBeds,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        cleaningBeds,
        maintenanceBeds,
        blockedBeds
      }
    );
  }
}

module.exports = BedManagementService;

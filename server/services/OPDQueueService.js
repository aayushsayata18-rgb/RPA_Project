const OPDQueue = require('../models/OPDQueue');
const OPDToken = require('../models/OPDToken');
const CheckIn = require('../models/CheckIn');
const OPDTokenHistory = require('../models/OPDTokenHistory');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');
const ConfigService = require('./ConfigService');
const IdGeneratorService = require('./IdGeneratorService');
const OPDQueueOrderingService = require('./OPDQueueOrderingService');

class OPDQueueService {
  /**
   * Helper to derive department prefix from departmentId/name
   */
  static getDepartmentPrefix(departmentId, departmentName = '') {
    if (!departmentId) return 'GM';
    const clean = departmentId.toUpperCase();
    if (clean.includes('CARD')) return 'CARD';
    if (clean.includes('DERM')) return 'DERM';
    if (clean.includes('ORTH')) return 'ORTHO';
    if (clean.includes('PED')) return 'PED';
    if (clean.includes('NEUR')) return 'NEURO';
    if (clean.includes('ENT')) return 'ENT';
    if (clean.includes('OPHTH')) return 'EYE';
    if (clean.includes('GEN') || clean.includes('MED')) return 'GM';

    const letters = clean.replace(/[^A-Z]/g, '');
    return letters.length >= 2 ? letters.substring(0, 4) : 'OPD';
  }

  /**
   * Get or automatically initialize today's OPD Queue
   */
  static async getOrCreateTodayQueue({ departmentId, departmentName, doctorId, doctorName, queueType, roomNumber }) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const prefix = OPDQueueService.getDepartmentPrefix(departmentId, departmentName);
    const queueId = IdGeneratorService.generateQueueId(prefix, todayStr);

    let queue = await OPDQueue.findOne({ queueId });
    if (!queue) {
      queue = await OPDQueue.create({
        queueId,
        hospitalId: 'HOSP-001',
        queueDate: new Date(),
        queueDateStr: todayStr,
        departmentId: departmentId || 'GENERAL_MEDICINE',
        departmentName: departmentName || 'General Medicine',
        doctorId: doctorId || null,
        doctorName: doctorName || null,
        roomNumber: roomNumber || 'OPD-101',
        queueType: queueType || 'DEPARTMENT_SPECIFIC',
        status: 'OPEN',
        openedAt: new Date(),
        openedBy: 'SYSTEM'
      });
    }

    return queue;
  }

  /**
   * List all queues with live metrics
   */
  static async getQueues(filter = {}) {
    const todayStr = filter.date || new Date().toISOString().slice(0, 10);
    const query = { queueDateStr: todayStr };

    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.doctorId) query.doctorId = filter.doctorId;
    if (filter.status) query.status = filter.status;

    const queues = await OPDQueue.find(query).sort({ createdAt: -1 }).lean();

    const enrichedQueues = await Promise.all(
      queues.map(async (q) => {
        const tokens = await OPDToken.find({ queueId: q.queueId }).lean();
        const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
        const inServiceTokens = tokens.filter((t) => t.status === 'IN_SERVICE');
        const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');
        const calledTokens = tokens.filter((t) => t.status === 'CALLED');
        const skippedTokens = tokens.filter((t) => t.status === 'SKIPPED');

        const nextToken = await OPDQueueOrderingService.getNextToken(q.queueId);

        return {
          ...q,
          totalCheckedIn: tokens.length,
          totalWaiting: waitingTokens.length,
          totalInService: inServiceTokens.length,
          totalCompleted: completedTokens.length,
          totalCalled: calledTokens.length,
          totalSkipped: skippedTokens.length,
          nextCandidateToken: nextToken ? nextToken.tokenNumber : null
        };
      })
    );

    return enrichedQueues;
  }

  /**
   * Get complete queue details with ordered tokens
   */
  static async getQueueDetails(queueId) {
    const queue = await OPDQueue.findOne({ queueId }).lean();
    if (!queue) {
      const err = new Error(`OPD Queue '${queueId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'QUEUE_NOT_FOUND';
      throw err;
    }

    const allTokens = await OPDToken.find({ queueId }).sort({ checkInTime: 1 }).lean();
    const orderedWaiting = OPDQueueOrderingService.sortTokens(allTokens.filter((t) => t.status === 'WAITING'));
    const calledTokens = allTokens.filter((t) => t.status === 'CALLED');
    const inServiceTokens = allTokens.filter((t) => t.status === 'IN_SERVICE');
    const completedTokens = allTokens.filter((t) => t.status === 'COMPLETED');
    const skippedTokens = allTokens.filter((t) => t.status === 'SKIPPED');

    const nextToken = orderedWaiting.length > 0 ? orderedWaiting[0] : null;

    return {
      queue,
      tokens: {
        all: allTokens,
        waiting: orderedWaiting,
        called: calledTokens,
        inService: inServiceTokens,
        completed: completedTokens,
        skipped: skippedTokens
      },
      summary: {
        totalCheckedIn: allTokens.length,
        totalWaiting: orderedWaiting.length,
        totalInService: inServiceTokens.length,
        totalCompleted: completedTokens.length,
        totalSkipped: skippedTokens.length,
        currentToken: queue.currentToken,
        nextCandidateToken: nextToken ? nextToken.tokenNumber : null
      }
    };
  }

  /**
   * Process OPD Check-in (Online Self Check-in OR Front Desk Check-in)
   */
  static async processCheckIn({
    appointmentId,
    channel = 'ONLINE_SELF_CHECKIN',
    actorUser = {},
    override = false,
    overrideReason = null,
    idempotencyKey = null
  }) {
    const correlationId = IdGeneratorService.generateCorrelationId();

    if (!appointmentId) {
      const err = new Error('Appointment ID is mandatory for OPD check-in.');
      err.statusCode = 400;
      err.errorCode = 'APPOINTMENT_ID_REQUIRED';
      err.correlationId = correlationId;
      throw err;
    }

    // 1. Idempotency Check
    const existingToken = await OPDToken.findOne({ appointmentId });
    if (existingToken) {
      const ahead = await OPDQueueOrderingService.calculatePatientsAhead(existingToken.queueId, existingToken);
      const estWait = await OPDQueueOrderingService.calculateEstimatedWaitTime(ahead);

      return {
        alreadyCheckedIn: true,
        message: 'Patient has already completed OPD check-in.',
        token: existingToken,
        patientsAhead: ahead,
        estimatedWaitMinutes: estWait,
        correlationId
      };
    }

    // 2. Fetch & Validate Appointment
    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      const err = new Error(`Appointment '${appointmentId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'APPOINTMENT_NOT_FOUND';
      err.correlationId = correlationId;
      throw err;
    }

    if (appointment.status === 'CANCELLED') {
      const err = new Error('Cannot check in: this appointment has been cancelled.');
      err.statusCode = 400;
      err.errorCode = 'APPOINTMENT_CANCELLED';
      err.correlationId = correlationId;
      throw err;
    }

    if (appointment.status === 'COMPLETED') {
      const err = new Error('Cannot check in: this appointment is already completed.');
      err.statusCode = 400;
      err.errorCode = 'APPOINTMENT_ALREADY_COMPLETED';
      err.correlationId = correlationId;
      throw err;
    }

    // 3. Security / RBAC for Online Self Check-in
    if (channel === 'ONLINE_SELF_CHECKIN') {
      if (actorUser.role === 'PATIENT' || actorUser.patientId) {
        const patientMatches =
          actorUser.patientId === appointment.patientId ||
          actorUser.id === appointment.patientId ||
          actorUser.userId === appointment.patientId;

        if (!patientMatches && actorUser.role === 'PATIENT') {
          const err = new Error('Unauthorized: You can only perform online check-in for your own appointments.');
          err.statusCode = 403;
          err.errorCode = 'UNAUTHORIZED_CHECKIN';
          err.correlationId = correlationId;
          throw err;
        }
      }
    }

    // 4. Time Window & Late Check-in Evaluation
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const apptDateStr = appointment.appointmentDateStr || new Date(appointment.appointmentDate).toISOString().slice(0, 10);

    const [startH, startM] = (appointment.startTime || '09:00').split(':').map(Number);
    const scheduledDateTime = new Date(`${apptDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);

    const diffMinutes = Math.round((now.getTime() - scheduledDateTime.getTime()) / (1000 * 60));

    const windowBefore = await ConfigService.get('onlineCheckInWindowBeforeMinutes', 180);
    const windowAfter = await ConfigService.get('checkInWindowAfterMinutes', 120);

    let isOutsideWindow = false;
    let outsideReason = '';

    if (apptDateStr !== todayStr) {
      isOutsideWindow = true;
      outsideReason = `Appointment is scheduled for ${apptDateStr}, which is not today.`;
    } else if (diffMinutes < -windowBefore) {
      isOutsideWindow = true;
      outsideReason = `Check-in is not yet open. Opens ${windowBefore} minutes prior to ${appointment.startTime}.`;
    } else if (diffMinutes > windowAfter) {
      isOutsideWindow = true;
      outsideReason = `Check-in window expired (${windowAfter} minutes past scheduled time ${appointment.startTime}).`;
    }

    if (isOutsideWindow && !override) {
      const err = new Error(outsideReason || 'Check-in is not currently available for this appointment.');
      err.statusCode = 400;
      err.errorCode = 'OPD_CHECKIN_OUTSIDE_WINDOW';
      err.correlationId = correlationId;
      throw err;
    }

    const isLate = diffMinutes > 0;
    const lateMinutes = isLate ? diffMinutes : 0;

    // 5. Ensure OPD Queue exists for today
    const queue = await OPDQueueService.getOrCreateTodayQueue({
      departmentId: appointment.departmentId,
      departmentName: appointment.departmentName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      roomNumber: appointment.roomNumber || 'OPD-101'
    });

    if (queue.status === 'CLOSED') {
      const err = new Error(`OPD Queue for ${appointment.departmentName} is closed for today.`);
      err.statusCode = 400;
      err.errorCode = 'QUEUE_CLOSED';
      err.correlationId = correlationId;
      throw err;
    }

    // 6. Generate IDs
    const deptPrefix = OPDQueueService.getDepartmentPrefix(appointment.departmentId, appointment.departmentName);
    const { tokenNumber, sequenceNumber } = await IdGeneratorService.generateTokenNumber(deptPrefix, todayStr);
    const tokenId = await IdGeneratorService.generateTokenId();
    const checkInId = await IdGeneratorService.generateCheckInId();

    // 7. Ensure Visit Record exists or create one
    let visitId = appointment.visitId;
    if (!visitId) {
      visitId = await IdGeneratorService.generateVisitId();
      await Visit.create({
        visitId,
        patientId: appointment.patientId,
        patientRef: appointment.patientRef,
        appointmentId: appointment.appointmentId,
        department: appointment.departmentName || appointment.departmentId,
        consultingDoctorId: appointment.doctorId,
        checkInStatus: 'CHECKED_IN',
        status: 'IN_PROGRESS',
        visitType: 'OPD',
        registrationSource: channel === 'ONLINE_SELF_CHECKIN' ? 'ONLINE_SELF_REGISTRATION' : 'FRONT_DESK'
      });
      appointment.visitId = visitId;
    }

    // 8. Create OPD Token
    const opdToken = await OPDToken.create({
      tokenId,
      tokenNumber,
      sequenceNumber,
      patientId: appointment.patientId,
      patientRef: appointment.patientRef,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone || '',
      appointmentId: appointment.appointmentId,
      appointmentRef: appointment._id,
      visitId,
      queueId: queue.queueId,
      queueRef: queue._id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      departmentId: appointment.departmentId,
      departmentName: appointment.departmentName,
      roomNumber: appointment.roomNumber || queue.roomNumber || 'OPD-101',
      checkInChannel: channel,
      checkInTime: now,
      expectedAppointmentTime: appointment.startTime,
      status: 'WAITING',
      priorityType: 'NORMAL',
      isLate,
      lateMinutes,
      correlationId,
      idempotencyKey
    });

    // 9. Create CheckIn audit record
    await CheckIn.create({
      checkInId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      appointmentId: appointment.appointmentId,
      visitId,
      tokenId,
      tokenNumber,
      queueId: queue.queueId,
      channel,
      checkInTime: now,
      checkedInBy: actorUser.userId || actorUser.id || 'PATIENT_SELF',
      checkedInRole: actorUser.role || (channel === 'ONLINE_SELF_CHECKIN' ? 'PATIENT' : 'RECEPTIONIST'),
      status: override ? 'OVERRIDDEN' : 'SUCCESS',
      overrideUsed: Boolean(override),
      overrideReason: overrideReason || null,
      correlationId,
      idempotencyKey
    });

    // 10. Record Token History
    await OPDTokenHistory.create({
      tokenId,
      tokenNumber,
      queueId: queue.queueId,
      previousStatus: null,
      newStatus: 'WAITING',
      action: isLate ? 'LATE_RECORDED' : 'CHECKED_IN',
      actorUserId: actorUser.userId || actorUser.id || 'PATIENT_SELF',
      actorRole: actorUser.role || (channel === 'ONLINE_SELF_CHECKIN' ? 'PATIENT' : 'RECEPTIONIST'),
      actorName: actorUser.name || 'Check-in Staff',
      reason: isLate ? `Late arrival by ${lateMinutes} minutes` : 'Normal check-in',
      metadata: { channel, override, isLate, lateMinutes },
      correlationId
    });

    // 11. Update Appointment
    appointment.status = 'CHECKED_IN';
    appointment.checkInStatus = isLate ? 'LATE' : 'CHECKED_IN';
    appointment.checkedInAt = now;
    await appointment.save();

    // 12. Update Queue metrics
    await OPDQueue.updateOne(
      { queueId: queue.queueId },
      { $inc: { totalCheckedIn: 1, totalWaiting: 1 } }
    );

    // 13. Audit Event
    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'PATIENT',
      action: 'OPD_CHECKIN_COMPLETED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: tokenId,
      correlationId,
      details: `Patient ${appointment.patientName} (${appointment.patientId}) checked in via ${channel}. Token: ${tokenNumber}`
    });

    // 14. Dispatch Notification
    await NotificationService.sendNotification({
      recipientId: appointment.patientId,
      recipientPhone: appointment.patientPhone,
      recipientEmail: appointment.patientEmail,
      channel: 'SMS',
      event: 'OPD_CHECKIN_CONFIRMED',
      title: 'OPD Check-In Confirmed',
      message: `Your check-in is complete! OPD Token: ${tokenNumber}. Doctor: ${appointment.doctorName}. Room: ${opdToken.roomNumber}.`,
      entityType: 'OPDToken',
      entityId: tokenId,
      correlationId
    });

    // 15. Calculate real-time position
    const patientsAhead = await OPDQueueOrderingService.calculatePatientsAhead(queue.queueId, opdToken);
    const estimatedWaitMinutes = await OPDQueueOrderingService.calculateEstimatedWaitTime(patientsAhead);

    return {
      success: true,
      data: {
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        appointmentId: appointment.appointmentId,
        visitId,
        tokenId,
        tokenNumber,
        queueId: queue.queueId,
        roomNumber: opdToken.roomNumber,
        departmentName: appointment.departmentName,
        doctorName: appointment.doctorName,
        status: 'WAITING',
        isLate,
        lateMinutes,
        patientsAhead,
        estimatedWaitMinutes,
        checkInTime: now
      },
      correlationId
    };
  }

  /**
   * Call next or specific Token
   */
  static async callToken(tokenId, { actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    if (token.status !== 'WAITING' && token.status !== 'SKIPPED') {
      const err = new Error(`Cannot call token '${token.tokenNumber}' in status '${token.status}'. Must be WAITING or SKIPPED.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_TOKEN_TRANSITION';
      throw err;
    }

    const prevStatus = token.status;
    token.status = 'CALLED';
    token.calledAt = new Date();
    token.calledBy = actorUser.name || actorUser.id || 'Staff';
    await token.save();

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        currentToken: token.tokenNumber,
        currentTokenId: token.tokenId,
        $inc: prevStatus === 'WAITING' ? { totalWaiting: -1 } : {}
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: prevStatus,
      newStatus: 'CALLED',
      action: 'CALLED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'DOCTOR',
      actorName: actorUser.name || 'Doctor',
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'DOCTOR',
      action: 'OPD_TOKEN_CALLED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Token ${token.tokenNumber} called for service in Room ${token.roomNumber}.`
    });

    await NotificationService.sendNotification({
      recipientId: token.patientId,
      recipientPhone: token.patientPhone,
      channel: 'SMS',
      event: 'OPD_TOKEN_CALLED',
      title: 'Your OPD Token is Called',
      message: `Your token ${token.tokenNumber} has been called! Please proceed immediately to ${token.roomNumber}.`,
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId
    });

    return {
      success: true,
      token,
      message: `Token ${token.tokenNumber} has been called successfully.`
    };
  }

  /**
   * Start Service (CALLED -> IN_SERVICE)
   */
  static async startService(tokenId, { actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    if (token.status !== 'CALLED' && token.status !== 'WAITING') {
      const err = new Error(`Cannot start service for token in status '${token.status}'. Must be CALLED or WAITING.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_TOKEN_TRANSITION';
      throw err;
    }

    const prevStatus = token.status;
    token.status = 'IN_SERVICE';
    token.serviceStartedAt = new Date();
    token.serviceStartedBy = actorUser.name || actorUser.id || 'Doctor';
    await token.save();

    if (token.appointmentId) {
      await Appointment.updateOne(
        { appointmentId: token.appointmentId },
        { status: 'IN_PROGRESS' }
      );
    }

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        currentToken: token.tokenNumber,
        currentTokenId: token.tokenId,
        $inc: {
          totalInService: 1,
          ...(prevStatus === 'WAITING' ? { totalWaiting: -1 } : {})
        }
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: prevStatus,
      newStatus: 'IN_SERVICE',
      action: 'SERVICE_STARTED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'DOCTOR',
      actorName: actorUser.name || 'Doctor',
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'DOCTOR',
      action: 'OPD_SERVICE_STARTED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Consultation started for Token ${token.tokenNumber}.`
    });

    return {
      success: true,
      token,
      message: `Consultation started for token ${token.tokenNumber}.`
    };
  }

  /**
   * Complete Service (IN_SERVICE -> COMPLETED)
   */
  static async completeService(tokenId, { actorUser = {}, notes = '' }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    if (token.status !== 'IN_SERVICE' && token.status !== 'CALLED') {
      const err = new Error(`Cannot complete service for token in status '${token.status}'. Must be IN_SERVICE.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_TOKEN_TRANSITION';
      throw err;
    }

    const prevStatus = token.status;
    token.status = 'COMPLETED';
    token.completedAt = new Date();
    token.completedBy = actorUser.name || actorUser.id || 'Doctor';
    await token.save();

    if (token.appointmentId) {
      await Appointment.updateOne(
        { appointmentId: token.appointmentId },
        { status: 'COMPLETED' }
      );
    }
    if (token.visitId) {
      await Visit.updateOne(
        { visitId: token.visitId },
        { status: 'COMPLETED', endTime: new Date() }
      );
    }

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        $inc: {
          totalCompleted: 1,
          ...(prevStatus === 'IN_SERVICE' ? { totalInService: -1 } : {})
        }
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: prevStatus,
      newStatus: 'COMPLETED',
      action: 'COMPLETED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'DOCTOR',
      actorName: actorUser.name || 'Doctor',
      reason: notes || 'Consultation finished',
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'DOCTOR',
      action: 'OPD_SERVICE_COMPLETED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Consultation completed for Token ${token.tokenNumber}.`
    });

    return {
      success: true,
      token,
      message: `Consultation completed for token ${token.tokenNumber}.`
    };
  }

  /**
   * Skip Token (CALLED / WAITING -> SKIPPED)
   */
  static async skipToken(tokenId, { reason = 'PATIENT_NOT_PRESENT', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const prevStatus = token.status;
    token.status = 'SKIPPED';
    token.skippedAt = new Date();
    token.skippedBy = actorUser.name || actorUser.id || 'Staff';
    token.skipReason = reason;
    await token.save();

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        $inc: {
          totalSkipped: 1,
          ...(prevStatus === 'WAITING' ? { totalWaiting: -1 } : {})
        }
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: prevStatus,
      newStatus: 'SKIPPED',
      action: 'SKIPPED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'STAFF',
      actorName: actorUser.name || 'Staff User',
      reason,
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'STAFF',
      action: 'OPD_TOKEN_SKIPPED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Token ${token.tokenNumber} skipped. Reason: ${reason}`
    });

    return {
      success: true,
      token,
      message: `Token ${token.tokenNumber} marked as SKIPPED.`
    };
  }

  /**
   * Return Skipped Token back to Queue (SKIPPED -> WAITING)
   */
  static async returnToken(tokenId, { reason = 'PATIENT_ARRIVED_BACK', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    if (token.status !== 'SKIPPED') {
      const err = new Error(`Cannot return token in status '${token.status}'. Must be SKIPPED.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_TOKEN_TRANSITION';
      throw err;
    }

    token.status = 'WAITING';
    token.returnedAt = new Date();
    token.returnedBy = actorUser.name || actorUser.id || 'Staff';
    token.returnReason = reason;
    await token.save();

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        $inc: { totalWaiting: 1, totalSkipped: -1 }
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: 'SKIPPED',
      newStatus: 'WAITING',
      action: 'RETURNED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'STAFF',
      actorName: actorUser.name || 'Staff User',
      reason,
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'STAFF',
      action: 'OPD_TOKEN_RETURNED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Skipped Token ${token.tokenNumber} returned to active waiting queue.`
    });

    return {
      success: true,
      token,
      message: `Token ${token.tokenNumber} returned to active waiting queue.`
    };
  }

  /**
   * Transfer Token to Another Queue / Doctor / Department
   */
  static async transferToken({ tokenId, targetDoctorId, targetDepartmentId, reason = 'DEPARTMENT_TRANSFER', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const prevQueueId = token.queueId;
    const prevStatus = token.status;

    let deptName = token.departmentName;
    if (targetDepartmentId) {
      const dept = await Department.findOne({ departmentId: targetDepartmentId });
      if (dept) deptName = dept.name;
    }

    let docName = token.doctorName;
    if (targetDoctorId) {
      const doc = await Doctor.findOne({ doctorId: targetDoctorId });
      if (doc) docName = doc.name;
    }

    const targetQueue = await OPDQueueService.getOrCreateTodayQueue({
      departmentId: targetDepartmentId || token.departmentId,
      departmentName: deptName,
      doctorId: targetDoctorId || token.doctorId,
      doctorName: docName
    });

    token.fromQueueId = prevQueueId;
    token.toQueueId = targetQueue.queueId;
    token.queueId = targetQueue.queueId;
    token.queueRef = targetQueue._id;
    token.departmentId = targetDepartmentId || token.departmentId;
    token.departmentName = deptName;
    token.doctorId = targetDoctorId || token.doctorId;
    token.doctorName = docName;
    token.status = 'WAITING';
    token.transferredAt = new Date();
    token.transferredBy = actorUser.name || actorUser.id || 'Staff';
    token.transferReason = reason;
    await token.save();

    await OPDQueue.updateOne(
      { queueId: prevQueueId },
      { $inc: { totalWaiting: -1 } }
    );
    await OPDQueue.updateOne(
      { queueId: targetQueue.queueId },
      { $inc: { totalWaiting: 1 } }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: targetQueue.queueId,
      previousStatus: prevStatus,
      newStatus: 'WAITING',
      action: 'TRANSFERRED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'STAFF',
      actorName: actorUser.name || 'Staff User',
      reason: `Transferred from ${prevQueueId} to ${targetQueue.queueId}: ${reason}`,
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'STAFF',
      action: 'OPD_TOKEN_TRANSFERRED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Token ${token.tokenNumber} transferred to ${targetQueue.queueId}.`
    });

    return {
      success: true,
      token,
      message: `Token ${token.tokenNumber} successfully transferred to ${deptName}.`
    };
  }

  /**
   * Cancel Token (WAITING/CALLED -> CANCELLED)
   */
  static async cancelToken(tokenId, { reason = 'PATIENT_REQUEST', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const token = await OPDToken.findOne({ tokenId });

    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const prevStatus = token.status;
    token.status = 'CANCELLED';
    token.cancelledAt = new Date();
    token.cancelledBy = actorUser.name || actorUser.id || 'Staff';
    token.cancellationReason = reason;
    await token.save();

    await OPDQueue.updateOne(
      { queueId: token.queueId },
      {
        $inc: {
          totalCancelled: 1,
          ...(prevStatus === 'WAITING' ? { totalWaiting: -1 } : {})
        }
      }
    );

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: prevStatus,
      newStatus: 'CANCELLED',
      action: 'CANCELLED',
      actorUserId: actorUser.userId || actorUser.id || 'SYSTEM',
      actorRole: actorUser.role || 'STAFF',
      actorName: actorUser.name || 'Staff User',
      reason,
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'SYSTEM',
      role: actorUser.role || 'STAFF',
      action: 'OPD_TOKEN_CANCELLED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Token ${token.tokenNumber} cancelled. Reason: ${reason}`
    });

    return {
      success: true,
      token,
      message: `Token ${token.tokenNumber} has been cancelled.`
    };
  }

  /**
   * Assign or Update Clinical/Operational Priority (NORMAL, URGENT, EMERGENCY)
   */
  static async assignPriority(tokenId, { priorityType, priorityReason, actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();

    const allowedRoles = ['DOCTOR', 'NURSE', 'SYSTEM_ADMIN', 'ADMIN_MANAGER', 'RECEPTIONIST'];
    if (!allowedRoles.includes(actorUser.role)) {
      const err = new Error('Unauthorized: Patients and unauthorized roles cannot assign or modify queue priority.');
      err.statusCode = 403;
      err.errorCode = 'UNAUTHORIZED_PRIORITY_MODIFICATION';
      throw err;
    }

    if (!['NORMAL', 'URGENT', 'EMERGENCY'].includes(priorityType)) {
      const err = new Error("Invalid priorityType. Must be 'NORMAL', 'URGENT', or 'EMERGENCY'.");
      err.statusCode = 400;
      err.errorCode = 'INVALID_PRIORITY_TYPE';
      throw err;
    }

    const token = await OPDToken.findOne({ tokenId });
    if (!token) {
      const err = new Error(`OPD Token '${tokenId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const prevPriority = token.priorityType;
    token.priorityType = priorityType;
    token.priorityReason = priorityReason || `Assigned by ${actorUser.role}`;
    token.priorityAssignedBy = actorUser.userId || actorUser.id || actorUser.name || 'STAFF';
    token.priorityAssignedAt = new Date();
    await token.save();

    await OPDTokenHistory.create({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      queueId: token.queueId,
      previousStatus: token.status,
      newStatus: token.status,
      action: 'PRIORITY_ASSIGNED',
      actorUserId: actorUser.userId || actorUser.id || 'STAFF',
      actorRole: actorUser.role || 'STAFF',
      actorName: actorUser.name || 'Authorized Staff',
      reason: `Priority changed from ${prevPriority} to ${priorityType}. Reason: ${priorityReason || 'Clinical decision'}`,
      correlationId
    });

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'STAFF',
      role: actorUser.role || 'STAFF',
      action: 'OPD_PRIORITY_ASSIGNED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDToken',
      entityId: token.tokenId,
      correlationId,
      details: `Token ${token.tokenNumber} priority changed to ${priorityType}. Reason: ${priorityReason}`
    });

    return {
      success: true,
      token,
      message: `Priority updated to ${priorityType} for token ${token.tokenNumber}.`
    };
  }

  /**
   * Pause OPD Queue
   */
  static async pauseQueue(queueId, { reason = 'DOCTOR_UNAVAILABLE', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const queue = await OPDQueue.findOne({ queueId });

    if (!queue) {
      const err = new Error(`OPD Queue '${queueId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'QUEUE_NOT_FOUND';
      throw err;
    }

    queue.status = 'PAUSED';
    queue.pauseReason = reason;
    queue.pausedAt = new Date();
    queue.pausedBy = actorUser.name || actorUser.id || 'Staff';
    await queue.save();

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'STAFF',
      role: actorUser.role || 'STAFF',
      action: 'OPD_QUEUE_PAUSED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDQueue',
      entityId: queueId,
      correlationId,
      details: `OPD Queue ${queueId} paused. Reason: ${reason}`
    });

    return {
      success: true,
      queue,
      message: `OPD Queue ${queueId} has been paused.`
    };
  }

  /**
   * Resume OPD Queue
   */
  static async resumeQueue(queueId, { actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const queue = await OPDQueue.findOne({ queueId });

    if (!queue) {
      const err = new Error(`OPD Queue '${queueId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'QUEUE_NOT_FOUND';
      throw err;
    }

    queue.status = 'OPEN';
    queue.resumedAt = new Date();
    queue.resumedBy = actorUser.name || actorUser.id || 'Staff';
    await queue.save();

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'STAFF',
      role: actorUser.role || 'STAFF',
      action: 'OPD_QUEUE_RESUMED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDQueue',
      entityId: queueId,
      correlationId,
      details: `OPD Queue ${queueId} resumed to OPEN.`
    });

    return {
      success: true,
      queue,
      message: `OPD Queue ${queueId} has resumed operation.`
    };
  }

  /**
   * Close OPD Queue for session
   */
  static async closeQueue(queueId, { policy = 'AUTO_RESOLVE', actorUser = {} }) {
    const correlationId = IdGeneratorService.generateCorrelationId();
    const queue = await OPDQueue.findOne({ queueId });

    if (!queue) {
      const err = new Error(`OPD Queue '${queueId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'QUEUE_NOT_FOUND';
      throw err;
    }

    const unresolvedTokens = await OPDToken.find({
      queueId,
      status: { $in: ['WAITING', 'CALLED'] }
    });

    queue.status = 'CLOSED';
    queue.closedAt = new Date();
    queue.closedBy = actorUser.name || actorUser.id || 'Staff';
    queue.closurePolicyApplied = policy;
    await queue.save();

    await AuditService.logEvent({
      userId: actorUser.userId || actorUser.id || 'STAFF',
      role: actorUser.role || 'STAFF',
      action: 'OPD_QUEUE_CLOSED',
      module: 'OPD_QUEUE_MANAGEMENT',
      entityType: 'OPDQueue',
      entityId: queueId,
      correlationId,
      details: `OPD Queue ${queueId} closed with ${unresolvedTokens.length} unresolved tokens. Policy: ${policy}`
    });

    return {
      success: true,
      queue,
      unresolvedCount: unresolvedTokens.length,
      message: `OPD Queue ${queueId} has been closed.`
    };
  }

  /**
   * Fetch patient token details for live tracker view
   */
  static async getPatientTokenDetails(tokenIdOrPatientId) {
    let token = await OPDToken.findOne({ tokenId: tokenIdOrPatientId });
    if (!token) {
      token = await OPDToken.findOne({
        $or: [{ appointmentId: tokenIdOrPatientId }, { patientId: tokenIdOrPatientId }]
      }).sort({ createdAt: -1 });
    }

    if (!token) {
      const err = new Error('OPD Token not found.');
      err.statusCode = 404;
      err.errorCode = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const queue = await OPDQueue.findOne({ queueId: token.queueId }).lean();
    const patientsAhead = await OPDQueueOrderingService.calculatePatientsAhead(token.queueId, token);
    const estimatedWaitMinutes = await OPDQueueOrderingService.calculateEstimatedWaitTime(patientsAhead);

    return {
      token,
      queue,
      patientsAhead,
      estimatedWaitMinutes
    };
  }
}

module.exports = OPDQueueService;

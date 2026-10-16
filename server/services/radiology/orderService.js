const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologyExam = require('../../models/RadiologyExam');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Visit = require('../../models/Visit');
const Admission = require('../../models/Admission');
const RadiologyException = require('../../models/RadiologyException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class OrderService {
  /**
   * Preflight check for duplicate open radiology orders
   */
  static async checkDuplicateOrder({ patientId, patientCode, examId, examCode }) {
    let resolvedPatientId = patientId;
    let resolvedPatientCode = patientCode;

    if (!resolvedPatientId && patientCode) {
      const p = await Patient.findOne({ patientId: patientCode });
      if (p) {
        resolvedPatientId = p._id;
        resolvedPatientCode = p.patientId;
      }
    } else if (resolvedPatientId && !resolvedPatientCode) {
      if (String(resolvedPatientId).match(/^[0-9a-fA-F]{24}$/)) {
        const p = await Patient.findById(resolvedPatientId);
        if (p) resolvedPatientCode = p.patientId;
      } else {
        const p = await Patient.findOne({ patientId: resolvedPatientId });
        if (p) {
          resolvedPatientId = p._id;
          resolvedPatientCode = p.patientId;
        }
      }
    }

    if (!resolvedPatientId) {
      return { isDuplicate: false, potentialDuplicates: [] };
    }

    // Resolve Exam
    let resolvedExam = null;
    if (examId && String(examId).match(/^[0-9a-fA-F]{24}$/)) {
      resolvedExam = await RadiologyExam.findById(examId);
    }
    if (!resolvedExam && (examCode || examId)) {
      resolvedExam = await RadiologyExam.findOne({
        $or: [{ code: String(examCode || examId).toUpperCase() }, { examId: String(examId) }]
      });
    }

    // Look for active orders within last 72 hours
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const existingOrders = await RadiologyOrder.find({
      $or: [{ patientId: resolvedPatientId }, { patientCode: resolvedPatientCode }],
      status: {
        $in: [
          'ORDERED',
          'PENDING_SCHEDULING',
          'SCHEDULED',
          'PREPARATION_REQUIRED',
          'READY_FOR_CHECKIN',
          'CHECKED_IN',
          'IN_PROGRESS'
        ]
      },
      orderDateTime: { $gte: threeDaysAgo }
    }).populate('examId').lean();

    if (!existingOrders || existingOrders.length === 0) {
      return { isDuplicate: false, potentialDuplicates: [] };
    }

    // Check if any existing active order has the same exam
    const duplicates = existingOrders.filter(o => {
      if (resolvedExam && String(o.examId?._id || o.examId) === String(resolvedExam._id)) {
        return true;
      }
      if (resolvedExam && o.examCodeSnapshot === resolvedExam.code) {
        return true;
      }
      return false;
    });

    if (duplicates.length > 0) {
      return {
        isDuplicate: true,
        potentialDuplicates: duplicates.map(d => ({
          orderId: d.orderId,
          status: d.status,
          examCode: d.examCodeSnapshot,
          examName: d.examNameSnapshot,
          orderDateTime: d.orderDateTime
        })),
        message: `Patient already has an active order (${duplicates[0].orderId} - ${duplicates[0].examNameSnapshot}, Status: ${duplicates[0].status}) placed recently.`
      };
    }

    return { isDuplicate: false, potentialDuplicates: [] };
  }

  /**
   * Create Radiology Order
   */
  static async createOrder({
    patientId,
    patientCode,
    visitId,
    admissionId,
    orderingDoctorId,
    examId,
    priority = 'NORMAL',
    clinicalNote = '',
    source = 'DOCTOR_PORTAL',
    allowDuplicateOverride = false,
    user = null
  }) {
    // 1. Patient validation
    let patient = null;
    if (patientId) {
      const pidStr = String(patientId);
      patient = await Patient.findOne({
        $or: [{ _id: pidStr.match(/^[0-9a-fA-F]{24}$/) ? pidStr : null }, { patientId: pidStr }]
      });
    } else if (patientCode) {
      patient = await Patient.findOne({ patientId: patientCode });
    }

    if (!patient) {
      patient = await Patient.findOne();
      if (!patient) {
        throw new Error('Valid patient is required.');
      }
    }

    // 2. Doctor validation
    let doctor = null;
    if (orderingDoctorId) {
      const docIdStr = String(orderingDoctorId);
      doctor = await Doctor.findOne({
        $or: [{ _id: docIdStr.match(/^[0-9a-fA-F]{24}$/) ? docIdStr : null }, { doctorId: docIdStr }]
      }).populate('userId');
    }
    const doctorName = doctor
      ? `Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()
      : 'Authorised Clinician';

    // 3. Exam validation
    let exam = null;
    if (examId && String(examId).match(/^[0-9a-fA-F]{24}$/)) {
      exam = await RadiologyExam.findById(examId);
    }
    if (!exam && examId) {
      exam = await RadiologyExam.findOne({
        $or: [{ code: String(examId).toUpperCase() }, { examId: String(examId) }]
      });
    }

    if (!exam) {
      throw new Error(`Radiology exam '${examId}' not found.`);
    }

    if (exam.status !== 'ACTIVE') {
      throw new Error(`Radiology exam '${exam.code}' is currently ${exam.status} and cannot be ordered.`);
    }

    // 4. Duplicate Order Check
    const dupCheck = await this.checkDuplicateOrder({
      patientId: patient._id,
      patientCode: patient.patientId,
      examId: exam._id
    });

    if (dupCheck.isDuplicate && !allowDuplicateOverride) {
      const exceptionId = await IdGeneratorService.generateRadiologyExceptionId();
      await RadiologyException.create({
        exceptionId,
        type: 'DUPLICATE_ORDER',
        severity: 'MEDIUM',
        patientId: patient._id,
        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        description: dupCheck.message,
        source: 'MERN_VALIDATION',
        status: 'OPEN'
      });

      const err = new Error(dupCheck.message);
      err.code = 'DUPLICATE_RADIOLOGY_ORDER';
      err.details = dupCheck;
      throw err;
    }

    // 5. Generate Order ID
    const orderId = await IdGeneratorService.generateRadiologyOrderId();

    const order = new RadiologyOrder({
      orderId,
      patientId: patient._id,
      patientCode: patient.patientId,
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      visitId: visitId || null,
      admissionId: admissionId || null,
      orderingDoctorId: doctor ? doctor._id : user?._id || patient._id,
      orderingDoctorName: doctorName,
      examId: exam._id,
      examNameSnapshot: exam.name,
      examCodeSnapshot: exam.code,
      modalityTypeSnapshot: exam.modalityType,
      bodyPartSnapshot: exam.bodyPart || '',
      priority: ['NORMAL', 'URGENT', 'STAT'].includes(priority) ? priority : 'NORMAL',
      clinicalNote,
      orderDateTime: new Date(),
      status: exam.fastingRequired || exam.preparationInstructions ? 'PREPARATION_REQUIRED' : 'PENDING_SCHEDULING',
      preparationStatus: exam.preparationInstructions ? 'INSTRUCTIONS_SENT' : 'NOT_REQUIRED',
      preparationInstructions: exam.preparationInstructions || '',
      source,
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await order.save();

    // Trigger Notification for Order Placed
    try {
      await NotificationService.sendNotification({
        userId: user?._id || null,
        recipient: patient.email || patient.phoneNumber || 'patient@hospital.org',
        recipientType: 'PATIENT',
        channel: 'PORTAL',
        templateCode: 'RADIOLOGY_ORDER_CREATED',
        variables: {
          patientName: order.patientName,
          orderId: order.orderId,
          examName: order.examNameSnapshot,
          priority: order.priority
        }
      });
    } catch (e) {
      console.warn('[Radiology Order Notification Warning]:', e.message);
    }

    await AuditService.logAction({
      user,
      action: 'CREATE_RADIOLOGY_ORDER',
      entity: 'RadiologyOrder',
      entityId: order._id,
      description: `Created Radiology Order ${order.orderId} for ${order.patientName} (${order.examNameSnapshot})`
    });

    return order;
  }

  /**
   * List radiology orders with filtering & pagination
   */
  static async listOrders(filters = {}, pagination = {}) {
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.modalityType) query.modalityTypeSnapshot = filters.modalityType;
    if (filters.patientId) {
      query.$or = [
        { patientId: String(filters.patientId).match(/^[0-9a-fA-F]{24}$/) ? filters.patientId : null },
        { patientCode: filters.patientId }
      ];
    }
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { orderId: regex },
        { patientName: regex },
        { patientCode: regex },
        { examNameSnapshot: regex },
        { examCodeSnapshot: regex }
      ];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      RadiologyOrder.find(query)
        .populate('examId')
        .populate('orderingDoctorId')
        .sort({ orderDateTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RadiologyOrder.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(id) {
    let order = null;
    if (String(id).match(/^[0-9a-fA-F]{24}$/)) {
      order = await RadiologyOrder.findById(id).populate('examId').populate('orderingDoctorId').lean();
    }
    if (!order) {
      order = await RadiologyOrder.findOne({ orderId: id }).populate('examId').populate('orderingDoctorId').lean();
    }
    if (!order) {
      throw new Error(`Radiology Order '${id}' not found.`);
    }
    return order;
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id, reason, user = null) {
    const order = await RadiologyOrder.findOne({
      $or: [{ _id: String(id).match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderId: id }]
    });

    if (!order) {
      throw new Error(`Order '${id}' not found.`);
    }

    if (['IN_PROGRESS', 'COMPLETED', 'REPORT_PENDING', 'RELEASED'].includes(order.status)) {
      throw new Error(`Cannot cancel order in status '${order.status}'. Examination or reporting is underway.`);
    }

    const oldStatus = order.status;
    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Cancelled by authorized user';
    order.updatedBy = user?._id || null;
    await order.save();

    await AuditService.logAction({
      user,
      action: 'CANCEL_RADIOLOGY_ORDER',
      entity: 'RadiologyOrder',
      entityId: order._id,
      previousState: { status: oldStatus },
      newState: { status: 'CANCELLED', reason },
      description: `Cancelled order ${order.orderId}`
    });

    return order;
  }
}

module.exports = OrderService;

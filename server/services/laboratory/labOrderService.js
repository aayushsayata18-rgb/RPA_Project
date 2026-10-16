const LabOrder = require('../../models/LabOrder');
const LabOrderItem = require('../../models/LabOrderItem');
const LabTest = require('../../models/LabTest');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Visit = require('../../models/Visit');
const Admission = require('../../models/Admission');
const LabException = require('../../models/LabException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const SampleService = require('./sampleService');
const LaboratoryBillingService = require('./billingService');
const NotificationService = require('../NotificationService');

class LabOrderService {
  /**
   * Preflight check for duplicate open lab orders
   */
  static async checkDuplicateOrder({ patientId, patientCode, testCodes = [], testIds = [] }) {
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
        if (p) {
          resolvedPatientCode = p.patientId;
        }
      } else {
        const p = await Patient.findOne({ patientId: resolvedPatientId });
        if (p) {
          resolvedPatientId = p._id;
          resolvedPatientCode = p.patientId;
        } else {
          resolvedPatientCode = resolvedPatientId;
        }
      }
    }

    if (!resolvedPatientId) {
      return { isDuplicate: false, potentialDuplicates: [] };
    }

    // Look for orders from the last 72 hours for this patient that are still active
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const existingOrders = await LabOrder.find({
      $or: [
        { patientId: resolvedPatientId },
        { patientCode: resolvedPatientCode }
      ],
      status: { $in: ['ORDERED', 'SCHEDULED', 'AWAITING_COLLECTION', 'PARTIALLY_COLLECTED', 'COLLECTED', 'IN_PROCESS'] },
      orderDateTime: { $gte: threeDaysAgo }
    }).lean();

    if (!existingOrders || existingOrders.length === 0) {
      return { isDuplicate: false, potentialDuplicates: [] };
    }

    const orderIds = existingOrders.map(o => o._id);
    const existingItems = await LabOrderItem.find({
      orderId: { $in: orderIds }
    }).lean();

    // Resolve testIds against LabTest collection to support ObjectId, labTestId, and code
    let resolvedTestObjectIds = [];
    let resolvedTestCodes = [...(testCodes || [])];
    if (testIds && testIds.length > 0) {
      const tests = await LabTest.find({
        $or: [
          { _id: { $in: testIds.filter(id => String(id).match(/^[0-9a-fA-F]{24}$/)) } },
          { labTestId: { $in: testIds } },
          { code: { $in: testIds } }
        ]
      }).select('_id code').lean();
      resolvedTestObjectIds = tests.map(t => String(t._id));
      resolvedTestCodes.push(...tests.map(t => t.code));
    }

    // Check if any testCode or testId matches
    const matchingItems = existingItems.filter(item => {
      const codeMatch = resolvedTestCodes.some(c => c && c.toUpperCase() === item.testCodeSnapshot.toUpperCase());
      const idMatch = resolvedTestObjectIds.some(id => String(id) === String(item.labTestId)) ||
                      testIds.some(id => String(id) === String(item.labTestId));
      return codeMatch || idMatch;
    });

    if (matchingItems.length > 0) {
      return {
        isDuplicate: true,
        message: `Potential duplicate order detected: Patient ${resolvedPatientCode} already has active order(s) for ${matchingItems.map(m => m.testCodeSnapshot).join(', ')}.`,
        matchingItems,
        existingOrders
      };
    }

    return { isDuplicate: false, potentialDuplicates: [] };
  }

  /**
   * Create a new laboratory order
   */
  static async createOrder({
    patientId,
    patientCode,
    orderingDoctorId,
    testIds = [],
    priority = 'NORMAL',
    clinicalNote = '',
    visitId = null,
    admissionId = null,
    collectionLocation = 'CENTRAL_PHLEBOTOMY',
    allowDuplicateOverride = false,
    source = 'DOCTOR_PORTAL',
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
        throw new Error(`Patient was not found.`);
      }
    }

    // 2. Doctor validation
    let doctor = null;
    if (orderingDoctorId) {
      const docIdStr = String(orderingDoctorId);
      doctor = await Doctor.findOne({
        $or: [
          { _id: docIdStr.match(/^[0-9a-fA-F]{24}$/) ? docIdStr : null },
          { doctorId: docIdStr }
        ]
      }).populate('userId');
    }

    const doctorName = doctor
      ? `Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()
      : 'Authorised Physician';

    // 3. Tests validation
    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      throw new Error('At least one laboratory test must be specified.');
    }

    const labTests = await LabTest.find({
      $or: [
        { _id: { $in: testIds.filter(id => String(id).match(/^[0-9a-fA-F]{24}$/)) } },
        { code: { $in: testIds.map(t => String(t).toUpperCase()) } },
        { labTestId: { $in: testIds.map(t => String(t)) } }
      ]
    });

    if (!labTests || labTests.length === 0) {
      throw new Error('No valid laboratory tests found for the requested items.');
    }

    // 4. Duplicate Check
    const dupCheck = await this.checkDuplicateOrder({
      patientId: patient._id,
      patientCode: patient.patientId,
      testCodes: labTests.map(t => t.code),
      testIds: labTests.map(t => t._id)
    });

    if (dupCheck.isDuplicate && !allowDuplicateOverride) {
      // Create duplicate order exception
      const exceptionId = await IdGeneratorService.generateLabExceptionId();
      const exception = new LabException({
        exceptionId,
        type: 'DUPLICATE_ORDER',
        severity: 'MEDIUM',
        patientId: patient._id,
        patientCode: patient.patientId,
        description: dupCheck.message,
        source: 'MERN_VALIDATION',
        status: 'OPEN'
      });
      await exception.save();

      const err = new Error(dupCheck.message);
      err.code = 'DUPLICATE_LAB_ORDER';
      err.details = dupCheck;
      throw err;
    }

    // 5. Generate Order ID
    const orderId = await IdGeneratorService.generateLabOrderId();

    // Calculate patient age
    let patientAge = null;
    if (patient.dateOfBirth) {
      const diff = Date.now() - new Date(patient.dateOfBirth).getTime();
      patientAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    const newOrder = new LabOrder({
      orderId,
      patientId: patient._id,
      patientCode: patient.patientId,
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      patientGender: patient.gender || '',
      patientAge,
      visitId: visitId || null,
      visitIdString: visitId ? String(visitId) : '',
      admissionId: admissionId || null,
      admissionIdString: admissionId ? String(admissionId) : '',
      orderingDoctorId: doctor ? doctor._id : user?._id || patient._id,
      orderingDoctorName: doctorName,
      orderDateTime: new Date(),
      priority: priority || 'NORMAL',
      clinicalNote,
      collectionLocation,
      source: source || 'DOCTOR_PORTAL',
      status: 'AWAITING_COLLECTION',
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await newOrder.save();

    // 6. Create order items and register samples
    const orderItems = [];
    for (const test of labTests) {
      const orderItemId = await IdGeneratorService.generateLabOrderItemId();
      const item = new LabOrderItem({
        orderItemId,
        orderId: newOrder._id,
        orderIdString: newOrder.orderId,
        labTestId: test._id,
        testCodeSnapshot: test.code,
        testNameSnapshot: test.name,
        specimenTypeSnapshot: test.specimenType,
        containerTypeSnapshot: test.containerType,
        collectionInstructionsSnapshot: test.collectionInstructions,
        priceSnapshot: test.priceReference || 0,
        status: 'AWAITING_COLLECTION'
      });
      await item.save();

      // Automatically register a sample with atomic Accession Number
      const sample = await SampleService.registerSample({
        orderItemId: item._id,
        specimenType: test.specimenType,
        containerType: test.containerType,
        user
      });

      orderItems.push(item);
    }

    // 7. Billing Integration: Generate idempotent charges
    try {
      const billingResults = await LaboratoryBillingService.createChargesForOrder({
        order: newOrder,
        orderItems,
        user
      });
      const firstCharge = billingResults.find(r => r.charge)?.charge;
      if (firstCharge) {
        newOrder.billingReferenceId = firstCharge.chargeId;
        newOrder.billingStatus = 'BILLED';
        await newOrder.save();
      }
    } catch (billErr) {
      console.warn('[Lab Billing Integration Warning]:', billErr.message);
    }

    // 8. Trigger Notification
    try {
      await NotificationService.sendNotification({
        userId: user?.userId || 'SYSTEM',
        recipient: patient.patientId,
        channel: 'IN_APP',
        templateCode: 'LAB_ORDER_CREATED',
        variables: {
          orderId: newOrder.orderId,
          patientName: newOrder.patientName,
          testsCount: String(labTests.length),
          priority: newOrder.priority
        }
      });
    } catch (notifErr) {
      // Non-blocking notification
    }

    // 9. Audit Log
    await AuditService.logAction({
      action: 'LAB_ORDER_CREATED',
      module: 'LABORATORY',
      entityId: newOrder.orderId,
      entityType: 'LabOrder',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Created lab order ${newOrder.orderId} with ${labTests.length} tests for patient ${newOrder.patientCode}`
    });

    return {
      order: newOrder,
      items: orderItems
    };
  }

  /**
   * List orders with filters & pagination
   */
  static async listOrders({
    patientCode = '',
    status = '',
    priority = '',
    search = '',
    page = 1,
    limit = 50
  }) {
    const filter = {};
    if (patientCode) {
      filter.patientCode = patientCode;
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { patientCode: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { orderingDoctorName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      LabOrder.find(filter)
        .sort({ orderDateTime: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabOrder.countDocuments(filter)
    ]);

    // Attach items summary
    const orderIds = orders.map(o => o._id);
    const items = await LabOrderItem.find({ orderId: { $in: orderIds } }).lean();

    const enrichedOrders = orders.map(o => ({
      ...o,
      items: items.filter(i => String(i.orderId) === String(o._id))
    }));

    return {
      orders: enrichedOrders,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get single order by orderId or ObjectId
   */
  static async getOrderById(identifier) {
    const idStr = String(identifier);
    const order = await LabOrder.findOne({
      $or: [
        { orderId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    }).lean();

    if (!order) {
      throw new Error(`Laboratory order '${identifier}' not found.`);
    }

    const items = await LabOrderItem.find({ orderId: order._id })
      .populate('sampleId')
      .populate('resultId')
      .populate('reportId')
      .lean();

    return {
      ...order,
      items
    };
  }

  /**
   * Cancel an order
   */
  static async cancelOrder({ orderIdentifier, cancellationReason = '', user = null }) {
    const idStr = String(orderIdentifier);
    const order = await LabOrder.findOne({
      $or: [
        { orderId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!order) {
      throw new Error(`Order '${orderIdentifier}' not found.`);
    }

    if (['COMPLETED', 'RELEASED'].includes(order.status)) {
      throw new Error(`Cannot cancel order '${order.orderId}' in status ${order.status}.`);
    }

    order.status = 'CANCELLED';
    order.cancellationReason = cancellationReason || 'Cancelled by authorized user';
    order.cancelledBy = user?._id || null;
    order.cancelledAt = new Date();
    await order.save();

    await LabOrderItem.updateMany({ orderId: order._id }, { status: 'CANCELLED' });

    await AuditService.logAction({
      action: 'LAB_ORDER_CANCELLED',
      module: 'LABORATORY',
      entityId: order.orderId,
      entityType: 'LabOrder',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Cancelled lab order ${order.orderId}. Reason: ${order.cancellationReason}`
    });

    return order;
  }
}

module.exports = LabOrderService;

const LabSample = require('../../models/LabSample');
const LabOrder = require('../../models/LabOrder');
const LabOrderItem = require('../../models/LabOrderItem');
const LabException = require('../../models/LabException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const NotificationService = require('../NotificationService');

class SampleService {
  /**
   * Get collection queue: order items awaiting sample collection
   */
  static async getCollectionQueue({ priority = '', search = '', page = 1, limit = 50 }) {
    const filter = {
      status: { $in: ['ORDERED', 'AWAITING_COLLECTION'] }
    };

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [items, total] = await Promise.all([
      LabOrderItem.find(filter)
        .populate('orderId')
        .populate('labTestId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabOrderItem.countDocuments(filter)
    ]);

    let filteredItems = items;
    if (priority) {
      filteredItems = filteredItems.filter(i => i.orderId?.priority === priority);
    }
    if (search) {
      const q = search.toLowerCase();
      filteredItems = filteredItems.filter(
        i =>
          i.testNameSnapshot.toLowerCase().includes(q) ||
          i.testCodeSnapshot.toLowerCase().includes(q) ||
          i.orderId?.patientName?.toLowerCase().includes(q) ||
          i.orderId?.patientCode?.toLowerCase().includes(q) ||
          i.orderIdString.toLowerCase().includes(q)
      );
    }

    return {
      queue: filteredItems,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Register a new sample & generate unique Accession Number
   */
  static async registerSample({ orderItemId, specimenType, containerType = '', user = null }) {
    const orderItem = await LabOrderItem.findById(orderItemId).populate('orderId');
    if (!orderItem) {
      throw new Error(`Order item '${orderItemId}' not found.`);
    }

    // Check if sample already registered for this order item
    let sample = await LabSample.findOne({ orderItemId: orderItem._id });
    if (!sample) {
      const [sampleId, accessionNumber] = await Promise.all([
        IdGeneratorService.generateLabSampleId(),
        IdGeneratorService.generateAccessionNumber()
      ]);

      sample = new LabSample({
        sampleId,
        accessionNumber,
        orderId: orderItem.orderId._id,
        orderIdString: orderItem.orderId.orderId,
        orderItemId: orderItem._id,
        orderItemIdString: orderItem.orderItemId,
        patientId: orderItem.orderId.patientId,
        patientCode: orderItem.orderId.patientCode,
        patientName: orderItem.orderId.patientName,
        specimenType: specimenType || orderItem.specimenTypeSnapshot || 'WHOLE_BLOOD',
        containerType: containerType || orderItem.containerTypeSnapshot || 'EDTA_TUBE_LAVENDER',
        status: 'REGISTERED'
      });

      await sample.save();

      orderItem.sampleId = sample._id;
      orderItem.sampleAccessionNumber = sample.accessionNumber;
      await orderItem.save();

      await AuditService.logAction({
        action: 'LAB_SAMPLE_REGISTERED',
        module: 'LABORATORY',
        entityId: sample.sampleId,
        entityType: 'LabSample',
        performedBy: user?.userId || 'SYSTEM',
        performedByRole: user?.role || 'SYSTEM',
        description: `Registered laboratory sample ${sample.sampleId} with accession ${sample.accessionNumber}`
      });
    }

    return sample;
  }

  /**
   * Collect a sample
   */
  static async collectSample({
    sampleIdOrAccession,
    orderItemId,
    collectionLocation = 'CENTRAL_PHLEBOTOMY',
    notes = '',
    user = null
  }) {
    let sample = null;

    if (sampleIdOrAccession) {
      const sIdStr = String(sampleIdOrAccession);
      sample = await LabSample.findOne({
        $or: [
          { sampleId: sIdStr },
          { accessionNumber: sIdStr },
          { _id: sIdStr.match(/^[0-9a-fA-F]{24}$/) ? sIdStr : null }
        ]
      });
    }

    if (!sample && orderItemId) {
      sample = await this.registerSample({ orderItemId, user });
    }

    if (!sample) {
      throw new Error('Laboratory sample not found for collection.');
    }

    sample.collectionDateTime = new Date();
    sample.collectedBy = user?._id || null;
    sample.collectedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Staff Collector';
    sample.collectionLocation = collectionLocation;
    sample.collectionNotes = notes;
    sample.status = 'COLLECTED';
    await sample.save();

    // Update order item status
    await LabOrderItem.findByIdAndUpdate(sample.orderItemId, {
      status: 'COLLECTED',
      sampleId: sample._id,
      sampleAccessionNumber: sample.accessionNumber
    });

    // Update overall order status
    const orderItems = await LabOrderItem.find({ orderId: sample.orderId });
    const allCollected = orderItems.every(i => ['COLLECTED', 'RECEIVED', 'IN_PROCESS', 'RESULT_ENTERED', 'VERIFIED', 'RELEASED'].includes(i.status));
    await LabOrder.findByIdAndUpdate(sample.orderId, {
      status: allCollected ? 'COLLECTED' : 'PARTIALLY_COLLECTED'
    });

    await AuditService.logAction({
      action: 'LAB_SAMPLE_COLLECTED',
      module: 'LABORATORY',
      entityId: sample.sampleId,
      entityType: 'LabSample',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Collected sample accession ${sample.accessionNumber} from patient ${sample.patientCode}`
    });

    return sample;
  }

  /**
   * Receive a sample at the laboratory bench
   */
  static async receiveSample({ identifier, processingLocation = 'MAIN_LAB', user = null }) {
    const idStr = String(identifier || '');
    const sample = await LabSample.findOne({
      $or: [
        { accessionNumber: idStr },
        { sampleId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!sample) {
      throw new Error(`Sample with identifier '${identifier}' was not found.`);
    }

    sample.receivedDateTime = new Date();
    sample.receivedBy = user?._id || null;
    sample.receivedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Lab Technician';
    sample.processingLocation = processingLocation;
    sample.status = 'RECEIVED';
    await sample.save();

    await LabOrderItem.findByIdAndUpdate(sample.orderItemId, {
      status: 'RECEIVED'
    });

    await AuditService.logAction({
      action: 'LAB_SAMPLE_RECEIVED',
      module: 'LABORATORY',
      entityId: sample.sampleId,
      entityType: 'LabSample',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Sample received in lab. Accession: ${sample.accessionNumber}`
    });

    return sample;
  }

  /**
   * Accept a sample for analytical processing
   */
  static async acceptSample({ identifier, user = null }) {
    const idStr = String(identifier || '');
    const sample = await LabSample.findOne({
      $or: [
        { accessionNumber: idStr },
        { sampleId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!sample) {
      throw new Error(`Sample with identifier '${identifier}' was not found.`);
    }

    sample.status = 'ACCEPTED';
    await sample.save();

    await LabOrderItem.findByIdAndUpdate(sample.orderItemId, {
      status: 'IN_PROCESS'
    });

    await LabOrder.findByIdAndUpdate(sample.orderId, {
      status: 'IN_PROCESS'
    });

    await AuditService.logAction({
      action: 'LAB_SAMPLE_ACCEPTED',
      module: 'LABORATORY',
      entityId: sample.sampleId,
      entityType: 'LabSample',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Sample accepted for testing. Accession: ${sample.accessionNumber}`
    });

    return sample;
  }

  /**
   * Reject a sample with operational reasons
   */
  static async rejectSample({ identifier, rejectionReason, rejectionNotes = '', recollectionRequired = true, user = null }) {
    const idStr = String(identifier || '');
    const sample = await LabSample.findOne({
      $or: [
        { accessionNumber: idStr },
        { sampleId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!sample) {
      throw new Error(`Sample with identifier '${identifier}' was not found.`);
    }

    sample.status = 'REJECTED';
    sample.rejectionReason = rejectionReason;
    sample.rejectionNotes = rejectionNotes;
    sample.rejectionRecordedBy = user?._id || null;
    sample.rejectionRecordedAt = new Date();
    sample.recollectionRequired = Boolean(recollectionRequired);
    await sample.save();

    await LabOrderItem.findByIdAndUpdate(sample.orderItemId, {
      status: 'REJECTED'
    });

    // Create an operational exception case
    const exceptionId = await IdGeneratorService.generateLabExceptionId();
    const labException = new LabException({
      exceptionId,
      type: 'SAMPLE_REJECTED',
      severity: 'HIGH',
      patientId: sample.patientId,
      patientCode: sample.patientCode,
      orderId: sample.orderId,
      orderIdString: sample.orderIdString,
      sampleId: sample._id,
      sampleAccessionNumber: sample.accessionNumber,
      description: `Sample rejected: ${rejectionReason}. ${rejectionNotes ? 'Notes: ' + rejectionNotes : ''}`,
      source: 'MERN_VALIDATION',
      status: 'OPEN'
    });
    await labException.save();

    // Trigger notification to phlebotomy / ordering doctor
    try {
      await NotificationService.sendNotification({
        userId: user?.userId || 'SYSTEM',
        recipient: sample.patientCode,
        channel: 'IN_APP',
        templateCode: 'LAB_SAMPLE_REJECTED',
        variables: {
          accessionNumber: sample.accessionNumber,
          reason: rejectionReason,
          recollectionRequired: recollectionRequired ? 'Yes' : 'No'
        }
      });
    } catch (e) {
      // Non-blocking notification
    }

    await AuditService.logAction({
      action: 'LAB_SAMPLE_REJECTED',
      module: 'LABORATORY',
      entityId: sample.sampleId,
      entityType: 'LabSample',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Sample rejected: ${rejectionReason} for accession ${sample.accessionNumber}`
    });

    return {
      sample,
      exception: labException
    };
  }

  /**
   * List samples with filters
   */
  static async listSamples({ status = '', search = '', labOrderId = '', orderId = '', patientId = '', page = 1, limit = 50 }) {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const ord = labOrderId || orderId;
    if (ord) {
      if (String(ord).match(/^[0-9a-fA-F]{24}$/)) {
        filter.orderId = ord;
      } else {
        const orderDoc = await LabOrder.findOne({ orderId: ord });
        if (orderDoc) {
          filter.orderId = orderDoc._id;
        } else {
          filter.orderId = null;
        }
      }
    }
    if (patientId) {
      filter.patientCode = patientId;
    }
    if (search) {
      filter.$or = [
        { accessionNumber: { $regex: search, $options: 'i' } },
        { sampleId: { $regex: search, $options: 'i' } },
        { patientCode: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [samples, total] = await Promise.all([
      LabSample.find(filter)
        .populate('orderId')
        .populate('orderItemId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabSample.countDocuments(filter)
    ]);

    return {
      samples,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  static async getSampleById(identifier) {
    const idStr = String(identifier || '');
    const sample = await LabSample.findOne({
      $or: [
        { accessionNumber: idStr },
        { sampleId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    })
      .populate('orderId')
      .populate('orderItemId')
      .lean();

    if (!sample) {
      throw new Error(`Sample '${identifier}' not found.`);
    }
    return sample;
  }
}

module.exports = SampleService;

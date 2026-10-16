const LabResult = require('../../models/LabResult');
const LabOrderItem = require('../../models/LabOrderItem');
const LabOrder = require('../../models/LabOrder');
const LabTest = require('../../models/LabTest');
const HospitalConfiguration = require('../../models/HospitalConfiguration');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const LaboratoryInventoryService = require('./inventoryService');

class ResultService {
  /**
   * Enter or update draft / pending laboratory result
   */
  static async enterResult({
    orderItemId,
    labOrderId,
    orderId,
    sampleId,
    labTestId,
    resultValue = '',
    resultText = '',
    unit = '',
    referenceRangeSnapshot = '',
    abnormalFlag = 'NORMAL',
    parameters = [],
    technicianNotes = '',
    submitForVerification = false,
    user = null
  }) {
    let orderItem = null;
    if (orderItemId) {
      if (String(orderItemId).match(/^[0-9a-fA-F]{24}$/)) {
        orderItem = await LabOrderItem.findById(orderItemId).populate('orderId');
      }
      if (!orderItem) {
        orderItem = await LabOrderItem.findOne({ orderItemId }).populate('orderId');
      }
    }
    if (!orderItem && (labOrderId || orderId)) {
      const ordIdentifier = labOrderId || orderId;
      const orderDoc = String(ordIdentifier).match(/^[0-9a-fA-F]{24}$/)
        ? await LabOrder.findById(ordIdentifier)
        : await LabOrder.findOne({ orderId: ordIdentifier });
      if (orderDoc) {
        orderItem = await LabOrderItem.findOne({ orderId: orderDoc._id }).populate('orderId');
      }
    }
    if (!orderItem && sampleId) {
      orderItem = await LabOrderItem.findOne({
        $or: [
          ...(String(sampleId).match(/^[0-9a-fA-F]{24}$/) ? [{ sampleId }] : []),
          { sampleAccessionNumber: sampleId }
        ]
      }).populate('orderId');
    }

    if (!orderItem) {
      throw new Error(`Order item could not be found for '${orderItemId || labOrderId || sampleId}'.`);
    }

    let result = await LabResult.findOne({
      orderItemId: orderItem._id,
      status: { $in: ['DRAFT', 'ENTERED', 'PENDING_VERIFICATION'] }
    });

    const isNew = !result;
    if (isNew) {
      const resultId = await IdGeneratorService.generateLabResultId();
      result = new LabResult({
        resultId,
        orderId: orderItem.orderId._id,
        orderIdString: orderItem.orderId.orderId,
        orderItemId: orderItem._id,
        sampleId: orderItem.sampleId,
        sampleAccessionNumber: orderItem.sampleAccessionNumber,
        patientId: orderItem.orderId.patientId,
        patientCode: orderItem.orderId.patientCode,
        testId: orderItem.labTestId,
        testCodeSnapshot: orderItem.testCodeSnapshot,
        testNameSnapshot: orderItem.testNameSnapshot,
        version: 1
      });
    }

    result.resultValue = resultValue;
    result.resultText = resultText;
    result.unit = unit;
    result.referenceRangeSnapshot = referenceRangeSnapshot;
    result.abnormalFlag = abnormalFlag;
    result.technicianNotes = technicianNotes;
    if (parameters && parameters.length > 0) {
      result.parameters = parameters.map((p, idx) => ({
        parameterName: p.parameterName || p.name || `Param-${idx + 1}`,
        parameterCode: p.parameterCode || p.code || (p.name ? p.name.toUpperCase().replace(/\s+/g, '_') : `P${idx + 1}`),
        resultValue: String(p.resultValue !== undefined ? p.resultValue : (p.value !== undefined ? p.value : '')),
        unit: p.unit || '',
        referenceRangeSnapshot: p.referenceRangeSnapshot || p.referenceRange || '',
        abnormalFlag: p.abnormalFlag || p.flag || 'NORMAL',
        comments: p.comments || ''
      }));
    }

    result.enteredBy = user?._id || null;
    result.enteredByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Lab Technician';
    result.enteredAt = new Date();
    result.status = submitForVerification ? 'PENDING_VERIFICATION' : 'ENTERED';

    result.auditTrail.push({
      action: isNew ? 'RESULT_ENTERED' : 'RESULT_UPDATED',
      performedBy: user?.userId || 'SYSTEM',
      timestamp: new Date(),
      details: submitForVerification ? 'Result submitted for verification' : 'Result draft saved'
    });

    await result.save();

    orderItem.resultId = result._id;
    orderItem.status = submitForVerification ? 'RESULT_ENTERED' : orderItem.status;
    await orderItem.save();

    await AuditService.logAction({
      action: submitForVerification ? 'LAB_RESULT_SUBMITTED_FOR_VERIFICATION' : 'LAB_RESULT_SAVED',
      module: 'LABORATORY',
      entityId: result.resultId,
      entityType: 'LabResult',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Result for test ${result.testCodeSnapshot} (${result.resultId}) ${submitForVerification ? 'submitted for verification' : 'saved'}`
    });

    return result;
  }

  /**
   * Verify entered laboratory result with segregation of duties check
   */
  static async verifyResult({ resultId, verifierNotes = '', user = null }) {
    const resIdStr = String(resultId || '');
    const result = await LabResult.findOne({
      $or: [{ resultId: resIdStr }, { _id: resIdStr.match(/^[0-9a-fA-F]{24}$/) ? resIdStr : null }]
    });

    if (!result) {
      throw new Error(`Laboratory result '${resultId}' not found.`);
    }

    if (result.status === 'VERIFIED' || result.status === 'RELEASED') {
      throw new Error(`Result '${result.resultId}' is already verified. Use amendment workflow to make changes.`);
    }

    // Segregation of Duties Check
    let enforceSegregation = false;
    try {
      const config = await HospitalConfiguration.findOne({ configKey: 'LAB_SEGREGATION_OF_DUTIES' });
      if (config && config.configValue === 'true') {
        enforceSegregation = true;
      }
    } catch (e) {}

    if (enforceSegregation && result.enteredBy && user?._id) {
      if (String(result.enteredBy) === String(user._id)) {
        throw new Error('Segregation of duties policy violation: Result entry user cannot verify their own result.');
      }
    }

    result.status = 'VERIFIED';
    result.verifiedBy = user?._id || null;
    result.verifiedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Authorized Verifier';
    result.verifiedAt = new Date();
    result.verifierNotes = verifierNotes;

    result.auditTrail.push({
      action: 'RESULT_VERIFIED',
      performedBy: user?.userId || 'SYSTEM',
      timestamp: new Date(),
      details: `Verified by ${result.verifiedByName}`
    });

    await result.save();

    // Update order item status
    await LabOrderItem.findByIdAndUpdate(result.orderItemId, {
      status: 'VERIFIED'
    });

    // Automatically trigger inventory reagent consumption for the test if configured
    try {
      const labTest = await LabTest.findById(result.testId);
      const orderItem = await LabOrderItem.findById(result.orderItemId);
      if (labTest && orderItem) {
        await LaboratoryInventoryService.consumeReagentsForTest({ orderItem, labTest, user });
      }
    } catch (invErr) {
      console.warn('[Lab Inventory Consumption Warning]:', invErr.message);
    }

    await AuditService.logAction({
      action: 'LAB_RESULT_VERIFIED',
      module: 'LABORATORY',
      entityId: result.resultId,
      entityType: 'LabResult',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Verified result ${result.resultId} for test ${result.testCodeSnapshot}`
    });

    return result;
  }

  /**
   * Amend a verified/released laboratory result through controlled workflow
   */
  static async amendResult({
    resultId,
    amendmentReason,
    resultValue,
    resultText,
    unit,
    referenceRangeSnapshot,
    abnormalFlag,
    parameters = [],
    amendmentNotes = '',
    user = null
  }) {
    if (!amendmentReason || !amendmentReason.trim()) {
      throw new Error('An authorized amendment reason is required.');
    }

    const resIdStr = String(resultId || '');
    const previousResult = await LabResult.findOne({
      $or: [{ resultId: resIdStr }, { _id: resIdStr.match(/^[0-9a-fA-F]{24}$/) ? resIdStr : null }]
    });

    if (!previousResult) {
      throw new Error(`Laboratory result '${resultId}' not found.`);
    }

    // Generate new result ID for the amended version
    const newResultId = await IdGeneratorService.generateLabResultId();
    const newVersion = (previousResult.version || 1) + 1;

    const normalizedParameters = (parameters && parameters.length > 0)
      ? parameters.map(p => ({
          parameterCode: p.parameterCode || p.code || 'PARAM',
          parameterName: p.parameterName || p.name || 'Parameter',
          resultValue: p.resultValue !== undefined ? String(p.resultValue) : String(p.value || ''),
          unit: p.unit || '',
          referenceRangeSnapshot: p.referenceRangeSnapshot || p.referenceRange || '',
          abnormalFlag: p.abnormalFlag || p.flag || 'NORMAL',
          numericValue: !isNaN(parseFloat(p.resultValue || p.value)) ? parseFloat(p.resultValue || p.value) : null
        }))
      : previousResult.parameters;

    const amendedResult = new LabResult({
      resultId: newResultId,
      orderId: previousResult.orderId,
      orderIdString: previousResult.orderIdString,
      orderItemId: previousResult.orderItemId,
      sampleId: previousResult.sampleId,
      sampleAccessionNumber: previousResult.sampleAccessionNumber,
      patientId: previousResult.patientId,
      patientCode: previousResult.patientCode,
      testId: previousResult.testId,
      testCodeSnapshot: previousResult.testCodeSnapshot,
      testNameSnapshot: previousResult.testNameSnapshot,
      parameters: normalizedParameters,
      resultValue: resultValue !== undefined ? resultValue : previousResult.resultValue,
      resultText: resultText !== undefined ? resultText : previousResult.resultText,
      unit: unit !== undefined ? unit : previousResult.unit,
      referenceRangeSnapshot: referenceRangeSnapshot !== undefined ? referenceRangeSnapshot : previousResult.referenceRangeSnapshot,
      abnormalFlag: abnormalFlag !== undefined ? abnormalFlag : previousResult.abnormalFlag,
      technicianNotes: amendmentNotes,
      status: 'AMENDED',
      enteredBy: user?._id || null,
      enteredByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Authorised Staff',
      enteredAt: new Date(),
      verifiedBy: user?._id || null,
      verifiedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Authorised Verifier',
      verifiedAt: new Date(),
      version: newVersion,
      amendmentReason,
      previousResultId: previousResult._id,
      auditTrail: [
        ...previousResult.auditTrail,
        {
          action: 'RESULT_AMENDED',
          performedBy: user?.userId || 'SYSTEM',
          timestamp: new Date(),
          details: `Amended from version ${previousResult.version} to version ${newVersion}. Reason: ${amendmentReason}`
        }
      ]
    });

    await amendedResult.save();

    // Update order item to point to latest amended result
    await LabOrderItem.findByIdAndUpdate(previousResult.orderItemId, {
      resultId: amendedResult._id,
      status: 'VERIFIED'
    });

    await AuditService.logAction({
      action: 'LAB_RESULT_AMENDED',
      module: 'LABORATORY',
      entityId: amendedResult.resultId,
      entityType: 'LabResult',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Amended result for test ${amendedResult.testCodeSnapshot} (v${newVersion}). Reason: ${amendmentReason}`
    });

    return amendedResult;
  }

  static async getResultById(identifier) {
    const idStr = String(identifier || '');
    const result = await LabResult.findOne({
      $or: [{ resultId: idStr }, { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }]
    })
      .populate('orderId')
      .populate('orderItemId')
      .populate('sampleId')
      .populate('previousResultId')
      .lean();

    if (!result) {
      throw new Error(`Laboratory result '${identifier}' not found.`);
    }
    return result;
  }

  static async getVerificationQueue({ search = '', page = 1, limit = 50 }) {
    const filter = { status: 'PENDING_VERIFICATION' };
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [results, total] = await Promise.all([
      LabResult.find(filter)
        .populate('orderId')
        .populate('orderItemId')
        .populate('sampleId')
        .sort({ enteredAt: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabResult.countDocuments(filter)
    ]);

    return {
      queue: results,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }
}

module.exports = ResultService;

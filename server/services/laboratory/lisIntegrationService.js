const LabOrder = require('../../models/LabOrder');
const LabOrderItem = require('../../models/LabOrderItem');
const LabResult = require('../../models/LabResult');
const LabException = require('../../models/LabException');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');
const ResultService = require('./resultService');

class LisIntegrationService {
  /**
   * Sync an internal lab order to external LIS with idempotency
   */
  static async syncOrderToExternalLis({ orderIdentifier, simulateFailure = false, simulateMismatch = false, user = null }) {
    const idStr = String(orderIdentifier || '');
    const order = await LabOrder.findOne({
      $or: [
        { orderId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!order) {
      throw new Error(`Order '${orderIdentifier}' not found.`);
    }

    // Idempotency: If already synced successfully, return existing sync details
    if (order.externalLisSyncStatus === 'SYNCED' && order.externalLisOrderId) {
      return {
        isDuplicate: true,
        orderId: order.orderId,
        externalLisOrderId: order.externalLisOrderId,
        status: order.externalLisSyncStatus,
        message: `Order ${order.orderId} is already synchronized with external LIS (${order.externalLisOrderId}).`
      };
    }

    // Mismatch simulation: e.g. External system has different patient record
    if (simulateMismatch) {
      const exceptionId = await IdGeneratorService.generateLabExceptionId();
      const exception = new LabException({
        exceptionId,
        type: 'PATIENT_MISMATCH',
        severity: 'HIGH',
        orderId: order._id,
        orderIdString: order.orderId,
        patientId: order.patientId,
        patientCode: order.patientCode,
        description: `External LIS identity conflict: Patient demographic mismatch on patient ${order.patientCode} during order synchronization.`,
        source: 'EXTERNAL_LIS',
        status: 'OPEN'
      });
      await exception.save();

      order.externalLisSyncStatus = 'FAILED';
      await order.save();

      return {
        isDuplicate: false,
        success: false,
        error: 'Patient identity mismatch detected in external LIS.',
        exception
      };
    }

    // Outage / Failure simulation
    if (simulateFailure) {
      const exceptionId = await IdGeneratorService.generateLabExceptionId();
      const exception = new LabException({
        exceptionId,
        type: 'EXTERNAL_LIS_UNAVAILABLE',
        severity: 'MEDIUM',
        orderId: order._id,
        orderIdString: order.orderId,
        description: `External LIS endpoint timeout or service unavailable while syncing order ${order.orderId}. Queued for retry.`,
        source: 'EXTERNAL_LIS',
        status: 'WAITING_FOR_EXTERNAL_SYSTEM'
      });
      await exception.save();

      order.externalLisSyncStatus = 'FAILED';
      await order.save();

      return {
        isDuplicate: false,
        success: false,
        error: 'External LIS unavailable.',
        exception
      };
    }

    // Successful sync
    const externalLisOrderId = `LIS-ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    order.externalLisOrderId = externalLisOrderId;
    order.externalLisSyncStatus = 'SYNCED';
    order.externalLisSyncAt = new Date();
    await order.save();

    await AuditService.logAction({
      action: 'LAB_LIS_ORDER_SYNCED',
      module: 'LABORATORY',
      entityId: order.orderId,
      entityType: 'LabOrder',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Synchronized order ${order.orderId} to external LIS. External Order ID: ${externalLisOrderId}`
    });

    return {
      isDuplicate: false,
      success: true,
      orderId: order.orderId,
      externalLisOrderId,
      status: 'SYNCED',
      message: 'Order successfully synchronized with external Laboratory Information System.'
    };
  }

  /**
   * Fetch results from external LIS
   */
  static async fetchResultsFromExternalLis({ orderIdentifier, simulateMismatch = false, user = null }) {
    const idStr = String(orderIdentifier || '');
    const order = await LabOrder.findOne({
      $or: [
        { orderId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!order) {
      throw new Error(`Order '${orderIdentifier}' not found.`);
    }

    if (!order.externalLisOrderId) {
      throw new Error(`Order '${order.orderId}' has not been synced to external LIS yet.`);
    }

    if (simulateMismatch) {
      const exceptionId = await IdGeneratorService.generateLabExceptionId();
      const exception = new LabException({
        exceptionId,
        type: 'RESULT_MISMATCH',
        severity: 'CRITICAL',
        orderId: order._id,
        orderIdString: order.orderId,
        description: `External LIS returned report identifier mismatch or unexpected test results for external order ${order.externalLisOrderId}. Stopped for human review.`,
        source: 'EXTERNAL_LIS',
        status: 'OPEN'
      });
      await exception.save();

      return {
        success: false,
        error: 'External result mismatch detected. Exception created for authorized human review.',
        exception
      };
    }

    // Retrieve order items and populate entered results
    const orderItems = await LabOrderItem.find({ orderId: order._id });
    const importedResults = [];

    for (const item of orderItems) {
      // Simulate external machine values based on test
      let resultVal = '13.5';
      let unit = 'g/dL';
      let refRange = '12.0 - 16.0 g/dL';
      let flag = 'NORMAL';

      if (item.testCodeSnapshot === 'GLUCOSE') {
        resultVal = '96';
        unit = 'mg/dL';
        refRange = '70 - 100 mg/dL';
      } else if (item.testCodeSnapshot === 'LFT') {
        resultVal = 'Within normal limits';
        unit = '';
        refRange = 'Reference values verified';
      } else if (item.testCodeSnapshot === 'KFT') {
        resultVal = '1.0';
        unit = 'mg/dL';
        refRange = '0.6 - 1.2 mg/dL';
      } else if (item.testCodeSnapshot === 'LIPID') {
        resultVal = '180';
        unit = 'mg/dL';
        refRange = '< 200 mg/dL';
      }

      const res = await ResultService.enterResult({
        orderItemId: item._id,
        resultValue: resultVal,
        resultText: `External LIS Analyzer Automated Readout: ${resultVal} ${unit}`,
        unit,
        referenceRangeSnapshot: refRange,
        abnormalFlag: flag,
        technicianNotes: `Ingested from External LIS (Ref: ${order.externalLisOrderId})`,
        submitForVerification: true,
        user
      });

      importedResults.push(res);
    }

    return {
      success: true,
      orderId: order.orderId,
      externalLisOrderId: order.externalLisOrderId,
      importedCount: importedResults.length,
      results: importedResults,
      message: 'External LIS results fetched and queued for pathologist verification.'
    };
  }

  /**
   * Reconcile unknown external transaction outcome
   */
  static async reconcileUnknownOrder({ orderIdentifier, externalConfirmed = true, user = null }) {
    const idStr = String(orderIdentifier || '');
    const order = await LabOrder.findOne({
      $or: [
        { orderId: idStr },
        { _id: idStr.match(/^[0-9a-fA-F]{24}$/) ? idStr : null }
      ]
    });

    if (!order) {
      throw new Error(`Order '${orderIdentifier}' not found.`);
    }

    if (externalConfirmed) {
      if (!order.externalLisOrderId) {
        order.externalLisOrderId = `LIS-ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      order.externalLisSyncStatus = 'RECONCILED';
      await order.save();

      // Resolve open exception if any
      await LabException.updateMany(
        { orderId: order._id, type: { $in: ['EXTERNAL_LIS_UNAVAILABLE', 'EXTERNAL_RESULT_UNKNOWN'] }, status: 'WAITING_FOR_EXTERNAL_SYSTEM' },
        { status: 'RESOLVED', resolution: 'Reconciled via external verification', resolvedAt: new Date(), resolvedBy: user?._id || null }
      );

      return {
        success: true,
        orderId: order.orderId,
        externalLisOrderId: order.externalLisOrderId,
        status: 'RECONCILED',
        message: 'Order reconciled and verified against external LIS.'
      };
    } else {
      order.externalLisSyncStatus = 'FAILED';
      await order.save();

      return {
        success: false,
        orderId: order.orderId,
        status: 'FAILED',
        message: 'External verification confirmed order does not exist in LIS. Re-queued for sync.'
      };
    }
  }
}

module.exports = LisIntegrationService;

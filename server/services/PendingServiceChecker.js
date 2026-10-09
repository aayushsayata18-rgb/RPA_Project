const BillingCharge = require('../models/BillingCharge');

class PendingServiceChecker {
  /**
   * Check all pending service orders, results, and charges for an admission
   */
  static async checkPendingServices({ patientId, admissionId }) {
    // Look for any charges or service orders in 'PENDING' status for this admission
    const pendingCharges = await BillingCharge.find({
      admissionId,
      status: 'PENDING'
    }).lean();

    const laboratory = [];
    const radiology = [];
    const pharmacy = [];
    const consultations = [];
    const otherServices = [];

    for (const item of pendingCharges) {
      const formatted = {
        id: item._id,
        serviceType: item.serviceType,
        itemReference: item.chargeId || item.serviceReferenceId,
        description: item.serviceName,
        status: item.status,
        amount: item.totalAmount,
        detectedAt: item.chargeDate || item.createdAt
      };

      if (item.serviceType === 'LABORATORY') {
        laboratory.push(formatted);
      } else if (item.serviceType === 'RADIOLOGY') {
        radiology.push(formatted);
      } else if (item.serviceType === 'PHARMACY') {
        pharmacy.push(formatted);
      } else if (item.serviceType === 'CONSULTATION') {
        consultations.push(formatted);
      } else {
        otherServices.push(formatted);
      }
    }

    const allPending = [
      ...laboratory,
      ...radiology,
      ...pharmacy,
      ...consultations,
      ...otherServices
    ];

    return {
      hasPendingItems: allPending.length > 0,
      hasPendingServices: allPending.length > 0,
      totalPendingCount: allPending.length,
      pendingItems: allPending,
      laboratory,
      radiology,
      pharmacy,
      consultations,
      otherServices,
      allPending
    };

  }
}

module.exports = PendingServiceChecker;

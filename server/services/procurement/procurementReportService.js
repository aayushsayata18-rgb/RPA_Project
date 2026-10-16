const PurchaseRequest = require('../../models/PurchaseRequest');
const RFQ = require('../../models/RFQ');
const Quotation = require('../../models/Quotation');
const PurchaseOrder = require('../../models/PurchaseOrder');
const Delivery = require('../../models/Delivery');
const SupplierInvoice = require('../../models/SupplierInvoice');
const ExceptionCase = require('../../models/ExceptionCase');

class ProcurementReportService {
  /**
   * Get procurement dashboard KPIs (Section 93)
   */
  static async getDashboardKPIs() {
    const [
      openRequests,
      pendingApprovalRequests,
      openRfqs,
      openPOs,
      approvedPOs,
      delayedDeliveries,
      invoiceMismatches,
      openExceptions,
      totalSpendResult
    ] = await Promise.all([
      PurchaseRequest.countDocuments({ status: { $nin: ['FULFILLED', 'CLOSED', 'CANCELLED', 'REJECTED'] } }),
      PurchaseRequest.countDocuments({ status: { $in: ['SUBMITTED', 'PENDING_APPROVAL'] } }),
      RFQ.countDocuments({ status: { $in: ['DRAFT', 'ISSUED', 'PARTIALLY_RESPONDED'] } }),
      PurchaseOrder.countDocuments({ status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_VENDOR', 'ACKNOWLEDGED', 'IN_TRANSIT'] } }),
      PurchaseOrder.countDocuments({ status: 'APPROVED' }),
      Delivery.countDocuments({ status: 'DELAYED' }),
      SupplierInvoice.countDocuments({ matchStatus: { $in: ['PRICE_MISMATCH', 'QUANTITY_MISMATCH', 'ITEM_MISMATCH', 'TAX_MISMATCH'] } }),
      ExceptionCase.countDocuments({ module: 'PROCUREMENT', currentStatus: 'OPEN' }),
      PurchaseOrder.aggregate([
        { $match: { status: { $nin: ['CANCELLED', 'REJECTED'] } } },
        { $group: { _id: null, totalSpend: { $sum: '$grandTotal' }, poCount: { $sum: 1 } } }
      ])
    ]);

    const totalSpend = totalSpendResult.length > 0 ? totalSpendResult[0].totalSpend : 0;
    const poCount = totalSpendResult.length > 0 ? totalSpendResult[0].poCount : 0;

    return {
      openRequests,
      pendingApprovalRequests,
      openRfqs,
      openPOs,
      approvedPOs,
      delayedDeliveries,
      invoiceMismatches,
      openExceptions,
      totalSpend,
      poCount
    };
  }

  /**
   * Spend analytics by department & category (Section 92)
   */
  static async getSpendAnalytics() {
    const [departmentSpend, categorySpend, vendorSpend] = await Promise.all([
      PurchaseRequest.aggregate([
        { $match: { status: { $in: ['PO_CREATED', 'ORDERED', 'FULFILLED', 'APPROVED'] } } },
        {
          $group: {
            _id: '$departmentName',
            totalEstimated: { $sum: '$estimatedTotal' },
            requestCount: { $sum: 1 }
          }
        },
        { $sort: { totalEstimated: -1 } }
      ]),
      PurchaseRequest.aggregate([
        { $match: { status: { $in: ['PO_CREATED', 'ORDERED', 'FULFILLED', 'APPROVED'] } } },
        {
          $group: {
            _id: '$category',
            totalEstimated: { $sum: '$estimatedTotal' },
            requestCount: { $sum: 1 }
          }
        },
        { $sort: { totalEstimated: -1 } }
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: { $nin: ['CANCELLED', 'REJECTED'] } } },
        {
          $group: {
            _id: '$vendorName',
            vendorId: { $first: '$vendorId' },
            totalPOValue: { $sum: '$grandTotal' },
            poCount: { $sum: 1 }
          }
        },
        { $sort: { totalPOValue: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      departmentSpend,
      categorySpend,
      vendorSpend
    };
  }

  /**
   * Delivery performance & on-time metrics (Section 92)
   */
  static async getDeliveryPerformance() {
    const totalDeliveries = await Delivery.countDocuments();
    const delivered = await Delivery.countDocuments({ status: 'DELIVERED' });
    const delayed = await Delivery.countDocuments({ status: 'DELAYED' });
    const inTransit = await Delivery.countDocuments({ status: { $in: ['SHIPPED', 'IN_TRANSIT'] } });

    const onTimeRate = totalDeliveries > 0 ? Math.round(((totalDeliveries - delayed) / totalDeliveries) * 100) : 100;

    return {
      totalDeliveries,
      delivered,
      delayed,
      inTransit,
      onTimeRate
    };
  }
}

module.exports = ProcurementReportService;

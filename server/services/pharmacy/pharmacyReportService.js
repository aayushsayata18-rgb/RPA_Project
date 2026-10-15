const PharmacyOrder = require('../../models/PharmacyOrder');
const Prescription = require('../../models/Prescription');
const DispensingRecord = require('../../models/DispensingRecord');
const PharmacyReturn = require('../../models/PharmacyReturn');
const Medicine = require('../../models/Medicine');
const InventoryBatch = require('../../models/InventoryBatch');
const RPAJob = require('../../models/RPAJob');
const ExceptionCase = require('../../models/ExceptionCase');

class PharmacyReportService {
  /**
   * Get operational KPIs for the Pharmacy Dashboard (Section 43 & 78)
   */
  static async getDashboardKPIs() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const now = new Date();
    const nearExpiryCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      todayOrdersCount,
      pendingOrdersCount,
      readyOrdersCount,
      partialOrdersCount,
      dispensedTodayCount,
      pendingPrescriptionsCount,
      pendingReturnsCount,
      nearExpiryBatchesCount,
      activeRpaJobsCount,
      openExceptionsCount
    ] = await Promise.all([
      PharmacyOrder.countDocuments({ requestedAt: { $gte: startOfToday, $lte: endOfToday } }),
      PharmacyOrder.countDocuments({ status: { $in: ['NEW', 'RECEIVED', 'VALIDATING'] } }),
      PharmacyOrder.countDocuments({ status: 'READY_FOR_DISPENSING' }),
      PharmacyOrder.countDocuments({ status: 'PARTIALLY_FULFILLED' }),
      DispensingRecord.countDocuments({ dispensedAt: { $gte: startOfToday, $lte: endOfToday } }),
      Prescription.countDocuments({ status: { $in: ['ISSUED', 'SENT_TO_PHARMACY', 'UNDER_REVIEW'] } }),
      PharmacyReturn.countDocuments({ status: { $in: ['REQUESTED', 'UNDER_REVIEW'] } }),
      InventoryBatch.countDocuments({
        status: 'ACTIVE',
        availableQuantity: { $gt: 0 },
        expiryDate: { $gte: now, $lte: nearExpiryCutoff }
      }),
      RPAJob.countDocuments({ module: 'PHARMACY', status: { $in: ['CREATED', 'QUEUED', 'RUNNING'] } }),
      ExceptionCase.countDocuments({ module: 'PHARMACY', status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] } })
    ]);

    // Fast check for out of stock medicines
    const activeMedicines = await Medicine.find({ status: 'ACTIVE' }).select('medicineId').lean();
    let outOfStockCount = 0;
    for (const med of activeMedicines) {
      const activeStock = await InventoryBatch.aggregate([
        { $match: { medicineId: med.medicineId, status: 'ACTIVE', expiryDate: { $gt: now } } },
        { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
      ]);
      const available = activeStock.length > 0 ? activeStock[0].total : 0;
      if (available <= 0) {
        outOfStockCount++;
      }
    }

    return {
      todayOrders: todayOrdersCount,
      pendingOrders: pendingOrdersCount,
      readyOrders: readyOrdersCount,
      partialOrders: partialOrdersCount,
      dispensedToday: dispensedTodayCount,
      pendingPrescriptions: pendingPrescriptionsCount,
      outOfStockItems: outOfStockCount,
      nearExpiryItems: nearExpiryBatchesCount,
      pendingReturns: pendingReturnsCount,
      activeRpaJobs: activeRpaJobsCount,
      openExceptions: openExceptionsCount
    };
  }

  /**
   * Dispensing report with aggregation
   */
  static async getDispensingReport({ startDate, endDate }) {
    const match = {};
    if (startDate || endDate) {
      match.dispensedAt = {};
      if (startDate) match.dispensedAt.$gte = new Date(startDate);
      if (endDate) match.dispensedAt.$lte = new Date(endDate);
    }

    const records = await DispensingRecord.find(match).sort({ dispensedAt: -1 }).limit(100).lean();

    // Aggregations
    const medicineStats = {};
    const pharmacistStats = {};
    let grandTotalRevenue = 0;

    for (const rec of records) {
      grandTotalRevenue += rec.totalAmount || 0;

      const pKey = rec.pharmacistName || rec.pharmacistId || 'Unknown';
      pharmacistStats[pKey] = (pharmacistStats[pKey] || 0) + 1;

      for (const item of rec.items) {
        const mKey = item.medicineName;
        if (!medicineStats[mKey]) {
          medicineStats[mKey] = { quantity: 0, totalAmount: 0 };
        }
        medicineStats[mKey].quantity += item.dispensedQuantity;
        medicineStats[mKey].totalAmount += item.totalPrice;
      }
    }

    return {
      totalDispensingTransactions: records.length,
      grandTotalRevenue: Math.round(grandTotalRevenue * 100) / 100,
      medicineStats,
      pharmacistStats,
      recentRecords: records.slice(0, 20)
    };
  }

  /**
   * Order volume breakdown
   */
  static async getOrdersReport({ startDate, endDate, orderType }) {
    const match = {};
    if (orderType) match.orderType = orderType;
    if (startDate || endDate) {
      match.requestedAt = {};
      if (startDate) match.requestedAt.$gte = new Date(startDate);
      if (endDate) match.requestedAt.$lte = new Date(endDate);
    }

    const [statusBreakdown, typeBreakdown, totalOrders] = await Promise.all([
      PharmacyOrder.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      PharmacyOrder.aggregate([{ $match: match }, { $group: { _id: '$orderType', count: { $sum: 1 } } }]),
      PharmacyOrder.countDocuments(match)
    ]);

    return {
      totalOrders,
      statusBreakdown: statusBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      typeBreakdown: typeBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    };
  }
}

module.exports = PharmacyReportService;

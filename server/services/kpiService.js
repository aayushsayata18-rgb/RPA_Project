const mongoose = require('mongoose');
const KPIDefinition = require('../models/KPIDefinition');
const KPISnapshot = require('../models/KPISnapshot');
const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');

/**
 * Module 28: KPIService
 * Real-time Metric Aggregation, Trend Tracking & Alert Rule Triggers
 * (28_REPORTS_ANALYTICS.md Section 67-70, 102-103)
 */
class KPIService {
  static getModel(modelName) {
    if (mongoose.models[modelName]) return mongoose.models[modelName];
    const modelMap = {
      Patient: 'Patient',
      Appointment: 'Appointment',
      Bed: 'Bed',
      Invoice: 'Invoice',
      Payment: 'PaymentTransaction',
      PaymentTransaction: 'PaymentTransaction',
      Feedback: 'Feedback',
      RPAJob: 'RPAJob',
      ExceptionCase: 'ExceptionCase'
    };
    const target = modelMap[modelName] || modelName;
    try {
      return require(`../models/${target}`);
    } catch (e) {
      return mongoose.model(modelName);
    }
  }

  /**
   * Get list of all defined KPIs with current snapshot
   */
  static async listKPIs() {
    const definitions = await KPIDefinition.find({ enabled: true }).sort({ category: 1, name: 1 }).lean();
    const results = [];

    for (const def of definitions) {
      const latestSnapshot = await KPISnapshot.findOne({ kpiCode: def.kpiCode })
        .sort({ generatedAt: -1 })
        .lean();

      results.push({
        ...def,
        currentValue: latestSnapshot ? latestSnapshot.value : 0,
        trend: latestSnapshot ? latestSnapshot.trend : { changePercent: 0, direction: 'FLAT' },
        lastUpdated: latestSnapshot ? latestSnapshot.generatedAt : null
      });
    }

    return results;
  }

  /**
   * Calculate all standard KPIs across operational models
   */
  static async calculateAllKPIs() {
    const Patient = this.getModel('Patient');
    const Appointment = this.getModel('Appointment');
    const Bed = this.getModel('Bed');
    const Invoice = this.getModel('Invoice');
    const Payment = this.getModel('Payment');
    const Feedback = this.getModel('Feedback');
    const RPAJob = this.getModel('RPAJob');
    const ExceptionCase = this.getModel('ExceptionCase');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Patient Registrations Today
    const patientsToday = await Patient.countDocuments({ createdAt: { $gte: todayStart } });

    // 2. Bed Occupancy Rate
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: 'OCCUPIED' });
    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // 3. Appointments Today & Completion Rate
    const apptsToday = await Appointment.find({ createdAt: { $gte: todayStart } }).lean();
    const completedAppts = apptsToday.filter((a) => a.status === 'COMPLETED').length;
    const apptCompletionRate = apptsToday.length > 0 ? Number(((completedAppts / apptsToday.length) * 100).toFixed(1)) : 100;

    // 4. Collections Today (INR)
    const paymentsToday = await Payment.find({ createdAt: { $gte: todayStart } }).lean();
    const collectionsToday = paymentsToday.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 5. Total Outstanding Invoices (INR)
    const unpaidInvoices = await Invoice.find({ status: { $ne: 'PAID' } }).lean();
    const outstandingINR = unpaidInvoices.reduce((sum, i) => sum + ((i.totalAmount || 0) - (i.paidAmount || 0)), 0);

    // 6. Average Patient Satisfaction (1-5)
    const ratedFeedbacks = await Feedback.find({ rating: { $ne: null } }).lean();
    const avgRating = ratedFeedbacks.length > 0
      ? Number((ratedFeedbacks.reduce((sum, f) => sum + f.rating, 0) / ratedFeedbacks.length).toFixed(1))
      : 4.5;

    // 7. RPA Success Rate
    const totalJobs = await RPAJob.countDocuments();
    const completedJobs = await RPAJob.countDocuments({ status: 'COMPLETED' });
    const rpaSuccessRate = totalJobs > 0 ? Number(((completedJobs / totalJobs) * 100).toFixed(1)) : 100;

    // 8. Open Critical Exceptions
    const openCriticalExceptions = await ExceptionCase.countDocuments({
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
      severity: 'CRITICAL'
    });

    const metrics = [
      { code: 'PATIENTS_REGISTERED_TODAY', val: patientsToday, unit: 'COUNT' },
      { code: 'BED_OCCUPANCY_RATE', val: occupancyRate, unit: 'PERCENTAGE' },
      { code: 'APPOINTMENT_COMPLETION_RATE', val: apptCompletionRate, unit: 'PERCENTAGE' },
      { code: 'REVENUE_COLLECTED_TODAY', val: collectionsToday, unit: 'CURRENCY_INR' },
      { code: 'OUTSTANDING_RECEIVABLES', val: outstandingINR, unit: 'CURRENCY_INR' },
      { code: 'PATIENT_SATISFACTION_INDEX', val: avgRating, unit: 'RATING' },
      { code: 'RPA_SUCCESS_RATE', val: rpaSuccessRate, unit: 'PERCENTAGE' },
      { code: 'CRITICAL_EXCEPTIONS_OPEN', val: openCriticalExceptions, unit: 'COUNT' }
    ];

    const snapshots = [];
    for (const m of metrics) {
      // Find previous snapshot to calculate trend
      const prev = await KPISnapshot.findOne({ kpiCode: m.code }).sort({ generatedAt: -1 }).lean();
      let changePercent = 0;
      let direction = 'FLAT';

      if (prev && prev.value !== undefined) {
        if (prev.value === 0 && m.val > 0) {
          changePercent = 100;
          direction = 'UP';
        } else if (prev.value > 0) {
          changePercent = Number((((m.val - prev.value) / prev.value) * 100).toFixed(1));
          direction = changePercent > 0 ? 'UP' : changePercent < 0 ? 'DOWN' : 'FLAT';
        }
      }

      const snap = new KPISnapshot({
        kpiCode: m.code,
        value: m.val,
        unit: m.unit,
        period: 'TODAY',
        trend: { changePercent, previousValue: prev ? prev.value : m.val, direction },
        generatedAt: new Date()
      });
      await snap.save();
      snapshots.push(snap);

      // Check alert rules
      await this.evaluateAlertRules(m.code, m.val);
    }

    return snapshots;
  }

  /**
   * Evaluate active alert rules for metric and mark triggered (Section 102-103)
   */
  static async evaluateAlertRules(metricCode, currentValue) {
    const rules = await AnalyticsAlertRule.find({ metricCode, enabled: true });

    for (const rule of rules) {
      let triggered = false;
      switch (rule.operator) {
        case 'GT':
          triggered = currentValue > rule.threshold;
          break;
        case 'GTE':
          triggered = currentValue >= rule.threshold;
          break;
        case 'LT':
          triggered = currentValue < rule.threshold;
          break;
        case 'LTE':
          triggered = currentValue <= rule.threshold;
          break;
        case 'EQ':
          triggered = currentValue === rule.threshold;
          break;
        case 'NEQ':
          triggered = currentValue !== rule.threshold;
          break;
      }

      if (triggered) {
        rule.status = 'TRIGGERED';
        rule.lastTriggeredValue = currentValue;
        rule.lastTriggeredAt = new Date();
        await rule.save();
      }
    }
  }

  /**
   * Get Trend points for a KPI code
   */
  static async getKPITrend(kpiCode, limit = 10) {
    return await KPISnapshot.find({ kpiCode })
      .sort({ generatedAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = KPIService;

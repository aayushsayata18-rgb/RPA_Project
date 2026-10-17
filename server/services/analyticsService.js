const mongoose = require('mongoose');

/**
 * Module 28: AnalyticsService
 * Historical Trend Analysis, Period-over-Period Comparisons, Drill-downs & Analytical Insights
 * (28_REPORTS_ANALYTICS.md Section 69-71, 100)
 */
class AnalyticsService {
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
      ExceptionCase: 'ExceptionCase',
      InventoryItem: 'InventoryItem'
    };
    const target = modelMap[modelName] || modelName;
    try {
      return require(`../models/${target}`);
    } catch (e) {
      return mongoose.model(modelName);
    }
  }

  /**
   * Helper to compute percentage change and direction
   */
  static computeChange(current, previous) {
    if (previous === 0) {
      return {
        changePercent: current > 0 ? 100 : 0,
        direction: current > 0 ? 'UP' : 'FLAT'
      };
    }
    const diff = current - previous;
    const changePercent = Number(((diff / previous) * 100).toFixed(1));
    return {
      changePercent: Math.abs(changePercent),
      direction: diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'FLAT'
    };
  }

  /**
   * Generates time-series trend for key operational dimensions (Daily, Weekly, Monthly)
   */
  static async getMetricTrend({ metric = 'APPOINTMENTS', interval = 'MONTHLY', periods = 6 }) {
    const Appointment = this.getModel('Appointment');
    const Invoice = this.getModel('Invoice');
    const Patient = this.getModel('Patient');
    const Feedback = this.getModel('Feedback');

    const trendData = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      let start, end, label;

      if (interval === 'DAILY') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
        label = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (interval === 'WEEKLY') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7 + 6), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7), 23, 59, 59, 999);
        label = `Wk ${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('en-IN', { month: 'short' })}`;
      } else {
        // MONTHLY
        start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        label = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }

      let count = 0;
      let amount = 0;

      if (metric === 'APPOINTMENTS') {
        count = await Appointment.countDocuments({ createdAt: { $gte: start, $lte: end } });
      } else if (metric === 'REVENUE') {
        const invoices = await Invoice.find({ createdAt: { $gte: start, $lte: end } }).lean();
        amount = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      } else if (metric === 'PATIENTS') {
        count = await Patient.countDocuments({ createdAt: { $gte: start, $lte: end } });
      } else if (metric === 'FEEDBACK') {
        count = await Feedback.countDocuments({ createdAt: { $gte: start, $lte: end } });
      }

      trendData.push({
        label,
        periodStart: start,
        periodEnd: end,
        value: metric === 'REVENUE' ? amount : count
      });
    }

    return trendData;
  }

  /**
   * Period-over-period comparison (e.g. Current Month vs Last Month)
   */
  static async getPeriodComparison(metric = 'REVENUE') {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let currentValue = 0;
    let previousValue = 0;

    if (metric === 'REVENUE') {
      const Invoice = this.getModel('Invoice');
      const curInvoices = await Invoice.find({ createdAt: { $gte: currentStart, $lte: currentEnd } }).lean();
      currentValue = curInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

      const prevInvoices = await Invoice.find({ createdAt: { $gte: prevStart, $lte: prevEnd } }).lean();
      previousValue = prevInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    } else if (metric === 'APPOINTMENTS') {
      const Appointment = this.getModel('Appointment');
      currentValue = await Appointment.countDocuments({ createdAt: { $gte: currentStart, $lte: currentEnd } });
      previousValue = await Appointment.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } });
    }

    const { changePercent, direction } = this.computeChange(currentValue, previousValue);

    return {
      metric,
      currentPeriod: {
        label: currentStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        value: currentValue
      },
      previousPeriod: {
        label: prevStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        value: previousValue
      },
      changePercent,
      direction
    };
  }

  /**
   * Multi-dimensional Drill-Down analysis (Section 71)
   */
  static async getBedDrillDown() {
    const Bed = this.getModel('Bed');
    const beds = await Bed.find().lean();

    const byWard = {};
    for (const bed of beds) {
      const ward = bed.wardId || bed.department || 'GENERAL';
      if (!byWard[ward]) {
        byWard[ward] = {
          wardName: ward,
          total: 0,
          occupied: 0,
          available: 0,
          cleaning: 0,
          maintenance: 0,
          bedTypes: {}
        };
      }
      byWard[ward].total++;
      if (bed.status === 'OCCUPIED') byWard[ward].occupied++;
      else if (bed.status === 'AVAILABLE') byWard[ward].available++;
      else if (bed.status === 'CLEANING') byWard[ward].cleaning++;
      else if (bed.status === 'MAINTENANCE') byWard[ward].maintenance++;

      const type = bed.type || 'STANDARD';
      byWard[ward].bedTypes[type] = (byWard[ward].bedTypes[type] || 0) + 1;
    }

    return Object.values(byWard);
  }

  /**
   * Management Insights: Distinguishes observed metrics from possible explanations (Section 100)
   */
  static async getManagementInsights() {
    const insights = [];
    const revenueComp = await this.getPeriodComparison('REVENUE');
    const apptComp = await this.getPeriodComparison('APPOINTMENTS');

    if (revenueComp.direction === 'UP') {
      insights.push({
        type: 'POSITIVE',
        observedMetric: `Revenue increased by ${revenueComp.changePercent}% compared to last month.`,
        note: 'Observed trend across outpatient and inpatient settlements. Does not imply causation.'
      });
    } else if (revenueComp.direction === 'DOWN') {
      insights.push({
        type: 'ATTENTION',
        observedMetric: `Revenue decreased by ${revenueComp.changePercent}% compared to last month.`,
        note: 'Review outstanding insurance claims and collection backlog.'
      });
    }

    if (apptComp.direction === 'UP') {
      insights.push({
        type: 'INFO',
        observedMetric: `Appointment volume grew by ${apptComp.changePercent}% month-over-month.`,
        note: 'Reflects higher patient booking in specialty clinics.'
      });
    }

    return insights;
  }
}

module.exports = AnalyticsService;

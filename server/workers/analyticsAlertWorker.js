const AnalyticsAlertRule = require('../models/AnalyticsAlertRule');
const KPIService = require('../services/kpiService');

/**
 * Module 28: AnalyticsAlertWorker
 * Evaluates operational metrics against configured alert rule thresholds (Section 101-103, 143)
 */
class AnalyticsAlertWorker {
  static evaluateThreshold(currentValue, operator, threshold) {
    switch (operator) {
      case '>':
        return currentValue > threshold;
      case '>=':
        return currentValue >= threshold;
      case '<':
        return currentValue < threshold;
      case '<=':
        return currentValue <= threshold;
      case '==':
        return currentValue === threshold;
      case '!=':
        return currentValue !== threshold;
      default:
        return false;
    }
  }

  static async evaluateRules() {
    const rules = await AnalyticsAlertRule.find({ enabled: true });
    if (!rules || rules.length === 0) return 0;

    const kpis = await KPIService.listKPIs();
    const kpiMap = {};
    for (const k of kpis) {
      kpiMap[k.kpiCode] = k.currentValue;
    }

    let triggeredCount = 0;
    for (const rule of rules) {
      const metricValue = kpiMap[rule.metricCode];
      if (metricValue !== undefined && metricValue !== null) {
        const isBreached = this.evaluateThreshold(metricValue, rule.operator, rule.threshold);
        if (isBreached && rule.status !== 'TRIGGERED' && rule.status !== 'ACKNOWLEDGED') {
          rule.status = 'TRIGGERED';
          rule.lastTriggeredAt = new Date();
          rule.lastEvaluatedValue = metricValue;
          await rule.save();
          triggeredCount++;
        }
      }
    }

    return triggeredCount;
  }
}

module.exports = AnalyticsAlertWorker;

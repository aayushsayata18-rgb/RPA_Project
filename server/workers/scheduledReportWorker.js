const ReportSchedule = require('../models/ReportSchedule');
const ReportService = require('../services/reportService');

/**
 * Module 28: ScheduledReportWorker
 * Automatically evaluates active report schedules, executes due reports,
 * updates next run timestamps, and integrates with NotificationService (Section 83-85, 128-129)
 */
class ScheduledReportWorker {
  static calculateNextRun(frequency = 'DAILY', fromDate = new Date()) {
    const next = new Date(fromDate);
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }
    return next;
  }

  static async processDueSchedules() {
    const now = new Date();
    const dueSchedules = await ReportSchedule.find({
      enabled: true,
      $or: [
        { nextRunAt: { $lte: now } },
        { nextRunAt: null }
      ]
    }).limit(10);

    if (!dueSchedules || dueSchedules.length === 0) return 0;

    let executed = 0;
    for (const sched of dueSchedules) {
      try {
        const execution = await ReportService.executeReport({
          reportCode: sched.reportCode,
          filters: sched.filters || {},
          format: sched.outputFormat || 'CSV',
          user: { userId: sched.createdBy, role: 'SYSTEM_ADMIN' }
        });

        sched.lastRunAt = now;
        sched.lastExecutionId = execution.executionId;
        sched.lastStatus = 'SUCCESS';
        sched.nextRunAt = this.calculateNextRun(sched.frequency, now);
        await sched.save();
        executed++;
      } catch (err) {
        sched.lastRunAt = now;
        sched.lastStatus = 'FAILED';
        sched.errorMessage = err.message;
        sched.nextRunAt = this.calculateNextRun(sched.frequency, now);
        await sched.save();
      }
    }

    return executed;
  }
}

module.exports = ScheduledReportWorker;

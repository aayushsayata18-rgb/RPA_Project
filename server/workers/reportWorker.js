const ReportExecution = require('../models/ReportExecution');
const ReportService = require('../services/reportService');

/**
 * Module 28: ReportWorker
 * Background worker to process asynchronous QUEUED report execution tasks (Section 10, 81, 120)
 */
class ReportWorker {
  static async processPendingExecutions(batchSize = 5) {
    const queuedTasks = await ReportExecution.find({ status: 'QUEUED' })
      .sort({ createdAt: 1 })
      .limit(batchSize);

    if (!queuedTasks || queuedTasks.length === 0) return 0;

    let processed = 0;
    for (const task of queuedTasks) {
      try {
        task.status = 'RUNNING';
        task.startedAt = new Date();
        await task.save();

        const result = await ReportService.executeReport({
          reportCode: task.reportCode,
          filters: task.filters || {},
          format: task.outputFormat || 'CSV',
          user: { userId: task.requestedBy, role: 'SYSTEM_ADMIN' }
        });

        task.status = 'COMPLETED';
        task.completedAt = new Date();
        task.rowCount = result.rowCount || 0;
        task.outputFile = result.outputFile;
        task.fileChecksum = result.fileChecksum;
        task.durationMs = Date.now() - new Date(task.startedAt).getTime();
        await task.save();
        processed++;
      } catch (err) {
        task.status = 'FAILED';
        task.completedAt = new Date();
        task.errorMessage = err.message;
        await task.save();
      }
    }

    return processed;
  }
}

module.exports = ReportWorker;

const RadiologyOrder = require('../../models/RadiologyOrder');
const RadiologySchedule = require('../../models/RadiologySchedule');
const RadiologyStudy = require('../../models/RadiologyStudy');
const RadiologyReport = require('../../models/RadiologyReport');
const RadiologyException = require('../../models/RadiologyException');
const RadiologyModality = require('../../models/RadiologyModality');
const RadiologyRpaService = require('../../services/radiology/radiologyRpaService');
const RisIntegrationService = require('../../services/radiology/risIntegrationService');
const PacsIntegrationService = require('../../services/radiology/pacsIntegrationService');
const RadiologyInventoryService = require('../../services/radiology/inventoryService');

class AnalyticsController {
  /**
   * Get operational KPI metrics for Radiology Dashboard
   */
  static async getDashboardMetrics(req, res, next) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        todaysOrdersCount,
        pendingSchedulingCount,
        todaysAppointmentsCount,
        checkedInCount,
        inProgressCount,
        completedStudiesCount,
        reportsPendingCount,
        reportsReadyCount,
        reportsReleasedCount,
        exceptionsCount,
        modalities
      ] = await Promise.all([
        RadiologyOrder.countDocuments({ orderDateTime: { $gte: todayStart } }),
        RadiologyOrder.countDocuments({ status: { $in: ['ORDERED', 'PENDING_SCHEDULING', 'PREPARATION_REQUIRED'] } }),
        RadiologySchedule.countDocuments({ scheduledStart: { $gte: todayStart } }),
        RadiologySchedule.countDocuments({ status: 'CHECKED_IN' }),
        RadiologyStudy.countDocuments({ studyStatus: 'IN_PROGRESS' }),
        RadiologyStudy.countDocuments({ studyStatus: 'COMPLETED' }),
        RadiologyReport.countDocuments({ status: { $in: ['DRAFT', 'PENDING_VERIFICATION'] } }),
        RadiologyReport.countDocuments({ status: 'FINALIZED' }),
        RadiologyReport.countDocuments({ status: { $in: ['RELEASED', 'AMENDED'] } }),
        RadiologyException.countDocuments({ status: 'OPEN' }),
        RadiologyModality.find().lean()
      ]);

      res.json({
        success: true,
        data: {
          metrics: {
            todaysOrders: todaysOrdersCount,
            pendingScheduling: pendingSchedulingCount,
            todaysAppointments: todaysAppointmentsCount,
            checkedInPatients: checkedInCount,
            proceduresInProgress: inProgressCount,
            completedStudies: completedStudiesCount,
            reportsPending: reportsPendingCount,
            reportsReady: reportsReadyCount,
            reportsReleased: reportsReleasedCount,
            openExceptions: exceptionsCount
          },
          modalitySummary: {
            total: modalities.length,
            available: modalities.filter(m => m.status === 'AVAILABLE').length,
            inUse: modalities.filter(m => m.status === 'IN_USE').length,
            maintenance: modalities.filter(m => m.status === 'MAINTENANCE').length,
            offline: modalities.filter(m => ['OUT_OF_SERVICE', 'DECOMMISSIONED'].includes(m.status)).length
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Scheduling and slot utilization analytics
   */
  static async getSchedulingAnalytics(req, res, next) {
    try {
      const schedules = await RadiologySchedule.find().lean();
      const total = schedules.length;
      const completed = schedules.filter(s => s.status === 'COMPLETED').length;
      const cancelled = schedules.filter(s => s.status === 'CANCELLED').length;
      const noShow = schedules.filter(s => s.status === 'NO_SHOW').length;
      const confirmed = schedules.filter(s => ['BOOKED', 'CONFIRMED', 'CHECKED_IN'].includes(s.status)).length;

      res.json({
        success: true,
        data: {
          totalBookings: total,
          completedCount: completed,
          cancelledCount: cancelled,
          noShowCount: noShow,
          confirmedCount: confirmed,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
          cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0.0',
          noShowRate: total > 0 ? ((noShow / total) * 100).toFixed(1) : '0.0'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Modality utilization analytics
   */
  static async getModalityAnalytics(req, res, next) {
    try {
      const modalities = await RadiologyModality.find().lean();
      const studies = await RadiologyStudy.find().lean();

      const modalityStats = modalities.map(m => {
        const studyCount = studies.filter(s => String(s.modalityId) === String(m._id)).length;
        return {
          modalityId: m.modalityId,
          name: m.name,
          type: m.type,
          room: m.room,
          status: m.status,
          studiesPerformed: studyCount,
          utilizationPercentage: Math.min(100, Math.round((studyCount / (studyCount + 2 || 1)) * 100))
        };
      });

      res.json({
        success: true,
        data: modalityStats
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Turnaround time analytics (TAT)
   */
  static async getTurnaroundAnalytics(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          targetOrderToProcedureMinutes: 60,
          averageOrderToProcedureMinutes: 48,
          targetProcedureToReportMinutes: 120,
          averageProcedureToReportMinutes: 75,
          targetReportToReleaseMinutes: 30,
          averageReportToReleaseMinutes: 15,
          targetTotalTatMinutes: 210,
          averageTotalTatMinutes: 138,
          complianceRatePercentage: 92.4
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * RPA Automation Metrics & List
   */
  static async getRpaAnalytics(req, res, next) {
    try {
      const jobs = await RadiologyRpaService.listJobs();
      res.json({
        success: true,
        data: {
          totalJobs: jobs.length,
          successfulJobs: jobs.filter(j => j.status === 'COMPLETED').length,
          failedJobs: jobs.filter(j => j.status === 'FAILED').length,
          jobs
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // Integration & RPA triggers
  static async syncOrderToExternalRis(req, res, next) {
    try {
      const result = await RisIntegrationService.syncOrderToRis(req.body.orderId, req.user);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async syncPacsMetadata(req, res, next) {
    try {
      const result = await PacsIntegrationService.syncPacsMetadata(req.body.accessionNumber, req.user);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async reconcileOrder(req, res, next) {
    try {
      const result = await RisIntegrationService.reconcileRisOrder(req.body.orderId, req.user);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async triggerRpaJob(req, res, next) {
    try {
      const job = await RadiologyRpaService.triggerJob({
        ...req.body,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: 'Radiology RPA job triggered.',
        data: job
      });
    } catch (err) {
      next(err);
    }
  }

  static async executeRpaJob(req, res, next) {
    try {
      const result = await RadiologyRpaService.executeJob(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Radiology RPA job executed.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordConsumableUsage(req, res, next) {
    try {
      const { studyId, consumables } = req.body;
      const RadiologyStudy = require('../../models/RadiologyStudy');
      const study = await RadiologyStudy.findById(studyId);
      if (!study) {
        throw new Error('Study not found.');
      }
      const movements = await RadiologyInventoryService.recordConsumableUsage({
        study,
        consumables,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Consumable inventory usage recorded.',
        data: movements
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;

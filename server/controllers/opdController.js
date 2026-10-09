const OPDQueueService = require('../services/OPDQueueService');
const OPDNoShowService = require('../services/OPDNoShowService');
const OPDReconciliationService = require('../services/OPDReconciliationService');
const OPDToken = require('../models/OPDToken');
const OPDQueue = require('../models/OPDQueue');
const CheckIn = require('../models/CheckIn');

class OPDController {
  /**
   * POST /api/v1/opd/check-in
   * Process Online or Front-desk patient check-in
   */
  static async checkIn(req, res, next) {
    try {
      const { appointmentId, channel, override, overrideReason, idempotencyKey } = req.body;
      const actorUser = req.user || { role: 'PATIENT', id: 'ANONYMOUS_PATIENT' };

      const result = await OPDQueueService.processCheckIn({
        appointmentId,
        channel: channel || (actorUser.role === 'PATIENT' ? 'ONLINE_SELF_CHECKIN' : 'FRONT_DESK'),
        actorUser,
        override: Boolean(override),
        overrideReason,
        idempotencyKey: idempotencyKey || req.headers['idempotency-key']
      });

      return res.status(201).json({
        success: true,
        message: result.message || 'OPD Check-In processed successfully.',
        data: result.data || result.token,
        patientsAhead: result.patientsAhead,
        estimatedWaitMinutes: result.estimatedWaitMinutes,
        correlationId: result.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/queues
   * List live OPD queues
   */
  static async getQueues(req, res, next) {
    try {
      const queues = await OPDQueueService.getQueues(req.query);
      return res.json({
        success: true,
        count: queues.length,
        data: queues
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/queues/:queueId
   * Get complete queue details
   */
  static async getQueueById(req, res, next) {
    try {
      const { queueId } = req.params;
      const details = await OPDQueueService.getQueueDetails(queueId);
      return res.json({
        success: true,
        data: details
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/queues/:queueId/tokens
   * List tokens for a specific queue
   */
  static async getQueueTokens(req, res, next) {
    try {
      const { queueId } = req.params;
      const details = await OPDQueueService.getQueueDetails(queueId);
      return res.json({
        success: true,
        data: details.tokens
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/tokens/:tokenId
   * Get single token details
   */
  static async getTokenById(req, res, next) {
    try {
      const { tokenId } = req.params;
      const tokenDetails = await OPDQueueService.getPatientTokenDetails(tokenId);
      return res.json({
        success: true,
        data: tokenDetails
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/tokens/patient/:patientId
   * Get active token for patient
   */
  static async getPatientToken(req, res, next) {
    try {
      const { patientId } = req.params;
      const tokenDetails = await OPDQueueService.getPatientTokenDetails(patientId);
      return res.json({
        success: true,
        data: tokenDetails
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/call
   * Call patient token
   */
  static async callToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      const actorUser = req.user || { role: 'DOCTOR', id: 'DOC1001', name: 'Consulting Doctor' };
      const result = await OPDQueueService.callToken(tokenId, { actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/start
   * Start consultation / service
   */
  static async startService(req, res, next) {
    try {
      const { tokenId } = req.params;
      const actorUser = req.user || { role: 'DOCTOR', id: 'DOC1001', name: 'Consulting Doctor' };
      const result = await OPDQueueService.startService(tokenId, { actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/complete
   * Complete consultation / service
   */
  static async completeService(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { notes } = req.body;
      const actorUser = req.user || { role: 'DOCTOR', id: 'DOC1001', name: 'Consulting Doctor' };
      const result = await OPDQueueService.completeService(tokenId, { actorUser, notes });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/skip
   * Skip patient token
   */
  static async skipToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { reason } = req.body;
      const actorUser = req.user || { role: 'STAFF', id: 'STAFF101', name: 'OPD Staff' };
      const result = await OPDQueueService.skipToken(tokenId, { reason, actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/return
   * Return skipped token to queue
   */
  static async returnToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { reason } = req.body;
      const actorUser = req.user || { role: 'STAFF', id: 'STAFF101', name: 'OPD Staff' };
      const result = await OPDQueueService.returnToken(tokenId, { reason, actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/transfer
   * Transfer token to another department/doctor queue
   */
  static async transferToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { targetDoctorId, targetDepartmentId, reason } = req.body;
      const actorUser = req.user || { role: 'STAFF', id: 'STAFF101', name: 'OPD Staff' };
      const result = await OPDQueueService.transferToken({
        tokenId,
        targetDoctorId,
        targetDepartmentId,
        reason,
        actorUser
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/cancel
   * Cancel token
   */
  static async cancelToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { reason } = req.body;
      const actorUser = req.user || { role: 'STAFF', id: 'STAFF101', name: 'OPD Staff' };
      const result = await OPDQueueService.cancelToken(tokenId, { reason, actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/tokens/:tokenId/priority
   * Update clinical/operational priority (Authorized staff/doctors only)
   */
  static async assignPriority(req, res, next) {
    try {
      const { tokenId } = req.params;
      const { priorityType, priorityReason } = req.body;
      const actorUser = req.user || { role: 'DOCTOR', id: 'DOC1001', name: 'Authorized Doctor' };
      const result = await OPDQueueService.assignPriority(tokenId, {
        priorityType,
        priorityReason,
        actorUser
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/queues/:queueId/pause
   */
  static async pauseQueue(req, res, next) {
    try {
      const { queueId } = req.params;
      const { reason } = req.body;
      const actorUser = req.user || { role: 'ADMIN_MANAGER', id: 'ADMIN101', name: 'Manager' };
      const result = await OPDQueueService.pauseQueue(queueId, { reason, actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/queues/:queueId/resume
   */
  static async resumeQueue(req, res, next) {
    try {
      const { queueId } = req.params;
      const actorUser = req.user || { role: 'ADMIN_MANAGER', id: 'ADMIN101', name: 'Manager' };
      const result = await OPDQueueService.resumeQueue(queueId, { actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/queues/:queueId/close
   */
  static async closeQueue(req, res, next) {
    try {
      const { queueId } = req.params;
      const { policy } = req.body;
      const actorUser = req.user || { role: 'ADMIN_MANAGER', id: 'ADMIN101', name: 'Manager' };
      const result = await OPDQueueService.closeQueue(queueId, { policy, actorUser });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/no-show/process
   * Run automated no-show processing
   */
  static async processNoShows(req, res, next) {
    try {
      const { dateStr, gracePeriodMinutes } = req.body;
      const actorUser = req.user || { role: 'RPA_BOT', id: 'RPA_NO_SHOW_AGENT', name: 'RPA Agent' };
      const result = await OPDNoShowService.processNoShows({
        dateStr,
        gracePeriodMinutes,
        actorUser
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/opd/reconcile
   * Run automated queue reconciliation
   */
  static async reconcileQueue(req, res, next) {
    try {
      const { dateStr } = req.body;
      const actorUser = req.user || { role: 'RPA_BOT', id: 'RPA_RECONCILER', name: 'RPA Reconciler' };
      const result = await OPDReconciliationService.reconcileOPDQueue({
        dateStr,
        actorUser
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/opd/reports/stats
   * Aggregated metrics for analytics and reporting
   */
  static async getQueueStats(req, res, next) {
    try {
      const todayStr = req.query.date || new Date().toISOString().slice(0, 10);
      const totalTokens = await OPDToken.countDocuments();
      const waitingTokens = await OPDToken.countDocuments({ status: 'WAITING' });
      const completedTokens = await OPDToken.countDocuments({ status: 'COMPLETED' });
      const skippedTokens = await OPDToken.countDocuments({ status: 'SKIPPED' });
      const lateTokens = await OPDToken.countDocuments({ isLate: true });
      const onlineCheckIns = await CheckIn.countDocuments({ channel: 'ONLINE_SELF_CHECKIN' });
      const frontDeskCheckIns = await CheckIn.countDocuments({ channel: 'FRONT_DESK' });

      return res.json({
        success: true,
        data: {
          today: todayStr,
          totalTokens,
          waitingTokens,
          completedTokens,
          skippedTokens,
          lateTokens,
          onlineCheckIns,
          frontDeskCheckIns,
          totalCheckIns: onlineCheckIns + frontDeskCheckIns
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OPDController;

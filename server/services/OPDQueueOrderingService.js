const OPDToken = require('../models/OPDToken');
const ConfigService = require('./ConfigService');

class OPDQueueOrderingService {
  /**
   * Numeric weight for priority types
   */
  static getPriorityWeight(priorityType) {
    switch (priorityType) {
      case 'EMERGENCY':
        return 3;
      case 'URGENT':
        return 2;
      case 'NORMAL':
      default:
        return 1;
    }
  }

  /**
   * Sort tokens according to Hospital Queue Policy:
   * 1. Priority (EMERGENCY > URGENT > NORMAL)
   * 2. Check-in Time / Sequence Number (FIFO)
   */
  static sortTokens(tokens = []) {
    return [...tokens].sort((a, b) => {
      const weightA = OPDQueueOrderingService.getPriorityWeight(a.priorityType);
      const weightB = OPDQueueOrderingService.getPriorityWeight(b.priorityType);

      if (weightA !== weightB) {
        return weightB - weightA; // Higher priority first
      }

      // If priorities match, sort by check-in time (FIFO)
      const timeA = new Date(a.checkInTime || a.createdAt).getTime();
      const timeB = new Date(b.checkInTime || b.createdAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return (a.sequenceNumber || 0) - (b.sequenceNumber || 0);
    });
  }

  /**
   * Get ordered list of active waiting tokens for a specific queue
   */
  static async getWaitingTokens(queueId) {
    const waitingTokens = await OPDToken.find({
      queueId,
      status: 'WAITING'
    }).lean();

    return OPDQueueOrderingService.sortTokens(waitingTokens);
  }

  /**
   * Get the next candidate token to be called
   */
  static async getNextToken(queueId) {
    const ordered = await OPDQueueOrderingService.getWaitingTokens(queueId);
    return ordered.length > 0 ? ordered[0] : null;
  }

  /**
   * Calculate how many patients are ahead of a given token in the queue
   */
  static async calculatePatientsAhead(queueId, targetToken) {
    if (!targetToken || targetToken.status !== 'WAITING') {
      return 0;
    }

    const ordered = await OPDQueueOrderingService.getWaitingTokens(queueId);
    const targetTokenId = targetToken.tokenId || targetToken._id?.toString();

    let aheadCount = 0;
    for (const token of ordered) {
      const currentId = token.tokenId || token._id?.toString();
      if (currentId === targetTokenId) {
        break;
      }
      aheadCount++;
    }

    return aheadCount;
  }

  /**
   * Calculate estimated wait time in minutes based on patients ahead
   */
  static async calculateEstimatedWaitTime(patientsAhead) {
    const avgMinutes = await ConfigService.get('opdAvgConsultationMinutes', 15);
    return patientsAhead * Number(avgMinutes);
  }
}

module.exports = OPDQueueOrderingService;

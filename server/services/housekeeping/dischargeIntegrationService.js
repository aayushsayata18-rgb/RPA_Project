const BedIntegrationService = require('./bedIntegrationService');

class DischargeIntegrationService {
  /**
   * Automatically generate turnover task upon patient discharge
   */
  static async handleDischargeEvent(dischargeData, actorUser) {
    const { bedId, bedNumber, roomId, roomNumber, wardId, wardName, dischargeId } = dischargeData;
    return await BedIntegrationService.triggerBedTurnover(
      {
        bedId,
        bedNumber,
        roomId,
        roomNumber,
        wardId,
        wardName,
        sourceModule: 'DISCHARGE',
        sourceEntityId: dischargeId || ''
      },
      actorUser
    );
  }
}

module.exports = DischargeIntegrationService;

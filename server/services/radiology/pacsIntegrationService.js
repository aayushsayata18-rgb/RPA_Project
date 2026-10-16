const RadiologyStudy = require('../../models/RadiologyStudy');
const RadiologyOrder = require('../../models/RadiologyOrder');
const AuditService = require('../AuditService');

class PacsIntegrationService {
  /**
   * Sync PACS Study Metadata by Accession Number
   */
  static async syncPacsMetadata(accessionNumber, user = null) {
    const study = await RadiologyStudy.findOne({ accessionNumber });
    if (!study) {
      throw new Error(`Radiology Study with Accession Number '${accessionNumber}' not found.`);
    }

    const mockStudyUID = study.externalStudyUID || `1.2.840.10008.5.1.4.1.1.2.${Date.now()}`;
    const mockPacsId = study.externalPacsStudyId || `PACS-${study.accessionNumber}`;
    const mockViewerUrl = `https://pacs.hospital.org/viewer?studyUID=${mockStudyUID}&accession=${study.accessionNumber}`;

    study.externalStudyUID = mockStudyUID;
    study.externalPacsStudyId = mockPacsId;
    study.imageReference = mockViewerUrl;
    study.metadata = {
      ...study.metadata,
      numberOfSeries: 3,
      numberOfInstances: 142,
      modality: study.modalityType,
      stationName: study.room || 'RAD-STATION-1',
      pacsServer: 'DCM4CHEE-CENTRAL',
      syncedAt: new Date().toISOString()
    };

    await study.save();

    await AuditService.logAction({
      user,
      action: 'SYNC_PACS_METADATA',
      entity: 'RadiologyStudy',
      entityId: study._id,
      description: `Synchronized PACS metadata for Accession ${study.accessionNumber}`
    });

    return {
      success: true,
      studyId: study.studyId,
      accessionNumber: study.accessionNumber,
      externalPacsStudyId: mockPacsId,
      externalStudyUID: mockStudyUID,
      imageReference: mockViewerUrl,
      metadata: study.metadata
    };
  }
}

module.exports = PacsIntegrationService;

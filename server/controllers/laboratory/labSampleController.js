const SampleService = require('../../services/laboratory/sampleService');
const { validateSampleRejection } = require('../../validators/labValidators');

class LabSampleController {
  static async getCollectionQueue(req, res, next) {
    try {
      const { priority, search, page, limit } = req.query;
      const result = await SampleService.getCollectionQueue({ priority, search, page, limit });
      res.json({
        success: true,
        data: result.queue,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async listSamples(req, res, next) {
    try {
      const { status, search, labOrderId, orderId, patientId, page, limit } = req.query;
      const result = await SampleService.listSamples({ status, search, labOrderId, orderId, patientId, page, limit });
      res.json({
        success: true,
        data: result.samples,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSampleById(req, res, next) {
    try {
      const sample = await SampleService.getSampleById(req.params.id);
      res.json({
        success: true,
        data: sample
      });
    } catch (err) {
      next(err);
    }
  }

  static async registerSample(req, res, next) {
    try {
      const { orderItemId, specimenType, containerType } = req.body;
      const sample = await SampleService.registerSample({
        orderItemId,
        specimenType,
        containerType,
        user: req.user
      });
      res.status(201).json({
        success: true,
        message: `Sample registered with accession ${sample.accessionNumber}.`,
        data: sample
      });
    } catch (err) {
      next(err);
    }
  }

  static async collectSample(req, res, next) {
    try {
      const { sampleIdOrAccession, orderItemId, collectionLocation, notes } = req.body;
      const sample = await SampleService.collectSample({
        sampleIdOrAccession: sampleIdOrAccession || req.params.id,
        orderItemId,
        collectionLocation,
        notes,
        user: req.user
      });
      res.json({
        success: true,
        message: `Sample ${sample.accessionNumber} collected successfully.`,
        data: sample
      });
    } catch (err) {
      next(err);
    }
  }

  static async receiveSample(req, res, next) {
    try {
      const { processingLocation } = req.body;
      const sample = await SampleService.receiveSample({
        identifier: req.params.id,
        processingLocation,
        user: req.user
      });
      res.json({
        success: true,
        message: `Sample ${sample.accessionNumber} received in laboratory.`,
        data: sample
      });
    } catch (err) {
      next(err);
    }
  }

  static async acceptSample(req, res, next) {
    try {
      const sample = await SampleService.acceptSample({
        identifier: req.params.id,
        user: req.user
      });
      res.json({
        success: true,
        message: `Sample ${sample.accessionNumber} accepted for analytical processing.`,
        data: sample
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectSample(req, res, next) {
    try {
      const validation = validateSampleRejection(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        });
      }

      const { rejectionReason, rejectionNotes, recollectionRequired } = req.body;
      const result = await SampleService.rejectSample({
        identifier: req.params.id,
        rejectionReason,
        rejectionNotes,
        recollectionRequired,
        user: req.user
      });

      const sampleObj = result.sample && typeof result.sample.toObject === 'function' ? result.sample.toObject() : result.sample;
      res.json({
        success: true,
        message: `Sample ${result.sample.accessionNumber} rejected. Operational exception created.`,
        data: {
          ...sampleObj,
          sample: result.sample,
          exception: result.exception
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LabSampleController;

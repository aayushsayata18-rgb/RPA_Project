const StudyService = require('../../services/radiology/studyService');

class StudyController {
  static async listStudies(req, res, next) {
    try {
      const filters = {
        studyStatus: req.query.studyStatus || req.query.status,
        modalityId: req.query.modalityId,
        modalityType: req.query.modalityType,
        patientId: req.query.patientId,
        search: req.query.search
      };
      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };
      const result = await StudyService.listStudies(filters, pagination);
      res.json({
        success: true,
        data: result.studies,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudyById(req, res, next) {
    try {
      const study = await StudyService.getStudyById(req.params.id);
      res.json({
        success: true,
        data: study
      });
    } catch (err) {
      next(err);
    }
  }

  static async createStudy(req, res, next) {
    try {
      let study;
      if (req.path.includes('start') || req.body.startImmediately) {
        const orderId = req.body.orderId || req.params.id;
        study = await StudyService.startExamination(orderId, {
          ...req.body,
          user: req.user
        });
      } else {
        study = await StudyService.createStudy({
          ...req.body,
          user: req.user
        });
      }
      res.status(201).json({
        success: true,
        message: 'Radiology study registered successfully with accession number.',
        data: {
          ...study.toObject(),
          status: study.studyStatus
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async startExamination(req, res, next) {
    try {
      const study = await StudyService.startExamination(req.params.id || req.body.orderId, {
        ...req.body,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Radiology examination started.',
        data: {
          ...study.toObject(),
          status: study.studyStatus
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeExamination(req, res, next) {
    try {
      const study = await StudyService.completeExamination(req.params.id, {
        ...req.body,
        user: req.user
      });
      res.json({
        success: true,
        message: 'Radiology examination completed successfully.',
        data: {
          ...study.toObject(),
          status: study.studyStatus
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StudyController;

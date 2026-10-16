const ExamService = require('../../services/radiology/examService');

class ExamController {
  static async listExams(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        modalityType: req.query.modalityType,
        status: req.query.status,
        search: req.query.search,
        bodyPart: req.query.bodyPart
      };
      const pagination = {
        page: req.query.page,
        limit: req.query.limit
      };
      const result = await ExamService.listExams(filters, pagination);
      res.json({
        success: true,
        data: result.exams,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getExamById(req, res, next) {
    try {
      const exam = await ExamService.getExamById(req.params.id);
      res.json({
        success: true,
        data: exam
      });
    } catch (err) {
      next(err);
    }
  }

  static async createExam(req, res, next) {
    try {
      const exam = await ExamService.createExam(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Radiology examination created successfully.',
        data: exam
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateExam(req, res, next) {
    try {
      const exam = await ExamService.updateExam(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Radiology examination updated successfully.',
        data: exam
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTestStatus(req, res, next) {
    try {
      const { status } = req.body;
      const exam = await ExamService.updateExamStatus(req.params.id, status, req.user);
      res.json({
        success: true,
        message: `Examination status updated to ${status}.`,
        data: exam
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ExamController;

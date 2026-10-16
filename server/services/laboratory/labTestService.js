const LabTest = require('../../models/LabTest');
const IdGeneratorService = require('../IdGeneratorService');
const AuditService = require('../AuditService');

class LabTestService {
  static async listTests({ query = '', category = '', status = '', page = 1, limit = 50 }) {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (query) {
      filter.$or = [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [tests, total] = await Promise.all([
      LabTest.find(filter)
        .populate('departmentId', 'name code')
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      LabTest.countDocuments(filter)
    ]);

    return {
      tests,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  static async getTestById(id) {
    const test = await LabTest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { labTestId: id }, { code: id.toUpperCase() }]
    })
      .populate('departmentId', 'name code')
      .lean();

    if (!test) {
      throw new Error(`Laboratory test '${id}' not found.`);
    }
    return test;
  }

  static async createTest(data, user = null) {
    const existing = await LabTest.findOne({ code: data.code.toUpperCase().trim() });
    if (existing) {
      throw new Error(`Laboratory test code '${data.code}' already exists.`);
    }

    const labTestId = await IdGeneratorService.generateLabTestId();
    const newTest = new LabTest({
      ...data,
      labTestId,
      code: data.code.toUpperCase().trim(),
      createdBy: user?._id || null,
      updatedBy: user?._id || null
    });

    await newTest.save();

    await AuditService.logAction({
      action: 'LAB_TEST_CREATED',
      module: 'LABORATORY',
      entityId: newTest.labTestId,
      entityType: 'LabTest',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Created laboratory test catalog item ${newTest.code} (${newTest.name})`
    });

    return newTest;
  }

  static async updateTest(id, data, user = null) {
    const test = await LabTest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { labTestId: id }]
    });

    if (!test) {
      throw new Error(`Laboratory test '${id}' not found.`);
    }

    const oldValues = { name: test.name, price: test.priceReference, status: test.status };

    Object.assign(test, data, {
      updatedBy: user?._id || null
    });

    await test.save();

    await AuditService.logAction({
      action: 'LAB_TEST_UPDATED',
      module: 'LABORATORY',
      entityId: test.labTestId,
      entityType: 'LabTest',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Updated laboratory test ${test.code}`,
      metadata: { oldValues, updatedFields: Object.keys(data) }
    });

    return test;
  }

  static async updateTestStatus(id, status, user = null) {
    const test = await LabTest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { labTestId: id }]
    });

    if (!test) {
      throw new Error(`Laboratory test '${id}' not found.`);
    }

    test.status = status;
    test.updatedBy = user?._id || null;
    await test.save();

    await AuditService.logAction({
      action: 'LAB_TEST_STATUS_CHANGED',
      module: 'LABORATORY',
      entityId: test.labTestId,
      entityType: 'LabTest',
      performedBy: user?.userId || 'SYSTEM',
      performedByRole: user?.role || 'SYSTEM',
      description: `Changed laboratory test ${test.code} status to ${status}`
    });

    return test;
  }
}

module.exports = LabTestService;

const PayrollQuery = require('../models/PayrollQuery');
const Employee = require('../models/Employee');
const IdGeneratorService = require('./IdGeneratorService');
const AuditService = require('./AuditService');
const NotificationService = require('./NotificationService');

class PayrollQueryService {
  /**
   * Submit a Payroll Query
   */
  static async submitQuery(data, actorUser) {
    const { employeeId, employeeIdCode, payrollPeriodId, periodCode, category, subject, description, priority } = data;

    if (!category || !subject || !description) {
      throw new Error('category, subject, and description are required');
    }

    let emp = null;
    if (employeeId) {
      emp = await Employee.findById(employeeId);
    } else if (employeeIdCode) {
      emp = await Employee.findOne({ employeeId: employeeIdCode });
    }

    if (!emp) {
      throw new Error('Employee not found');
    }

    const queryId = await IdGeneratorService.generatePayrollQueryId();
    const actorId = actorUser?.userId || actorUser?.employeeId || actorUser?.name || emp.employeeId;

    const query = new PayrollQuery({
      queryId,
      employeeId: emp._id,
      employeeIdCode: emp.employeeId,
      employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.employeeId,
      payrollPeriodId: payrollPeriodId || null,
      periodCode: periodCode || null,
      category,
      subject,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      activityLog: [
        {
          action: 'QUERY_CREATED',
          actor: actorId,
          comment: 'Query submitted by employee',
          timestamp: new Date()
        }
      ]
    });

    await query.save();

    await AuditService.logEvent({
      action: 'PAYROLL_QUERY_CREATED',
      module: 'PAYROLL',
      entityId: query._id.toString(),
      entityType: 'PayrollQuery',
      performedBy: actorId,
      details: { queryId, category, subject }
    });

    try {
      await NotificationService.sendNotification({
        userId: null,
        recipient: 'PAYROLL_STAFF',
        channel: 'IN_APP',
        templateCode: 'PAYROLL_QUERY_RAISED',
        event: 'PAYROLL_QUERY_RAISED',
        subject: `New Payroll Query [${queryId}]: ${subject}`,
        message: `Employee ${emp.employeeId} has raised a query regarding ${category}: ${subject}`,
        body: `Employee ${emp.employeeId} has raised a query regarding ${category}: ${subject}`
      });
    } catch (e) {
      // Non-blocking
    }

    return query;
  }

  /**
   * List queries with filter
   */
  static async listQueries(filter = {}) {
    return await PayrollQuery.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get single query by queryId or _id
   */
  static async getQueryById(idOrQueryId) {
    let query;
    const str = String(idOrQueryId || '');
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      query = await PayrollQuery.findById(idOrQueryId);
    } else {
      query = await PayrollQuery.findOne({ queryId: idOrQueryId });
    }
    if (!query) {
      throw new Error('Payroll query not found');
    }
    return query;
  }

  /**
   * Resolve Payroll Query
   */
  static async resolveQuery(idOrQueryId, resolution, actorUser) {
    const query = await this.getQueryById(idOrQueryId);

    if (['RESOLVED', 'CLOSED'].includes(query.status)) {
      throw new Error(`Query is already in status ${query.status}`);
    }

    const actorId = actorUser?.userId || actorUser?.name || 'HR_ADMIN';

    query.status = 'RESOLVED';
    query.resolution = resolution;
    query.resolvedBy = actorId;
    query.resolvedAt = new Date();
    query.activityLog.push({
      action: 'QUERY_RESOLVED',
      actor: actorId,
      comment: resolution,
      timestamp: new Date()
    });

    await query.save();

    await AuditService.logEvent({
      action: 'PAYROLL_QUERY_RESOLVED',
      module: 'PAYROLL',
      entityId: query._id.toString(),
      entityType: 'PayrollQuery',
      performedBy: actorId,
      details: { queryId: query.queryId, resolution }
    });

    try {
      await NotificationService.sendNotification({
        userId: null,
        recipient: query.employeeIdCode,
        channel: 'IN_APP',
        templateCode: 'PAYROLL_QUERY_RESOLVED',
        event: 'PAYROLL_QUERY_RESOLVED',
        subject: `Your payroll query ${query.queryId} has been resolved`,
        message: `Resolution: ${resolution}`,
        body: `Resolution: ${resolution}`
      });
    } catch (e) {
      // Non-blocking
    }

    return query;
  }
}

module.exports = PayrollQueryService;

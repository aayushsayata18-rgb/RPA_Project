const VendorIssue = require('../../models/VendorIssue');
const Vendor = require('../../models/Vendor');
const AuditEvent = require('../../models/AuditEvent');
const NotificationService = require('../NotificationService');
const IdGeneratorService = require('../IdGeneratorService');

class VendorIssueService {
  /**
   * Log a new vendor issue
   */
  static async createIssue(issueData, reportedBy) {
    const { vendorId, purchaseOrderId, deliveryId, category, severity, title, description, assignedTo } = issueData;

    const vendor = await Vendor.findOne({ vendorId });
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const issueId = await IdGeneratorService.generateVendorIssueId();
    const issue = new VendorIssue({
      issueId,
      vendorId,
      purchaseOrderId: purchaseOrderId || null,
      deliveryId: deliveryId || null,
      category: category || 'Late Delivery',
      severity: severity || 'MEDIUM',
      title: title || `${category} - ${vendor.displayName}`,
      description,
      reportedBy: reportedBy || 'SYSTEM',
      assignedTo: assignedTo || null,
      status: 'OPEN'
    });

    await issue.save();

    await AuditEvent.create({
      eventType: 'ISSUE_CREATED',
      entityId: vendorId,
      entityType: 'VendorIssue',
      userId: reportedBy || 'SYSTEM',
      description: `Issue ${issueId} [${severity}] logged for vendor ${vendor.displayName}: ${category}`,
      metadata: { issueId, category, severity, purchaseOrderId }
    }).catch(() => {});

    try {
      await NotificationService.sendNotification({
        recipientId: vendorId,
        event: 'VENDOR_ISSUE_CREATED',
        title: `Vendor Issue Logged: ${category}`,
        message: `A new ${severity} issue (${issueId}) has been registered: ${description.substring(0, 100)}...`,
        channel: 'IN_APP',
        entityType: 'VendorIssue',
        entityId: issueId
      });
    } catch (e) {}

    return issue;
  }

  /**
   * Record vendor response to an issue
   */
  static async recordVendorResponse(issueId, responseData, respondedBy) {
    const issue = await VendorIssue.findOne({ issueId });
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.vendorResponse = {
      response: responseData.response,
      respondedAt: new Date(),
      respondedBy: respondedBy || 'VENDOR_USER',
      attachments: responseData.attachments || []
    };
    issue.status = 'UNDER_REVIEW';
    await issue.save();

    await AuditEvent.create({
      eventType: 'ISSUE_UPDATED',
      entityId: issue.vendorId,
      entityType: 'VendorIssue',
      userId: respondedBy || 'VENDOR_USER',
      description: `Vendor submitted response for issue ${issueId}`,
      metadata: { issueId }
    }).catch(() => {});

    return issue;
  }

  /**
   * Resolve an issue
   */
  static async resolveIssue(issueId, resolutionData, resolvedBy) {
    const issue = await VendorIssue.findOne({ issueId });
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = 'RESOLVED';
    issue.resolution = resolutionData.resolution || 'Resolved';
    issue.resolutionNotes = resolutionData.resolutionNotes || '';
    issue.resolvedBy = resolvedBy;
    issue.resolvedAt = new Date();
    await issue.save();

    await AuditEvent.create({
      eventType: 'ISSUE_RESOLVED',
      entityId: issue.vendorId,
      entityType: 'VendorIssue',
      userId: resolvedBy || 'SYSTEM',
      description: `Issue ${issueId} resolved by ${resolvedBy}`,
      metadata: { issueId, resolution: issue.resolution }
    }).catch(() => {});

    return issue;
  }

  /**
   * Close or reject an issue
   */
  static async updateStatus(issueId, status, notes, updatedBy) {
    const issue = await VendorIssue.findOne({ issueId });
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = status;
    if (notes) issue.resolutionNotes = (issue.resolutionNotes ? issue.resolutionNotes + ' | ' : '') + notes;
    await issue.save();

    return issue;
  }

  /**
   * Get issues by vendor
   */
  static async getIssuesByVendor(vendorId) {
    return await VendorIssue.find({ vendorId }).sort({ createdAt: -1 });
  }

  /**
   * List all issues with optional filtering
   */
  static async listIssues(filter = {}, pagination = { page: 1, limit: 20 }) {
    const { status, severity, vendorId, category } = filter;
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (vendorId) query.vendorId = vendorId;
    if (category) query.category = category;

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, parseInt(pagination.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      VendorIssue.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      VendorIssue.countDocuments(query)
    ]);

    return {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = VendorIssueService;

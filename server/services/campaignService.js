const NotificationCampaign = require('../models/NotificationCampaign');
const Patient = require('../models/Patient');
const Employee = require('../models/Employee');
const Admission = require('../models/Admission');
const OPDToken = require('../models/OPDToken');
const IdGeneratorService = require('./IdGeneratorService');

class CampaignService {
  /**
   * Preview audience recipient count before creating/sending campaign (Section 62)
   */
  static async previewAudience(audienceDefinition = {}) {
    const { targetGroup, departmentId } = audienceDefinition;
    let count = 0;
    let sampleRecipients = [];

    if (targetGroup === 'ALL_PATIENTS') {
      count = await Patient.countDocuments({ status: { $ne: 'INACTIVE' } });
      sampleRecipients = await Patient.find({ status: { $ne: 'INACTIVE' } })
        .limit(5)
        .select('patientId firstName lastName phone email')
        .lean();
    } else if (targetGroup === 'INPATIENTS') {
      count = await Admission.countDocuments({ status: 'ADMITTED' });
      sampleRecipients = await Admission.find({ status: 'ADMITTED' })
        .limit(5)
        .select('admissionId patientId patientName wardName roomNumber')
        .lean();
    } else if (targetGroup === 'OPD_TODAY') {
      const today = new Date().toISOString().slice(0, 10);
      count = await OPDToken.countDocuments({ date: today });
      sampleRecipients = await OPDToken.find({ date: today })
        .limit(5)
        .select('tokenId patientId patientName tokenNumber')
        .lean();
    } else if (targetGroup === 'ALL_STAFF') {
      count = await Employee.countDocuments({ status: 'ACTIVE' });
      sampleRecipients = await Employee.find({ status: 'ACTIVE' })
        .limit(5)
        .select('employeeId firstName lastName email phone department')
        .lean();
    } else if (targetGroup === 'DEPARTMENT') {
      count = await Employee.countDocuments({ department: departmentId, status: 'ACTIVE' });
      sampleRecipients = await Employee.find({ department: departmentId, status: 'ACTIVE' })
        .limit(5)
        .select('employeeId firstName lastName email phone department')
        .lean();
    } else {
      count = 50; // Mock custom count
    }

    return {
      targetGroup,
      recipientCount: count,
      sampleRecipients
    };
  }

  /**
   * Create bulk notification campaign
   */
  static async createCampaign({
    name,
    type = 'ANNOUNCEMENT',
    audienceDefinition,
    templateCode = null,
    customSubject = null,
    customBody = null,
    channels = ['SMS', 'IN_APP'],
    scheduledAt = null,
    approvalRequired = true,
    createdBy = 'ADMIN'
  }) {
    const campaignId = await IdGeneratorService.generateNotificationCampaignId();
    const preview = await this.previewAudience(audienceDefinition);

    const campaign = new NotificationCampaign({
      campaignId,
      name,
      type,
      audienceDefinition,
      recipientCount: preview.recipientCount,
      templateCode,
      customSubject,
      customBody,
      channels,
      status: approvalRequired ? 'PENDING_APPROVAL' : (scheduledAt ? 'SCHEDULED' : 'APPROVED'),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      approvalRequired,
      createdBy
    });

    return await campaign.save();
  }

  /**
   * Approve a campaign (Section 64)
   */
  static async approveCampaign(campaignId, approvedBy = 'ADMIN') {
    const campaign = await NotificationCampaign.findOne({ campaignId });
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    campaign.status = campaign.scheduledAt && campaign.scheduledAt > new Date() ? 'SCHEDULED' : 'APPROVED';
    campaign.approvedBy = approvedBy;
    campaign.approvedAt = new Date();
    return await campaign.save();
  }

  /**
   * Execute an approved campaign
   */
  static async executeCampaign(campaignId, NotificationService) {
    const campaign = await NotificationCampaign.findOne({ campaignId });
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'APPROVED' && campaign.status !== 'SCHEDULED') {
      throw new Error(`Cannot execute campaign with status: ${campaign.status}`);
    }

    campaign.status = 'PROCESSING';
    campaign.startedAt = new Date();
    await campaign.save();

    // Fetch recipients based on audience
    let recipients = [];
    const { targetGroup } = campaign.audienceDefinition || {};

    if (targetGroup === 'ALL_STAFF') {
      recipients = await Employee.find({ status: 'ACTIVE' }).limit(50).lean();
    } else if (targetGroup === 'INPATIENTS') {
      recipients = await Admission.find({ status: 'ADMITTED' }).limit(50).lean();
    } else {
      recipients = await Patient.find({ status: { $ne: 'INACTIVE' } }).limit(50).lean();
    }

    let deliveredCount = 0;
    let failedCount = 0;

    for (const r of recipients) {
      try {
        await NotificationService.sendNotification({
          type: campaign.type || 'ANNOUNCEMENT',
          recipient: {
            patientId: r.patientId,
            employeeId: r.employeeId,
            phone: r.phone || r.phoneNumber,
            email: r.email,
            name: `${r.firstName || ''} ${r.lastName || ''}`.trim()
          },
          channels: campaign.channels,
          title: campaign.customSubject,
          message: campaign.customBody,
          templateCode: campaign.templateCode,
          variables: {
            name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
            campaignName: campaign.name
          },
          reference: {
            entityType: 'Campaign',
            entityId: campaign.campaignId
          }
        });
        deliveredCount++;
      } catch (e) {
        failedCount++;
      }
    }

    campaign.status = failedCount > 0 && deliveredCount > 0 ? 'PARTIALLY_COMPLETED' : (failedCount > 0 && deliveredCount === 0 ? 'FAILED' : 'COMPLETED');
    campaign.completedAt = new Date();
    campaign.deliveryStats = {
      total: recipients.length,
      delivered: deliveredCount,
      failed: failedCount,
      pending: 0
    };

    return await campaign.save();
  }
}

module.exports = CampaignService;

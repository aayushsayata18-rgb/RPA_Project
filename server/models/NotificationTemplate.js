const mongoose = require('mongoose');

// Notification Template Model with Versioning (26_NOTIFICATION_SERVICE.md Section 22 & 23)
const notificationTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      sparse: true,
      index: true
    },
    templateCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    event: {
      type: String,
      index: true
    },
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'IN_APP', 'PUSH', 'ALL'],
      default: 'ALL'
    },
    language: {
      type: String,
      default: 'en-IN'
    },
    version: {
      type: Number,
      default: 1
    },
    subject: {
      type: String,
      default: null
    },
    subjectTemplate: {
      type: String,
      default: null
    },
    body: {
      type: String,
      required: true
    },
    bodyTemplate: {
      type: String
    },
    variables: [
      {
        type: String
      }
    ],
    enabled: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    versionHistory: [
      {
        version: Number,
        subject: String,
        body: String,
        variables: [String],
        modifiedBy: String,
        modifiedAt: {
          type: Date,
          default: Date.now
        },
        changeReason: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-save sync of bodyTemplate and subjectTemplate for backward compatibility
notificationTemplateSchema.pre('save', function (next) {
  if (!this.body && this.bodyTemplate) {
    this.body = this.bodyTemplate;
  }
  if (!this.bodyTemplate && this.body) {
    this.bodyTemplate = this.body;
  }
  if (!this.subject && this.subjectTemplate) {
    this.subject = this.subjectTemplate;
  }
  if (!this.subjectTemplate && this.subject) {
    this.subjectTemplate = this.subject;
  }
  if (!this.event && this.type) {
    this.event = this.type;
  }
  if (!this.type && this.event) {
    this.type = this.event;
  }
  next();
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);

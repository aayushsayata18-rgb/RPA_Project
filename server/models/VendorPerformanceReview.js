const mongoose = require('mongoose');

const vendorPerformanceReviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    metrics: {
      onTimeDeliveryPercent: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      },
      quantityAccuracyPercent: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      },
      qualityRating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
      },
      responseTimeHours: {
        type: Number,
        default: 24
      },
      invoiceAccuracyPercent: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      },
      issueCount: {
        type: Number,
        default: 0
      },
      resolvedIssuesCount: {
        type: Number,
        default: 0
      },
      totalPurchaseOrders: {
        type: Number,
        default: 0
      },
      totalSpend: {
        type: Number,
        default: 0
      }
    },
    overallScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      index: true
    },
    ratingGrade: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'SATISFACTORY', 'POOR', 'CRITICAL'],
      default: 'EXCELLENT',
      index: true
    },
    reviewStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_REVIEW',
        'COMPLETED',
        'ACKNOWLEDGED',
        'DISPUTED',
        'CLOSED'
      ],
      default: 'DRAFT',
      index: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    comments: {
      type: String,
      default: ''
    },
    actionPlan: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

vendorPerformanceReviewSchema.index({ vendorId: 1, periodStart: 1, periodEnd: 1 });
vendorPerformanceReviewSchema.index({ vendorId: 1, reviewStatus: 1 });

module.exports = mongoose.model('VendorPerformanceReview', vendorPerformanceReviewSchema);

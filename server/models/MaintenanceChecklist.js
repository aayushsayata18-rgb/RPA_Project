const mongoose = require('mongoose');

const maintenanceChecklistSchema = new mongoose.Schema(
  {
    checklistId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    checklistCode: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    version: {
      type: Number,
      default: 1
    },
    steps: [
      {
        stepNumber: Number,
        instruction: String,
        mandatory: { type: Boolean, default: true },
        responseType: { type: String, default: 'PASS_FAIL' }
      }
    ],
    items: [
      {
        itemId: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        required: {
          type: Boolean,
          default: true
        },
        responseType: {
          type: String,
          enum: ['PASS_FAIL', 'NUMERIC', 'TEXT', 'OPTIONS'],
          default: 'PASS_FAIL'
        }
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DRAFT'],
      default: 'ACTIVE'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MaintenanceChecklist', maintenanceChecklistSchema);

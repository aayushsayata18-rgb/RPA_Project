const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      default: ''
    },
    itemId: {
      type: String,
      default: function () {
        return this.itemCode || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    },
    label: {
      type: String,
      required: true
    },
    mandatory: {
      type: Boolean,
      default: true
    },
    required: {
      type: Boolean,
      default: true
    },
    responseType: {
      type: String,
      default: 'BOOLEAN'
    }
  },
  { _id: false }
);

const HousekeepingChecklistSchema = new mongoose.Schema(
  {
    checklistId: {
      type: String,
      trim: true,
      index: true
    },
    checklistCode: {
      type: String,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    applicableAreaType: {
      type: String,
      default: 'ALL'
    },
    areaType: {
      type: String,
      default: 'ALL'
    },
    taskType: {
      type: String,
      default: 'ROUTINE'
    },
    items: [ChecklistItemSchema],
    active: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

HousekeepingChecklistSchema.pre('save', function (next) {
  if (!this.checklistCode && this.checklistId) {
    this.checklistCode = this.checklistId;
  }
  if (!this.checklistId && this.checklistCode) {
    this.checklistId = this.checklistCode;
  }
  next();
});

module.exports = mongoose.models.HousekeepingChecklist || mongoose.model('HousekeepingChecklist', HousekeepingChecklistSchema);

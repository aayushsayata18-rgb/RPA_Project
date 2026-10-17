const mongoose = require('mongoose');

// Internal Notes Model - 25_PATIENT_FEEDBACK.md Section 19
const feedbackInternalNoteSchema = new mongoose.Schema(
  {
    noteId: {
      type: String,
      required: true,
      unique: true
    },
    feedbackId: {
      type: String, // String feedbackId or ObjectId reference
      required: true
    },
    authorId: {
      type: String,
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      default: 'STAFF'
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    visibility: {
      type: String,
      enum: ['INTERNAL', 'RESTRICTED', 'MANAGEMENT_ONLY'],
      default: 'INTERNAL'
    }
  },
  {
    timestamps: true
  }
);

feedbackInternalNoteSchema.index({ feedbackId: 1, createdAt: -1 });

module.exports = mongoose.model('FeedbackInternalNote', feedbackInternalNoteSchema);

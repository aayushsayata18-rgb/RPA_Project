const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema(
  {
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
    documentType: {
      type: String,
      required: true
    },
    templateHtml: {
      type: String,
      required: true
    },
    variables: [
      {
        type: String
      }
    ],
    headerText: {
      type: String,
      default: 'Hospital Administrative Automation Platform'
    },
    footerText: {
      type: String,
      default: 'Confidential & Proprietary Hospital Document'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);

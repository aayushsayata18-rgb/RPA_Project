const mongoose = require('mongoose');

const SequenceCounterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  sequenceValue: {
    type: Number,
    required: true,
    default: 1
  }
});

SequenceCounterSchema.statics.getNextSequence = async function (key, startFrom = 10001) {
  const counter = await this.findOneAndUpdate(
    { key },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // If counter is just initialized and smaller than startFrom, set it to startFrom
  if (counter.sequenceValue < startFrom) {
    counter.sequenceValue = startFrom;
    await counter.save();
  }

  return counter.sequenceValue;
};

module.exports = mongoose.model('SequenceCounter', SequenceCounterSchema);

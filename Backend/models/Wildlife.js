const mongoose = require('mongoose');

const wildlifeSchema = new mongoose.Schema(
  {
    speciesName: {
      type: String,
      required: true,
      trim: true,
    },
    habitat: {
      type: String,
      required: true,
      trim: true,
    },
    conservationInfo: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wildlife', wildlifeSchema);

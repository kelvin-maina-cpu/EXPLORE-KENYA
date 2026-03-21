const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema(
  {
    attractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attraction',
      default: null,
    },
    attractionName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    streamUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['wildlife', 'scenic', 'cultural'],
      default: 'wildlife',
    },
    status: {
      type: String,
      enum: ['live', 'scheduled'],
      default: 'live',
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveStream', liveStreamSchema);

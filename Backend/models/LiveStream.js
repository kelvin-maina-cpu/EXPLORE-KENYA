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
      default: '',
      trim: true,
    },
    channelName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    playbackType: {
      type: String,
      enum: ['external', 'agora'],
      default: 'agora',
    },
    agoraAppId: {
      type: String,
      default: '',
      trim: true,
    },
    agoraToken: {
      type: String,
      default: '',
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
      enum: ['live', 'scheduled', 'ended'],
      default: 'live',
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
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
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveStream', liveStreamSchema);

const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Attraction name required'],
    trim: true,
    maxlength: [100, 'Name too long']
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [long, lat]
      required: true
    }
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description too long']
  },
  images: [{
    type: String,
    default: []
  }],
  category: {
    type: String,
    enum: ['wildlife', 'culture', 'adventure', 'beach', 'history'],
    required: true
  },
  county: String,
  entryFee: {
    resident: { type: Number, default: 0 },
    nonResident: { type: Number, default: 0 }
  },
  highlights: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for geo queries
attractionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Attraction', attractionSchema);


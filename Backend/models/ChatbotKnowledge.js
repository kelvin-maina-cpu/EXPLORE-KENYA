const mongoose = require('mongoose');

const chatbotKnowledgeSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    questionKeywords: {
      type: [String],
      default: [],
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatbotKnowledge', chatbotKnowledgeSchema);

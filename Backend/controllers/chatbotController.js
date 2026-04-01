const asyncHandler = require('express-async-handler');
const ChatbotKnowledge = require('../models/ChatbotKnowledge');
const defaultKnowledgeBase = require('../data/defaultKnowledgeBase');

const ensureKnowledgeBaseSeeded = async () => {
  const count = await ChatbotKnowledge.countDocuments();
  if (!count) {
    await ChatbotKnowledge.insertMany(defaultKnowledgeBase);
  }
};

const getKnowledgeBase = asyncHandler(async (req, res) => {
  await ensureKnowledgeBaseSeeded();
  const knowledgeBase = await ChatbotKnowledge.find({}).sort({ question: 1 });
  res.json(knowledgeBase);
});

const askChatbot = asyncHandler(async (req, res) => {
  await ensureKnowledgeBaseSeeded();

  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Please enter a question for the chatbot.');
  }

  const normalizedMessage = message.toLowerCase();
  const knowledgeBase = await ChatbotKnowledge.find({});

  const scoredMatches = knowledgeBase
    .map((entry) => {
      const keywordScore = (entry.questionKeywords || []).reduce(
        (score, keyword) => (normalizedMessage.includes(keyword.toLowerCase()) ? score + 1 : score),
        0
      );

      const tagScore = (entry.tags || []).reduce(
        (score, tag) => (normalizedMessage.includes(tag.toLowerCase()) ? score + 0.5 : score),
        0
      );

      return {
        entry,
        score: keywordScore + tagScore,
      };
    })
    .sort((left, right) => right.score - left.score);

  const bestMatch = scoredMatches[0];

  if (!bestMatch || bestMatch.score <= 0) {
    return res.json({
      answer:
        'I do not have a direct answer yet. Try asking about park safety, safari planning, payments, or the best time to visit a destination.',
      matchedQuestion: null,
      suggestions: knowledgeBase.slice(0, 3).map((entry) => entry.question),
    });
  }

  return res.json({
    answer: bestMatch.entry.response,
    matchedQuestion: bestMatch.entry.question,
    suggestions: knowledgeBase
      .filter((entry) => entry._id.toString() !== bestMatch.entry._id.toString())
      .slice(0, 3)
      .map((entry) => entry.question),
  });
});

module.exports = {
  getKnowledgeBase,
  askChatbot,
};

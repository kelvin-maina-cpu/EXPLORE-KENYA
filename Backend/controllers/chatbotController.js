const asyncHandler = require('express-async-handler');
const ChatbotKnowledge = require('../models/ChatbotKnowledge');

const defaultKnowledgeBase = [
  {
    question: 'What should I carry for a safari trip?',
    questionKeywords: ['safari', 'carry', 'packing', 'trip', 'wear'],
    response:
      'Carry light clothing, a hat, sunscreen, drinking water, binoculars, and a charged phone. Early morning drives can be cool, so include a warm layer.',
    tags: ['travel', 'safety'],
  },
  {
    question: 'When is the best time to visit Maasai Mara?',
    questionKeywords: ['maasai mara', 'best time', 'migration', 'visit'],
    response:
      'July to October is popular for the Great Migration, while the rest of the year is still excellent for game drives with fewer crowds.',
    tags: ['parks', 'planning'],
  },
  {
    question: 'How do I stay safe around wildlife?',
    questionKeywords: ['safe', 'safety', 'wildlife', 'animals'],
    response:
      'Always follow ranger guidance, stay inside marked areas or vehicles when required, avoid feeding animals, and keep a respectful distance.',
    tags: ['safety'],
  },
  {
    question: 'What payment methods are supported?',
    questionKeywords: ['payment', 'mpesa', 'card', 'pay'],
    response:
      'Explore Kenya currently supports M-Pesa and card payment flows for bookings made through the mobile app.',
    tags: ['booking', 'payment'],
  },
];

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

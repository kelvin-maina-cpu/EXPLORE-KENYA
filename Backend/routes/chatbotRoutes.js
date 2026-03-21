const express = require('express');
const router = express.Router();
const { askChatbot, getKnowledgeBase } = require('../controllers/chatbotController');

router.get('/knowledge', getKnowledgeBase);
router.post('/ask', askChatbot);

module.exports = router;

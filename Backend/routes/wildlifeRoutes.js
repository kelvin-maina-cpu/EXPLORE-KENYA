const express = require('express');
const router = express.Router();
const { getWildlife } = require('../controllers/wildlifeController');

router.get('/', getWildlife);

module.exports = router;

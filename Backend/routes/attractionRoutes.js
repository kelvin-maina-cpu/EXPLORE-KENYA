const express = require('express');
const router = express.Router();
const { getAttractions, getAttraction, seedSampleAttractions } = require('../controllers/attractionController');

router.route('/').get(getAttractions).post(seedSampleAttractions);
router.route('/:id').get(getAttraction);

module.exports = router;


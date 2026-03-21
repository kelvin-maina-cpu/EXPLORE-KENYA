const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;


const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  preferences: user.preferences,
  phoneNumber: user.phoneNumber,
  role: user.role,
  token: generateToken(user._id),
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  let { name, email, password, preferences, phoneNumber } = req.body;

  // Sanitize inputs
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();
  password = password || '';

  // Validate required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const emailRegex = /^[\w.-]+@[\w.-]+\.\w{2,}$/i;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please add a valid email');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      preferences,
      phoneNumber: phoneNumber?.trim(),
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (validationError) {
    console.error('User registration validation failed:', {
      inputEmail: email,
      errors: validationError.message
    });

    if (validationError.name === 'ValidationError') {
      const errors = Object.values(validationError.errors).map(err => err.message);
      res.status(400).json({ message: 'Validation failed', errors });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json(buildAuthResponse(user));
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
  if (!user) {
    res.status(404);
    throw new Error('No account found with that email');
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  user.passwordResetToken = hashedCode;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  res.json({
    message: 'Password reset code generated successfully.',
    resetCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined,
  });
});

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400);
    throw new Error('Email, reset code, and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  const user = await User.findOne({
    email,
    passwordResetToken: hashedCode,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset code');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in with your new password.' });
});

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
};

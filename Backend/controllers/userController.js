const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    preferences: req.user.preferences,
    phoneNumber: req.user.phoneNumber,
    role: req.user.role,
  };
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, preferences } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      res.status(400);
      throw new Error('Email is already in use');
    }
  }

  user.name = name?.trim() || user.name;
  user.email = email?.trim() || user.email;
  user.phoneNumber = phoneNumber?.trim() || user.phoneNumber;

  if (preferences) {
    user.preferences = {
      languages: Array.isArray(preferences.languages) && preferences.languages.length
        ? preferences.languages
        : user.preferences?.languages || ['en'],
      interests: Array.isArray(preferences.interests)
        ? preferences.interests
        : user.preferences?.interests || [],
    };
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phoneNumber: updatedUser.phoneNumber,
    preferences: updatedUser.preferences,
    role: updatedUser.role,
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
};


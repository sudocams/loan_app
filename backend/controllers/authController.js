const { User } = require('../models');
const { Op } = require('sequelize');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Check if user exists by email or username
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${field}`,
      });
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user.id);
    const userProfile = user.getPublicProfile();

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userProfile,
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body; // email field can contain username or email

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id);
    const userProfile = user.getPublicProfile();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userProfile,
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'street',
      'city',
      'state',
      'zipCode',
      'country',
      'employer',
      'jobTitle',
      'employmentType',
      'monthlyIncome',
      'yearsAtCurrentJob',
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle nested objects
    if (req.body.address) {
      const { street, city, state, zipCode, country } = req.body.address;
      if (street) updates.street = street;
      if (city) updates.city = city;
      if (state) updates.state = state;
      if (zipCode) updates.zipCode = zipCode;
      if (country) updates.country = country;
    }

    if (req.body.employmentInfo) {
      const { employer, jobTitle, employmentType, monthlyIncome, yearsAtCurrentJob } = req.body.employmentInfo;
      if (employer) updates.employer = employer;
      if (jobTitle) updates.jobTitle = jobTitle;
      if (employmentType) updates.employmentType = employmentType;
      if (monthlyIncome) updates.monthlyIncome = monthlyIncome;
      if (yearsAtCurrentJob) updates.yearsAtCurrentJob = yearsAtCurrentJob;
    }

    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id);

    const userProfile = user.getPublicProfile();

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Admin/Officer password reset for any user
const resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    // Check if current user is admin or loan officer
    if (!['admin', 'loan_officer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and loan officers can reset passwords.',
      });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Loan officers can only reset customer passwords, admins can reset anyone's
    if (req.user.role === 'loan_officer' && targetUser.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Loan officers can only reset customer passwords',
      });
    }

    targetUser.password = newPassword;
    await targetUser.save();

    logger.info(`Password reset for user ${targetUser.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get all users for password reset (admin/officer only)
const getAllUsers = async (req, res) => {
  try {
    // Check if current user is admin or loan officer
    if (!['admin', 'loan_officer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and loan officers can view users.',
      });
    }

    let whereClause = {};
    
    // Loan officers can only see customers
    if (req.user.role === 'loan_officer') {
      whereClause.role = 'customer';
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  resetUserPassword,
  getAllUsers,
};
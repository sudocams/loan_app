const express = require('express');
const { auth } = require('../middleware/auth');
const { validateRegister, validateLogin, validateUserUpdate } = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  resetUserPassword,
  getAllUsers,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateUserUpdate, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/reset-password', auth, resetUserPassword);
router.get('/users', auth, getAllUsers);
router.post('/upload-profile-picture', auth, uploadSingle('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { User } = require('../models');
    await User.update(
      { profilePicture: req.file.filename },
      { where: { id: req.user.id } }
    );
    const user = await User.findByPk(req.user.id);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
    });
  }
});

module.exports = router;
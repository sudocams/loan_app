const { User } = require('../models');
const { connectDB } = require('../config/database');
const bcrypt = require('bcryptjs');

const resetAdminPassword = async () => {
  try {
    await connectDB();
    
    const admin = await User.findOne({ 
      where: { 
        email: 'admin@loanapp.com',
        role: 'admin' 
      }
    });
    
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Found admin:', admin.firstName, admin.lastName, admin.email);
    
    // Hash new password
    const newPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update admin password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('✅ Admin password reset successfully');
    console.log('New login credentials:');
    console.log('Email: admin@loanapp.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
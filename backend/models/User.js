const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [3, 50]
    }
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  street: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'USA',
  },
  employer: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  employmentType: {
    type: DataTypes.ENUM('full-time', 'part-time', 'self-employed', 'unemployed', 'retired'),
    allowNull: true,
  },
  monthlyIncome: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  yearsAtCurrentJob: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  creditScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 300,
      max: 850
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'loan_officer', 'admin'),
    defaultValue: 'customer',
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    }
  ],
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getPublicProfile = function() {
  const userObject = this.toJSON();
  delete userObject.password;
  return userObject;
};

module.exports = User;
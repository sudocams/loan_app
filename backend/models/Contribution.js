const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contribution = sequelize.define('Contribution', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contributionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    contributionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_money', 'cheque'),
      allowNull: false,
      defaultValue: 'mobile_money',
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'contributions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['contributionDate'],
      },
      {
        fields: ['status'],
      },
    ],
  });

module.exports = Contribution;
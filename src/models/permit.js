'use strict';

module.exports = (sequelize, DataTypes) => {
  const Permit = sequelize.define(
    'Permit',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
      },
      permitNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      collegeStatus: {
        // The status the applicant declared for this application. Must be
        // cross-checked server-side against the applicant's AuthorizedUser
        // role before a permit is approved.
        type: DataTypes.ENUM('student', 'staff'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'permits',
      underscored: true,
    }
  );

  Permit.associate = (models) => {
    Permit.belongsTo(models.User, { foreignKey: 'userId' });
    Permit.belongsTo(models.Vehicle, { foreignKey: 'vehicleId' });
  };

  return Permit;
};

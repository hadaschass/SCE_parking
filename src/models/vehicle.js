'use strict';

module.exports = (sequelize, DataTypes) => {
  const currentYear = new Date().getFullYear();

  const Vehicle = sequelize.define(
    'Vehicle',
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
      plateNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue('plateNumber', String(value).trim().toUpperCase());
        },
        validate: {
          notEmpty: true,
          is: /^[A-Z0-9-]{2,12}$/i,
        },
      },
      make: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [1, 50] },
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [1, 50] },
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [1, 30] },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1980, max: currentYear + 1 },
      },
    },
    {
      tableName: 'vehicles',
      underscored: true,
    }
  );

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.User, { foreignKey: 'userId' });
    Vehicle.hasMany(models.Permit, { foreignKey: 'vehicleId' });
  };

  return Vehicle;
};

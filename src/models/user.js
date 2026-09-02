'use strict';

/**
 * User is a login account. It can only be created for an email that exists
 * in AuthorizedUser (enforced in the controller, not just here), and its
 * `role` and `isAdmin` fields are always set server-side from trusted data
 * — never from client-submitted request bodies.
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      authorizedUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'authorized_users', key: 'id' },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('student', 'staff'),
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'users',
      underscored: true,
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.AuthorizedUser, { foreignKey: 'authorizedUserId' });
    User.hasMany(models.Vehicle, { foreignKey: 'userId' });
    User.hasMany(models.Permit, { foreignKey: 'userId' });
  };

  return User;
};

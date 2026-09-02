'use strict';

/**
 * AuthorizedUser is the college's predefined "who is allowed to log in" list.
 * A person can only register/receive a permit if their email exists here
 * with isActive = true. This table is managed by the registrar/HR via the
 * seed data or an administrative process — it is never writable by a
 * self-service applicant.
 */
module.exports = (sequelize, DataTypes) => {
  const AuthorizedUser = sequelize.define(
    'AuthorizedUser',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        // The college's own record of this person's status. This is the
        // source of truth used to authorize permit applications — it is
        // never taken from client input.
        type: DataTypes.ENUM('student', 'staff'),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        // Lets the college revoke authorization (e.g. graduated, resigned)
        // without deleting historical records.
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'authorized_users',
      underscored: true,
    }
  );

  AuthorizedUser.associate = (models) => {
    AuthorizedUser.hasOne(models.User, { foreignKey: 'authorizedUserId' });
  };

  return AuthorizedUser;
};

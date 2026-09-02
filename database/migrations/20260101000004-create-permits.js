'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      permit_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      college_status: {
        type: Sequelize.ENUM('student', 'staff'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      rejection_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('permits');
  },
};

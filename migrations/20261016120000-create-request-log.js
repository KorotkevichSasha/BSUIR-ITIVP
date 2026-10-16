'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RequestLogs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      requestedAt: { type: Sequelize.DATE, allowNull: false },
      method: { type: Sequelize.STRING(16), allowNull: false },
      url: { type: Sequelize.TEXT, allowNull: false },
      statusCode: { type: Sequelize.INTEGER, allowNull: false },
      durationMs: { type: Sequelize.DOUBLE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('RequestLogs');
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate('Posts', { mediaUrl: '/media/night-city.svg' }, { mediaUrl: 'https://example.com/night-city.jpg' });
    await queryInterface.bulkUpdate('Posts', { mediaUrl: '/media/winning-goal.mp4' }, { mediaUrl: 'https://example.com/winning-goal.mp4' });
  },
  async down(queryInterface) {
    await queryInterface.bulkUpdate('Posts', { mediaUrl: 'https://example.com/night-city.jpg' }, { mediaUrl: '/media/night-city.svg' });
    await queryInterface.bulkUpdate('Posts', { mediaUrl: 'https://example.com/winning-goal.mp4' }, { mediaUrl: '/media/winning-goal.mp4' });
  },
};

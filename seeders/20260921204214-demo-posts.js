'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('Posts', [
      {
        title: 'Sunset in Night City',
        game: 'Cyberpunk 2077',
        mediaType: 'screenshot',
        mediaUrl: '/media/night-city.svg',
        description: 'A local demonstration illustration of a night city.',
        comments: JSON.stringify(['Great lighting!', 'This city looks amazing.']),
        likesCount: 12,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Winning goal',
        game: 'Rocket League',
        mediaType: 'video',
        mediaUrl: '/media/winning-goal.mp4',
        description: 'A local demonstration animation of a goal.',
        comments: JSON.stringify(['Nice shot!']),
        likesCount: 5,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Posts', null, {});
  }
};

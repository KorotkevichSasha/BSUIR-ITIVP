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
        mediaUrl: 'https://example.com/night-city.jpg',
        description: 'A screenshot taken during an evening walk.',
        comments: JSON.stringify(['Great lighting!', 'This city looks amazing.']),
        likesCount: 12,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Winning goal',
        game: 'Rocket League',
        mediaType: 'video',
        mediaUrl: 'https://example.com/winning-goal.mp4',
        description: 'The final goal of the match.',
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

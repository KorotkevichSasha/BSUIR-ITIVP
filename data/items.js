// Данные страниц ПЗ хранятся в памяти и сбрасываются при перезапуске.
const items = [
  {
    id: 1,
    createdAt: '2026-10-16T08:00:00.000Z',
    likesCount: 0,
    title: 'Закат в Найт-Сити',
    game: 'Cyberpunk 2077',
    mediaType: 'screenshot',
    mediaUrl: 'https://example.com/night-city.jpg',
    description: 'Скриншот вечернего города после завершения задания.',
  },
  {
    id: 2,
    createdAt: '2026-10-16T08:01:00.000Z',
    likesCount: 0,
    title: 'Победный гол',
    game: 'Rocket League',
    mediaType: 'video',
    mediaUrl: 'https://example.com/winning-goal.mp4',
    description: 'Видеозапись решающего момента матча.',
  },
];

module.exports = items;

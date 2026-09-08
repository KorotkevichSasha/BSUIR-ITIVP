const posts = [
  {
    id: 1,
    title: 'Sunset in Night City',
    game: 'Cyberpunk 2077',
    mediaType: 'screenshot',
    mediaUrl: 'https://example.com/night-city.jpg',
    description: 'A screenshot taken during an evening walk.',
    comments: ['Great lighting!', 'This city looks amazing.'],
  },
  {
    id: 2,
    title: 'Winning goal',
    game: 'Rocket League',
    mediaType: 'video',
    mediaUrl: 'https://example.com/winning-goal.mp4',
    description: 'The final goal of the match.',
    comments: ['Nice shot!'],
  },
];

let nextId = 3;

function getNextId() {
  return nextId++;
}

module.exports = { posts, getNextId };

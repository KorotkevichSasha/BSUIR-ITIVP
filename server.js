const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

let posts = [
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

function validatePost(post) {
  const requiredStringFields = ['title', 'game', 'mediaType', 'mediaUrl', 'description'];

  for (const field of requiredStringFields) {
    if (typeof post[field] !== 'string' || post[field].trim() === '') {
      return `Field "${field}" must be a non-empty string`;
    }
  }

  if (!['screenshot', 'video'].includes(post.mediaType)) {
    return 'Field "mediaType" must be "screenshot" or "video"';
  }

  if (post.comments !== undefined) {
    const commentsAreValid =
      Array.isArray(post.comments) &&
      post.comments.every((comment) => typeof comment === 'string');

    if (!commentsAreValid) {
      return 'Field "comments" must be an array of strings';
    }
  }

  return null;
}

app.get('/', (req, res) => {
  res.json({ message: 'Game Media API is running' });
});

app.get('/posts', (req, res) => {
  const { mediaType } = req.query;

  if (mediaType && !['screenshot', 'video'].includes(mediaType)) {
    return res.status(400).json({
      error: 'Query parameter "mediaType" must be "screenshot" or "video"',
    });
  }

  const result = mediaType
    ? posts.filter((post) => post.mediaType === mediaType)
    : posts;

  return res.json(result);
});

app.get('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((item) => item.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  return res.json(post);
});

app.post('/posts', (req, res) => {
  const validationError = validatePost(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const newPost = {
    id: nextId++,
    title: req.body.title.trim(),
    game: req.body.game.trim(),
    mediaType: req.body.mediaType,
    mediaUrl: req.body.mediaUrl.trim(),
    description: req.body.description.trim(),
    comments: req.body.comments || [],
  };

  posts.push(newPost);
  return res.status(201).json(newPost);
});

app.put('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const postIndex = posts.findIndex((item) => item.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const validationError = validatePost(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const updatedPost = {
    id,
    title: req.body.title.trim(),
    game: req.body.game.trim(),
    mediaType: req.body.mediaType,
    mediaUrl: req.body.mediaUrl.trim(),
    description: req.body.description.trim(),
    comments: req.body.comments || [],
  };

  posts[postIndex] = updatedPost;
  return res.json(updatedPost);
});

app.delete('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const postIndex = posts.findIndex((item) => item.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(postIndex, 1);
  return res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

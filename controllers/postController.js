const { posts, getNextId } = require('../models/postModel');

function validatePost(post) {
  if (!post || typeof post !== 'object' || Array.isArray(post)) {
    return 'Request body must be a JSON object';
  }

  const requiredStringFields = ['title', 'game', 'mediaType', 'mediaUrl', 'description'];

  for (const field of requiredStringFields) {
    if (typeof post[field] !== 'string' || post[field].trim() === '') {
      return `Field "${field}" must be a non-empty string`;
    }
  }

  if (!['screenshot', 'video'].includes(post.mediaType)) {
    return 'Field "mediaType" must be "screenshot" or "video"';
  }

  if (
    post.comments !== undefined &&
    (!Array.isArray(post.comments) ||
      !post.comments.every((comment) => typeof comment === 'string'))
  ) {
    return 'Field "comments" must be an array of strings';
  }

  return null;
}

function getPosts(req, res) {
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
}

function getPostById(req, res) {
  const id = Number(req.params.id);
  const post = posts.find((item) => item.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  return res.json(post);
}

function createPost(req, res) {
  const validationError = validatePost(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const newPost = {
    id: getNextId(),
    title: req.body.title.trim(),
    game: req.body.game.trim(),
    mediaType: req.body.mediaType,
    mediaUrl: req.body.mediaUrl.trim(),
    description: req.body.description.trim(),
    comments: req.body.comments || [],
  };

  posts.push(newPost);
  return res.status(201).json(newPost);
}

function updatePost(req, res) {
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
}

function deletePost(req, res) {
  const id = Number(req.params.id);
  const postIndex = posts.findIndex((item) => item.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(postIndex, 1);
  return res.status(204).send();
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};

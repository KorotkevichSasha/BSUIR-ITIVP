const { Post } = require('../models');

function validatePost(post) {
  if (!post || typeof post !== 'object' || Array.isArray(post)) {
    return 'Request body must be a JSON object';
  }

  const requiredStringFields = [
    'title',
    'game',
    'mediaType',
    'mediaUrl',
    'description',
  ];

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

  if (
    post.likesCount !== undefined &&
    (!Number.isInteger(post.likesCount) || post.likesCount < 0)
  ) {
    return 'Field "likesCount" must be a non-negative integer';
  }

  return null;
}

async function getPosts(req, res, next) {
  try {
    const { mediaType } = req.query;

    if (mediaType && !['screenshot', 'video'].includes(mediaType)) {
      return res.status(400).json({
        error: 'Query parameter "mediaType" must be "screenshot" or "video"',
      });
    }

    const posts = await Post.findAll({
      where: mediaType ? { mediaType } : {},
      order: [['id', 'ASC']],
    });

    return res.json(posts);
  } catch (error) {
    return next(error);
  }
}

async function getPostById(req, res, next) {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json(post);
  } catch (error) {
    return next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const validationError = validatePost(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const post = await Post.create({
      title: req.body.title.trim(),
      game: req.body.game.trim(),
      mediaType: req.body.mediaType,
      mediaUrl: req.body.mediaUrl.trim(),
      description: req.body.description.trim(),
      comments: req.body.comments || [],
      likesCount: req.body.likesCount || 0,
    });

    return res.status(201).json(post);
  } catch (error) {
    return next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const validationError = validatePost(req.body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await post.update({
      title: req.body.title.trim(),
      game: req.body.game.trim(),
      mediaType: req.body.mediaType,
      mediaUrl: req.body.mediaUrl.trim(),
      description: req.body.description.trim(),
      comments: req.body.comments || [],
      likesCount: req.body.likesCount ?? post.likesCount,
    });

    return res.json(post);
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    const deletedCount = await Post.destroy({
      where: { id: req.params.id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};

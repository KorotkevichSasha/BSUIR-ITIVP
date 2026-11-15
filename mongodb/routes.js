const express = require('express');
const { mongoose } = require('./db');
const Post = require('./models/Post');
const { authenticate } = require('./auth');
const limits = require('../config/postLimits.json');
const router = express.Router();
router.use(authenticate);

function validId(id) { return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id); }
function invalidBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Expected a JSON object';
  const allowed = ['title', 'game', 'mediaType', 'mediaUrl', 'description', 'tags', 'metadata'];
  if (Object.keys(body).some(key => !allowed.includes(key))) return 'Unknown or read-only field';
  for (const field of ['title', 'game', 'mediaType', 'mediaUrl', 'description']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > limits[field]) return `Invalid field: ${field}`;
  }
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string'))) return 'Tags must be an array of strings';
  if (body.metadata !== undefined && (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata)
    || Object.keys(body.metadata).some(key => !['platform', 'resolution'].includes(key))
    || Object.values(body.metadata).some(value => typeof value !== 'string'))) return 'Invalid metadata';
  return null;
}
router.param('id', (req, res, next, id) => validId(id) ? next() : res.status(400).json({ error: 'Invalid ObjectId' }));
router.param('commentId', (req, res, next, id) => validId(id) ? next() : res.status(400).json({ error: 'Invalid comment ObjectId' }));

router.get('/', async (req, res) => {
  const filter = {};
  for (const key of Object.keys(req.query)) {
    if (!['game', 'mediaType', 'tag', 'platform', 'author'].includes(key) || typeof req.query[key] !== 'string') return res.status(400).json({ error: 'Invalid filter' });
  }
  if (req.query.mediaType && !['screenshot', 'video'].includes(req.query.mediaType)) return res.status(400).json({ error: 'Invalid mediaType' });
  if (req.query.game) filter.game = req.query.game;
  if (req.query.mediaType) filter.mediaType = req.query.mediaType;
  if (req.query.tag) filter.tags = req.query.tag;
  if (req.query.platform) filter['metadata.platform'] = req.query.platform;
  if (req.query.author) filter['comments.author'] = req.query.author;
  return res.json(await Post.find(filter).sort({ createdAt: -1, _id: -1 }));
});

router.get('/stats', async (req, res) => res.json(await Post.aggregate([
  { $match: { mediaType: { $in: ['screenshot', 'video'] } } },
  { $group: { _id: '$game', publications: { $sum: 1 }, comments: { $sum: { $size: '$comments' } } } },
  { $sort: { publications: -1, _id: 1 } },
])));

router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  return post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
});
router.post('/', async (req, res) => {
  const error = invalidBody(req.body);
  if (error) return res.status(400).json({ error });
  return res.status(201).json(await Post.create(req.body));
});
router.put('/:id', async (req, res) => {
  const error = invalidBody(req.body);
  if (error) return res.status(400).json({ error });
  const post = await Post.findByIdAndUpdate(req.params.id, { $set: req.body }, { returnDocument: 'after', runValidators: true });
  return post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
});
router.delete('/:id', async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  return post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
});

// Атомарное добавление вложенного комментария без отдельной коллекции.
router.post('/:id/comments', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['author', 'text'].includes(k))
    || typeof body.author !== 'string' || !body.author.trim() || body.author.length > 80
    || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 1000) return res.status(400).json({ error: 'Enter author (1–80) and text (1–1000)' });
  const post = await Post.findOneAndUpdate({ _id: req.params.id, 'comments.99': { $exists: false } },
    { $push: { comments: { author: body.author.trim(), text: body.text.trim() } } },
    { returnDocument: 'after', runValidators: true });
  if (post) return res.status(201).json(post);
  return res.status(await Post.exists({ _id: req.params.id }) ? 409 : 404).json({ error: 'Post not found or comment limit reached' });
});

// Позиционный оператор $ обновляет выбранный элемент массива, $inc — счётчик.
router.patch('/:id/comments/:commentId/likes', async (req, res) => {
  if (req.body && Object.keys(req.body).length) return res.status(400).json({ error: 'This endpoint adds one like and accepts no fields' });
  const post = await Post.findOneAndUpdate({ _id: req.params.id, comments: { $elemMatch: {
    _id: new mongoose.Types.ObjectId(req.params.commentId), likesCount: { $lt: 2147483647 },
  } } }, { $inc: { 'comments.$.likesCount': 1 } }, { returnDocument: 'after' });
  return post ? res.json(post) : res.status(404).json({ error: 'Post or comment not found, or like limit reached' });
});
module.exports = { router, invalidBody, validId };

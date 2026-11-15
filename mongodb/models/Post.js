const { mongoose } = require('../db');
const { Schema } = mongoose;
const limits = require('../../config/postLimits.json');

const requiredText = max => ({ type: String, required: true, trim: true, maxlength: max });
const commentSchema = new Schema({
  author: requiredText(80),
  text: requiredText(1000),
  likesCount: { type: Number, default: 0, min: 0, max: 2147483647, validate: Number.isInteger },
  createdAt: { type: Date, default: Date.now },
}, { strict: 'throw' });

const postSchema = new Schema({
  title: requiredText(limits.title),
  game: requiredText(limits.game),
  mediaType: { type: String, required: true, enum: ['screenshot', 'video'] },
  mediaUrl: {
    ...requiredText(limits.mediaUrl),
    validate: {
      validator(value) {
        if (/^\/media\/[a-z0-9._-]+$/i.test(value)) return true;
        try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
      },
      message: 'Use HTTP, HTTPS or a local /media/ path',
    },
  },
  description: requiredText(limits.description),
  tags: { type: [{ type: String, trim: true, minlength: 1, maxlength: 30 }], default: [],
    validate: { validator: value => value.length <= 20 && new Set(value).size === value.length,
      message: 'Use at most 20 distinct tags' } },
  metadata: {
    platform: { type: String, trim: true, maxlength: 40, default: 'PC' },
    resolution: { type: String, trim: true, maxlength: 30, default: '1920x1080' },
  },
  comments: { type: [commentSchema], default: [],
    validate: { validator: value => value.length <= 100, message: 'At most 100 comments' } },
  likesCount: { type: Number, default: 0, min: 0, max: 2147483647, validate: Number.isInteger },
}, { timestamps: true, strict: 'throw', toJSON: { virtuals: true, versionKey: false } });

postSchema.index({ game: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model('MongoPost', postSchema, 'posts');

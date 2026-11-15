const { mongoose } = require('../db');
const schema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user'], default: 'user' },
}, { timestamps: true, strict: 'throw' });
schema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model('MongoUser', schema, 'users');

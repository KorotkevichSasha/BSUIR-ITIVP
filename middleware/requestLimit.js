const { rateLimit } = require('express-rate-limit');
const { request } = require('../config/validation.json');

module.exports = rateLimit({
  windowMs: request.windowMs,
  limit: request.maxRequests,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(req, res, next) {
    const error = new Error('Слишком много запросов');
    error.status = 429;
    error.publicMessage = `Превышен предел ${request.maxRequests} запросов за ${request.windowMs / 1000} секунд с одного IP-адреса. Подождите минуту и повторите запрос.`;
    next(error);
  },
});

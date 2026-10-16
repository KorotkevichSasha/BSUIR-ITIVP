const { RequestLog } = require('../models');

function requestLogger(req, res, next) {
  const requestedAt = new Date();
  const startedAt = process.hrtime.bigint();

  // Статус и длительность известны после отправки ответа.
  res.on('finish', async () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const entry = {
      requestedAt,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    console.log(`[${requestedAt.toISOString()}] ${entry.method} ${entry.url} ${entry.statusCode} ${entry.durationMs} ms`);

    try {
      await RequestLog.create(entry);
    } catch (error) {
      // Ошибка записи журнала не должна останавливать приложение.
      console.error('Unable to save request log:', error.message);
    }
  });

  next();
}

module.exports = requestLogger;

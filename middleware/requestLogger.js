const { RequestLog } = require('../models');

async function requestLogger(req, res, next) {
  const startedAt = Date.now();
  try {
    // Zero marks a request whose response has not finished yet.
    const log = await RequestLog.create({
      requestedAt: new Date(), method: req.method, url: req.originalUrl,
      statusCode: 0, durationMs: 0,
    });
    res.once('finish', () => {
      log.update({ statusCode: res.statusCode, durationMs: Date.now() - startedAt })
        .catch((error) => console.error('Не удалось обновить результат запроса в БД:', error.message));
    });
    return next();
  } catch (cause) {
    const error = new Error('Не удалось записать журнал запросов в БД', { cause });
    error.publicMessage = 'Не удалось записать запрос в базу данных. Проверьте доступность PostgreSQL и подключение к Supabase. После восстановления соединения повторите запрос.';
    return next(error);
  }
}

module.exports = requestLogger;

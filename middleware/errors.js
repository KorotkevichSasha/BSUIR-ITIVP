const { request: limits } = require('../config/validation.json');

function isApiRequest(req) {
  return /^\/(posts|auth|profile|admin)(\/|$)/.test(req.path);
}

function notFound(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({ error: 'Route not found' });
  }
  return res.status(404).render('404', { title: 'Страница не найдена' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.status === 413 || err.status === 429) {
    const status = err.status;
    const title = status === 413 ? 'Слишком большой запрос' : 'Слишком много запросов';
    const explanation = status === 413
      ? `Размер тела запроса не должен превышать ${limits.bodyBytes / 1024} КиБ. Форма принимает не более ${limits.parameterLimit} параметров. Уменьшите объём данных и повторите отправку.`
      : err.publicMessage;
    if (isApiRequest(req)) return res.status(status).json({ error: title });
    return res.status(status).render('request-error', { status, title, explanation });
  }

  console.error(err);

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  if (isApiRequest(req)) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(500).render('500', {
    title: 'Ошибка сервера',
    explanation: err.publicMessage || 'При обработке запроса произошёл внутренний сбой. Повторите запрос позже. Подробности ошибки записаны в консоль сервера.',
  });
}

module.exports = { notFound, errorHandler };

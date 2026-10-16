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
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  if (isApiRequest(req)) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(500).render('500', { title: 'Ошибка сервера' });
}

module.exports = { notFound, errorHandler };

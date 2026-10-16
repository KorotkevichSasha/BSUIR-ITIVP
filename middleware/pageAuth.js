function pageAuth(req, res, next) {
  if (req.query.auth !== '1') {
    return res.redirect('/login');
  }

  req.user = { name: 'Александр' };
  return next();
}

module.exports = pageAuth;

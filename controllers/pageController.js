const items = require('../data/items');
const { RequestLog } = require('../models');

function getIndex(req, res) {
  res.render('index', { title: 'Игровые публикации', items });
}

function getItem(req, res, next) {
  const item = items.find((item) => String(item.id) === req.params.id);
  if (!item) {
    return next();
  }
  return res.render('item', { title: item.title, item });
}

function getAdd(req, res) {
  res.render('add', { title: 'Добавить публикацию', user: req.user, error: null, values: {} });
}

function createItem(req, res) {
  const fields = ['title', 'game', 'mediaType', 'mediaUrl', 'description'];
  const values = {};
  for (const field of fields) {
    values[field] = typeof req.body?.[field] === 'string' ? req.body[field].trim() : '';
  }

  let validUrl = false;
  try {
    validUrl = ['https:', 'http:'].includes(new URL(values.mediaUrl).protocol);
  } catch {
    validUrl = false;
  }

  if (fields.some((field) => !values[field]) ||
      !['screenshot', 'video'].includes(values.mediaType) || !validUrl) {
    return res.status(400).render('add', {
      title: 'Добавить публикацию', user: req.user, values,
      error: 'Заполните все поля, выберите тип медиа и укажите ссылку http:// или https://.',
    });
  }

  const id = items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  items.push({ id, ...values });
  return res.redirect('/');
}

function getLogin(req, res) {
  res.render('login', { title: 'Учебная авторизация' });
}

async function getLogs(req, res) {
  const logs = await RequestLog.findAll({ order: [['id', 'DESC']], limit: 100 });
  res.render('logs', { title: 'Журнал запросов', logs });
}

function testError(req, res, next) {
  next(new Error('Проверка middleware обработки ошибки 500'));
}

module.exports = { getIndex, getItem, getAdd, createItem, getLogin, getLogs, testError };

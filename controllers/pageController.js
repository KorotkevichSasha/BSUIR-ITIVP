const items = require('../data/items');
const { RequestLog } = require('../models');
const limits = require('../config/validation.json');

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
  res.render('add', { title: 'Добавить публикацию', user: req.user, errors: [], values: { likesCount: '0' }, limits });
}

function createItem(req, res) {
  const fields = ['title', 'game', 'mediaType', 'mediaUrl', 'description', 'likesCount'];
  const values = {};
  const errors = [];
  const labels = { title: 'Название', game: 'Игра', mediaType: 'Тип медиа', mediaUrl: 'Ссылка на медиа', description: 'Описание', likesCount: 'Количество лайков' };
  for (const field of fields) {
    const raw = typeof req.body?.[field] === 'string' ? req.body[field] : '';
    const maxLength = limits[field].maxLength;
    // Check length before trimming or converting numbers. Bound the echoed value too.
    values[field] = raw.trim().slice(0, maxLength);
    if (raw.length > maxLength) {
      errors.push(`Поле «${labels[field]}»: не более ${maxLength} символов.`);
    } else if (!values[field]) {
      const label = labels[field];
      errors.push(`Поле «${label}» не должно быть пустым или состоять из пробелов.`);
    }
  }
  // This is a numeric counter: keep its stored value finite and nonnegative.
  if (values.likesCount && !/^\d+$/.test(values.likesCount)) {
    errors.push('Количество лайков — целое неотрицательное число.');
  }
  if (items.length >= limits.maxItems) errors.push('Учебный массив заполнен. Перезапустите сервер для очистки добавленных публикаций.');
  if (errors.length) {
    return res.status(400).render('add', {
      title: 'Добавить публикацию', user: req.user, values, errors, limits,
    });
  }

  const likesCount = Number(values.likesCount);
  const id = items.length ? items[items.length - 1].id + 1 : 1;
  const previousTime = items.length ? Date.parse(items[items.length - 1].createdAt) : 0;
  const createdAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
  items.push({ id, ...values, likesCount, createdAt });
  return res.redirect('/');
}

function getLogin(req, res) {
  res.render('login', { title: 'Учебная авторизация' });
}

async function getLogs(req, res) {
  const logs = await RequestLog.findAll({ order: [['id', 'DESC']], limit: limits.log.maxEntries });
  res.render('logs', { title: 'Журнал запросов', logs });
}

module.exports = { getIndex, getItem, getAdd, createItem, getLogin, getLogs };

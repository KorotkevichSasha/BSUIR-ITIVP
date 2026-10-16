const items = require('../data/items');
const fs = require('node:fs/promises');
const { logFile } = require('../middleware/requestLogger');
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
  for (const field of fields) {
    values[field] = typeof req.body?.[field] === 'string' ? req.body[field].trim() : '';
  }

  const errors = [];
  const labels = { title: 'Название', game: 'Игра', mediaUrl: 'Ссылка на медиа', description: 'Описание' };
  for (const [field, label] of Object.entries(labels)) {
    if (values[field].length < limits[field].minLength) {
      errors.push(`Поле «${label}» не должно быть пустым или состоять из пробелов.`);
    } else if (values[field].length > limits[field].maxLength) {
      errors.push(`Поле «${label}»: не более ${limits[field].maxLength} символов.`);
    }
  }
  if (!limits.mediaTypes.includes(values.mediaType)) {
    errors.push('Выберите тип медиа: скриншот или видео.');
  }

  let validUrl = false;
  try {
    validUrl = ['https:', 'http:'].includes(new URL(values.mediaUrl).protocol);
  } catch {
    validUrl = false;
  }

  if (values.mediaUrl && !validUrl) {
    errors.push('Ссылка на медиа должна начинаться с http:// или https:// и содержать корректный адрес.');
  }
  const likesCount = Number(values.likesCount);
  if (!/^\d+$/.test(values.likesCount) || !Number.isSafeInteger(likesCount) ||
      likesCount < limits.likesCount.min || likesCount > limits.likesCount.max) {
    errors.push(`Количество лайков — целое число от ${limits.likesCount.min} до ${limits.likesCount.max}.`);
  }

  if (errors.length) {
    return res.status(400).render('add', {
      title: 'Добавить публикацию', user: req.user, values, errors, limits,
    });
  }

  const id = items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  const previousTime = Math.max(...items.map((item) => Date.parse(item.createdAt)), 0);
  const createdAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
  items.push({ id, ...values, likesCount, createdAt });
  return res.redirect('/');
}

function getLogin(req, res) {
  res.render('login', { title: 'Учебная авторизация' });
}

async function getLogs(req, res) {
  const text = await fs.readFile(logFile, 'utf8');
  const logs = text.trim().split('\n').filter(Boolean).slice(-100).reverse().map((line) => JSON.parse(line));
  res.render('logs', { title: 'Журнал запросов', logs });
}

function testError(req, res, next) {
  const error = new Error('Проверка middleware обработки ошибки 500');
  error.publicMessage = 'Вызвана учебная ошибка для демонстрации обработчика. Express передал её в middleware с четырьмя параметрами, которое сформировало эту страницу с HTTP-кодом 500.';
  next(error);
}

module.exports = { getIndex, getItem, getAdd, createItem, getLogin, getLogs, testError };

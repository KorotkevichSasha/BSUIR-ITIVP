const fs = require('node:fs');
const input = { title: 'ЛР6 — Победный гол', game: 'Rocket League', mediaType: 'video',
  mediaUrl: '/media/winning-goal.mp4', description: 'Публикация хранится в MongoDB вместе с тегами и вложенными комментариями.',
  tags: ['финал', 'лаб6'], metadata: { platform: 'PC', resolution: '1920x1080' } };
function item(name, method, path, body, status = 200, extra = [], auth) {
  const request = { method, header: body === undefined ? [] : [{ key: 'Content-Type', value: 'application/json' }], url: '{{baseUrl}}' + path };
  if (auth) request.auth = { type: auth };
  if (body !== undefined) request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
  return { name, request, event: [{ listen: 'test', script: { type: 'text/javascript', exec: [
    `pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`, ...extra,
  ] } }] };
}
const registration = item('01 Регистрация тестового пользователя', 'POST', '/auth/register', { email: '{{email}}', password: '{{password}}' }, 201, [], 'noauth');
registration.event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: [
  "pm.collectionVariables.set('email', 'lab6-postman-' + pm.variables.replaceIn('{{$guid}}') + '@example.test');",
  "pm.collectionVariables.set('password', pm.variables.replaceIn('{{$guid}}') + '-Lab6');",
] } });
const collection = {
  info: { name: 'ЛР6 — Game Media MongoDB — Короткевич А.Г.', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: 'Параллельная реализация в ветке 26. Запуск: npm run start:mongo. Выполнять запросы по порядку. JWT сохраняется локально в переменной token. Учётная запись MongoDB API отдельная от PostgreSQL. Секретов Atlas в коллекции нет.' },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
  variable: ['baseUrl', 'email', 'password', 'token', 'postId', 'commentId'].map(key => ({ key, value: key === 'baseUrl' ? 'http://127.0.0.1:3002' : '', type: 'string' })),
  item: [registration,
    item('02 Вход и получение JWT', 'POST', '/auth/login', { email: '{{email}}', password: '{{password}}' }, 200, ["pm.collectionVariables.set('token', pm.response.json().token);"], 'noauth'),
    item('03 GET список публикаций', 'GET', '/posts'),
    item('04 POST публикация с tags и metadata', 'POST', '/posts', input, 201, ["pm.collectionVariables.set('postId', pm.response.json().id);", "pm.test('ObjectId и вложенная metadata', () => { pm.expect(pm.response.json().id).to.match(/^[a-f0-9]{24}$/); pm.expect(pm.response.json().metadata.platform).to.eql('PC'); });"]),
    item('05 GET по ObjectId', 'GET', '/posts/{{postId}}'),
    item('06 PUT изменение публикации', 'PUT', '/posts/{{postId}}', { ...input, title: 'ЛР6 — Гол после редактирования' }),
    item('07 POST вложенный комментарий', 'POST', '/posts/{{postId}}/comments', { author: 'Короткевич А. Г.', text: 'Вложенный документ внутри массива comments' }, 201,
      ["const comments = pm.response.json().comments; pm.collectionVariables.set('commentId', comments[comments.length - 1]._id);", "pm.test('Комментарий создан', () => pm.expect(pm.response.json().comments).to.have.length.above(0));"]),
    item('08 PATCH лайк внутри массива', 'PATCH', '/posts/{{postId}}/comments/{{commentId}}/likes', undefined, 200,
      ["pm.test('likesCount увеличен', () => { const c = pm.response.json().comments.find(c => c._id === pm.collectionVariables.get('commentId')); pm.expect(c.likesCount).to.be.above(0); });"]),
    item('09 GET по тегу и вложенному полю', 'GET', '/posts?tag=%D0%BB%D0%B0%D0%B16&platform=PC'),
    item('10 GET агрегация по играм', 'GET', '/posts/stats'),
    item('11 Ошибка 400 неверный ObjectId', 'GET', '/posts/not-an-id', undefined, 400),
    item('12 Ошибка 400 пустой заголовок', 'POST', '/posts', { ...input, title: '   ' }, 400),
    item('13 Ошибка 401 без JWT', 'GET', '/posts', undefined, 401, [], 'noauth'),
    item('14 DELETE возврат удалённого документа', 'DELETE', '/posts/{{postId}}', undefined, 200,
      ["pm.test('Удалён нужный документ', () => pm.expect(pm.response.json().id).to.eql(pm.collectionVariables.get('postId')));"]),
    item('15 GET после удаления — 404', 'GET', '/posts/{{postId}}', undefined, 404),
  ],
};
fs.writeFileSync('Lab 6 - MongoDB.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
console.log('Postman collection generated: 15 requests');

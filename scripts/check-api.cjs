// Интеграционная проверка: настоящий Express и PostgreSQL, только свои временные записи.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../server');
const { sequelize, User, Post } = require('../models');

async function main() {
  await sequelize.authenticate();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const email = `lab5-${randomUUID()}@example.test`;
  const password = randomUUID();
  let token = '';
  let id;
  let passed = 0;
  async function request(path, method = 'GET', body, auth = true, extra = {}) {
    const headers = { ...extra };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  function check(value, label) { assert.ok(value, label); console.log(`PASS ${++passed}: ${label}`); }
  try {
    check((await request('/')).status === 200, 'API starts');
    check((await request('/posts')).status === 401, 'GET posts requires JWT');
    check((await request('/posts', 'POST', {}, false)).status === 401, 'POST posts requires JWT');
    const cors = await request('/posts', 'OPTIONS', undefined, false, { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' });
    check(cors.status === 204 && cors.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'CORS preflight');
    const denied = await request('/', 'GET', undefined, false, { Origin: 'https://untrusted.test' });
    check(!denied.headers.has('access-control-allow-origin'), 'CORS does not allow arbitrary origins');
    check((await request('/auth/register', 'POST', { email, password, role: 'admin' }, false)).status === 201, 'Register user');
    check((await request('/auth/register', 'POST', { email, password }, false)).status === 409, 'Duplicate email');
    check((await request('/auth/login', 'POST', { email, password: 'wrong' }, false)).status === 401, 'Wrong password');
    const response = await request('/auth/login', 'POST', { email, password }, false);
    const session = await response.json(); token = session.token;
    check(response.status === 200 && typeof token === 'string', 'Login returns JWT');
    const profile = await (await request('/profile')).json();
    check(profile.role === 'user' && !profile.passwordHash, 'Role cannot be assigned through registration');
    check((await request('/admin')).status === 403, 'User cannot access admin route');
    const originalIds = (await (await request('/posts')).json()).map(post => post.id);
    check(Array.isArray(originalIds), 'Read real PostgreSQL collection');
    const data = { title: 'ЛР5 интеграционный тест', game: 'Rocket League', mediaType: 'video', mediaUrl: '/media/winning-goal.mp4', description: 'Временная запись автоматической проверки', comments: ['Сохранить комментарий'], likesCount: 2 };
    const createdResponse = await request('/posts', 'POST', data);
    const created = await createdResponse.json(); id = created.id;
    check(createdResponse.status === 201 && Number.isInteger(id), 'POST returns real database id');
    check((await Post.findByPk(id)).title === data.title, 'Inserted row exists in PostgreSQL');
    const updatedResponse = await request(`/posts/${id}`, 'PUT', { title: 'ЛР5 обновлённый тест', game: data.game, mediaType: data.mediaType, mediaUrl: data.mediaUrl, description: 'Изменённое описание' });
    const updated = await updatedResponse.json();
    check(updatedResponse.status === 200 && updated.title === 'ЛР5 обновлённый тест' && updated.createdAt === created.createdAt, 'PUT updates row and preserves creation time');
    check(updated.comments[0] === data.comments[0] && updated.likesCount === 2, 'PUT preserves omitted comments and likes');
    check((await request('/posts?mediaType=video')).status === 200, 'Existing media type filter');
    check((await request('/posts', 'POST', { ...data, title: '   ' })).status === 400, 'Whitespace rejected');
    check((await request('/posts', 'POST', { ...data, title: 'x'.repeat(101) })).status === 400, 'Text length bounded');
    check((await request('/posts', 'POST', { ...data, mediaUrl: 'javascript:alert(1)' })).status === 400, 'Unsafe media URL rejected');
    check((await request('/posts', 'POST', { ...data, likesCount: 1e100 })).status === 400, 'Huge numeric value rejected');
    check((await request('/posts', 'POST', { ...data, comments: ['x'.repeat(1001)] })).status === 400, 'Comment length bounded');
    check((await request('/posts', 'POST', { ...data, description: 'x'.repeat(40000) })).status === 413, 'Oversized body returns 413');
    check((await request('/posts/9999999999999999999999999')).status === 400, 'Huge identifier returns 400');
    check((await request(`/posts/${id}`, 'DELETE')).status === 204, 'DELETE returns 204');
    check(await Post.findByPk(id) === null, 'Deleted row absent in PostgreSQL');
    check((await request(`/posts/${id}`)).status === 404, 'Deleted row returns 404');
    const remaining = await (await request('/posts')).json();
    check(originalIds.every(originalId => remaining.some(post => post.id === originalId)), 'Original publications preserved');
    const image = await request('/media/night-city.svg');
    check(image.status === 200 && image.headers.get('content-type').includes('svg'), 'Local demo media available');
    const oldToken = token; token = 'invalid';
    check((await request('/posts')).status === 401, 'Invalid token rejected'); token = oldToken;
    console.log(`API CHECKS: ${passed} passed`);
  } finally {
    if (id) await Post.destroy({ where: { id } });
    await User.destroy({ where: { email } });
    await new Promise(resolve => server.close(resolve));
    await sequelize.close();
  }
}

main().catch(error => { console.error('API CHECK FAILED:', error.message); process.exitCode = 1; });

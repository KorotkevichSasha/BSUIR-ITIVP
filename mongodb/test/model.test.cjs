const test = require('node:test');
const assert = require('node:assert/strict');
const Post = require('../models/Post');
const { validId, invalidBody } = require('../routes');
const valid = { title: 'Финал', game: 'Rocket League', mediaType: 'video', mediaUrl: '/media/winning-goal.mp4', description: 'Победный гол' };
test('nested comments, tags, metadata and ObjectIds are embedded in a single document', async () => {
  const post = new Post({ ...valid, tags: ['финал'], metadata: { platform: 'PC' }, comments: [{ author: 'Александр', text: 'Отличный гол' }] });
  await post.validate();
  assert.equal(post.comments[0].likesCount, 0);
  assert.match(post.comments[0].id, /^[a-f0-9]{24}$/);
  assert.equal(post.metadata.platform, 'PC');
  assert.equal(post.toJSON().id, post.id);
});
test('empty or whitespace fields are rejected', async () => {
  for (const field of ['title', 'game', 'description']) await assert.rejects(new Post({ ...valid, [field]: '   ' }).validate());
});
test('invalid types, unsafe URI and negative likes are rejected', async () => {
  for (const bad of [{ mediaType: 'audio' }, { mediaUrl: 'javascript:alert(1)' }, { likesCount: -1 }, { likesCount: 1.5 }]) await assert.rejects(new Post({ ...valid, ...bad }).validate());
});
test('title boundary accepts 100 and rejects 101', async () => {
  await new Post({ ...valid, title: 'Я'.repeat(100) }).validate();
  await assert.rejects(new Post({ ...valid, title: 'Я'.repeat(101) }).validate());
});
test('arrays are bounded and tags must be distinct after trimming', async () => {
  await assert.rejects(new Post({ ...valid, tags: Array.from({ length: 21 }, (_, i) => String(i)) }).validate());
  await assert.rejects(new Post({ ...valid, tags: ['final', ' final '] }).validate());
  await assert.rejects(new Post({ ...valid, comments: Array.from({ length: 101 }, () => ({ author: 'A', text: 'B' })) }).validate());
});
test('body parser allowlists fields and rejects query operators and nested injection', () => {
  assert.equal(invalidBody(valid), null);
  for (const value of [{ ...valid, $set: {} }, { ...valid, game: { $ne: '' } }, { ...valid, metadata: { $where: 'x' } }, { ...valid, tags: [123] }, { ...valid, comments: [] }]) assert.ok(invalidBody(value));
});
test('only canonical ObjectId hex input is accepted', () => {
  assert.ok(validId('0123456789abcdef01234567'));
  for (const value of ['abc', '1', 'abcdefghijklmnopqrstuvwx', null]) assert.equal(validId(value), false);
});
test('unconfigured API still exposes health; protected routes reject missing/invalid JWT', async () => {
  const { app } = require('../../server-mongo');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await (await fetch(url)).json()).storage, 'MongoDB');
    assert.equal((await fetch(url + '/posts')).status, 401);
    assert.equal((await fetch(url + '/posts', { headers: { Authorization: 'Bearer invalid' } })).status, 401);
    assert.equal((await fetch(url + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

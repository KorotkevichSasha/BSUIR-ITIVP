require('dotenv').config();
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { connectMongo, mongoose } = require('../mongodb/db');
const Post = require('../mongodb/models/Post');
const User = require('../mongodb/models/User');
const { app } = require('../server-mongo');

(async () => {
  let server, userId, postId, token; const checks = [];
  try {
    await connectMongo(); await Promise.all([User.init(), Post.init()]);
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, path, body, expected) {
      const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${response.status}`);
      checks.push({ method, path, status: response.status }); return data;
    }
    await request('GET', '/posts', undefined, 401);
    const creds = { email: `lab6-check-${crypto.randomUUID()}@example.test`, password: crypto.randomBytes(20).toString('hex') };
    const user = await request('POST', '/auth/register', creds, 201); userId = user.id;
    token = (await request('POST', '/auth/login', creds, 200)).token;
    const input = { title: 'ЛР6 — проверка MongoDB', game: 'Rocket League', mediaType: 'video', mediaUrl: '/media/winning-goal.mp4', description: 'Временная запись интеграционной проверки', tags: ['лаб6', 'финал'], metadata: { platform: 'PC', resolution: '1920x1080' } };
    const post = await request('POST', '/posts', input, 201); postId = post.id;
    assert.ok(mongoose.isObjectIdOrHexString(postId)); assert.equal(post.metadata.platform, 'PC');
    assert.equal((await request('GET', '/posts/' + postId, undefined, 200)).title, input.title);
    assert.ok((await request('GET', '/posts?tag=' + encodeURIComponent('лаб6') + '&platform=PC', undefined, 200)).some(p => p.id === postId));
    const updated = await request('PUT', '/posts/' + postId, { ...input, title: 'ЛР6 — обновлено' }, 200); assert.equal(updated.title, 'ЛР6 — обновлено');
    const withComment = await request('POST', `/posts/${postId}/comments`, { author: 'Короткевич А. Г.', text: 'Комментарий внутри документа публикации' }, 201);
    const commentId = withComment.comments[0]._id;
    const liked = await request('PATCH', `/posts/${postId}/comments/${commentId}/likes`, undefined, 200);
    assert.equal(liked.comments[0].likesCount, 1);
    const stored = await Post.findById(postId).lean(); assert.equal(stored.comments[0].likesCount, 1);
    assert.ok((await request('GET', '/posts?author=' + encodeURIComponent('Короткевич А. Г.'), undefined, 200)).some(p => p.id === postId));
    assert.ok(Array.isArray(await request('GET', '/posts/stats', undefined, 200)));
    await request('GET', '/posts/not-an-objectid', undefined, 400);
    await request('GET', '/posts/0123456789abcdef01234567', undefined, 404);
    await request('POST', '/posts', { ...input, title: ' ' }, 400);
    await request('POST', '/posts', { ...input, mediaType: 'audio' }, 400);
    await request('POST', '/posts', { ...input, $set: { title: 'injected' } }, 400);
    await request('PUT', '/posts/' + postId, { ...input, tags: ['x', 'x'] }, 400);
    await request('POST', `/posts/${postId}/comments`, { author: 'A', text: ' ' }, 400);
    const deleted = await request('DELETE', '/posts/' + postId, undefined, 200); assert.equal(deleted.id, postId);
    await request('GET', '/posts/' + postId, undefined, 404); postId = null;
    fs.mkdirSync('report-assets/lab6', { recursive: true });
    fs.writeFileSync('report-assets/lab6/api-checks.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks, count: checks.length }, null, 2));
    console.log(`MongoDB integration checks passed: ${checks.length}`);
  } catch (error) { console.error('Integration checks failed:', error.name, error.message.includes('MONGO_URI') ? 'Set MONGO_URI in .env' : 'Check database connectivity and test assertions'); process.exitCode = 1; }
  finally {
    if (postId) await Post.deleteOne({ _id: postId });
    if (userId) await User.deleteOne({ _id: userId });
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
})();

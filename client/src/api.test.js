import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { addPost, clearToken, deletePost, fetchPosts, login, readToken, saveToken } from './api.js';

beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => vi.unstubAllGlobals());

it('подставляет Bearer JWT и передаёт signal', async () => {
  saveToken('test-token');
  const controller = new AbortController();
  fetch.mockResolvedValue(new Response('[]', { status: 200 }));
  await fetchPosts(controller.signal);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});

it('отправляет JSON при добавлении', async () => {
  fetch.mockResolvedValue(new Response('{"id":3}', { status: 201 }));
  await addPost({ title: 'Новая запись' });
  const options = fetch.mock.calls[0][1];
  expect(options.method).toBe('POST');
  expect(options.headers['Content-Type']).toBe('application/json');
  expect(JSON.parse(options.body)).toEqual({ title: 'Новая запись' });
});

it('не пытается разбирать пустой ответ DELETE 204', async () => {
  fetch.mockResolvedValue(new Response(null, { status: 204 }));
  expect(await deletePost(3)).toBeNull();
});

it('превращает HTTP 500 в ошибку с кодом', async () => {
  fetch.mockResolvedValue(new Response('{"error":"Internal server error"}', { status: 500 }));
  await expect(fetchPosts()).rejects.toMatchObject({ status: 500 });
});

it('объясняет сетевую ошибку', async () => {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(fetchPosts()).rejects.toThrow('Сервер недоступен');
});

it('сохраняет отмену как AbortError', async () => {
  fetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
  await expect(fetchPosts()).rejects.toMatchObject({ name: 'AbortError' });
});

it('не отправляет старый токен при логине', async () => {
  saveToken('old-token');
  fetch.mockResolvedValue(new Response('{"token":"new-token"}', { status: 200 }));
  await login({ email: 'test@example.test', password: 'secret' });
  expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});

it('показывает ошибку при некорректном JSON', async () => {
  fetch.mockResolvedValue(new Response('broken', { status: 200 }));
  await expect(fetchPosts()).rejects.toThrow('некорректный ответ');
});

it('удаляет сохранённый токен при выходе', () => {
  saveToken('token'); clearToken(); expect(readToken()).toBe('');
});

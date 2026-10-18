import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as api from '../api.js';
import PostList from './PostList.jsx';

vi.mock('../api.js', () => ({ fetchPosts: vi.fn(), addPost: vi.fn(), updatePost: vi.fn(), deletePost: vi.fn(), mediaLink: url => url }));
const post = { id: 1, title: 'Первый пост', game: 'Rocket League', mediaType: 'video', mediaUrl: '/media/winning-goal.mp4', description: 'Описание', createdAt: '2026-10-18T10:00:00Z' };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function ready(props = {}) {
  const view = render(<PostList {...props} />);
  await screen.findByRole('heading', { name: post.title });
  return view;
}
function fill() {
  for (const [label, value] of Object.entries({ Заголовок: 'Новый пост', Игра: 'Cyberpunk 2077', 'Ссылка на материал': '/media/night-city.svg', Описание: 'Новый момент' })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}
beforeEach(() => {
  vi.clearAllMocks();
  api.fetchPosts.mockReset().mockResolvedValue([post]);
  api.addPost.mockReset(); api.updatePost.mockReset(); api.deletePost.mockReset();
});
afterEach(cleanup);

it('показывает индикатор до завершения GET', async () => {
  const load = deferred(); api.fetchPosts.mockReturnValue(load.promise);
  render(<PostList />);
  expect(screen.getByText('Загружаем публикации с сервера…')).toBeTruthy();
  await act(async () => load.resolve([post]));
  expect(screen.getByRole('heading', { name: post.title })).toBeTruthy();
});

it('после ошибки GET позволяет повторить загрузку', async () => {
  api.fetchPosts.mockRejectedValueOnce(new Error('Сервер недоступен'));
  render(<PostList />);
  await screen.findByText('Сервер недоступен');
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
  await screen.findByRole('heading', { name: post.title });
  expect(api.fetchPosts).toHaveBeenCalledTimes(2);
});

it('оптимистично добавляет запись и заменяет временный id ответом сервера', async () => {
  const write = deferred(); api.addPost.mockReturnValue(write.promise);
  await ready(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить публикацию' }));
  expect(screen.getByRole('article', { name: 'Новый пост' })).toBeTruthy();
  expect(screen.getByText('Отправляется…')).toBeTruthy();
  await act(async () => write.resolve({ ...post, id: 22, title: 'Новый пост' }));
  expect(screen.queryByText('Отправляется…')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Удалить: Новый пост' }));
  await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith(22));
});

it('откатывает неуспешное добавление и оставляет введённый текст', async () => {
  const write = deferred(); api.addPost.mockReturnValue(write.promise);
  await ready(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить публикацию' }));
  expect(screen.getByRole('article', { name: 'Новый пост' })).toBeTruthy();
  await act(async () => write.reject(new Error('Ошибка 500')));
  expect(screen.queryByRole('article', { name: 'Новый пост' })).toBeNull();
  expect(screen.getByLabelText('Заголовок').value).toBe('Новый пост');
  expect(screen.getByText(/Изменение отменено/)).toBeTruthy();
});

it('оптимистично изменяет запись и откатывает отказ PUT', async () => {
  const write = deferred(); api.updatePost.mockReturnValue(write.promise);
  await ready(); fireEvent.click(screen.getByRole('button', { name: `Изменить: ${post.title}` }));
  fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'Правка' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
  expect(screen.getByRole('article', { name: 'Правка' })).toBeTruthy();
  await act(async () => write.reject(new Error('Нет соединения')));
  expect(screen.getByRole('article', { name: post.title })).toBeTruthy();
});

it('подтверждает редактирование данными ответа PUT', async () => {
  api.updatePost.mockResolvedValue({ ...post, title: 'Правка' });
  await ready(); fireEvent.click(screen.getByRole('button', { name: `Изменить: ${post.title}` }));
  fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'Правка' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
  await screen.findByText('Изменения сохранены на сервере.');
  expect(screen.getByRole('article', { name: 'Правка' })).toBeTruthy();
});

it('оптимистично удаляет запись и возвращает её при ошибке DELETE', async () => {
  const write = deferred(); api.deletePost.mockReturnValue(write.promise);
  await ready(); fireEvent.click(screen.getByRole('button', { name: `Удалить: ${post.title}` }));
  expect(screen.queryByRole('article', { name: post.title })).toBeNull();
  await act(async () => write.reject(new Error('Сервер недоступен')));
  expect(screen.getByRole('article', { name: post.title })).toBeTruthy();
  expect(screen.getByText(/карточка восстановлена/)).toBeTruthy();
});

it('не возвращает запись после успешного DELETE', async () => {
  api.deletePost.mockResolvedValue(null);
  await ready(); fireEvent.click(screen.getByRole('button', { name: `Удалить: ${post.title}` }));
  await screen.findByText('Публикация удалена на сервере.');
  expect(screen.queryByRole('article', { name: post.title })).toBeNull();
});

it('блокирует параллельные изменения во время отправки', async () => {
  api.addPost.mockReturnValue(deferred().promise);
  await ready(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Добавить публикацию' }));
  expect(screen.getByRole('button', { name: `Удалить: ${post.title}` }).disabled).toBe(true);
  expect(screen.getByLabelText('Заголовок').disabled || screen.getByLabelText('Заголовок').closest('fieldset').disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Обновить список' }).disabled).toBe(true);
});

it('отменяет загрузку кнопкой и игнорирует опоздавший ответ', async () => {
  const load = deferred(); api.fetchPosts.mockReturnValue(load.promise);
  render(<PostList />);
  const signal = api.fetchPosts.mock.calls[0][0];
  fireEvent.click(screen.getByRole('button', { name: 'Отменить загрузку' }));
  expect(signal.aborted).toBe(true);
  await act(async () => load.resolve([post]));
  expect(screen.queryByRole('article', { name: post.title })).toBeNull();
  expect(screen.getByText(/Загрузка отменена/)).toBeTruthy();
});

it('отменяет запрос при размонтировании', () => {
  api.fetchPosts.mockReturnValue(deferred().promise);
  const view = render(<PostList />);
  const signal = api.fetchPosts.mock.calls[0][0];
  view.unmount(); expect(signal.aborted).toBe(true);
});

it('переживает дополнительную очистку StrictMode', async () => {
  const old = deferred();
  api.fetchPosts.mockReturnValueOnce(old.promise).mockResolvedValue([post]);
  render(<StrictMode><PostList /></StrictMode>);
  await screen.findByRole('heading', { name: post.title });
  expect(api.fetchPosts.mock.calls[0][0].aborted).toBe(true);
  await act(async () => old.resolve([]));
  expect(screen.getByRole('heading', { name: post.title })).toBeTruthy();
});

it('при HTTP 401 завершает сеанс через родительский обработчик', async () => {
  const onUnauthorized = vi.fn();
  api.fetchPosts.mockRejectedValue(Object.assign(new Error('Expired'), { status: 401 }));
  render(<PostList onUnauthorized={onUnauthorized} />);
  await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
});

it('отклоняет пробельный заголовок до обращения к API', async () => {
  await ready(); fill(); fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Добавить публикацию' }));
  expect(api.addPost).not.toHaveBeenCalled();
  expect(screen.getByText(/Заполните поля текстом/)).toBeTruthy();
});

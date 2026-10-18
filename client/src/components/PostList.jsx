import { useEffect, useRef, useState } from 'react';
import { addPost, deletePost as removePost, fetchPosts, updatePost } from '../api.js';
import { EMPTY_FORM, LIMITS, MEDIA_TYPES } from '../data.js';
import PostForm from './PostForm.jsx';
import PostCard from './PostCard.jsx';

const noop = () => {};

export default function PostList({ onLogout = noop, onUnauthorized = noop }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const loadController = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState('');
  const locked = loading || Boolean(pending);

  useEffect(() => {
    const controller = new AbortController();
    loadController.current = controller;
    setLoading(true);
    setLoadError('');
    setError('');
    setMessage('');
    async function load() {
      try {
        const rows = await fetchPosts(controller.signal);
        if (controller.signal.aborted) return;
        if (!Array.isArray(rows)) throw new Error('Сервер вернул неверный формат списка.');
        setPosts(rows);
        setHasLoaded(true);
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause.status === 401) onUnauthorized();
        else setLoadError(cause.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [reload, onUnauthorized]);

  useEffect(() => {
    document.title = `Game Media — публикаций: ${posts.length}`;
  }, [posts.length]);

  function cancelLoad() {
    loadController.current?.abort();
    setLoading(false);
    setLoadError('Загрузка отменена. Можно повторить запрос.');
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked || !hasLoaded) return;
    const values = { ...form };
    for (const field of ['title', 'game', 'mediaUrl', 'description']) values[field] = form[field].trim();
    if (['title', 'game', 'mediaUrl', 'description'].some(field => !values[field] || form[field].length > LIMITS[field])) {
      setFormError('Заполните поля текстом, а не пробелами. Не превышайте ограничение длины.');
      return;
    }
    const snapshot = posts;
    const temporaryId = `temp-${crypto.randomUUID()}`;
    setError('');
    setFormError('');
    setMessage('');
    setPending(editingId ? 'Сохраняем изменения…' : 'Добавляем публикацию…');
    // Интерфейс меняется до получения ответа API.
    if (editingId) {
      setPosts(previous => previous.map(post => post.id === editingId ? { ...post, ...values, pending: true } : post));
    } else {
      setPosts(previous => [...previous, { ...values, id: temporaryId, createdAt: new Date().toISOString(), pending: true }]);
    }
    try {
      const saved = editingId ? await updatePost(editingId, values) : await addPost(values);
      const id = editingId || temporaryId;
      setPosts(previous => previous.map(post => post.id === id ? saved : post));
      setMessage(editingId ? 'Изменения сохранены на сервере.' : 'Публикация сохранена на сервере.');
      resetForm();
    } catch (cause) {
      // Одновременно разрешена одна операция, поэтому снимок безопасен для отката.
      setPosts(snapshot);
      setError(`${cause.message} Изменение отменено. Введённые данные оставлены в форме.`);
      if (cause.status === 401) onUnauthorized();
    } finally {
      setPending('');
    }
  }

  function editPost(post) {
    if (locked) return;
    setForm({ title: post.title, game: post.game, mediaType: post.mediaType, mediaUrl: post.mediaUrl, description: post.description });
    setEditingId(post.id);
    setFormError('');
    setError('');
    setMessage('');
    document.getElementById('title').focus();
  }

  async function deletePost(id) {
    if (locked) return;
    const snapshot = posts;
    setPosts(previous => previous.filter(post => post.id !== id));
    setPending('Удаляем публикацию…');
    setError('');
    setMessage('');
    try {
      await removePost(id);
      if (editingId === id) resetForm();
      setMessage('Публикация удалена на сервере.');
    } catch (cause) {
      setPosts(snapshot);
      setError(`${cause.message} Удаление отменено, карточка восстановлена.`);
      if (cause.status === 401) onUnauthorized();
    } finally {
      setPending('');
    }
  }

  const query = search.trim().toLocaleLowerCase('ru-RU');
  const visiblePosts = posts.filter(post => (type === 'all' || post.mediaType === type)
    && `${post.title} ${post.game} ${post.description}`.toLocaleLowerCase('ru-RU').includes(query));
  visiblePosts.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'ru')
    : sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
      : Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <>
      <div className="account-bar"><span>Общая коллекция · PostgreSQL</span>
        <button type="button" onClick={onLogout} disabled={Boolean(pending)}>Выйти</button></div>
      <section className="intro">
        <div><p className="eyebrow">ИГРОВЫЕ ПУБЛИКАЦИИ</p><h1>Моменты, которые<br />хочется сохранить.</h1>
          <p className="intro-text">Скриншоты и видео из любимых игр — в одной коллекции.</p></div>
        <div className="summary"><strong>{posts.length}</strong><span>публикаций в коллекции</span>
          <span className="save-status" role="status">{pending || (loading ? 'Загрузка…' : hasLoaded ? 'Данные с сервера' : 'Нет данных')}</span></div>
      </section>
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading && <div className="notice loading-panel" role="status"><span className="spinner" aria-hidden="true" />
        <span>Загружаем публикации с сервера…</span><button type="button" onClick={cancelLoad}>Отменить загрузку</button></div>}
      {loadError && <div className="notice error" role="alert">{loadError}
        <button type="button" disabled={locked} onClick={() => setReload(value => value + 1)}>Повторить загрузку</button></div>}
      <div className="workspace">
        <PostForm form={form} setForm={setForm} editingId={editingId} onSubmit={handleSubmit}
          onCancel={resetForm} error={formError} disabled={locked || !hasLoaded} pending={Boolean(pending)} />
        <section className="collection" aria-labelledby="collection-heading" aria-busy={locked}>
          <div className="collection-title"><h2 id="collection-heading">Публикации</h2>
            <span className="result-count">Показано {visiblePosts.length} из {posts.length}</span>
            <button type="button" disabled={locked} onClick={() => setReload(value => value + 1)}>Обновить список</button></div>
          <div className="filters">
            <div><label htmlFor="search">Поиск</label><input id="search" type="search" value={search}
              onChange={event => setSearch(event.target.value.slice(0, LIMITS.search))} maxLength={LIMITS.search} placeholder="Заголовок, игра или описание" /></div>
            <div><label htmlFor="filter">Тип</label><select id="filter" value={type} onChange={event => setType(event.target.value)}>
              <option value="all">Все материалы</option>
              {Object.entries(MEDIA_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></div>
            <div><label htmlFor="sort">Порядок</label><select id="sort" value={sort} onChange={event => setSort(event.target.value)}>
              <option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="title">По заголовку</option>
            </select></div>
          </div>
          <p className="feedback" role="status">{message || 'Изменения отправляются в API и сохраняются в PostgreSQL.'}</p>
          <div className="post-list">
            {visiblePosts.map(post => <PostCard key={post.id} post={post} onEdit={editPost} onDelete={deletePost} disabled={locked} />)}
            {!loading && !loadError && visiblePosts.length === 0 && <div className="empty-state"><h3>{posts.length ? 'Ничего не найдено' : 'Коллекция пока пуста'}</h3>
              <p>{posts.length ? 'Попробуйте изменить поиск или тип материала.' : 'Добавьте первую публикацию с помощью формы.'}</p></div>}
          </div>
        </section>
      </div>
    </>
  );
}

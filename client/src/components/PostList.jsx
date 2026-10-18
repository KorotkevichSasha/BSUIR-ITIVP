import { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { EMPTY_FORM, LIMITS, MEDIA_TYPES } from '../data.js';
import PostForm from './PostForm.jsx';
import PostCard from './PostCard.jsx';

export default function PostList() {
  const { posts, setPosts, loaded, storageError, saveStatus } = useLocalStorage();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = `Game Media — публикаций: ${posts.length}`;
  }, [posts.length]);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const values = { ...form, title: form.title.trim(), game: form.game.trim(), description: form.description.trim() };
    if (['title', 'game', 'description'].some(field => !values[field] || form[field].length > LIMITS[field])) {
      setError('Заполните поля текстом, а не пробелами. Не превышайте ограничение длины.');
      return;
    }
    if (!editingId && posts.length >= LIMITS.posts) return;
    if (editingId) {
      setPosts(previous => previous.map(post => post.id === editingId ? { ...post, ...values } : post));
      setMessage('Изменения сохранены.');
    } else {
      const post = { ...values, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      setPosts(previous => [...previous, post]);
      setMessage('Публикация добавлена.');
    }
    resetForm();
  }

  function editPost(post) {
    setForm({ title: post.title, game: post.game, mediaType: post.mediaType, description: post.description });
    setEditingId(post.id);
    setError('');
    setMessage('');
    document.getElementById('title').focus();
  }

  function deletePost(id) {
    setPosts(previous => previous.filter(post => post.id !== id));
    if (editingId === id) resetForm();
    setMessage('Публикация удалена.');
  }

  // Производный список вычисляем без отдельного состояния и useEffect.
  const query = search.trim().toLocaleLowerCase('ru-RU');
  const visiblePosts = posts.filter(post => (type === 'all' || post.mediaType === type)
    && `${post.title} ${post.game} ${post.description}`.toLocaleLowerCase('ru-RU').includes(query));
  visiblePosts.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'ru')
    : sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
      : Date.parse(b.createdAt) - Date.parse(a.createdAt));

  if (!loaded) return <p role="status">Загружаем коллекцию…</p>;

  return (
    <>
      <section className="intro">
        <div><p className="eyebrow">ЛИЧНАЯ МЕДИАТЕКА</p><h1>Моменты, которые<br />хочется сохранить.</h1>
          <p className="intro-text">Скриншоты и видео из любимых игр — в одной коллекции.</p></div>
        <div className="summary"><strong>{posts.length}</strong><span>публикаций в коллекции</span>
          <span className="save-status" role="status">{saveStatus}</span></div>
      </section>
      {storageError && <p className="notice error" role="alert">{storageError}</p>}
      <div className="workspace">
        <PostForm form={form} setForm={setForm} editingId={editingId} onSubmit={handleSubmit}
          onCancel={resetForm} error={error} full={posts.length >= LIMITS.posts} />
        <section className="collection" aria-labelledby="collection-heading">
          <div className="collection-title"><h2 id="collection-heading">Публикации</h2>
            <span className="result-count">Показано {visiblePosts.length} из {posts.length}</span></div>
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
          <p className="feedback" role="status">{message || 'Коллекция хранится в этом браузере.'}</p>
          <div className="post-list">
            {visiblePosts.map(post => <PostCard key={post.id} post={post} onEdit={editPost} onDelete={deletePost} />)}
            {visiblePosts.length === 0 && <div className="empty-state"><h3>{posts.length ? 'Ничего не найдено' : 'Коллекция пока пуста'}</h3>
              <p>{posts.length ? 'Попробуйте изменить поиск или тип материала.' : 'Добавьте первую публикацию с помощью формы.'}</p></div>}
          </div>
        </section>
      </div>
    </>
  );
}

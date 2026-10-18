import { MEDIA_TYPES } from '../data.js';

export default function PostCard({ post, onEdit, onDelete }) {
  return (
    <article className="post-card" aria-label={post.title}>
      <div className="card-top">
        <span className={`type-badge ${post.mediaType}`}>{MEDIA_TYPES[post.mediaType]}</span>
        <span className="game-name">{post.game}</span>
      </div>
      <h3>{post.title}</h3>
      <p className="description">{post.description}</p>
      <div className="card-bottom">
        <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString('ru-RU')}</time>
        <div className="card-actions">
          <button type="button" onClick={() => onEdit(post)} aria-label={`Изменить: ${post.title}`}>Изменить</button>
          <button type="button" className="danger" onClick={() => onDelete(post.id)}
            aria-label={`Удалить: ${post.title}`}>Удалить</button>
        </div>
      </div>
    </article>
  );
}

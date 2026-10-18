export const STORAGE_KEY = 'game-media-posts-v1';
export const LIMITS = { title: 100, game: 80, description: 1000, search: 100, posts: 500 };
export const MEDIA_TYPES = { screenshot: 'Скриншот', video: 'Видео' };
export const EMPTY_FORM = { title: '', game: '', mediaType: 'screenshot', description: '' };

export const initialPosts = [
  { id: 'demo-night-city', title: 'Закат в Найт-Сити', game: 'Cyberpunk 2077',
    mediaType: 'screenshot', description: 'Неоновые улицы и вечерний город после дождя.',
    createdAt: '2026-10-17T15:30:00.000Z' },
  { id: 'demo-winning-goal', title: 'Победный гол', game: 'Rocket League',
    mediaType: 'video', description: 'Решающий гол в последние секунды матча.',
    createdAt: '2026-10-17T16:45:00.000Z' },
];

// Проверяем структуру сохранённых данных перед использованием в интерфейсе.
export function isPostList(value) {
  return Array.isArray(value) && value.length <= LIMITS.posts
    && value.every(post => post && typeof post.id === 'string' && post.id.length > 0 && post.id.length <= 100
      && ['title', 'game', 'description'].every(field => typeof post[field] === 'string'
        && post[field].trim().length > 0 && post[field].length <= LIMITS[field])
      && typeof post.mediaType === 'string' && Object.hasOwn(MEDIA_TYPES, post.mediaType)
      && typeof post.createdAt === 'string' && Number.isFinite(Date.parse(post.createdAt)))
    && new Set(value.map(post => post.id)).size === value.length;
}

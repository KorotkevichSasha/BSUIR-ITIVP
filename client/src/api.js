export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const TOKEN_KEY = 'game-media-jwt';

export function readToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* Сеанс в интерфейсе всё равно завершается. */ }
}

async function request(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? readToken() : '';
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method, headers, signal, cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Сервер недоступен. Проверьте, запущен ли API, и повторите запрос.');
  }
  if (response.status === 204) return null;
  let data;
  try { data = await response.json(); } catch {
    const error = new Error(`Сервер вернул некорректный ответ (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`Ошибка ${response.status}: ${data.error || 'запрос не выполнен'}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const fetchPosts = signal => request('/posts', { signal });
export const addPost = body => request('/posts', { method: 'POST', body });
export const updatePost = (id, body) => request(`/posts/${id}`, { method: 'PUT', body });
export const deletePost = id => request(`/posts/${id}`, { method: 'DELETE' });
export const login = body => request('/auth/login', { method: 'POST', body, auth: false });
export const register = body => request('/auth/register', { method: 'POST', body, auth: false });

export function mediaLink(url) {
  if (/^\/media\/[a-z0-9._-]+$/i.test(url)) return `${API_URL}${url}`;
  try { return ['http:', 'https:'].includes(new URL(url).protocol) ? url : null; } catch { return null; }
}

import { useState } from 'react';
import { login, register, saveToken } from '../api.js';

export default function AuthForm({ onAuthenticated, notice }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password.trim()) { setError('Заполните email и пароль.'); return; }
    setBusy(true);
    setError('');
    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'register') await register(credentials);
      const { token } = await login(credentials);
      try { saveToken(token); } catch { throw new Error('Браузер запретил сохранение входа. Разрешите localStorage для этого сайта.'); }
      setPassword('');
      onAuthenticated(token);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel auth-panel" aria-labelledby="auth-heading">
      <p className="eyebrow">GAME MEDIA · СЕРВЕРНАЯ КОЛЛЕКЦИЯ</p>
      <h1 id="auth-heading">{mode === 'login' ? 'Вход в коллекцию' : 'Регистрация'}</h1>
      <p className="muted">Войдите, чтобы загружать и изменять публикации на сервере.</p>
      {notice && <p className="notice" role="status">{notice}</p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={event => setEmail(event.target.value.slice(0, 254))}
            maxLength="254" autoComplete="username" required />
          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" value={password} onChange={event => setPassword(event.target.value.slice(0, 72))}
            maxLength="72" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          <p className="field-hint">Пароль ограничен 72 байтами UTF-8 на сервере.</p>
          {error && <p className="notice error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="primary" type="submit">{busy ? 'Отправляем…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

import { useState } from 'react';
import PostList from './components/PostList.jsx';
import AuthForm from './components/AuthForm.jsx';
import { clearToken, readToken } from './api.js';

export default function App() {
  const [token, setToken] = useState(readToken);
  const [notice, setNotice] = useState('');
  function logout(message = '') {
    clearToken();
    setToken('');
    setNotice(message);
  }
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#main">GAME<span>MEDIA</span></a>
        <span className="header-note">Коллекция игровых моментов</span>
        <span className="lab-label">ЛР 5 · Вариант 13</span>
      </header>
      <main id="main">
        {token ? <PostList onLogout={() => logout()} onUnauthorized={() => logout('Сессия истекла. Войдите повторно.')} />
          : <AuthForm onAuthenticated={setToken} notice={notice} />}
      </main>
      <footer>Game Media · Короткевич А. Г. · 320602</footer>
    </>
  );
}

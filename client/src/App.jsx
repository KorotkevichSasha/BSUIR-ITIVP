import PostList from './components/PostList.jsx';

export default function App() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#main">GAME<span>MEDIA</span></a>
        <span className="header-note">Коллекция игровых моментов</span>
        <span className="lab-label">ЛР 4 · Вариант 13</span>
      </header>
      <main id="main"><PostList /></main>
      <footer>Game Media · Короткевич А. Г. · 320602</footer>
    </>
  );
}

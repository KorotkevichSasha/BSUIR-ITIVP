import { useEffect, useState } from 'react';
import { initialPosts, isPostList, STORAGE_KEY } from '../data.js';

export default function useLocalStorage() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [saveStatus, setSaveStatus] = useState('Загрузка…');

  // При монтировании читаем данные. Сохранённый пустой массив тоже корректен.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const restored = saved === null ? initialPosts : JSON.parse(saved);
      if (!isPostList(restored)) throw new Error('Некорректные данные');
      setPosts(restored);
    } catch {
      setPosts(initialPosts);
      setCanSave(false);
      setStorageError('Хранилище недоступно или данные повреждены. Изменения останутся только на этой странице.');
      setSaveStatus('Не сохраняется');
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Не перезаписываем коллекцию пустым состоянием до окончания чтения.
    if (!loaded || !canSave) return;
    setSaveStatus('Сохранение…');
    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        setStorageError('');
        setSaveStatus('Сохранено в браузере');
      } catch {
        setStorageError('Не удалось сохранить публикации. Проверьте доступ и свободное место в хранилище браузера.');
        setSaveStatus('Ошибка сохранения');
      }
    }
    const timer = setTimeout(save, 500);
    // При перезагрузке сохраняем последнюю правку, не дожидаясь таймера.
    window.addEventListener('pagehide', save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', save);
    };
  }, [posts, loaded, canSave]);

  return { posts, setPosts, loaded, storageError, saveStatus };
}

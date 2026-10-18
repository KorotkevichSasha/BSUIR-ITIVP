import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useLocalStorage from './useLocalStorage.js';
import { initialPosts, STORAGE_KEY } from '../data.js';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Хранение коллекции', () => {
  it('загружает примеры и сохраняет их через 500 мс', () => {
    const { result } = renderHook(() => useLocalStorage(), { wrapper: StrictMode });
    expect(result.current.posts).toEqual(initialPosts);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => vi.advanceTimersByTime(500));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(initialPosts);
  });

  it('не затирает сохранённую коллекцию начальным пустым массивом', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([initialPosts[0]]));
    const { result } = renderHook(() => useLocalStorage(), { wrapper: StrictMode });
    expect(result.current.posts).toEqual([initialPosts[0]]);
    act(() => vi.advanceTimersByTime(500));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([initialPosts[0]]);
  });

  it('после удаления всех элементов восстанавливает пустой список', () => {
    const { result, unmount } = renderHook(() => useLocalStorage());
    act(() => result.current.setPosts([]));
    act(() => vi.advanceTimersByTime(500));
    unmount();
    const restored = renderHook(() => useLocalStorage());
    expect(restored.result.current.posts).toEqual([]);
  });

  it('отменяет предыдущий таймер при быстрых изменениях', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useLocalStorage());
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.setPosts([initialPosts[1]]));
    act(() => vi.advanceTimersByTime(300));
    expect(write).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([initialPosts[1]]);
  });

  it('сохраняет последнюю правку при уходе со страницы', () => {
    const { result } = renderHook(() => useLocalStorage());
    act(() => result.current.setPosts([]));
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it.each(['{broken', '{"wrong":"shape"}', '[{"id":"invalid"}]'])(
    'показывает предупреждение и не перезаписывает повреждённые данные: %s', saved => {
      localStorage.setItem(STORAGE_KEY, saved);
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.storageError).not.toBe('');
      expect(result.current.posts).toEqual(initialPosts);
      act(() => vi.advanceTimersByTime(500));
      expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
    },
  );

  it('при запрете чтения позволяет работать в памяти', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Denied'); });
    const { result } = renderHook(() => useLocalStorage());
    act(() => result.current.setPosts([]));
    expect(result.current.posts).toEqual([]);
    expect(result.current.saveStatus).toBe('Не сохраняется');
  });

  it('показывает ошибку переполнения без потери текущего состояния', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
    const { result } = renderHook(() => useLocalStorage());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.posts).toEqual(initialPosts);
    expect(result.current.saveStatus).toBe('Ошибка сохранения');
  });

  it('удаляет таймер и обработчик pagehide при размонтировании', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const { unmount } = renderHook(() => useLocalStorage());
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(write).not.toHaveBeenCalled();
  });
});

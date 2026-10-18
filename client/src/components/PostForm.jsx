import { LIMITS, MEDIA_TYPES } from '../data.js';

export default function PostForm({ form, setForm, editingId, onSubmit, onCancel, error, disabled, pending }) {
  function changeField(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value.slice(0, LIMITS[name] ?? 20) }));
  }

  return (
    <section className="panel form-panel" aria-labelledby="form-heading">
      <p className="eyebrow">ВАША КОЛЛЕКЦИЯ</p>
      <h2 id="form-heading">{editingId ? 'Редактировать публикацию' : 'Новая публикация'}</h2>
      <p className="muted">Сохраните игровой момент и пару слов о нём.</p>
      <form onSubmit={onSubmit}>
        <fieldset disabled={disabled}>
        <label htmlFor="title">Заголовок</label>
        <input id="title" name="title" value={form.title} onChange={changeField}
          maxLength={LIMITS.title} required placeholder="Например, победа в финале" />
        <label htmlFor="game">Игра</label>
        <input id="game" name="game" value={form.game} onChange={changeField}
          maxLength={LIMITS.game} required placeholder="Название игры" />
        <label htmlFor="mediaType">Тип материала</label>
        <select id="mediaType" name="mediaType" value={form.mediaType} onChange={changeField}>
          {Object.entries(MEDIA_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label htmlFor="mediaUrl">Ссылка на материал</label>
        <input id="mediaUrl" name="mediaUrl" value={form.mediaUrl} onChange={changeField}
          maxLength={LIMITS.mediaUrl} required placeholder="https://… или /media/night-city.svg" />
        <label htmlFor="description">Описание</label>
        <textarea id="description" name="description" value={form.description} onChange={changeField}
          maxLength={LIMITS.description} required rows="4" placeholder="Что произошло в этом моменте?" />
        <span className="field-hint">{form.description.length} / {LIMITS.description} символов</span>
        {error && <p role="alert" className="notice error">{error}</p>}
        <div className="form-actions">
          <button className="primary" type="submit">
            {pending ? 'Отправляем…' : editingId ? 'Сохранить изменения' : 'Добавить публикацию'}
          </button>
          {editingId && <button type="button" onClick={onCancel}>Отмена</button>}
          {!editingId && <button type="button" onClick={onCancel}>Очистить</button>}
        </div>
        </fieldset>
      </form>
    </section>
  );
}

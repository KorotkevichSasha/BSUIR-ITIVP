# Game Media API

Учебный REST API платформы для обмена игровыми скриншотами и видео.

Во второй лабораторной временный массив заменён PostgreSQL в Supabase. Для работы с базой используется ORM Sequelize.

## Установка

```bash
npm install
```

Скопируйте `.env.example` в `.env` и укажите строку подключения Supabase:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PORT=3001
```

## Подготовка базы

```bash
npm run db:migrate
npm run db:seed
```

Первая миграция создаёт таблицу `Posts`, вторая добавляет поле `likesCount`. Seed добавляет две тестовые публикации.

## Запуск

```bash
npm run dev
```

Сервер работает по адресу `http://localhost:3001`.

## Маршруты

| Метод | URL | Описание |
| --- | --- | --- |
| GET | `/posts` | Получить все публикации |
| GET | `/posts/:id` | Получить публикацию по ID |
| POST | `/posts` | Создать публикацию |
| PUT | `/posts/:id` | Полностью обновить публикацию |
| DELETE | `/posts/:id` | Удалить публикацию |

Фильтрация по типу: `GET /posts?mediaType=video`.

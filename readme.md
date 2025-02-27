# Телеграм бот на [grammY](https://grammy.dev) для [Deno Deploy](https://deno.com/deploy)

## Настройка

1. Создайте проект на [Deno Deploy](https://deno.com/deploy).
2. Добавьте в настройки проекта следующие переменные окружения:
   - `BOT_TOKEN` - токен бота из @BotFather
   - `API_KEY` - ключ доступа к API
   - `API_BASE_URL` - основной адрес API
   - `API_ENDPOINT_USERS` - путь для получения данных пользователей
   - `API_ENDPOINT_REGISTER` - путь для регистрации пользователей
   - `WEBHOOK_BASE_URL` - адрес вашего проекта на Deno Deploy

3. Настройте вебхук для бота по шаблону:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<ИМЯ_ПРОЕКТА>.deno.dev/<BOT_TOKEN>
```

### Публикация через GitHub

4. Загрузите код в репозиторий GitHub
5. В настройках проекта подключите GitHub и укажите `server.ts` как основной файл
6. Готово! Теперь при каждом push код будет автоматически обновляться

### Публикация через `deployctl`

4. Установите [`deployctl`](https://github.com/denoland/deployctl)
5. Получите [токен доступа](https://dash.deno.com/account#access-tokens)
6. Опубликуйте командой:
   `deployctl deploy --project <ИМЯ_ПРОЕКТА> ./server.ts --prod --token <ТОКЕН>`

## Разработка

Для локальной разработки используйте `poll.ts`. Учтите, что это отключит вебхук, поэтому после загрузки на сервер нужно будет заново выполнить шаг 3.

## Безопасность

Не храните реальные значения переменных окружения в репозитории. Используйте файл `.env.example` как шаблон для настройки.
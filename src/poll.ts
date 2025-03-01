/**
 * Запуск бота в режиме polling (локальное тестирование)
 */
import { logger } from "./utils/logger.ts";
import { config, validateEnvVars } from "./config/index.ts";
import { bot, initBot } from "./bot/index.ts";

console.log("Запуск бота в режиме polling");

// Проверяем наличие BOT_TOKEN
const token = Deno.env.get("BOT_TOKEN");
console.log(`BOT_TOKEN: ${token ? "установлен" : "не установлен"}`);

// Проверяем наличие необходимых переменных окружения
validateEnvVars(config.bot.requiredEnvVars);

logger.info("Запуск бота в режиме polling...");

try {
  // Удаляем старый webhook если он был установлен
  await bot.api.deleteWebhook({ drop_pending_updates: true });
  logger.info("Webhook удален");

  // Инициализируем бота
  await initBot();
  logger.info("Бот инициализирован");

  // Запускаем бота в режиме polling
  logger.info("Запуск polling...");
  await bot.start({
    drop_pending_updates: true,
    onStart: (botInfo) => {
      logger.info(`Бот @${botInfo.username} успешно запущен в режиме polling`);
    },
  });
} catch (error) {
  logger.error("Критическая ошибка при запуске бота:", error);
  Deno.exit(1);
} 
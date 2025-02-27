// run the bot locally
import { bot, initBot } from "./bot.ts";
import { logger } from "./logger.ts";

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

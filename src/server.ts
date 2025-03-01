/**
 * Запуск бота в режиме webhook (для продакшена)
 */
import { bot, initBot } from "./bot/index.ts";
import { webhookCallback } from "../deps.deno.ts";
import { config, validateEnvVars } from "./config/index.ts";
import { logger } from "./utils/logger.ts";

logger.info("Запуск сервера в режиме:", Deno.env.get("DENO_ENV") || "development");
logger.info("Deployment ID:", Deno.env.get("DENO_DEPLOYMENT_ID"));

// Проверяем наличие необходимых переменных окружения
validateEnvVars(config.bot.requiredEnvVars);

try {
  // Создаем обработчик webhook
  const handleUpdate = webhookCallback(bot, "std/http");

  // Инициализируем бота перед запуском сервера
  await initBot();

  // Устанавливаем webhook
  const webhookUrl = `${config.webhook.baseUrl}/${bot.token}`;
  await bot.api.setWebhook(webhookUrl);
  logger.info("Webhook установлен:", webhookUrl);

  // Получаем информацию о текущем webhook
  const webhookInfo = await bot.api.getWebhookInfo();
  logger.debug("Webhook информация:", webhookInfo);

  // Запускаем сервер
  Deno.serve(async (req) => {
    if (req.method === "POST") {
      const url = new URL(req.url);
      logger.debug("Получен webhook запрос:", url.pathname);
      
      if (url.pathname.slice(1) === bot.token) {
        try {
          const response = await handleUpdate(req);
          logger.debug("Webhook обработан успешно");
          return response;
        } catch (err) {
          logger.error("Ошибка обработки webhook:", err);
          return new Response("Ошибка обработки webhook", { status: 500 });
        }
      } else {
        logger.debug("Получен неверный webhook путь");
        return new Response("Неверный путь", { status: 404 });
      }
    }

    // Добавляем простую проверку работоспособности
    if (req.method === "GET" && new URL(req.url).pathname === "/health") {
      const webhookInfo = await bot.api.getWebhookInfo();
      return new Response(JSON.stringify({
        status: "OK",
        timestamp: new Date().toISOString(),
        deployment: Deno.env.get("DENO_DEPLOYMENT_ID"),
        environment: Deno.env.get("DENO_ENV") || "development",
        webhook: {
          url: webhookInfo.url,
          pending_update_count: webhookInfo.pending_update_count,
          last_error_date: webhookInfo.last_error_date,
          last_error_message: webhookInfo.last_error_message
        }
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    logger.debug("Получен запрос:", { method: req.method, path: new URL(req.url).pathname });
    return new Response("Метод не поддерживается", { status: 405 });
  });
} catch (error) {
  logger.error("Критическая ошибка при запуске сервера:", error);
  throw error;
} 
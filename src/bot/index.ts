/**
 * Основной файл бота
 */
import {
  Bot,
  session,
  conversations,
  createConversation,
} from "../../deps.deno.ts";
import { config } from "../config/index.ts";
import { logger } from "../utils/logger.ts";
import { loggingMiddleware } from "../middlewares/logging.middleware.ts";
import { errorHandler } from "../middlewares/error.middleware.ts";
import { handleStartCommand } from "../commands/start.ts";
import { handleHelpCommand } from "../commands/help.ts";
import { handleTextMessage, handleCallbackQuery, handleInlineQuery } from "./handlers.ts";
import { registration } from "../conversations/registration.ts";
import type { MyContext } from "./context.ts";

// Создаем экземпляр бота
let _bot: Bot<MyContext> | null = null;

// Геттер для бота, который создает экземпляр при первом обращении
export function getBotInstance(): Bot<MyContext> {
  if (!_bot) {
    const token = config.bot.token;
    if (!token) {
      throw new Error("BOT_TOKEN не задан или пустой");
    }
    logger.debug(`Создание экземпляра бота с токеном длиной ${token.length}`);
    _bot = new Bot<MyContext>(token);
  }
  return _bot;
}

// Экспортируем бота как геттер
export const bot = getBotInstance();

/**
 * Функция инициализации бота, настраивает все middleware и обработчики
 * @returns {Promise<void>} 
 */
export async function initBot(): Promise<void> {
  const bot = getBotInstance();
  logger.info(`Инициализация бота версии ${config.bot.version}...`);
  
  try {
    // Устанавливаем middleware для сессий
    logger.info("Установка session middleware...");
    bot.use(session({
      initial: () => ({ __conversations: {} }),
      getSessionKey: (ctx) => {
        // Для inline запросов используем from.id
        if (ctx.from?.id !== undefined) {
          return ctx.from.id.toString();
        }
        // Для обычных сообщений используем chat.id
        return ctx.chat?.id.toString();
      },
    }));
    
    // Устанавливаем middleware для диалогов
    logger.info("Установка conversations middleware...");
    bot.use(conversations());
    bot.use(createConversation(registration));
    
    // Добавляем middleware для логирования запросов
    logger.info("Установка middleware для логирования...");
    bot.use(loggingMiddleware);
    
    // Регистрируем обработчики команд
    logger.info("Регистрация обработчиков команд...");
    bot.command("start", handleStartCommand);
    bot.command("help", handleHelpCommand);
    
    // Регистрируем обработчики сообщений и callback'ов
    logger.info("Регистрация обработчиков сообщений и callback'ов...");
    bot.on("message:text", handleTextMessage);
    bot.on("callback_query:data", handleCallbackQuery);
    bot.on("inline_query", handleInlineQuery);
    
    // Устанавливаем глобальный обработчик ошибок
    logger.info("Установка обработчика ошибок...");
    bot.catch(errorHandler);
    
    // Получаем информацию о боте
    const botInfo = await bot.api.getMe();
    logger.info(`Бот успешно инициализирован как @${botInfo.username}`);
    
    return;
  } catch (error) {
    logger.error("Критическая ошибка при инициализации бота:", error);
    throw error;
  }
} 
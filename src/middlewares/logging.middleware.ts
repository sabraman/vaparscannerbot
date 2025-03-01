/**
 * Middleware для логирования всех сообщений к боту
 */
import { logger } from "../utils/logger.ts";
import type { MyContext } from "../bot/context.ts";
import type { NextFunction } from "../../deps.deno.ts";

/**
 * Middleware для логирования текстовых сообщений
 * @param {MyContext} ctx Контекст бота
 * @param {NextFunction} next Функция для передачи управления следующему обработчику
 */
export async function loggingMiddleware(ctx: MyContext, next: NextFunction): Promise<void> {
  const message = ctx.message;
  
  if (message) {
    const from = message.from;
    const chatTitle = ctx.chat?.title || 'Личный чат';
    const chatId = ctx.chat?.id;
    const text = 'text' in message ? message.text : '<нет текста>';
    const messageType = text?.startsWith('/') ? 'Команда' : 'Текст';
    
    logger.debug("Получено сообщение:", {
      from: `${from.first_name} ${from.last_name || ''} (${from.id})`,
      chat: `${chatTitle} (${chatId})`,
      text: text || '<нет текста>',
      type: messageType
    });
  } else if (ctx.callbackQuery) {
    const from = ctx.callbackQuery.from;
    logger.debug("Получен callback query:", {
      from: `${from.first_name} ${from.last_name || ''} (${from.id})`,
      data: ctx.callbackQuery.data
    });
  } else if (ctx.inlineQuery) {
    const from = ctx.inlineQuery.from;
    logger.debug("Получен inline query:", {
      from: `${from.first_name} ${from.last_name || ''} (${from.id})`,
      query: ctx.inlineQuery.query || '<пустой запрос>'
    });
  }
  
  await next();
} 
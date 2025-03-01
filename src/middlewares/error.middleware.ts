/**
 * Middleware для обработки ошибок в боте
 */
import { logger } from "../utils/logger.ts";
import type { MyContext } from "../bot/context.ts";
import type { BotError } from "../../deps.deno.ts";

/**
 * Обработчик ошибок для бота
 * @param {Error} err Объект ошибки
 * @param {MyContext} ctx Контекст бота, в котором произошла ошибка
 */
export const errorHandler = async (err: BotError<MyContext>) => {
  const ctx = err.ctx;
  logger.error("Ошибка в боте:", err.error);
  
  // Отправляем сообщение пользователю только если контекст доступен
  // и ошибка произошла в ходе обработки запроса пользователя
  if (ctx && "message" in ctx) {
    try {
      await ctx.reply("Извините, произошла ошибка при обработке вашего запроса. Попробуйте позже.");
    } catch (replyError) {
      logger.error("Не удалось отправить сообщение об ошибке пользователю:", replyError);
    }
  }
} 
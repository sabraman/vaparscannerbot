/**
 * Обработчик команды /start
 */
import { logger } from "../utils/logger.ts";
import type { MyContext } from "../bot/context.ts";
import {  showMainMenu } from "../utils/telegram.ts";

/**
 * Обработчик команды /start
 * @param {MyContext} ctx Контекст бота
 */
export async function handleStartCommand(ctx: MyContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    logger.info("Обработка команды /start от пользователя", userId);
    
    await showMainMenu(ctx);
    
    logger.info("Ответ на команду /start отправлен пользователю", userId);
  } catch (error) {
    logger.error("Ошибка при обработке команды /start:", error);
    await ctx.reply("Произошла ошибка при обработке команды");
  }
} 
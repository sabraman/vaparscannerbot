/**
 * Обработчик команды /help
 */
import { logger } from "../utils/logger.ts";
import type { MyContext } from "../bot/context.ts";

/**
 * Обработчик команды /help
 * @param {MyContext} ctx Контекст бота
 */
export async function handleHelpCommand(ctx: MyContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    logger.info("Обработка команды /help от пользователя", userId);
    
    await ctx.reply(
      "Доступные команды:\n" +
      "/start - Начать поиск или регистрацию по номеру телефона\n" +
      "/help - Показать это сообщение"
    );
    
    logger.info("Ответ на команду /help отправлен пользователю", userId);
  } catch (error) {
    logger.error("Ошибка при обработке команды /help:", error);
    await ctx.reply("Произошла ошибка при обработке команды");
  }
} 
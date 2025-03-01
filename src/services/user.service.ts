/**
 * Сервис для работы с пользователями
 */
import { api } from "../api/index.ts";
import { logger } from "../utils/logger.ts";
import { escapeMarkdown } from "../utils/telegram.ts";
import { validateAndFormatPhone } from "../utils/phone.ts";
import type { MyContext } from "../bot/context.ts";

/**
 * Сервис для работы с данными пользователей
 */
export const userService = {
  /**
   * Отправляет информацию о пользователе в чат
   * @param {MyContext} ctx Контекст бота
   * @param {string} phone Номер телефона пользователя
   * @returns {Promise<boolean>} true если информация успешно отправлена
   */
  async sendUserInfo(ctx: MyContext, phone: string): Promise<boolean> {
    logger.info("Отправка информации о пользователе для номера:", phone);
    
    try {
      // Предполагаем, что на этом этапе номер уже валидирован,
      // но на всякий случай проверяем еще раз
      const phoneValidation = validateAndFormatPhone(phone);
      if (!phoneValidation.isValid) {
        logger.warn("Неверный формат номера телефона в sendUserInfo:", phone);
        await ctx.reply("Неверный формат номера телефона. Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999");
        return false;
      }
      
      const validPhone = phoneValidation.formattedPhone as string;
      
      const data = await api.searchByPhone(validPhone);
      
      if (data.users.length === 0) {
        logger.info("Пользователь не найден для номера:", validPhone);
        return false;
      }

      const user = data.users[0];
      logger.debug("Найдена информация о пользователе:", user);

      const avgBill = user.avgBill ? Number.parseFloat(user.avgBill).toFixed(2) : "N/A";
      
      // Экранируем специальные символы для MarkdownV2
      const escapedCardNum = escapeMarkdown(user.card_num);
      const escapedName = escapeMarkdown(user.name);
      const escapedBalance = escapeMarkdown(String(user.balance));
      const escapedAvgBill = escapeMarkdown(String(avgBill));
      
      await ctx.reply(`Номер Карты: \`${escapedCardNum}\`
\\(копируется нажатием\\)
Имя: ${escapedName}
Баланс: ${escapedBalance}
Средний чек: ${escapedAvgBill}`, { parse_mode: "MarkdownV2" });

      logger.info("Информация успешно отправлена пользователю");
      return true;
    } catch (error) {
      logger.error("Ошибка при получении/отправке информации о пользователе:", error);
      await ctx.reply("Произошла ошибка при получении информации о пользователе");
      return false;
    }
  },

  /**
   * Поиск пользователя с несколькими попытками (для новых регистраций)
   * @param {MyContext} ctx Контекст бота
   * @param {string} phone Номер телефона пользователя
   * @param {number} maxRetries Максимальное количество попыток
   * @param {number} retryDelay Задержка между попытками в мс
   * @returns {Promise<boolean>} true если пользователь найден
   */
  async searchUserWithRetry(
    ctx: MyContext, 
    phone: string, 
    maxRetries = 5, 
    retryDelay = 1000
  ): Promise<boolean> {
    // Валидация номера телефона
    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.isValid) {
      logger.warn("Неверный формат номера телефона в searchUserWithRetry:", phone);
      await ctx.reply("Неверный формат номера телефона. Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999");
      return false;
    }
    
    const validPhone = phoneValidation.formattedPhone as string;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        logger.debug(`Попытка ${retryCount + 1} поиска пользователя по номеру: ${validPhone}`);
        const success = await this.sendUserInfo(ctx, validPhone);
        
        if (success) {
          logger.info(`Пользователь найден после ${retryCount + 1} попыток`);
          return true;
        }
      } catch (error) {
        logger.error(`Попытка ${retryCount + 1}: Ошибка поиска пользователя:`, error);
      }

      retryCount++;
      
      if (retryCount < maxRetries) {
        logger.debug(`Ожидание ${retryDelay}мс перед следующей попыткой`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    logger.warn(`Пользователь не найден после ${maxRetries} попыток`);
    return false;
  }
}; 
/**
 * Обработчики для различных событий бота
 */
import { logger } from "../utils/logger.ts";
import type { MyContext } from "./context.ts";
import { CALLBACK_DATA, showMainMenu } from "../utils/telegram.ts";
import { userService } from "../services/user.service.ts";
import { analyticsService } from "../services/analytics.service.ts";
import { InlineQueryResultBuilder, Fuse } from "../deps.ts";
import type { OperationsResult } from "../types/index.ts";
import { validateAndFormatPhone } from "../utils/phone.ts";

// Определение типа для результата Fuse
interface FuseResult<T> {
  item: T;
  refIndex: number;
  score?: number;
}

/**
 * Обработчик текстовых сообщений (номера телефонов)
 * @param {MyContext} ctx Контекст бота
 * @returns {Promise<void>}
 */
export async function handleTextMessage(ctx: MyContext): Promise<void> {
  // Проверяем наличие текста в сообщении
  if (!ctx.message?.text) {
    logger.debug("Получено сообщение без текста");
    return;
  }

  // Пропускаем команды
  if (ctx.message.text.startsWith('/')) {
    logger.debug("Пропуск команды в текстовом обработчике:", ctx.message.text);
    return;
  }

  // Проверяем, является ли сообщение результатом inline-поиска менеджеров
  if (ctx.message.text.startsWith('Менеджер:')) {
    logger.debug("Пропуск сообщения от inline-поиска менеджеров");
    return;
  }

  const inputPhone = ctx.message.text.trim();
  logger.info("Обработка текстового сообщения от пользователя", { userId: ctx.from?.id, phone: inputPhone });

  // Валидация номера телефона
  const phoneValidation = validateAndFormatPhone(inputPhone);
  
  if (!phoneValidation.isValid) {
    logger.warn("Неверный формат номера телефона:", inputPhone);
    await ctx.reply("Неверный формат номера телефона. Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999");
    return;
  }

  const phone = phoneValidation.formattedPhone as string;
  logger.info("Номер телефона прошел валидацию:", { original: inputPhone, formatted: phone });

  try {
    const data = await userService.sendUserInfo(ctx, phone);
    
    if (!data) {
      logger.info("Пользователь не найден, начинаем регистрацию для номера:", phone);
      await ctx.reply("Пользователь не найден. Начинаем регистрацию...");
      
      return await ctx.conversation.enter("registration");
    }
    
    // Показываем меню снова после успешного поиска
    await showMainMenu(ctx);
  } catch (error) {
    logger.error("Ошибка поиска пользователя:", error);
    await ctx.reply("Произошла ошибка при поиске пользователя");
    
    // Показываем меню снова после ошибки
    await showMainMenu(ctx);
  }
}

/**
 * Обработчик callback запросов (нажатия на кнопки)
 * @param {MyContext} ctx Контекст бота
 * @returns {Promise<void>}
 */
export async function handleCallbackQuery(ctx: MyContext): Promise<void> {
  // Проверяем наличие callback query и данных
  if (!ctx.callbackQuery?.data) {
    logger.warn("Получен callback query без данных");
    await ctx.answerCallbackQuery();
    return;
  }

  try {
    const data = ctx.callbackQuery.data;
    logger.info("Получен callback query:", data);
    
    if (data === CALLBACK_DATA.FIND_CLIENT) {
      await ctx.answerCallbackQuery();
      await ctx.reply("Отправьте номер телефона для поиска информации");
      await ctx.reply("Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999");
    } else if (data.startsWith('save_default_manager:')) {
      const managerId = data.split(':')[1];
      const success = await analyticsService.saveDefaultManagerById(ctx, managerId);
      
      if (success) {
        await ctx.answerCallbackQuery({
          text: "Менеджер сохранен как менеджер по умолчанию",
        });
      } else {
        await ctx.answerCallbackQuery({
          text: "Не удалось сохранить менеджера по умолчанию",
        });
      }
    } else {
      await ctx.answerCallbackQuery();
      logger.warn(`Неизвестный callback query: ${data}`);
    }
  } catch (error) {
    logger.error("Ошибка при обработке callback query:", error);
    await ctx.answerCallbackQuery({
      text: "Произошла ошибка",
    });
  }
}

/**
 * Обработчик inline запросов (поиск менеджеров)
 * @param {MyContext} ctx Контекст бота
 * @returns {Promise<void>}
 */
export async function handleInlineQuery(ctx: MyContext): Promise<void> {
  if (!ctx.inlineQuery) {
    logger.warn("Получен некорректный inline запрос");
    return;
  }

  try {
    const query = ctx.inlineQuery.query.toLowerCase() || analyticsService.getDefaultManager(ctx)?.toLowerCase() || "";
    logger.info("Получен inline запрос:", query);

    // Получаем текущую дату для статистики
    const today = new Date();
    const dateFormat = today.toISOString().split('T')[0];

    // Получаем всех менеджеров с их статистикой
    const managersWithStats = await analyticsService.getManagersStats(dateFormat);
    
    // Настраиваем Fuse для нечеткого поиска если есть запрос
    let searchResults = managersWithStats;
    
    if (query) {
      const fuse = new Fuse(managersWithStats, {
        keys: ['name'],
        threshold: 0.4,
        includeScore: true
      });
      
      // Получаем результаты поиска
      const fuseResults = fuse.search(query);
      searchResults = fuseResults.map((result: FuseResult<{id: string, name: string, stats: OperationsResult}>) => result.item);
    }

    // Формируем результаты для отображения (берем первые 10)
    const results = searchResults.slice(0, 10).map(manager => 
      InlineQueryResultBuilder.article(
        manager.id,
        manager.name,
        {
          description: `Скачиваний: ${manager.stats.registrations}, Использований: ${manager.stats.usages}`,
          reply_markup: {
            inline_keyboard: [
              [{ text: "Сохранить по умолчанию", callback_data: `save_default_manager:${manager.id}` }]
            ]
          },
        }
      ).text(
        `Менеджер: ${manager.name}\nКол-во скачиваний: ${manager.stats.registrations}\nКол-во использований: ${manager.stats.usages}`
      )
    );

    await ctx.answerInlineQuery(results, { cache_time: 300 });
    logger.info("Отправлен ответ на inline запрос");
  } catch (error) {
    logger.error("Ошибка при обработке inline запроса:", error);
    await ctx.answerInlineQuery([], { cache_time: 0 });
  }
} 
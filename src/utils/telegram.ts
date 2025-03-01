/**
 * Утилиты для работы с Telegram API
 */
import { InlineKeyboard } from "../../deps.deno.ts";
import type { MyContext } from "../bot/context.ts";

// Константы для коллбэк-данных
export const CALLBACK_DATA = {
  FIND_CLIENT: "find_client",
  CALC_CONVERSION: "calc_conversion",
  SKIP: "skip",
  SAVE_DEFAULT_MANAGER: "save_default_manager",
};

// Текст кнопок
export const BUTTON_TEXT = {
  FIND_CLIENT: "Найти клиента",
  CALC_CONVERSION: "Посчитать конверсию",
  SKIP: "Пропустить",
  SAVE_DEFAULT_MANAGER: "Сохранить по умолчанию",
};

/**
 * Создает основную клавиатуру бота
 * @returns {InlineKeyboard} Основная клавиатура бота
 */
export function getMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BUTTON_TEXT.FIND_CLIENT, CALLBACK_DATA.FIND_CLIENT)
    .row()
    .switchInlineCurrent(BUTTON_TEXT.CALC_CONVERSION);
}

/**
 * Создает клавиатуру с кнопкой "Пропустить"
 * @returns {InlineKeyboard} Клавиатура с кнопкой "Пропустить"
 */
export function getSkipKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BUTTON_TEXT.SKIP, CALLBACK_DATA.SKIP);
}

/**
 * Экранирует специальные символы для MarkdownV2
 * @param {string} text Текст для экранирования
 * @returns {string} Экранированный текст
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Проверяет, является ли сообщение командой бота
 * @param {object} msg Объект сообщения
 * @returns {boolean} true, если сообщение является командой бота
 */
export function isCommand(msg: { entities?: Array<{ type: string }> }): boolean {
  return msg?.entities?.some((entity) => entity.type === "bot_command") ?? false;
}

/**
 * Показывает главное меню пользователю
 * @param {MyContext} ctx Контекст бота
 * @param {string} [message="Выберите действие:"] Сообщение для отображения с меню
 * @returns {Promise<void>}
 */
export async function showMainMenu(ctx: MyContext, message = "Выберите действие или введите номер телефона:"): Promise<void> {
  await ctx.reply(message, {
    reply_markup: getMainKeyboard(),
  });
} 
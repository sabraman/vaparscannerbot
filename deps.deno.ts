/**
 * Внешние зависимости проекта
 */

// Импортируем Context только как тип для использования в ErrorHandler
import type { Context } from "https://deno.land/x/grammy@v1.35.0/mod.ts";

// Основные зависимости grammY
export {
  Bot,
  type Context,
  type CallbackQueryContext,
  type InlineQueryContext,
  session,
  type SessionFlavor,
  webhookCallback,
  type BotError,
  type NextFunction,
} from "https://deno.land/x/grammy@v1.35.0/mod.ts";

// Поддержка диалогов (conversations)
export {
  conversations,
  type ConversationFlavor,
  type Conversation,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

// Тип для обработчика ошибок (явно определяем)
export type ErrorHandler<C extends Context> = (err: Error, ctx: C) => Promise<void> | void;

// Компоненты UI
export {
  InlineKeyboard,
  InlineQueryResultBuilder,
} from "https://deno.land/x/grammy@v1.35.0/mod.ts";

// Модуль для нечеткого поиска - используем из deno.land
export { default as Fuse } from "https://deno.land/x/fuse@v6.4.1/dist/fuse.esm.js"; 
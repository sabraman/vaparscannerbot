/**
 * Зависимости проекта
 */

// Реэкспортируем все из deps.deno.ts для лучшей поддержки типов и автодополнения
export * from "../deps.deno.ts";

// Импортируем и реэкспортируем типы для использования внутри проекта
export type {
  Context,
  CallbackQueryContext,
  InlineQueryContext,
  SessionFlavor,
  ConversationFlavor,
  Conversation,
  NextFunction,
} from "../deps.deno.ts";

// Реэкспортируем утилиты для удобства
export { userService } from "./services/user.service.ts";
export { analyticsService } from "./services/analytics.service.ts";
export { registration } from "./conversations/registration.ts";
export { logger } from "./utils/logger.ts";
export { config } from "./config/index.ts";
export * from "./utils/telegram.ts";
export * from "./utils/date.ts";
export * from "./bot/context.ts"; 
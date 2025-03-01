/**
 * Типы контекста Telegram бота
 */
import type {
  Context,
  SessionFlavor,
  ConversationFlavor,
  Conversation
} from "../../deps.deno.ts";
import type { SessionData } from "../types/index.ts";

/**
 * Тип контекста для бота, включающий в себя все middleware
 */
export type MyContext = Context & ConversationFlavor<Context> & SessionFlavor<SessionData>;

/**
 * Тип для диалога (conversation)
 */
export type MyConversation = Conversation<MyContext, MyContext>; 
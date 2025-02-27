import {
  Bot,
  type Context,
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
  session,
  type SessionFlavor,
  InlineKeyboard,
} from "./deps.deno.ts";
import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { api } from "./api.ts";
import { validateBirthDate, convertDate, getMinimumBirthDate, formatDateForApi } from "./utils.ts";
import type { SessionData } from "./types.ts";

// Извлекаем только нужные части конфигурации
const { version, requiredEnvVars } = config.bot;

// Проверяем наличие необходимых переменных окружения
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Отсутствует обязательная переменная окружения: ${envVar}`);
  }
}

// Outside context type (knows all middleware plugins)
type MyContext = Context & ConversationFlavor<Context> & SessionFlavor<SessionData>;
// Conversation type
type MyConversation = Conversation<MyContext>;

// Initialize bot
const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
// Мы уже проверили наличие токена выше, но TypeScript об этом не знает
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN не установлен в переменных окружения");
}

// Функция для инициализации сессии
function initial(): SessionData {
  return { __conversations: {} };
}

interface UserResponse {
  meta: {
    limit: number;
    total: number;
  };
  users: Array<{
    card_num: string;
    name: string;
    balance: number;
    avgBill: string | null;
  }>;
}

interface RegisterResponse {
  status: string;
  message?: string;
  androidUrl?: string;
  iosUrl?: string;
  authToken?: string;
  details?: {
    validation?: Record<string, string[]>;
  };
}

async function sendUserInfo(ctx: MyContext, phone: string) {
  logger.info("Отправка информации о пользователе для номера:", phone);
  const data = await api.searchByPhone(phone);
  
  if (data.users.length === 0) {
    logger.info("Пользователь не найден для номера:", phone);
    await ctx.reply("Ошибка: пользователь не найден");
    return;
  }

  const user = data.users[0];
  logger.debug("Найдена информация о пользователе:", user);

  const avgBill = user.avgBill ? Number.parseFloat(user.avgBill).toFixed(2) : "N/A";
  
  // Экранируем специальные символы для MarkdownV2
  const escapedCardNum = user.card_num.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  const escapedName = user.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  const escapedBalance = String(user.balance).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  const escapedAvgBill = String(avgBill).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  
  await ctx.reply(`Номер Карты: \`${escapedCardNum}\`
\\(копируется нажатием\\)
Имя: ${escapedName}
Баланс: ${escapedBalance}
Средний чек: ${escapedAvgBill}`, { parse_mode: "MarkdownV2" });

  logger.info("Информация успешно отправлена пользователю");
}

async function registration(conversation: MyConversation, ctx: MyContext) {
  const phone = ctx.message?.text;
  if (!phone) {
    logger.error("Ошибка: номер телефона не найден");
    await ctx.reply("Ошибка: номер телефона не найден");
    return;
  }

  const chatId = ctx.chat?.id;
  if (!chatId) {
    logger.error("Ошибка: не найден ID чата");
    return;
  }

  logger.info("Начало регистрации клиента", { phone, chatId });

  const skipKeyboard = new InlineKeyboard().text("Пропустить", "skip");

  let firstName = "";
  let lastName = "";
  let promoCode = "";

  // Имя (опционально)
  await ctx.reply("Введите имя клиента:", { reply_markup: skipKeyboard });
  const firstNameResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
  if (firstNameResponse.callbackQuery?.data === "skip") {
    await firstNameResponse.answerCallbackQuery();
    firstName = "";
    logger.debug("Имя пропущено");
  } else if (firstNameResponse.message?.text) {
    firstName = firstNameResponse.message.text;
    logger.debug("Получено имя:", firstName);
  }

  // Фамилия (опционально)
  await ctx.reply("Введите фамилию клиента:", { reply_markup: skipKeyboard });
  const lastNameResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
  if (lastNameResponse.callbackQuery?.data === "skip") {
    await lastNameResponse.answerCallbackQuery();
    lastName = "";
    logger.debug("Фамилия пропущена");
  } else if (lastNameResponse.message?.text) {
    lastName = lastNameResponse.message.text;
    logger.debug("Получена фамилия:", lastName);
  }

  // Промокод (опционально)
  await ctx.reply("Введите промокод (если есть):", { reply_markup: skipKeyboard });
  const promoResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
  if (promoResponse.callbackQuery?.data === "skip") {
    await promoResponse.answerCallbackQuery();
    promoCode = "";
    logger.debug("Промокод пропущен");
  } else if (promoResponse.message?.text) {
    promoCode = promoResponse.message.text;
    logger.debug("Получен промокод:", promoCode);
  }

  // Дата рождения (обязательно)
  await ctx.reply("Введите дату рождения клиента (формат: ДД.ММ.ГГГГ):", { reply_markup: skipKeyboard });
  
  let bDate: string;
  const bDateResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
  
  if (bDateResponse.callbackQuery?.data === "skip") {
    await bDateResponse.answerCallbackQuery();
    bDate = formatDateForApi(getMinimumBirthDate());
    logger.debug("Дата рождения пропущена, установлена минимальная:", bDate);
    await ctx.reply("Установлена минимально допустимая дата рождения (18 лет)");
  } else if (bDateResponse.message?.text) {
    while (true) {
      try {
        validateBirthDate(bDateResponse.message.text);
        bDate = convertDate(bDateResponse.message.text);
        logger.debug("Получена и проверена дата рождения:", bDate);
        break;
      } catch (error) {
        logger.error("Ошибка валидации даты:", error);
        await ctx.reply(error instanceof Error ? error.message : "Неверная дата рождения. Попробуйте еще раз:");
        const retryMsg = await conversation.waitFor("message:text");
        bDateResponse.message = retryMsg.message;
      }
    }
  } else {
    bDate = formatDateForApi(getMinimumBirthDate());
    logger.debug("Установлена дата по умолчанию:", bDate);
  }

  try {
    const trimmedPhone = phone.trim();
    logger.info("Начало параллельной регистрации и поиска для номера:", trimmedPhone);
    
    const registerPromise = api.registerUser(trimmedPhone, firstName, lastName, bDate, promoCode);
    await ctx.reply("Регистрация клиента и получение информации о карте...");

    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        logger.debug(`Попытка ${retryCount + 1} поиска пользователя`);
        const userData = await api.searchByPhone(trimmedPhone);
        if (userData.users.length > 0) {
          logger.info(`Пользователь найден после ${retryCount + 1} попыток`);
          await sendUserInfo(ctx, trimmedPhone);
          break;
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

    const registerResult = await registerPromise;
    logger.info("Успешная регистрация клиента:", registerResult);

    return true;

  } catch (error) {
    logger.error("Ошибка в процессе регистрации:", error);
    
    let errorMessage = "Ошибка при регистрации: ";
    if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Неизвестная ошибка";
    }
    
    await ctx.reply(errorMessage);
    return false;
  }
}

export const bot = new Bot<MyContext>(BOT_TOKEN);

// Функция инициализации бота
export async function initBot() {
  logger.info(`Бот версии ${version} инициализируется...`);
  
  try {
    // Install session middleware first
    logger.info("Установка session middleware...");
    bot.use(session({ initial }));
    
    // Install plugins with proper context types
    logger.info("Установка conversations middleware...");
    bot.use(conversations());
    bot.use(createConversation(registration));

    // Обработка команды /start
    logger.info("Регистрация команды /start...");
    bot.command("start", async (ctx) => {
      try {
        logger.info("Обработка команды /start от пользователя", ctx.from?.id);
        await ctx.reply("Отправьте номер телефона для поиска информации");
        logger.info("Ответ на команду /start отправлен пользователю", ctx.from?.id);
      } catch (error) {
        logger.error("Ошибка при обработке команды /start:", error);
        await ctx.reply("Произошла ошибка при обработке команды");
      }
    });

    // Обработка команды /help
    logger.info("Регистрация команды /help...");
    bot.command("help", async (ctx) => {
      try {
        logger.info("Обработка команды /help от пользователя", ctx.from?.id);
        await ctx.reply(
          "Доступные команды:\n" +
          "/start - Начать поиск или регистрацию по номеру телефона\n" +
          "/help - Показать это сообщение"
        );
        logger.info("Ответ на команду /help отправлен пользователю", ctx.from?.id);
      } catch (error) {
        logger.error("Ошибка при обработке команды /help:", error);
        await ctx.reply("Произошла ошибка при обработке команды");
      }
    });
    
    // Добавляем логирование всех сообщений
    logger.info("Регистрация обработчика сообщений...");
    bot.on("message", async (ctx, next) => {
      const message = ctx.message;
      const from = message.from;
      logger.debug("Получено сообщение:", {
        from: `${from?.first_name} ${from?.last_name} (${from?.id})`,
        chat: `${message.chat.title || 'Личный чат'} (${message.chat.id})`,
        text: message.text || '<нет текста>',
        type: message.text?.startsWith('/') ? 'Команда' : 'Текст'
      });
      
      await next();
    });

    // Handle every message that's not a command
    logger.info("Регистрация обработчика текстовых сообщений...");
    bot.on("message:text", async (ctx, next) => {
      if (ctx.message.text.startsWith('/')) {
        logger.debug("Пропуск команды в текстовом обработчике:", ctx.message.text);
        return next();
      }

      const phone = ctx.message.text.trim();
      logger.info("Обработка текстового сообщения от пользователя", { userId: ctx.from?.id, phone });

      try {
        const data = await api.searchByPhone(phone);
        if (data.users.length === 0) {
          logger.info("Пользователь не найден, начинаем регистрацию для номера:", phone);
          await ctx.reply("Пользователь не найден. Начинаем регистрацию...");
          return await ctx.conversation.enter("registration");
        }

        await sendUserInfo(ctx, phone);
      } catch (error) {
        logger.error("Ошибка поиска пользователя:", error);
        await ctx.reply("Произошла ошибка при поиске пользователя");
      }
    });

    // Добавляем логирование всех ошибок
    logger.info("Регистрация обработчика ошибок...");
    bot.catch((err) => {
      logger.error("Ошибка в боте:", err);
    });

    // Проверяем работоспособность API бота
    logger.info("Проверка API бота...");
    const botInfo = await bot.api.getMe();
    logger.info(`Бот подключен как @${botInfo.username}`);
    
    logger.info("Бот успешно инициализирован и готов к работе");
  } catch (error) {
    logger.error("Критическая ошибка при инициализации бота:", error);
    throw error;
  }
}
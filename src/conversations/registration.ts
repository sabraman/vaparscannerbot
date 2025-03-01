/**
 * Диалог для регистрации нового клиента
 */
import { api, PromoCodeError, ValidationError } from "../api/index.ts";
import { logger } from "../utils/logger.ts";
import type { MyContext, MyConversation } from "../bot/context.ts";
import { getSkipKeyboard, getMainKeyboard, isCommand, CALLBACK_DATA, showMainMenu } from "../utils/telegram.ts";
import { validateBirthDate, convertDate, getMinimumBirthDate, formatDateForApi } from "../utils/date.ts";
import { validateAndFormatPhone } from "../utils/phone.ts";

/**
 * Диалог регистрации нового клиента
 * @param {MyConversation} conversation Объект диалога
 * @param {MyContext} ctx Контекст бота
 * @returns {Promise<boolean>} Результат регистрации
 */
export async function registration(conversation: MyConversation, ctx: MyContext): Promise<boolean> {
  const inputPhone = ctx.message?.text;
  if (!inputPhone) {
    logger.error("Ошибка: номер телефона не найден");
    await ctx.reply("Ошибка: номер телефона не найден");
    return false;
  }

  // Валидация номера телефона
  const phoneValidation = validateAndFormatPhone(inputPhone);
  if (!phoneValidation.isValid) {
    logger.warn("Неверный формат номера телефона в диалоге регистрации:", inputPhone);
    await ctx.reply("Неверный формат номера телефона. Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999");
    return false;
  }

  const phone = phoneValidation.formattedPhone as string;
  logger.info("Номер телефона прошел валидацию для регистрации:", { original: inputPhone, formatted: phone });

  const chatId = ctx.chat?.id;
  if (!chatId) {
    logger.error("Ошибка: не найден ID чата");
    return false;
  }

  logger.info("Начало регистрации клиента", { phone, chatId });

  let firstName = "";
  let lastName = "";
  let promoCode = "";
  let bDate: string = formatDateForApi(getMinimumBirthDate()); // Значение по умолчанию

  // Получение имени
  await ctx.reply("Введите имя клиента:", { reply_markup: getSkipKeyboard() });
  const firstNameResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
  
  // Проверяем команду отмены
  if (firstNameResponse.message && isCommand(firstNameResponse.message)) {
    await ctx.reply("Регистрация отменена");
    await showMainMenu(ctx);
    return false;
  }

  if (firstNameResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
    await firstNameResponse.answerCallbackQuery();
    firstName = "";
    logger.debug("Имя пропущено");
  } else if (firstNameResponse.message?.text) {
    firstName = firstNameResponse.message.text;
    logger.debug("Получено имя:", firstName);
  }

  // Получение фамилии
  await ctx.reply("Введите фамилию клиента:", { reply_markup: getSkipKeyboard() });
  const lastNameResponse = await conversation.waitFor(["message:text", "callback_query:data"]);

  // Проверяем команду отмены
  if (lastNameResponse.message && isCommand(lastNameResponse.message)) {
    await ctx.reply("Регистрация отменена");
    await showMainMenu(ctx);
    return false;
  }

  if (lastNameResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
    await lastNameResponse.answerCallbackQuery();
    lastName = "";
    logger.debug("Фамилия пропущена");
  } else if (lastNameResponse.message?.text) {
    lastName = lastNameResponse.message.text;
    logger.debug("Получена фамилия:", lastName);
  }

  // Получение промокода с циклом для повторных попыток
  let validPromoCode = false;
  await ctx.reply("Введите промокод (если есть):", { reply_markup: getSkipKeyboard() });
  
  while (!validPromoCode) {
    try {
      const promoResponse = await conversation.waitFor(["message:text", "callback_query:data"]);

      // Проверяем команду отмены
      if (promoResponse.message && isCommand(promoResponse.message)) {
        await ctx.reply("Регистрация отменена");
        await showMainMenu(ctx);
        return false;
      }

      if (promoResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
        await promoResponse.answerCallbackQuery();
        promoCode = "";
        logger.debug("Промокод пропущен");
        validPromoCode = true;
        await ctx.reply("Регистрация продолжается без промокода");
      } else if (promoResponse.message?.text) {
        promoCode = promoResponse.message.text;
        logger.debug("Получен промокод:", promoCode);
        validPromoCode = true;
      } else {
        // Необработанный тип ответа
        await ctx.reply("Неожиданный формат ответа. Пожалуйста, введите промокод или нажмите кнопку \"Пропустить\":", {
          reply_markup: getSkipKeyboard()
        });
      }
    } catch (error) {
      logger.error("Непредвиденная ошибка при обработке промокода:", error);
      // Сообщаем пользователю о проблеме и продолжаем цикл
      await ctx.reply("Произошла ошибка при обработке промокода. Пожалуйста, попробуйте еще раз или пропустите:", {
        reply_markup: getSkipKeyboard()
      });
    }
  }

  // Получение даты рождения с циклом для повторных попыток
  let validDateInput = false;
  await ctx.reply("Введите дату рождения клиента (формат: ДД.ММ.ГГГГ):", { reply_markup: getSkipKeyboard() });
  
  while (!validDateInput) {
    try {
      const bDateResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
      
      // Проверяем команду отмены
      if (bDateResponse.message && isCommand(bDateResponse.message)) {
        await ctx.reply("Регистрация отменена");
        await showMainMenu(ctx);
        return false;
      }

      if (bDateResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
        await bDateResponse.answerCallbackQuery();
        bDate = formatDateForApi(getMinimumBirthDate());
        logger.debug("Дата рождения пропущена, установлена минимальная:", bDate);
        await ctx.reply("Установлена минимально допустимая дата рождения (18 лет)");
        validDateInput = true;
      } else if (bDateResponse.message?.text) {
        // Проверка валидности даты рождения
        try {
          validateBirthDate(bDateResponse.message.text);
          bDate = convertDate(bDateResponse.message.text);
          logger.debug("Получена и проверена дата рождения:", bDate);
          validDateInput = true;
          await ctx.reply(`Дата рождения успешно установлена: ${bDateResponse.message.text}`);
        } catch (error) {
          logger.error("Ошибка валидации даты:", error);
          // Явно сообщаем пользователю об ошибке и просим повторить ввод
          const errorMessage = error instanceof Error ? error.message : "Неверная дата рождения";
          await ctx.reply(`${errorMessage}\nПожалуйста, введите дату еще раз в формате ДД.ММ.ГГГГ или нажмите кнопку "Пропустить":`, {
            reply_markup: getSkipKeyboard()
          });
          // Цикл продолжится и запросит дату снова
        }
      } else {
        // Необработанный тип ответа - сообщаем пользователю и просим повторить
        await ctx.reply("Неожиданный формат ответа. Пожалуйста, введите дату рождения в формате ДД.ММ.ГГГГ:", {
          reply_markup: getSkipKeyboard()
        });
      }
    } catch (error) {
      logger.error("Непредвиденная ошибка при обработке даты:", error);
      // Сообщаем пользователю о проблеме и продолжаем цикл
      await ctx.reply("Произошла ошибка при обработке даты. Пожалуйста, введите дату рождения еще раз в формате ДД.ММ.ГГГГ:", {
        reply_markup: getSkipKeyboard()
      });
    }
  }

  // Цикл для повторных попыток регистрации при ошибках
  let registrationSuccess = false;
  let registrationAttempts = 0;
  const maxRegistrationAttempts = 3;

  // Функция для отправки информации о пользователе
  const sendUserInfo = async (phone: string): Promise<boolean> => {
    try {
      // Валидация номера телефона
      const phoneValidation = validateAndFormatPhone(phone);
      if (!phoneValidation.isValid) {
        logger.warn("Неверный формат номера телефона в sendUserInfo диалога регистрации:", phone);
        // Не отправляем сообщение пользователю, так как это внутренняя функция
        return false;
      }
      
      const validPhone = phoneValidation.formattedPhone as string;
      
      const userData = await api.searchByPhone(validPhone);
      
      if (userData.users.length === 0) {
        logger.info("Пользователь не найден для номера:", validPhone);
        return false;
      }

      const user = userData.users[0];
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
      
      // Показываем меню снова
      await showMainMenu(ctx);
      
      return true;
    } catch (error) {
      logger.error("Ошибка при поиске/отправке информации:", error);
      return false;
    }
  };

  while (!registrationSuccess && registrationAttempts < maxRegistrationAttempts) {
    registrationAttempts++;
    logger.info(`Попытка регистрации ${registrationAttempts}/${maxRegistrationAttempts} для номера: ${phone}`);
    
    try {
      // Не показываем сообщение о начале регистрации заранее
      // Вместо этого просто пытаемся зарегистрировать
      logger.info("Регистрация клиента:", {
        phone,
        firstName,
        lastName,
        bDate,
        promoCode: promoCode || "<пусто>"
      });
      
      // Выполняем регистрацию напрямую и сразу перехватываем возможные ошибки
      const registerResult = await api.registerUser(phone, firstName, lastName, bDate, promoCode);
      
      // Только после успешной регистрации уведомляем пользователя
      await ctx.reply("Регистрация прошла успешно! Получаем информацию о карте...");
      logger.info("Успешная регистрация клиента:", registerResult);
      
      // Пробуем найти пользователя несколько раз после успешной регистрации
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 1000;
      let userFound = false;
      
      while (retryCount < maxRetries && !userFound) {
        logger.debug(`Попытка ${retryCount + 1} поиска пользователя после регистрации`);
        userFound = await sendUserInfo(phone);
        
        if (!userFound) {
          retryCount++;
          if (retryCount < maxRetries) {
            logger.debug(`Ожидание ${retryDelay}мс перед следующей попыткой`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      if (!userFound) {
        await ctx.reply("Не удалось получить информацию о карте после регистрации.");
        await showMainMenu(ctx);
      }
      
      registrationSuccess = true;
      
    } catch (error) {
      // Обрабатываем все возможные ошибки регистрации
      logger.error("Ошибка в процессе регистрации:", error);
      
      if (error instanceof PromoCodeError) {
        // Ошибка промокода - предлагаем ввести другой или пропустить
        await ctx.reply(`Указанный промокод не найден. Введите другой промокод или нажмите 'Пропустить' для регистрации без промокода:`, {
          reply_markup: getSkipKeyboard()
        });
        
        try {
          // Ждем ответа пользователя
          const newPromoResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
          
          if (newPromoResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
            await newPromoResponse.answerCallbackQuery();
            promoCode = "";
            logger.debug("Промокод пропущен после ошибки");
            await ctx.reply("Продолжаем регистрацию без промокода...");
          } else if (newPromoResponse.message?.text) {
            promoCode = newPromoResponse.message.text;
            logger.debug("Получен новый промокод после ошибки:", promoCode);
            await ctx.reply(`Пробуем регистрацию с новым промокодом: ${promoCode}`);
          }
        } catch (promptError) {
          logger.error("Ошибка при запросе нового промокода:", promptError);
          await ctx.reply("Произошла ошибка. Продолжаем регистрацию без промокода.");
          promoCode = "";
        }
        
      } else if (error instanceof ValidationError) {
        // Ошибка валидации данных
        await ctx.reply(`Проверка данных не пройдена: ${error.message}`);
        
        // Если есть детали ошибок, показываем их
        if (error.details) {
          let detailsMessage = "Детали ошибок:\n";
          
          for (const [field, messages] of Object.entries(error.details)) {
            let fieldMessages = "";
            
            if (Array.isArray(messages)) {
              fieldMessages = messages.join(", ");
            } else if (typeof messages === "string") {
              fieldMessages = messages;
            } else {
              fieldMessages = String(messages);
            }
            
            detailsMessage += `- ${field}: ${fieldMessages}\n`;
          }
          
          // Если проблема только с промокодом, не показываем детали ошибок
          if (Object.keys(error.details).length === 1 && 'promoCode' in error.details) {
            await ctx.reply("Введите другой промокод или нажмите 'Пропустить' для регистрации без промокода:", {
              reply_markup: getSkipKeyboard()
            });
          } else {
            // Показываем детали ошибок для других полей
            await ctx.reply(detailsMessage);
            
            // Если среди прочих ошибок есть проблема с промокодом, предлагаем изменить его
            if ('promoCode' in error.details) {
              await ctx.reply("Введите другой промокод или нажмите 'Пропустить' для регистрации без промокода:", {
                reply_markup: getSkipKeyboard()
              });
            }
          }
          
          // Если проблема с промокодом, ждем ввода нового
          if ('promoCode' in error.details) {
            try {
              const newPromoResponse = await conversation.waitFor(["message:text", "callback_query:data"]);
              
              if (newPromoResponse.callbackQuery?.data === CALLBACK_DATA.SKIP) {
                await newPromoResponse.answerCallbackQuery();
                promoCode = "";
                logger.debug("Промокод пропущен после ошибки валидации");
                await ctx.reply("Продолжаем регистрацию без промокода...");
              } else if (newPromoResponse.message?.text) {
                promoCode = newPromoResponse.message.text;
                logger.debug("Получен новый промокод после ошибки валидации:", promoCode);
                await ctx.reply(`Пробуем регистрацию с промокодом: ${promoCode}`);
              }
            } catch (promptError) {
              logger.error("Ошибка при запросе нового промокода:", promptError);
              await ctx.reply("Произошла ошибка. Продолжаем регистрацию без промокода.");
              promoCode = "";
            }
          } else if (registrationAttempts >= maxRegistrationAttempts) {
            // Если достигли максимального количества попыток
            await ctx.reply("Превышено количество попыток регистрации. Пожалуйста, попробуйте позже.");
            await showMainMenu(ctx);
            return false;
          }
        }
      } else {
        // Другие непредвиденные ошибки
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
        await ctx.reply(`Не удалось выполнить регистрацию: ${errorMessage}`);
        
        if (registrationAttempts >= maxRegistrationAttempts) {
          await ctx.reply("Превышено количество попыток регистрации. Пожалуйста, попробуйте позже.");
          await showMainMenu(ctx);
          return false;
        }
        
        await ctx.reply("Пробуем еще раз...");
      }
    }
  }
  
  if (!registrationSuccess) {
    await ctx.reply("Не удалось завершить регистрацию после нескольких попыток.");
    await showMainMenu(ctx);
  }
  
  return registrationSuccess;
} 
/**
 * Утилиты для работы с номерами телефонов
 */
import { logger } from "./logger.ts";

/**
 * Валидирует и форматирует номер телефона
 * Допустимые форматы: 9999999999, +79999999999, 79999999999, 89999999999
 * @param {string} phone Номер телефона для валидации
 * @returns {{ isValid: boolean; formattedPhone: string | null }} Результат валидации
 */
export function validateAndFormatPhone(phone: string): { 
  isValid: boolean; 
  formattedPhone: string | null;
} {
  if (!phone) {
    return {
      isValid: false,
      formattedPhone: null
    };
  }

  // Удаляем все нецифровые символы, кроме +
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  // Проверяем различные форматы
  let formattedPhone: string | null = null;
  
  // Формат: 9999999999 (только 10 цифр)
  if (/^\d{10}$/.test(cleanedPhone)) {
    formattedPhone = `7${cleanedPhone}`;
    logger.debug(`Номер в формате 10 цифр: ${cleanedPhone} -> ${formattedPhone}`);
  } 
  // Формат: +79999999999
  else if (/^\+7\d{10}$/.test(cleanedPhone)) {
    formattedPhone = cleanedPhone.substring(1); // Убираем +
    logger.debug(`Номер в формате +7: ${cleanedPhone} -> ${formattedPhone}`);
  } 
  // Формат: 79999999999
  else if (/^7\d{10}$/.test(cleanedPhone)) {
    formattedPhone = cleanedPhone;
    logger.debug(`Номер в формате 7: ${cleanedPhone} -> ${formattedPhone}`);
  } 
  // Формат: 89999999999
  else if (/^8\d{10}$/.test(cleanedPhone)) {
    formattedPhone = `7${cleanedPhone.substring(1)}`; // Заменяем 8 на 7
    logger.debug(`Номер в формате 8: ${cleanedPhone} -> ${formattedPhone}`);
  } 
  else {
    logger.warn(`Неверный формат номера: ${cleanedPhone}`);
    return {
      isValid: false,
      formattedPhone: null
    };
  }
  
  return {
    isValid: true,
    formattedPhone
  };
} 
/**
 * Утилита для загрузки переменных окружения из .env файла
 */
import { logger } from "./logger.ts";

/**
 * Загружает переменные окружения из .env файла
 * @param {string} path Путь к .env файлу
 * @returns {Promise<void>}
 */
export async function loadEnv(path = ".env"): Promise<void> {
  try {
    console.log(`Пытаемся загрузить .env файл: ${path}`);
    
    // Проверяем, существует ли файл
    try {
      const fileInfo = await Deno.stat(path);
      console.log(`.env файл найден: ${fileInfo.isFile}`);
    } catch (e) {
      console.error(`Файл ${path} не найден:`, e);
      return;
    }
    
    const text = await Deno.readTextFile(path);
    console.log(`Содержимое файла (${text.length} символов):`);
    
    const lines = text.split("\n");
    console.log(`Найдено ${lines.length} строк в файле`);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      
      if (key && value) {
        Deno.env.set(key.trim(), value.trim());
        console.log(`Установлена переменная: ${key.trim()} = ${value.trim()}`);
      }
    }
    
    // Проверяем, что переменные установлены
    console.log("Проверка переменных:");
    console.log(`BOT_TOKEN: ${Deno.env.get("BOT_TOKEN") ? "✓" : "×"}`);
    console.log(`API_KEY: ${Deno.env.get("API_KEY") ? "✓" : "×"}`);
    
    logger.info(`Переменные окружения загружены из файла: ${path}`);
  } catch (error) {
    logger.error(`Ошибка загрузки .env файла (${path}):`, error);
    logger.warn("Продолжаем работу с существующими переменными окружения");
  }
} 
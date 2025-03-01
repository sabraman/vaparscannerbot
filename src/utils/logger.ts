/**
 * Модуль для логирования сообщений
 */
import { config } from "../config/index.ts";

/**
 * Типы уровней логирования
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Возвращает строку с текущей временной меткой
 */
const timestamp = (): string => `[${new Date().toISOString()}]`;

/**
 * Проверяет, должно ли сообщение с данным уровнем быть залогировано
 * @param level Уровень сообщения для проверки
 */
function shouldLog(level: LogLevel): boolean {
  const configLevel = config.logger.logLevel;
  
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  return levels[level] >= levels[configLevel as LogLevel];
}

/**
 * Сохраняет сообщение в файл лога (если настроено)
 * @param level Уровень сообщения
 * @param message Сообщение для логирования
 * @param args Дополнительные аргументы
 */
async function logToFile(level: LogLevel, message: string, ...args: unknown[]): Promise<void> {
  if (!config.logger.logToFile) return;
  
  try {
    const logDir = "./logs";
    const date = new Date().toISOString().split("T")[0];
    const logFile = `${logDir}/${date}.log`;
    
    // Создаем директорию логов, если она не существует
    try {
      await Deno.mkdir(logDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
    
    // Форматируем сообщение для записи в файл
    const argsStr = args.length > 0 ? JSON.stringify(args) : '';
    const logMessage = `${timestamp()} [${level.toUpperCase()}] ${message} ${argsStr}\n`;
    
    // Добавляем сообщение в файл логов
    await Deno.writeTextFile(logFile, logMessage, { append: true });
  } catch (error) {
    console.error(`Ошибка записи в лог-файл: ${error}`);
  }
}

/**
 * Объект логгера с методами для разных уровней логирования
 */
export const logger = {
  /**
   * Логирует отладочное сообщение (только если включен режим отладки)
   * @param message Сообщение для логирования
   * @param args Дополнительные данные
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (!shouldLog("debug")) return;
    
    console.debug(`${timestamp()} [DEBUG] ${message}`, ...args);
    logToFile("debug", message, ...args);
  },

  /**
   * Логирует информационное сообщение
   * @param message Сообщение для логирования
   * @param args Дополнительные данные
   */
  info: (message: string, ...args: unknown[]): void => {
    if (!shouldLog("info")) return;
    
    console.log(`${timestamp()} [INFO] ${message}`, ...args);
    logToFile("info", message, ...args);
  },

  /**
   * Логирует предупреждение
   * @param message Сообщение для логирования
   * @param args Дополнительные данные
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (!shouldLog("warn")) return;
    
    console.warn(`${timestamp()} [WARN] ${message}`, ...args);
    logToFile("warn", message, ...args);
  },

  /**
   * Логирует ошибку
   * @param message Сообщение для логирования
   * @param args Дополнительные данные
   */
  error: (message: string, ...args: unknown[]): void => {
    if (!shouldLog("error")) return;
    
    console.error(`${timestamp()} [ERROR] ${message}`, ...args);
    logToFile("error", message, ...args);
  }
}; 
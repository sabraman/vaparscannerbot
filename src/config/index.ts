/**
 * Конфигурация приложения
 */

/**
 * Проверка наличия всех необходимых переменных окружения
 * @param envVars Список необходимых переменных
 * @throws Error если какая-либо из необходимых переменных отсутствует
 */
export function validateEnvVars(envVars: string[]): void {
  const missingVars = envVars.filter(v => !Deno.env.get(v));
  if (missingVars.length > 0) {
    throw new Error(`Отсутствуют обязательные переменные окружения: ${missingVars.join(', ')}`);
  }
}

// Список необходимых переменных окружения
const requiredEnvVars = [
  "BOT_TOKEN",
  "API_KEY",
  "API_BASE_URL",
  "API_ENDPOINT_USERS",
  "API_ENDPOINT_REGISTER",
  "WEBHOOK_BASE_URL"
];

// Создаем конфигурацию, которая будет обновляться при запросе
export const config = {
  // Конфигурация бота
  get bot() {
    return {
      version: "1.0.0",
      requiredEnvVars,
      token: Deno.env.get("BOT_TOKEN") ?? "",
    };
  },
  // Конфигурация API
  get api() {
    return {
      baseUrl: Deno.env.get("API_BASE_URL") ?? "",
      endpoints: {
        getUsers: Deno.env.get("API_ENDPOINT_USERS") ?? "",
        userRegister: Deno.env.get("API_ENDPOINT_REGISTER") ?? "",
      },
      apiKey: Deno.env.get("API_KEY") ?? ""
    };
  },
  // Конфигурация webhook
  get webhook() {
    return {
      baseUrl: Deno.env.get("WEBHOOK_BASE_URL") ?? ""
    };
  },
  // Конфигурация логгера
  get logger() {
    return {
      debug: Boolean(Deno.env.get("DEBUG")) || false,
      logToFile: Boolean(Deno.env.get("LOG_TO_FILE")) || false,
      logLevel: Deno.env.get("LOG_LEVEL") || "info", // debug, info, warn, error
    };
  }
}; 
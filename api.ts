import { config } from "./config.ts";
import { logger } from "./logger.ts";
import type { UserResponse, RegisterResponse } from "./types.ts";

export const api = {
  async searchByPhone(phone: string): Promise<UserResponse> {
    logger.info("Поиск пользователя по номеру:", phone);
    
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.getUsers}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: config.api.apiKey,
        limit: 1,
        phone: phone,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Ошибка поиска:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logger.debug("Результат поиска:", data);
    return data;
  },

  async registerUser(
    phone: string,
    firstName: string,
    lastName: string,
    bDate: string,
    promoCode = ""
  ): Promise<RegisterResponse> {
    logger.info("Регистрация клиента:", { 
      phone, 
      firstName: firstName || '<пусто>', 
      lastName: lastName || '<пусто>', 
      bDate,
      promoCode: promoCode || '<пусто>'
    });

    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.userRegister}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        firstName,
        lastName,
        bDate,
        promoCode,
        token: "",
      }),
    });

    const data = await response.json();
    logger.debug("Результат регистрации:", data);

    if (!response.ok || data.status === "error") {
      const errorMessage = data.message || `Ошибка HTTP: ${response.status}`;
      logger.error("Ошибка регистрации:", errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  }
}; 
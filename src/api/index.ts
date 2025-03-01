/**
 * API сервис для взаимодействия с внешними сервисами
 */
import { config } from "../config/index.ts";
import { logger } from "../utils/logger.ts";
import type { UserResponse, RegisterResponse, ManagerResponse, BonusResponse, OperationsResult } from "../types/index.ts";

// Создаю специальный класс ошибки для проблем с промокодом
export class PromoCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoCodeError";
  }
}

// Создаю специальный класс ошибки для проблем валидации
export class ValidationError extends Error {
  public details?: Record<string, string[]>;
  
  constructor(message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Базовый класс для API запросов
 */
class ApiService {
  /**
   * Выполняет POST запрос к API
   * @param {string} endpoint Конечная точка API
   * @param {unknown} data Данные для отправки
   * @returns {Promise<T>} Результат запроса
   * @throws {Error} Если запрос завершился с ошибкой
   */
  protected async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${config.api.baseUrl}${endpoint}`;
    logger.debug(`POST запрос к ${url}`, data);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Ошибка запроса: ${response.status}`, errorText);
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const responseData = await response.json();
    logger.debug(`Ответ от ${url}:`, responseData);
    return responseData as T;
  }
}

/**
 * Класс для работы с API пользователей
 */
class UserApiService extends ApiService {
  /**
   * Поиск пользователя по номеру телефона
   * @param {string} phone Номер телефона для поиска
   * @returns {Promise<UserResponse>} Информация о пользователе
   */
  async searchByPhone(phone: string): Promise<UserResponse> {
    logger.info("Поиск пользователя по номеру:", phone);
    
    return await this.post<UserResponse>(config.api.endpoints.getUsers, {
      api_key: config.api.apiKey,
      limit: 1,
      phone: phone,
    });
  }

  /**
   * Регистрация нового пользователя
   * @param {string} phone Номер телефона
   * @param {string} firstName Имя пользователя
   * @param {string} lastName Фамилия пользователя
   * @param {string} bDate Дата рождения в формате YYYY-MM-DD
   * @param {string} promoCode Промокод (опционально)
   * @returns {Promise<RegisterResponse>} Результат регистрации
   * @throws {Error} Если регистрация завершилась с ошибкой
   * @throws {PromoCodeError} Если проблема с промокодом
   * @throws {ValidationError} Если данные не прошли валидацию
   */
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

    const data = await this.post<RegisterResponse>(config.api.endpoints.userRegister, {
      phone,
      firstName,
      lastName,
      bDate,
      promoCode,
      token: "",
    });

    if (data.status === "error") {
      const errorMessage = data.message || "Неизвестная ошибка регистрации";
      logger.error("Ошибка регистрации:", errorMessage);
      
      // Проверяем наличие деталей валидации
      if (data.details?.validation) {
        const validationDetails = data.details.validation;
        
        // Проверяем, есть ли проблема с промокодом
        if (validationDetails.promoCode) {
          let promoError: string;
          
          // Проверяем, является ли promoCode массивом
          if (Array.isArray(validationDetails.promoCode)) {
            promoError = validationDetails.promoCode.join(", ");
          } else if (typeof validationDetails.promoCode === "string") {
            promoError = validationDetails.promoCode;
          } else {
            // Для других типов конвертируем в строку
            promoError = String(validationDetails.promoCode);
          }
          
          logger.error("Ошибка промокода:", promoError);
          throw new PromoCodeError(promoError);
        }
        
        // Другие ошибки валидации
        throw new ValidationError(errorMessage, validationDetails);
      }
      
      throw new Error(errorMessage);
    }

    return data;
  }
}

/**
 * Класс для работы с API менеджеров
 */
class ManagerApiService extends ApiService {
  /**
   * Получение списка менеджеров
   * @returns {Promise<ManagerResponse>} Список менеджеров
   */
  async getManagers(): Promise<ManagerResponse> {
   await logger.info("Получение списка менеджеров");
    
    return this.post<ManagerResponse>("/rest/mobile/v44-admin/managers", {
      "api.admin.key": config.api.apiKey,
      "limit": 500
    });
  }

  /**
   * Получение списка бонусов для менеджера
   * @param {string} managerId ID менеджера
   * @param {string} dateStart Дата начала в формате YYYY-MM-DD
   * @param {string} dateEnd Дата окончания в формате YYYY-MM-DD
   * @returns {Promise<BonusResponse>} Список бонусов
   */
  async getBonusList(managerId: string, dateStart: string, dateEnd: string): Promise<BonusResponse> {
   await logger.info("Получение списка бонусов для менеджера:", { managerId, dateStart, dateEnd });
    
    return this.post<BonusResponse>("/rest/base/v33/validator/bonus-list", {
      api_key: config.api.apiKey,
      date_start: dateStart,
      dateEnd: dateEnd,
      id_manager: managerId
    });
  }

  /**
   * Расчет количества операций для менеджера
   * @param {string} managerId ID менеджера
   * @param {string} dateStart Дата начала в формате YYYY-MM-DD
   * @param {string} dateEnd Дата окончания в формате YYYY-MM-DD
   * @returns {Promise<OperationsResult>} Результат расчета операций
   */
  async calculateOperations(managerId: string, dateStart: string, dateEnd: string): Promise<OperationsResult> {
    const { bonus_list } = await this.getBonusList(managerId, dateStart, dateEnd);
    
    // Сортируем по дате и ID для правильного сопоставления пар
    const sortedBonuses = [...bonus_list].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return Number(a.id_bonus) - Number(b.id_bonus);
      }
      return dateCompare;
    });

    let totalOperations = 0;
    let registrations = 0;
    let usages = 0;

    // Проходим по списку и ищем пары операций
    for (let i = 0; i < sortedBonuses.length; i++) {
      const current = sortedBonuses[i];
      const next = i < sortedBonuses.length - 1 ? sortedBonuses[i + 1] : null;

      // Проверяем пару операций для регистрации (-100 и следующая операция)
      if (
        next &&
        current.value === "-100" && 
        current.order_price === "0.00" &&
        Number(next.value) > 0
      ) {
        registrations++;
        totalOperations++;
        i++; // Пропускаем следующую операцию, так как она уже учтена
        continue;
      }

      // Проверяем пару операций для использования (списание-начисление)
      if (
        next &&
        Number(current.value) < 0 && 
        current.order_price === "0.00" &&
        Number(next.value) > 0 &&
        Number(next.order_price) > 0
      ) {
        usages++;
        totalOperations++;
        i++; // Пропускаем следующую операцию, так как она уже учтена
      }
      // Проверяем одиночное начисление
      else if (
        Number(current.value) > 0 &&
        Number(current.order_price) > 0
      ) {
        usages++;
        totalOperations++;
      }
    }

    return {
      totalOperations,
      registrations,
      usages
    };
  }
}

// Создаем экземпляры классов
const userApi = new UserApiService();
const managerApi = new ManagerApiService();

// API для экспорта
export const api = {
  // User API
  searchByPhone: userApi.searchByPhone.bind(userApi),
  registerUser: userApi.registerUser.bind(userApi),
  
  // Manager API
  getManagers: managerApi.getManagers.bind(managerApi),
  getBonusList: managerApi.getBonusList.bind(managerApi),
  calculateOperations: managerApi.calculateOperations.bind(managerApi),
}; 
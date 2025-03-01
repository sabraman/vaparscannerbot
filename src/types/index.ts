/**
 * Типы данных для API ответов
 */

/**
 * Ответ от API для информации о пользователе
 */
export interface UserResponse {
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

/**
 * Ответ от API при регистрации пользователя
 */
export interface RegisterResponse {
  status: string;
  message?: string;
  androidUrl?: string;
  iosUrl?: string;
  authToken?: string;
  details?: {
    validation?: Record<string, string[]>;
  };
}

/**
 * Ответ от API со списком менеджеров
 */
export interface ManagerResponse {
  managers: Array<{
    idManager: string;
    managerName: string;
  }>;
}

/**
 * Ответ от API со списком бонусов
 */
export interface BonusResponse {
  bonus_list: Array<{
    id_bonus: string;
    value: string;
    order_price: string;
    invoice_num: string;
    date: string;
    isDeleted: boolean;
    branch: {
      id_branch: string;
      name: string;
    };
    client: {
      id_client: string;
      id_device: string;
      name: string;
      login: string;
    };
    manager: {
      id_manager: string;
      name: string;
      login: string;
    };
    gift: Array<unknown>;
  }>;
}

/**
 * Структура сессионных данных для контекста
 */
export interface SessionData {
  __conversations: Record<string, unknown>;
  defaultManagerName?: string;
}

/**
 * Результат расчета операций для менеджера
 */
export interface OperationsResult {
  totalOperations: number;
  registrations: number;
  usages: number;
} 
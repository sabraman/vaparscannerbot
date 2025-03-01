/**
 * Сервис для аналитики и работы с менеджерами
 */
import { api } from "../api/index.ts";
import { logger } from "../utils/logger.ts";
import { getCurrentDateForApi } from "../utils/date.ts";
import type { MyContext } from "../bot/context.ts";
import type { OperationsResult } from "../types/index.ts";

/**
 * Сервис для аналитики и работы с менеджерами
 */
export const analyticsService = {
  /**
   * Получает статистику по менеджерам за выбранный день
   * @param {string} date Дата в формате YYYY-MM-DD, по умолчанию - текущая дата
   * @returns {Promise<Array<{id: string, name: string, stats: OperationsResult}>>} Список менеджеров с их статистикой
   */
  async getManagersStats(
    date = getCurrentDateForApi()
  ): Promise<Array<{id: string, name: string, stats: OperationsResult}>> {
    logger.info(`Получение статистики по менеджерам за дату: ${date}`);
    
    try {
      // Получаем список всех менеджеров
      const { managers } = await api.getManagers();
      logger.debug(`Получено ${managers.length} менеджеров`);
      
      // Получаем статистику для каждого менеджера
      const managersWithStats = await Promise.all(
        managers.map(async (manager) => {
          try {
            const stats = await api.calculateOperations(
              manager.idManager,
              date, // Дата начала
              date  // Дата окончания
            );
            
            return {
              id: manager.idManager,
              name: manager.managerName,
              stats
            };
          } catch (error) {
            logger.error(`Ошибка получения статистики для менеджера ${manager.idManager}:`, error);
            return {
              id: manager.idManager,
              name: manager.managerName,
              stats: { totalOperations: 0, registrations: 0, usages: 0 }
            };
          }
        })
      );
      
      // Сортируем по общему количеству операций
      return managersWithStats.sort((a, b) => {
        const aTotal = a.stats.registrations + a.stats.usages;
        const bTotal = b.stats.registrations + b.stats.usages;
        return bTotal - aTotal;
      });
    } catch (error) {
      logger.error("Ошибка при получении статистики по менеджерам:", error);
      return [];
    }
  },
  
  /**
   * Поиск менеджеров по имени с размытым поиском
   * @param {Array<{id: string, name: string, stats: OperationsResult}>} managers Список менеджеров
   * @param {string} query Строка поиска
   * @returns {Array<{id: string, name: string, stats: OperationsResult}>} Отфильтрованный список менеджеров
   */
  filterManagers(
    managers: Array<{id: string, name: string, stats: OperationsResult}>,
    query: string
  ): Array<{id: string, name: string, stats: OperationsResult}> {
    if (!query.trim()) {
      return managers;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return managers.filter(manager => 
      manager.name.toLowerCase().includes(normalizedQuery)
    );
  },
  
  /**
   * Сохраняет менеджера по умолчанию в сессии пользователя
   * @param {MyContext} ctx Контекст бота
   * @param {string} managerName Имя менеджера
   */
  saveDefaultManager(ctx: MyContext, managerName: string): void {
    logger.info(`Сохранение менеджера по умолчанию: ${managerName}`);
    ctx.session.defaultManagerName = managerName;
  },
  
  /**
   * Сохраняет менеджера по умолчанию в сессии пользователя по его ID
   * @param {MyContext} ctx Контекст бота
   * @param {string} managerId ID менеджера
   * @returns {Promise<boolean>} true если менеджер найден и сохранен
   */
  async saveDefaultManagerById(ctx: MyContext, managerId: string): Promise<boolean> {
    logger.info(`Поиск и сохранение менеджера по умолчанию по ID: ${managerId}`);
    
    try {
      // Получаем список всех менеджеров
      const { managers } = await api.getManagers();
      
      // Ищем менеджера по ID
      const manager = managers.find(m => m.idManager === managerId);
      
      if (manager) {
        ctx.session.defaultManagerName = manager.managerName;
        logger.info(`Менеджер по умолчанию сохранен: ${manager.managerName}`);
        return true;
      }
      
      logger.warn(`Менеджер с ID ${managerId} не найден`);
      return false;
    } catch (error) {
      logger.error(`Ошибка при сохранении менеджера по ID ${managerId}:`, error);
      return false;
    }
  },
  
  /**
   * Получает менеджера по умолчанию из сессии пользователя
   * @param {MyContext} ctx Контекст бота
   * @returns {string|undefined} Имя менеджера или undefined если не установлен
   */
  getDefaultManager(ctx: MyContext): string | undefined {
    return ctx.session.defaultManagerName;
  }
}; 
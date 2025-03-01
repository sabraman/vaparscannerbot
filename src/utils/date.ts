/**
 * Утилиты для работы с датами
 */

/**
 * Возвращает минимальную дату рождения для клиентов (18 лет)
 * @returns {Date} Минимальная допустимая дата рождения
 */
export function getMinimumBirthDate(): Date {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  today.setDate(today.getDate() - 1);
  return today;
}

/**
 * Форматирует дату в формат, требуемый API (YYYY-MM-DD)
 * @param {Date} date Дата для форматирования
 * @returns {string} Отформатированная дата в формате YYYY-MM-DD
 */
export function formatDateForApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Конвертирует пользовательскую дату из формата ДД.ММ.ГГГГ в формат API YYYY-MM-DD
 * @param {string} userDate Пользовательская дата в формате ДД.ММ.ГГГГ
 * @returns {string} Дата в формате YYYY-MM-DD
 * @throws {Error} Если формат даты неверный или дата не существует
 */
export function convertDate(userDate: string): string {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = userDate.match(dateRegex);
  
  if (!match) {
    throw new Error("Неверный формат даты. Используйте формат ДД.ММ.ГГГГ (например, 25.12.2000)");
  }
  
  const [_, day, month, year] = match;
  
  // Проверяем валидность даты
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getDate() !== Number(day) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getFullYear() !== Number(year)
  ) {
    throw new Error("Указана несуществующая дата");
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * Валидирует дату рождения на соответствие формату и минимальному возрасту
 * @param {string} dateStr Строка с датой рождения в формате ДД.ММ.ГГГГ
 * @returns {boolean} true если дата валидна
 * @throws {Error} Если формат даты неверный или возраст меньше 18 лет
 */
export function validateBirthDate(dateStr: string): boolean {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = dateStr.match(dateRegex);
  
  if (!match) {
    throw new Error("Неверный формат даты. Используйте формат ДД.ММ.ГГГГ (например, 25.12.2000)");
  }
  
  const [_, day, month, year] = match;
  
  // Проверяем валидность даты
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getDate() !== Number(day) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getFullYear() !== Number(year)
  ) {
    throw new Error("Указана несуществующая дата");
  }
  
  // Проверяем минимальный возраст
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const minDate = getMinimumBirthDate();
  
  if (birthDate > minDate) {
    throw new Error("Клиент должен быть старше 18 лет");
  }
  
  return true;
}

/**
 * Получает текущую дату в формате, требуемом API (YYYY-MM-DD)
 * @returns {string} Текущая дата в формате YYYY-MM-DD
 */
export function getCurrentDateForApi(): string {
  return formatDateForApi(new Date());
} 
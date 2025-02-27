export function getMinimumBirthDate(): Date {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  today.setDate(today.getDate() - 1);
  return today;
}

export function formatDateForApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function convertDate(userDate: string): string {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = userDate.match(dateRegex);
  
  if (!match) {
    throw new Error("Неверный формат даты. Используйте формат ДД.ММ.ГГГГ (например, 25.12.2000)");
  }
  
  const [_, day, month, year] = match;
  
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

export function validateBirthDate(dateStr: string): boolean {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = dateStr.match(dateRegex);
  
  if (!match) {
    throw new Error("Неверный формат даты. Используйте формат ДД.ММ.ГГГГ (например, 25.12.2000)");
  }
  
  const [_, day, month, year] = match;
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const minDate = getMinimumBirthDate();
  
  if (birthDate > minDate) {
    throw new Error("Клиент должен быть старше 18 лет");
  }
  
  return true;
} 
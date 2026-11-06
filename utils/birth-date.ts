// Give native pickers an explicit lower bound so Android never defaults to epoch.
export const NATIVE_BIRTH_DATE_MINIMUM = new Date(1900, 0, 1);

export function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date | undefined {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && formatLocalDate(date) === value ? date : undefined;
}

export function latestAdultBirthDate(today = new Date()): Date {
  const month = today.getMonth();
  const year = today.getFullYear() - 18;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(today.getDate(), lastDay));
}

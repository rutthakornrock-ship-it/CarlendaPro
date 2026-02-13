
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST'
}

export interface UserProfile {
  email: string;
  name: string;
  photoUrl?: string;
  role: UserRole;
  usageDaysLeft?: number;
}

export interface CalendarAlerts {
  oneDayBefore: boolean;
  twoHoursBefore: boolean;
}

export interface CalendarTask {
  id: string;
  email: string;
  date: string; // ISO format YYYY-MM-DD
  time?: string; // HH:mm format
  content: string;
  isCompleted: boolean;
  isHoliday: boolean;
  alerts?: CalendarAlerts;
}

export interface Promotion {
  code: string;
  usageDays: number;
  discountPercent: number;
}

export interface GoogleSheetsData {
  admins: string[][];
  customers: string[][];
  promotions: string[][];
  calendarData: string[][];
}

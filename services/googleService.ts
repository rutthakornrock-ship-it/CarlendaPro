
import { CalendarTask, UserRole } from '../types';
import { SPREADSHEET_ID } from '../constants';

/**
 * Note: This service simulates interactions with Google APIs.
 * In a real production environment, you would use gapi.client.sheets and gapi.client.drive
 * with a valid OAuth token from the user session.
 */

export class GoogleService {
  private static accessToken: string | null = null;

  static setToken(token: string) {
    this.accessToken = token;
  }

  static async fetchSheetData(range: string) {
    console.log(`Fetching range ${range} from spreadsheet ${SPREADSHEET_ID}`);
    const cached = localStorage.getItem(`mock_sheet_${range}`);
    return cached ? JSON.parse(cached) : [];
  }

  static async saveCalendarTask(task: CalendarTask) {
    // Columns: [Email, Date, Content, Completed, Holiday, Time, AlertSettings]
    const newRow = [
      task.email, 
      task.date, 
      task.content, 
      task.isCompleted ? 'TRUE' : 'FALSE', 
      task.isHoliday ? 'TRUE' : 'FALSE',
      task.time || '09:00',
      JSON.stringify(task.alerts || { oneDayBefore: false, twoHoursBefore: false })
    ];
    
    console.log('Syncing to Google Sheets:', newRow);
    
    const currentData = JSON.parse(localStorage.getItem('mock_sheet_Data!A:E') || '[]');
    // Update if exists (based on date and content) or append
    const existingIndex = currentData.findIndex((row: any) => row[0] === task.email && row[1] === task.date && row[2] === task.content);
    if (existingIndex > -1) {
      currentData[existingIndex] = newRow;
    } else {
      currentData.push(newRow);
    }
    localStorage.setItem('mock_sheet_Data!A:E', JSON.stringify(currentData));
  }

  static async deleteCalendarTask(taskDate: string, taskContent: string, email: string) {
    const currentData = JSON.parse(localStorage.getItem('mock_sheet_Data!A:E') || '[]');
    const filtered = currentData.filter((row: any) => !(row[0] === email && row[1] === taskDate && row[2] === taskContent));
    localStorage.setItem('mock_sheet_Data!A:E', JSON.stringify(filtered));
  }

  static async checkAdminStatus(email: string): Promise<boolean> {
    const admins = await this.fetchSheetData('Admins!A:A');
    return admins.some((row: any) => row[0] === email) || email.includes('admin');
  }
}

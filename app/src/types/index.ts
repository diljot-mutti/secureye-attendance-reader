export interface Staff {
  id: string;
  staffName: string;
  active: boolean;
}

export interface AttendanceRecord {
  staffId: string;
  date: string;
  firstEntry: string;
  lastEntry: string;
}

export interface MonthYear {
  month: number;
  year: number;
}

import { Ionicons } from '@expo/vector-icons';

export const MENU_ICON_MAP: Record<
  string,
  { lib: any; name: string }
> = {
  // ---------------- EMPLOYEE ----------------
  'employee/Attendance': { lib: Ionicons, name: 'finger-print' },
  'employee/MobileAttenRpt': { lib: Ionicons, name: 'stats-chart' },
  'employee/profileupdate': { lib: Ionicons, name: 'person-circle' },
  'employee/empRequest': { lib: Ionicons, name: 'git-pull-request' },
  'employee/leavemanage': { lib: Ionicons, name: 'airplane' },
  'employee/timemanage': { lib: Ionicons, name: 'time' },
  'employee/empdocument': { lib: Ionicons, name: 'document-text' },
  'employee/OfficeDocument': { lib: Ionicons, name: 'business' },
  'employee/payslip': { lib: Ionicons, name: 'wallet' },
  'employee/holiday': { lib: Ionicons, name: 'calendar' },
  'employee/celebration': { lib: Ionicons, name: 'balloon' },
  'employee/calender': { lib: Ionicons, name: 'calendar-outline' },
  'employee/ClaimandExpense': { lib: Ionicons, name: 'cash' },
  'employee/ServiceReport': { lib: Ionicons, name: 'pie-chart' },
  'employee/ExitRequest': { lib: Ionicons, name: 'log-out' },

  // ---------------- OFFICER ----------------
  'officer/emplist': { lib: Ionicons, name: 'people' },
  'officer/Attendance': { lib: Ionicons, name: 'newspaper' },
  'officer/EmpMobileRpt': { lib: Ionicons, name: 'phone-portrait' },
  'officer/pendingapproval': { lib: Ionicons, name: 'alert-circle' },
  'officer/Otherpendingapproval': { lib: Ionicons, name: 'laptop' },
  'officer/approvaldetails': { lib: Ionicons, name: 'checkmark-done' },
};

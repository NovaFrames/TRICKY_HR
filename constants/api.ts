export const API_ENDPOINTS = {
  // Base URL
  CompanyUrl: "https://hr.trickyhr.com",

  // Authentication
  LOGIN: "/WebApi/Login",

  REFRESH_LOGIN: "/WebApi/RefreshLogin",

  // Attendance
  INSERT_MOBILE_ATTENDANCE: "/WebApi/InsertMobileAtten",

  ATTENDANCE_LIST: "/WebApi/GetEmployee_AttendanceList",

  ATTENDANCE_REPORT: "/WebApi/GetMobileAttenRpt",

  // Projects
  GET_PROJECT_LIST: "/WebApi/GetProjectList",

  // General
  SERVER_TIME: "/WebApi/GetServerTime",

  // Holidays
  HOLIDAY: "/WebApi/GetHolidayList",

  // Celebrations
  CELEBRATION: "/WebApi/GetTodayCelebration",

  // Leave Management
  GET_LEAVE_DETAILS: "/WebApi/GetEmpLeaveApplyDtlById",

  GET_LEAVE_MANAGE: "/WebApi/GetEmpLeaveManageById",

  GET_LEAVE_BALANCE: "/WebApi/GetEmpLeaveBalanceByEmpId",

  GET_SURRENDER_BALANCE: "/WebApi/GetEmpLVSurrenderBalance",

  GET_SURRENDER_DETAILS: "/WebApi/GetEmpLvSurrenderById",

  GET_DELETE_APPLY: "/WebApi/GetDeletApply",

  // Leave Operations
  APPLY_LEAVE: "/WebApi/UpdateEmpLeaveApply",

  SUBMIT_SURRENDER: "/WebApi/UpdateEmpSurrender",


  // Medical Documents
  UPLOAD_MEDICAL_DOC: "/WebApi/UploadMedicalDoc",

  // Manager Approvals
  GET_PENDING_LEAVES: "/WebApi/GetSup_LeaveManageById",

  GET_PENDING_SURRENDERS: "/WebApi/GetSup_LVSurrenderById",

  SAVE_APPROVAL: "/WebApi/SaveApproval_Supervisor",

  // Employee Info
  GET_PROFILE: "/WebApi/GetEmpProfile",

  GET_PENDING_LIST: "/WebApi/GetPendingApprove_YourList",

  GET_EMP_REQUEST_STATUS: "/WebApi/GetEmpRequestStatus",

  // Time Management
  GET_TIME_MANAGE_LIST: "/WebApi/GetEmpTimeManage",

  UPDATE_TIME: "/WebApi/UpdateEmpTimeManage",

  DOWNLOAD_REPORT: "/WebApi/PrintMonthlyReport",

  // Uploaded Documents
  GET_UPLOADED_DOCUMENTS: "/WebApi/GetEmpDocumentShow",

  UPLOAD_DOCUMENT: "/WebApi/SaveEmpPortalDocument",

  // Office Documents
  GET_OFFICE_DOCUMENTS: "/WebApi/GetEmpDocumentsGridList",

  // Payslip
  GET_PAYSLIP_LIST: "/WebApi/GetEmpPaySalList",

  DOWNLOAD_PAYSLIP: "/WebApi/DownloadEmpPaySlip",

  // Calendar
  GET_CALENDAR_EVENTS: "/WebApi/GetLeaveCalender",

  GET_CALENDAR_DETAILS: "/WebApi/GetLeaveCalenderDtl",

  // Employee List
  GET_EMPLOYEE_LIST: "/WebApi/GetSup_EmployeeList",

  // Attendance Report
  GET_MOBILE_ATTENDANCE_REPORT: "/WebApi/GetMobileAttenRpt",

  // Service Report
  GET_CLIENT_LIST: "/WebApi/GetService_ClientList",

  SUBMIT_SERVICE_REPORT: "/WebApi/Update_StatusRpt",

  // Pending Approvals
  GET_YOUR_PENDING_APPROVALS: "/WebApi/GetPendingApprove_YourList",

  GET_OTHER_PENDING_APPROVALS: "/WebApi/GetPendingApprove_OtherList",

  UPDATE_PENDING_APPROVAL: "/WebApi/UpdatePendingApproval",

  PEND_TIMEMNG_URL: "/WebApi/GetSup_TimeManageById",
  PEND_CLAIM_URL: "/WebApi/GetSup_ClaimById",

  // Approval Details
  SUP_DETAPPROVE_URL: "/WebApi/GetApprovaledDetails",
};

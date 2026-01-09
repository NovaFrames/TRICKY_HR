export const API_ENDPOINTS = {
  // Base URL
  CompanyUrl: "https://hr.trickyhr.com",

  // Authentication
  LOGIN: "/WebApi2/Login",

  REFRESH_LOGIN: "/WebApi2/RefreshLogin",

  // Attendance
  INSERT_MOBILE_ATTENDANCE: "/WebApi2/InsertMobileAtten",

  ATTENDANCE_LIST: "/WebApi2/GetEmployee_AttendanceList",

  ATTENDANCE_REPORT: "/WebApi2/GetMobileAttenRpt",

  // Projects
  GET_PROJECT_LIST: "/WebApi2/GetProjectList",

  // General
  SERVER_TIME: "/WebApi2/GetServerTime",

  // Holidays
  HOLIDAY: "/WebApi2/GetHolidayList",

  // Celebrations
  CELEBRATION: "/WebApi2/GetTodayCelebration",

  // Leave Management
  GET_LEAVE_DETAILS: "/WebApi2/GetEmpLeaveApplyDtlById",

  GET_LEAVE_BALANCE_DETAILS: "/WebApi2/GetLeaveBalanceDtlById",

  GET_LEAVE_MANAGE: "/WebApi2/GetEmpLeaveManageById",

  GET_LEAVE_BALANCE: "/WebApi2/GetEmpLeaveBalanceByEmpId",

  GET_SURRENDER_BALANCE: "/WebApi2/GetEmpLVSurrenderBalance",

  GET_SURRENDER_DETAILS: "/WebApi2/GetEmpLvSurrenderById",

  GET_DELETE_APPLY: "/WebApi2/GetDeletApply",

  // Leave Operations
  APPLY_LEAVE: "/WebApi2/UpdateEmpLeaveApply",

  SUBMIT_SURRENDER: "/WebApi2/UpdateEmpSurrender",


  // Medical Documents
  UPLOAD_MEDICAL_DOC: "/WebApi2/UploadMedicalDoc",

  // Manager Approvals
  GET_PENDING_LEAVES: "/WebApi2/GetSup_LeaveManageById",

  GET_PENDING_SURRENDERS: "/WebApi2/GetSup_LVSurrenderById",

  SAVE_APPROVAL: "/WebApi2/SaveApproval_Supervisor",

  // Employee Info
  GET_PROFILE: "/WebApi2/GetEmpProfile",

  GET_PENDING_LIST: "/WebApi2/GetPendingApprove_YourList",

  GET_EMP_REQUEST_STATUS: "/WebApi2/GetEmpRequestStatus",

  // Time Management
  GET_TIME_MANAGE_LIST: "/WebApi2/GetEmpTimeManage",

  UPDATE_TIME: "/WebApi2/UpdateEmpTimeManage",

  DOWNLOAD_REPORT: "/WebApi2/PrintMonthlyReport",

  // Uploaded Documents
  GET_UPLOADED_DOCUMENTS: "/WebApi2/GetEmpDocumentShow",

  UPLOAD_DOCUMENT: "/WebApi2/SaveEmpPortalDocument",

  // Office Documents
  GET_OFFICE_DOCUMENTS: "/WebApi2/GetEmpDocumentsGridList",

  // Payslip
  GET_PAYSLIP_LIST: "/WebApi2/GetEmpPaySalList",

  DOWNLOAD_PAYSLIP: "/WebApi2/DownloadEmpPaySlip",

  // Calendar
  GET_CALENDAR_EVENTS: "/WebApi2/GetLeaveCalender",

  GET_CALENDAR_DETAILS: "/WebApi2/GetLeaveCalenderDtl",

  // Employee List
  GET_EMPLOYEE_LIST: "/WebApi2/GetSup_EmployeeList",

  // Attendance Report
  GET_MOBILE_ATTENDANCE_REPORT: "/WebApi2/GetMobileAttenRpt",

  // Service Report
  GET_CLIENT_LIST: "/WebApi2/GetService_ClientList",

  SUBMIT_SERVICE_REPORT: "/WebApi2/Update_StatusRpt",

  // Pending Approvals
  GET_YOUR_PENDING_APPROVALS: "/WebApi2/GetPendingApprove_YourList",

  GET_OTHER_PENDING_APPROVALS: "/WebApi2/GetPendingApprove_OtherList",

  UPDATE_PENDING_APPROVAL: "/WebApi2/UpdatePendingApproval",

  PEND_TIMEMNG_URL: "/WebApi2/GetSup_TimeManageById",
  PEND_CLAIM_URL: "/WebApi2/GetSup_ClaimById",
  PEND_DOC_URL: "/WebApi2/GetSup_EmpDocumentById",
  PEND_PROFILE_URL: "/WebApi2/GetSup_EmpProfileByEmpId",
  

  // Approval Details
  SUP_DETAPPROVE_URL: "/WebApi2/GetApprovaledDetails",
  SUP_GETREJECT_URL: "/WebApi2/GetApproval_RejectedDetails",
};

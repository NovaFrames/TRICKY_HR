# Request Cancellation Troubleshooting Guide

## Issue
Cannot cancel the request when clicking the "Cancel Request" button.

## Recent Improvements Made

### 1. Enhanced API Method (`ApiService.deleteRequest`)
- ✅ **String Conversion**: RequestID is now converted to string (`String(requestId)`)
- ✅ **Better Token Validation**: Checks if token exists before making the request
- ✅ **Enhanced Error Logging**: Logs detailed error information including:
  - Request payload
  - Request endpoint
  - Response status
  - Response data
  - Error details (status, data, headers)
- ✅ **Multiple Error Checks**: Checks for `Error`, `Message`, `error`, and `message` fields
- ✅ **Network Error Handling**: Distinguishes between server errors, network errors, and other errors

### 2. Enhanced Modal Handler (`RequestModal.handleCancelRequest`)
- ✅ **Multiple ID Field Support**: Checks `item.IdN`, `item.Id`, and `item.id`
- ✅ **Debug Logging**: Logs the entire item object and request ID
- ✅ **Better Error Messages**: More descriptive error messages for users
- ✅ **Result Logging**: Logs the API response for debugging

## How to Debug

### Step 1: Check the Console Logs
When you click "Cancel Request", look for these logs in your terminal/console:

```
=== Cancel Request Debug ===
Item: { ... }  // Full item object
Request ID: 123  // The ID being sent
Calling deleteRequest with ID: 123
Delete Request Payload: {"TokenC":"...","RequestID":"123"}
Delete Request Endpoint: https://hr.trickyhr.com/WebApi/GetDeletApply
Delete Request Response Status: 200
Delete Request Response Data: { ... }
Delete Request Result: { success: true/false, ... }
```

### Step 2: Identify the Issue

#### If you see "Request ID not found in item"
- The item object doesn't have `IdN`, `Id`, or `id` fields
- **Solution**: Check the console log for the Item object and identify the correct field name
- Update the code to use the correct field

#### If you see "Authentication token not found"
- The user token is missing or expired
- **Solution**: Try logging out and logging back in

#### If you see a 500 error
- Server-side error
- **Check**: The error response data for specific error messages
- **Common causes**:
  - Invalid RequestID format
  - Missing required fields
  - Database error
  - Permission issues

#### If you see "No response from server"
- Network connectivity issue
- **Solution**: Check internet connection and API endpoint availability

### Step 3: Common API Response Patterns

#### Success Response
```json
{
  "Status": "success",
  "Message": "Request cancelled successfully"
}
```

#### Error Response
```json
{
  "Status": "error",
  "Error": "Cannot cancel approved requests",
  "Message": "This request has already been approved"
}
```

## Testing Checklist

1. **Check Console Logs**
   - [ ] Item object is logged correctly
   - [ ] Request ID is found and logged
   - [ ] API endpoint is correct
   - [ ] Token is present in payload

2. **Check API Response**
   - [ ] Response status is 200
   - [ ] Response has Status field
   - [ ] Error message is clear (if failed)

3. **Check Network**
   - [ ] Internet connection is active
   - [ ] API server is reachable
   - [ ] No CORS errors (if applicable)

## Expected Behavior

1. User clicks "Cancel Request" button
2. Confirmation dialog appears
3. User confirms cancellation
4. Loading indicator shows
5. API request is sent with:
   - `TokenC`: User authentication token
   - `RequestID`: The request ID as a string
6. On success:
   - Success alert shows
   - Modal closes
   - Request list refreshes
7. On error:
   - Error alert shows with specific message
   - Modal stays open
   - User can try again

## API Endpoint Details

**Endpoint**: `/WebApi/GetDeletApply`  
**Method**: POST  
**Headers**: 
```json
{
  "Content-Type": "application/json",
  "Token": "user_token"
}
```
**Payload**:
```json
{
  "TokenC": "user_token",
  "RequestID": "123"
}
```

## Next Steps for Debugging

1. **Run the app** and try to cancel a request
2. **Check the console** for the debug logs
3. **Copy the logs** and share them if the issue persists
4. **Look for**:
   - The exact error message
   - The response status code
   - The response data
   - Any network errors

## Possible Backend Issues

If the frontend is working correctly but cancellation still fails, check:

1. **Backend Endpoint**: Is `/WebApi/GetDeletApply` implemented?
2. **Request Validation**: Does the backend accept `RequestID` as a string?
3. **Authorization**: Does the user have permission to cancel this request?
4. **Request Status**: Can only "Waiting" requests be cancelled?
5. **Database**: Are there any constraints preventing deletion?

## Code Changes Summary

### ApiService.ts
- Changed `requestId` parameter type from `number` to `number | string`
- Added `String(requestId)` conversion
- Added comprehensive error logging
- Added token validation before API call

### RequestModal.tsx
- Added support for multiple ID field names (`IdN`, `Id`, `id`)
- Added detailed console logging
- Improved error messages
- Better error handling with try-catch

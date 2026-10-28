# DataWise AI — Error Handling & Sanitization Policy

## 1. Core Principles
1. **Never Disclose Internal Details**:
   - Error responses returned to client browsers or API callers must never contain stack traces, internal paths (`c:\...`), SQL queries, connection strings, or system environment variables.
2. **Actionable & Consistent Formatting**:
   - Every user-facing error must follow a standard schema with safe error code, user message, correlation request ID, retryable flag, and recommended recovery action.
3. **Structured Logging for Observability**:
   - Internal logs record full exception diagnostics in protected observability stores, sanitized of passwords and PII.

---

## 2. Standard Error Response Schema

```json
{
  "error": {
    "code": "DATASET_VALIDATION_FAILED",
    "message": "The uploaded dataset could not be processed.",
    "request_id": "req_84f92a10",
    "retryable": false,
    "action": "Check the file format and column headers, then re-upload."
  }
}
```

---

## 3. Safe Error Code Mapping Table

| Internal Exception | HTTP Status | Client Error Code | User Message |
|---|---|---|---|
| Unauthenticated / Missing Bearer | 401 | `UNAUTHORIZED` | "Authentication required. Please sign in to continue." |
| Cross-tenant project access | 403 | `FORBIDDEN` | "You do not have access to this resource." |
| Non-admin accessing settings | 403 | `ADMIN_ACCESS_REQUIRED` | "Administrative privileges restricted to authorized personnel." |
| Project / Dataset not found | 404 | `RESOURCE_NOT_FOUND` | "The requested project or resource was not found." |
| Unsupported file extension | 400 | `INVALID_FILE_TYPE` | "Unsupported file format. Please upload a CSV, XLSX, or Parquet file." |
| Oversized upload (> 250MB) | 413 | `PAYLOAD_TOO_LARGE` | "File exceeds maximum permitted size of 250 MB." |
| Rate limit exceeded | 429 | `RATE_LIMITED` | "Too many requests. Please wait a moment before trying again." |
| Internal worker failure | 500 | `INTERNAL_SERVICE_ERROR` | "An unexpected error occurred. Reference ID: [req_id]." |

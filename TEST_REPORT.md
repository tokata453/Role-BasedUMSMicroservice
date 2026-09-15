# Test Report

Test date: 2026-09-15

## Environment

| Component | Result |
|---|---|
| MongoDB Docker container | Running on port `27017` |
| API Gateway | Running on port `3000` |
| Registration Service | Running on port `3001` |
| Login Service | Running on port `3002` |
| Admin Service | Running on port `3003` |
| User Service | Running on port `3004` |
| Shared database | `role_based_ums` |

## Syntax Checks

All service entry files passed `node --check server.js`.

## API Test Results

All requests were made through the API Gateway unless otherwise noted.

| # | Scenario | Expected | Actual | Result |
|---:|---|---:|---:|---|
| 1 | Gateway health | 200 | 200 | Pass |
| 2 | Register user | 201 | 201 | Pass |
| 3 | Register admin | 201 | 201 | Pass |
| 4 | Duplicate email rejected | 400 | 400 | Pass |
| 5 | User login returns JWT | 200 | 200 | Pass |
| 6 | Admin login returns JWT | 200 | 200 | Pass |
| 7 | Invalid email rejected | 401 | 401 | Pass |
| 8 | Invalid password rejected | 401 | 401 | Pass |
| 9 | Wrong role rejected | 403 | 403 | Pass |
| 10 | Admin view all users | 200 | 200 | Pass |
| 11 | Admin search user found | 200 | 200 | Pass |
| 12 | Admin search user not found | 404 | 404 | Pass |
| 13 | User view own profile | 200 | 200 | Pass |
| 14 | User update own profile | 200 | 200 | Pass |
| 15 | No token rejected | 401 | 401 | Pass |
| 16 | Wrong token rejected | 401 | 401 | Pass |
| 17 | Expired token rejected | 401 | 401 | Pass |
| 18 | Admin token blocked from user API | 403 | 403 | Pass |
| 19 | User token blocked from admin API | 403 | 403 | Pass |
| 20 | Direct internal service access rejected | 403 | 403 | Pass |
| 21 | Admin delete test user | 200 | 200 | Pass |
| 22 | Deleted user not found | 404 | 404 | Pass |

## MongoDB Verification

MongoDB was checked after registration. The saved password begins with bcrypt prefix `$2b$10$`, confirming the password is hashed and not stored as plain text.

## Postman Evidence

`Role-BasedUMS.postman_collection.json` was added for manual Postman import and screenshot capture. The automated smoke test validates the same functional and security scenarios listed in the assignment.

## Remaining Manual Submission Step

Take Postman and MongoDB screenshots required by `INSTRUCTION.md` and paste them into the assignment Word document.

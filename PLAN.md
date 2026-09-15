# Implementation Plan

## Project

Role-Based User Management System using Node.js, Express, MongoDB, JWT, an API Gateway, and four internal microservices.

## Assignment Source

The assignment requirements are documented in `INSTRUCTION.md`.

## Architecture

```text
Client / Postman
      |
      v
API Gateway
      |
      |-- Registration Service
      |-- Login Service
      |-- Admin Service
      |-- User Service
      |
      v
MongoDB
```

The API Gateway must be the single public entry point. Clients should call the gateway instead of directly calling internal services.

## Service Map

| Service | Folder | Port | Status |
|---|---|---:|---|
| API Gateway | `api-gateway` | 3000 | Implemented and verified |
| Registration Service | `registration-service` | 3001 | Implemented and verified |
| Login Service | `login-service` | 3002 | Implemented and verified |
| Admin Service | `admin-service` | 3003 | Implemented and verified |
| User Service | `user-service` | 3004 | Implemented and verified |
| MongoDB | Docker container `mongodb` | 27017 | Running |

## Current Implementation Status

| Task | Requirement | Status | Notes |
|---|---|---|---|
| Task 1 | Create 5 microservices and install libraries | Done | Service folders and package files exist |
| Task 2 | Create DB connection files | Done | `dbConnect.js` exists in all service folders |
| Task 3 | Create MongoDB User model | Done | Password hashing verified with bcrypt hash in MongoDB |
| Task 4 | Create API Gateway | Done | Gateway routes implemented in `api-gateway/server.js` |
| Task 5 | Registration API and Postman test | Done | Registration and duplicate email rejection verified |
| Task 6 | Login API and Postman test | Done | Valid login, invalid email, invalid password, and wrong role verified |
| Task 7 | JWT authentication and role validation at Gateway | Done | Missing, invalid, expired, and cross-role tokens verified |
| Task 8 | Admin microservice APIs and Postman tests | Done | Search, view all, and delete verified |
| Task 9 | User microservice APIs and Postman tests | Done | View own profile and update own profile verified |
| Task 10 | Postman security scenarios | Done | Automated tests passed; manual screenshots still required for submission |
| Task 11 | Push to GitHub | Pending | Repository creation and push still required |

## Implemented Internal Endpoints

| Service | Method | Internal Endpoint | Purpose |
|---|---|---|---|
| Registration | POST | `/api/registration/userregister` | Register user or admin |
| Login | POST | `/api/login/login` | Login and return JWT |
| Admin | GET | `/api/admin/searchuser` | Search by `name` or `email` query parameter |
| Admin | GET | `/api/admin/viewalluser` | View all users |
| Admin | DELETE | `/api/admin/deluser` | Delete user by `email` query parameter |
| User | GET | `/api/user/viewprofile` | View profile by `email` query parameter |
| User | PUT | `/api/user/updateprofile` | Update profile using request body |

## Target Gateway Endpoints

These should match the assignment paths exposed through the API Gateway.

| Method | Gateway Endpoint | Target Service | Auth Required | Role Required |
|---|---|---|---|---|
| POST | `/register/userregister` | Registration | No | None |
| POST | `/auth/login` | Login | No | None |
| GET | `/admin/searchuser` | Admin | Yes | `admin` |
| GET | `/admin/viewalluser` | Admin | Yes | `admin` |
| DELETE | `/admin/deluser` | Admin | Yes | `admin` |
| GET | `/user/viewprofile` | User | Yes | `user` |
| PUT | `/user/updateprofile` | User | Yes | `user` |

## Known Issues To Fix

1. Manual Postman and MongoDB screenshots still need to be captured for the assignment document.
2. GitHub repository creation and push still need to be completed.

## Build Order

1. Add root `.gitignore` for `node_modules`, `.env`, and OS files.
2. Standardize environment configuration across services.
3. Fix User model imports and password hashing.
4. Implement API Gateway server and Axios forwarding.
5. Implement gateway JWT validation and role authorization.
6. Update user-service profile APIs to rely on gateway-provided authenticated user data.
7. Start MongoDB and all five services.
8. Test registration and duplicate email rejection.
9. Test login success and login failure cases.
10. Test admin APIs using an admin JWT.
11. Test user APIs using a user JWT.
12. Test required security scenarios.
13. Capture screenshots and paste them into the submission document.
14. Push the finished project to a public GitHub repository.

## Postman Test Checklist

### Registration

| Scenario | Method | URL | Expected Result |
|---|---|---|---|
| Register user | POST | `http://localhost:3000/register/userregister` | `201`, success message |
| Duplicate email | POST | `http://localhost:3000/register/userregister` | `400`, duplicate email message |
| Confirm MongoDB record | MongoDB | users collection | Password is hashed, not plain text |

### Login

| Scenario | Method | URL | Expected Result |
|---|---|---|---|
| Valid user login | POST | `http://localhost:3000/auth/login` | `200`, JWT returned |
| Valid admin login | POST | `http://localhost:3000/auth/login` | `200`, JWT returned |
| Invalid email | POST | `http://localhost:3000/auth/login` | `401` |
| Invalid password | POST | `http://localhost:3000/auth/login` | `401` |
| Wrong role | POST | `http://localhost:3000/auth/login` | `403` |

### Admin

| Scenario | Method | URL | Expected Result |
|---|---|---|---|
| Search found user | GET | `http://localhost:3000/admin/searchuser?email=user@example.com` | User data returned |
| Search not found | GET | `http://localhost:3000/admin/searchuser?email=missing@example.com` | `404` |
| View all users | GET | `http://localhost:3000/admin/viewalluser` | User list returned |
| Delete user | DELETE | `http://localhost:3000/admin/deluser?email=user@example.com` | Delete success message |

### User

| Scenario | Method | URL | Expected Result |
|---|---|---|---|
| View own profile | GET | `http://localhost:3000/user/viewprofile` | Authenticated user's profile returned |
| Update own profile | PUT | `http://localhost:3000/user/updateprofile` | Updated profile returned |
| Confirm MongoDB update | MongoDB | users collection | Profile changes persisted |

## Required Security Scenarios

| Scenario | Endpoint Example | Expected Result |
|---|---|---|
| No token accessing admin API | `GET /admin/viewalluser` | `401` |
| Wrong token accessing admin or user API | `GET /admin/viewalluser` or `GET /user/viewprofile` | `401` |
| Admin token accessing user API | `GET /user/viewprofile` | `403` |
| User token accessing admin API | `GET /admin/viewalluser` | `403` |

## Screenshot Checklist

Capture clear Postman screenshots with visible URL, method, headers where needed, request body, and response output.

1. Code screenshot for User model.
2. API Gateway code screenshot after JWT and routing are complete.
3. Registration success screenshot.
4. Duplicate registration rejection screenshot.
5. MongoDB screenshot showing registered user and hashed password.
6. Login success screenshot with JWT.
7. Login invalid email/password/role screenshots.
8. Admin search user found screenshot.
9. Admin search user not found screenshot.
10. Admin view all users screenshot.
11. Admin delete user screenshot.
12. MongoDB screenshot after delete.
13. User view profile screenshot.
14. User update profile screenshot.
15. MongoDB before and after profile update screenshots.
16. No token security screenshot.
17. Wrong token security screenshot.
18. Admin token blocked from user API screenshot.
19. User token blocked from admin API screenshot.
20. GitHub repository link screenshot or final link.

## GitHub Submission Checklist

1. Ensure `.env` files and `node_modules` are ignored.
2. Run service startup checks.
3. Run API smoke tests.
4. Check `git status` and confirm only intended files are included.
5. Commit the final implementation.
6. Push to a public GitHub repository.
7. Share the GitHub repository link.

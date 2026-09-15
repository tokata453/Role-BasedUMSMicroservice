# Role-Based User Management Microservices

Node.js, Express, MongoDB, JWT, and API Gateway implementation for the Role-Based User Management System assignment.

## Services

| Service | Folder | Port |
|---|---|---:|
| API Gateway | `api-gateway` | 3000 |
| Registration Service | `registration-service` | 3001 |
| Login Service | `login-service` | 3002 |
| Admin Service | `admin-service` | 3003 |
| User Service | `user-service` | 3004 |
| MongoDB | Docker/local MongoDB | 27017 |

## Gateway Endpoints

| Method | Endpoint | Role |
|---|---|---|
| POST | `/register/userregister` | Public |
| POST | `/auth/login` | Public |
| GET | `/admin/searchuser` | `admin` |
| GET | `/admin/viewalluser` | `admin` |
| DELETE | `/admin/deluser` | `admin` |
| GET | `/user/viewprofile` | `user` |
| PUT | `/user/updateprofile` | `user` |

## Setup

1. Start MongoDB on port `27017`.
2. Copy each `.env.example` file to `.env` in the same folder.
3. Use the same `JWT_SECRET`, `GATEWAY_API_KEY`, and `MONGO_URL` values in all services.
4. Install dependencies in each service folder with `npm install` if `node_modules` is not present.
5. Start each service from its folder with `npm start`.

## Postman

Import `Role-BasedUMS.postman_collection.json` into Postman and run requests against `http://localhost:3000`.

The collection stores login tokens automatically and includes the required security scenarios:

1. No token access.
2. Wrong token access.
3. Admin token blocked from user APIs.
4. User token blocked from admin APIs.

## Security Notes

The API Gateway validates JWTs and roles. Internal microservices also require `x-internal-api-key`, so direct client access to ports `3001-3004` is rejected.

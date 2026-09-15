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

## Gateway Routing

The gateway routes by service prefix, then forwards the remaining path to the target microservice. New endpoints inside a microservice do not need new gateway routes.

| Prefix | Forwarded To | Role |
|---|---|---|
| `/register/*` | Registration Service | Public |
| `/auth/*` | Login Service | Public |
| `/admin/*` | Admin Service | `admin` |
| `/user/*` | User Service | `user` |

Examples: `POST /register/userregister`, `POST /auth/login`, `GET /admin/viewalluser`, `GET /user/viewprofile`.

## Setup

1. Start MongoDB on port `27017`.
2. Copy each `.env.example` file to `.env` in the same folder.
3. Use the same `JWT_SECRET`, `GATEWAY_API_KEY`, and `MONGO_URL` values in all services.
4. Install dependencies in each service folder with `npm install` if `node_modules` is not present.
5. Start services:
   - All five in one terminal with automatic restarts: `node start-all.js` from the repository root.
   - One service from its folder: `npm start`, or `npm run dev` for automatic restarts with nodemon.

Press `Ctrl+C` once to stop all services started by `start-all.js`.

## Tests

Each service uses Node.js native tests and does not need extra test dependencies:

```bash
npm --prefix registration-service test
npm --prefix login-service test
npm --prefix admin-service test
npm --prefix user-service test
npm --prefix api-gateway test
```

When service behavior, API contracts, security rules, routing, validation, or persistence logic changes, update the affected test files in the same change.

## Postman

Import `Role-BasedUMS.postman_collection.json` into Postman and run requests against `http://localhost:3000`.

The collection stores login tokens automatically and includes the required security scenarios:

1. No token access.
2. Wrong token access.
3. Admin token blocked from user APIs.
4. User token blocked from admin APIs.

## Security Notes

The API Gateway validates JWTs and roles by route prefix, then forwards trusted identity headers to internal services. Internal microservices also require `x-internal-api-key`, so direct client access to ports `3001-3004` is rejected.

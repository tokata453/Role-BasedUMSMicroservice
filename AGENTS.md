# Agent Notes

## Repository

- This project is its own Git repository nested inside `/Users/user/Desktop/CLOUD-NATIVE`; run Git commands from `Role-BasedUMSMicroservice`, not the parent workspace.
- There is no root npm workspace or root `package.json`; each service is an independent CommonJS Node package.
- The assignment source is `INSTRUCTION.md`; `README.md` is the public setup/API summary.
- When implementation behavior, setup, architecture, workflow, or a project decision changes, update every related Markdown file in the same change. Do not modify unrelated documentation.

## Services

- API Gateway: `api-gateway`, port `3000`, entrypoint `server.js`.
- Registration Service: `registration-service`, port `3001`, entrypoint `server.js`.
- Login Service: `login-service`, port `3002`, entrypoint `server.js`.
- Admin Service: `admin-service`, port `3003`, entrypoint `server.js`.
- User Service: `user-service`, port `3004`, entrypoint `server.js`.
- MongoDB must be reachable at `MONGO_URL`; current examples use `mongodb://localhost:27017/role_based_ums`.

## Setup And Run

- Use Node.js `>=18.0.0`.
- Install per service, for example `npm --prefix api-gateway install`; repeat for the other four service folders.
- Each service needs its own `.env`; copy from that service's `.env.example`.
- Keep `MONGO_URL`, `JWT_SECRET`, and `GATEWAY_API_KEY` identical across all five service `.env` files.
- Start internal services before the gateway when testing forwarding: registration, login, admin, user, then `api-gateway`.
- Start from root with `npm --prefix <service-folder> start`, or from inside a service folder with `npm start`.
- Start all five services concurrently with `node start-all.js` from root; `Ctrl+C` stops the full stack. For one service with automatic restarts, use `npm --prefix <service-folder> run dev` from root or `npm run dev` inside its folder. Each package includes `nodemon` as a development dependency.

## Architecture Gotchas

- Clients should call only `http://localhost:3000`; internal ports `3001-3004` intentionally reject direct calls without `x-internal-api-key`.
- Gateway routes by service prefix: `/register/*`, `/auth/*`, `/admin/*`, and `/user/*`; do not add per-endpoint gateway routes for new microservice endpoints.
- Internal services use prefixed paths like `/api/registration/userregister` and `/api/login/login`; the gateway maps public prefixes to these internal prefixes and forwards the remaining path.
- JWT validation and role checks live in `api-gateway`; protected user/admin services trust identity headers forwarded by the gateway.
- User profile routes must stay tied to `x-auth-user-email`; do not reintroduce client-supplied email for viewing/updating a profile.
- `models/User.js` is duplicated in every service; keep schema, hashing, and password comparison compatible across all copies because they share one MongoDB collection.

## Verification

- There is no lint or CI in this repo. API Gateway has a small native Node test suite with `npm --prefix api-gateway test`.
- Syntax-check changed service entrypoints with `node --check server.js` from the service folder.
- Check gateway availability with `GET http://localhost:3000/health`.
- Import `Role-BasedUMS.postman_collection.json` into Postman for the assignment's functional/security scenarios.
- Treat `TEST_REPORT.md` as historical evidence only; rerun focused checks after code changes.

## Files To Keep Out Of Git

- Real `.env` files and `node_modules/` are ignored and should stay untracked.
- If environment requirements change, update the relevant `.env.example` files instead of committing real secrets.

# 01. Role-Based User Management System Using Microservices API Gateway NodeJS MongoDB

FOR YOUR WORK - 34 points + Good/Visible Screenshots with Headings - 6 points
Submission PROCESS
AFTER TAKING A SCREENSHOT, PASTE IT IN A WORD DOCUMENT.

--------------------------------------------------------------------------------------------------------

Real-Life Scenario:

A university is developing a Central Identity and User Management Platform for its students and administrative staff.

The platform has two types of users:

User — students/staff who manage their own profile.
Admin — authorized university administrators who manage user accounts.
The university does not want a monolithic application. Instead, the system must be developed as independent microservices that communicate through an API Gateway.

The system must also ensure that an ordinary user can never access administrative APIs, while an administrator can never access user-only APIs.

# System Architecture

```text
                         Client
                            |
                            v

                 +----------------------+
                 |     API Gateway      |
                 |      Microservice    |
                 |                      |
                 |  - JWT Validation    |
                 |  - Role Validation  |
                 |  - Request Routing  |
                 +----------------------+
                            |
        ------------------------------------------------
        |              |              |               |
        v              v              v               v

+----------------+ +----------------+ +----------------+ +----------------+
| Registration   | | Login Service  | | Admin Service  | | User Service   |
| Service #1     | | Service #2     | | Service #4     | | Service #5     |
+----------------+ +----------------+ +----------------+ +----------------+
        |                 |                  |                  |
        v                 |                  v                  v

+-------------+       +-----------+     +-------------+     +-------------+
|  MongoDB    |       | JWT Token |     |  MongoDB    |     |  MongoDB    |
+-------------+       +-----------+     +-------------+     +-------------+

 
# Analyze the Requirement:

A user must be able to:
Register an account
Login
View own profile
Update own profile
An administrator must be able to:
Login
Search users 
View all users information
Delete a user
Security requirement

A User must NEVER be able to access Admin APIs, and an Admin must NEVER be able to access User APIs.

----------------------------------------------------------------------------------------------------------------------------------------------

Task 1: CREATE  5 MICROSERVICES (API Gateway, Register, Login, Admin and User Service) and install necessary library.

Task 2: Create DBConnect file and keep it in the appropriate Microservice folder and check it is working or not.

Task 3: Create the MongoDB User Model like below (if you want you can modify it) and keep it inside appropriate Microservice folder. - Code Screenshot. 

{
    "_id": "...",
    "name": "....",
    "email": "....",
    "password": "....",
    "role": "....",
    "phone": "....",
    "createdAt": "...",
    "updatedAt": "..."
}

Task 4 — Create API Gateway Microservice and Add Code inside it. Code Screenshot after complete Task 7.

The API Gateway is the single-entry point for clients. Clients must not directly access the internal microservices.

Add Routing Code

Client (Postman)
   ↓
API GATEWAY

Task 5: Add code (API) inside Registration Microservice Postman (Localhost) Duplicate Email should not be accepted + MongoDB Screenshot

API - POST /register/userregister

Email is unique.
Password is never stored as plain text.
Password must be hashed.
Client (Postman)
   ↓
API GATEWAY
   ↓
Registration MicroService
   ↓
Validate input
   ↓
Check email
   ↓
Hash password
   ↓
Store in MongoDB
   ↓
Return success

Task 6 — Add code (API) inside Login Microservice Postman (Localhost) Matched Email and Password. Invalid Email or Password or role Screenshot

API - POST /auth/login

{
     "email": "....",
    "password": "....",
    "role": "....",
}

role should provide as admin or user

Client (Postman)
   ↓
API GATEWAY
   ↓
Login Microservice
   ↓
Validate email, password and role with Database
   ↓
If matched, return JWT

If not matched, return Error

Task 7 — Implement JWT Authentication with role at API Gateway and Admin, User Microservice routing

Add Token Validation Code

The Gateway should reject requests containing:

No token
Expired token
Invalid token
Task 8 — Create Admin Microservice Postman (Localhost) + MongoDB Screenshot for 3 API calls. Search user for found and Not Found

Create API for the following Tasks

API - GET /admin/searchuser    - Search user by name or email id

          GET /admin/viewalluser   - View all users' information

          Delete /admin/deluser      -  Delete a user by emailid

Client (Postman)
   ↓
API GATEWAY (JWT Check and Routing)
   ↓
Admin Microservice
   ↓
MongoDB operation
   ↓
Return User Information or Message

Task 9 — Create User Microservice and add code. Postman (Localhost) + MongoDB Screenshot (Before and Update Profile) for all API calls. 

Create API for the following Tasks

API - GET /user/viewprofile
          PUT /user/updateprofile

Client (Postman)
   ↓
API GATEWAY (JWT Check and Routing)
   ↓
USER Microservice
   ↓
MongoDB operation
   ↓
Return User Information or Message


Task 10: Postman Screenshot with clear URL + Output required 

a) Without token try to access any API for admin or user

b) With wrong token try to access any API for admin or user

c) Using admin token try to access any User API

d) Using user token try to access any Admin API

Task 11: PUSH/Upload it in your public GitHub repository. - share GitHub repository Link
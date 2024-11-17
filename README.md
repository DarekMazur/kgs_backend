# Korona Gór Świętokrzyskich API
This repository contains the backend code for KGS. It is a Node.js application that provides a REST API. The application interacts with a PostgreSQL database.

## Features
- REST API React Native application
- Data persistence using PostgreSQL
- Built with TypeScript
- Environment variable configuration via `.env` file

## Technologies
- Node.js
- Express: REST API framework
- PostgreSQL: Database for storing quiz data
- TypeScript: Type safety and modern JavaScript features
- Dotenv: For environment variable management
- JWT: JSON Web Tokens for authentication
- Cloudinary to store images
- nodemailer to sending emails
- bcrypt to hash passwords

## Requirements
- Node.js (v20+)
- PostgreSQL (v13+)
- npm (v10+)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/DarekMazur/batMUI_backend.git
cd batMUI_backend
```

2. Install dependencies:
```bash
npm install 
```

3. Create a `.env` file in the root directory. Example:
```
DATABASE_NAME=your_database_name
DATABASE_USER=your_database_username
DATABASE_PASSWORD=your_database_password
DATABASE_HOST=your_database_host
DATABASE_PORT=your_database_port

PORT=your_server_port

TOKEN_SECRET_KEY=your_sercret_api_token
TOKEN_EXPIRATION_TIME=token_lifetime

AUTH_SECRET_KEY=your_sercret_api_auth_token
CONFIRMATION_TOKEN_EXPIRATION_TIME=token_lifetime

SMTP_HOST=your_email_smtp_host
SMTP_PORT=your_email_smtp_port
SMTP_SERVICE=your_email_smtp_service_name
SMTP_MAIL=your_email_address
SMTP_APP_PASS=your_email_password

API_HOST=your_api_host
CONFIRM_SENDER_EMAIL=your_email_sender_address

CLOUDIANRY_NAME=your_cloudinary_account_name
CLOUDINARY_KEY=your_cloudinary_account_key
CLOUDINARY_SECRET=your_cloudinary_account_secret

```

4. Setup your PostgreSQL database:
- Create a PostgreSQL database.
- Set up the necessary tables questions and results for storing quiz questions and top scores.

5. Run the application in development mode:
```bash
npm run dev 
```

The application will start using `nodemon` for auto-reloading on file changes.

6. For production, build and start the application:
```bash
npm run tsc
npm run start:prod 
```

## Scripts

- `npm run dev:` Runs the application in development mode with `nodemon`.
- `npm run tsc:` Compiles the TypeScript code into JavaScript.
- `npm run start:prod:` Starts the compiled JavaScript application for production.

## API Endpoints

Here are some of the potential REST API routes (exact routes and payloads would need to be added as per the codebase):

- GET /api/users: Fetches the list of all registered users.
- GET /api/users/:userId: Fetches single user.
- GET /api/users/login: User login.
- GET /api/users/current: Check current logged user.
- POST /api/users: Add new user to database.
- PUT /api/users/:userId: Edit user.
- PUT /api/users/messages/:userId: Send message.
- DELETE /api/users/:userId: Delete user.
- GET /api/posts: Fetches the list of posts.
- GET /api/posts/:postId: Fetches single post.
- POST /api/posts: Create new post.
- PUT /api/posts/:postId: Edit post.
- DELETE /api/posts/:postId: Delete post.
- GET /api/peaks: Fetches the list of all peaks.
- GET /api/peaks/:peakId: Fetches single peak.
- GET /api/roles: Fetches the list of all user's roles.
- GET /confirm/token: Generate bearer token.
- GET /reset-password/token: Generate reset token.
- POST /reset-password: Reset user password.
- POST /reset-password/forgot/:email: Reset password request.

## Database

The application uses a PostgreSQL database to store quiz questions and high scores. Ensure you configure the `.env` file correctly for database credentials.

## Environment Variables

- `DATABASE_NAME` Name of the database
- `DATABASE_USER` Username for the database
- `DATABASE_PASSWORD` Password for the database
- `DATABASE_HOST` Hostname for the PostgreSQL database
- `DATABASE_PORT` your_database_port
- `PORT` your_server_port
- `TOKEN_SECRET_KEY` Secret key used for JWT authentication
- `TOKEN_EXPIRATION_TIME` Token lifetime
- `AUTH_SECRET_KEY` Secret key used for reset password
- `CONFIRMATION_TOKEN_EXPIRATION_TIME` Token lifetime
- `SMTP_HOST` Sender smtp host
- `SMTP_PORT` Sender smtp port
- `SMTP_SERVICE` Sender smtp service name
- `SMTP_MAIL` Sender email address
- `SMTP_APP_PASS` Sender email password
- `API_HOST` Application host
- `CONFIRM_SENDER_EMAIL` Sender email address
- `CLOUDIANRY_NAME` Cloudinary account name
- `CLOUDINARY_KEY` Cloudinary account public key
- `CLOUDINARY_SECRET` Cloudinary secret

readme_content = """# BildyApp - Delivery Notes Digitalization Backend

BildyApp is a robust REST API built with Node.js and Express designed to manage delivery notes (time or materials records) between clients and suppliers. This project implements the core business logic for client, project, and delivery note management, featuring real-time notifications via WebSockets, automated testing, and professional documentation.

## Features

- **User Management**: Authentication with JWT, registration, and email validation.
- **Client Management**: Full CRUD operations with pagination, filtering, and soft-delete/archive functionality.
- **Project Management**: Associate projects with clients, featuring unique project codes and status tracking.
- **Delivery Notes**: Create material or hour-based notes, generate professional PDFs, and digital signature support.
- **Real-time Notifications**: Instant updates via Socket.IO for new clients, projects, and delivery notes.
- **Monitoring & Logging**: Automatic Slack notifications for 5XX server errors.
- **Documentation**: Fully interactive API documentation using Swagger/OpenAPI 3.0.

## Technologies

- **Backend**: Node.js, Express.
- **Database**: MongoDB with Mongoose ODM.
- **Validation**: Zod.
- **Documentation**: Swagger UI, swagger-jsdoc.
- **Testing**: Jest, Supertest, mongodb-memory-server.
- **Communication**: Socket.IO (WebSockets), Nodemailer.
- **PDF Generation**: PDFKit.
- **Security**: Helmet, Rate Limiting, JWT.

## Installation

1. **Clone the repository**:
   ```bash
   git clone <your-github-repo-url>
   cd bildyapp-api

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Required Environment Variables:*
   - `PORT`: Port where the server runs (e.g., 3000)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for signing tokens
   - `SLACK_WEBHOOK_URL`: Webhook URL for logging 5XX errors
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP credentials (e.g., Mailtrap)
   - Cloudinary credentials (if used for signatures/logos)

4. **Run the application**:
   ```bash
   # Development mode (e.g., with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## Testing

The project uses Jest, Supertest, and `mongodb-memory-server` to run tests against an in-memory database, aiming for a minimum of 70% code coverage.

- **Run all tests**: 
  ```bash
  npm test
  ```
- **Watch mode**: 
  ```bash
  npm run test:watch
  ```
- **Coverage report**: 
  ```bash
  npm run test:coverage
  ```

## Project Structure

```text
bildyapp-api/
├── src/
│   ├── config/         # Centralized configuration (DB, Cloudinary)
│   ├── controllers/    # Business logic (MVC)
│   ├── docs/           # Swagger (models)
│   ├── middleware/     # Auth, role handling, multer upload, validation
│   ├── models/         # Mongoose schemas (User, Company, Client, Project, DeliveryNote, RefreshToken)
│   ├── routes/         # Express route definitions, swagger documentation
│   ├── services/       # Third-party integrations (Cloudinary, Slack, Mail, PDF)
│   └── tests/          # Jest Tests (auth, client, project, deliveryNote)
│   ├── utils/          # Helpers and AppError class (errors, jwt, password, storage)
│   └── validators/     # Zod schemas for input validation
│   └── app.js          # Express config and socket.io
│   └── index.js        # DB connection
├── upload/             # Image storage
├── .env
├── package.json
└── README.md
```

## Real-time Events (WebSockets)

The application uses Socket.IO to emit real-time events exclusively to users within the **same company** (via Socket.IO rooms). A valid JWT is required to connect.

- `client:new` — Emitted when a new client is created.
- `project:new` — Emitted when a new project is created.
- `deliverynote:new` — Emitted when a new delivery note is created.
- `deliverynote:signed` — Emitted when a delivery note is successfully signed.

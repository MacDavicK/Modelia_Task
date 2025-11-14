# 🎨 Mini AI Studio - Modelia Assignment

A full-stack web application that simulates an AI-powered fashion image generation studio. Users can upload images, add creative prompts, and generate styled variations while experiencing realistic API behaviors including error handling and retry mechanisms.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Development Workflow](#-development-workflow)
- [Known Issues & TODOs](#-known-issues--todos)

---

## ✨ Features

### Authentication
- 🔐 Secure JWT-based authentication
- 👤 User signup and login with password hashing (bcrypt)
- 🔒 Protected routes with token validation
- 🚪 Persistent sessions via localStorage

### Image Generation Studio
- 📸 Drag-and-drop image upload (max 10MB, JPEG/PNG)
- 🖼️ Live image preview before generation
- ✍️ Text prompt input with character validation (10-500 chars)
- 🎨 Style selection dropdown (Realistic, Artistic, Minimalist, Vintage)
- ⚡ Simulated generation with 1-2 second delay
- 🔄 20% random "Model overloaded" error simulation
- 🔁 Smart retry logic (up to 3 attempts with exponential backoff)
- ⛔ Abort in-flight requests with AbortController
- 📜 Generation history (last 5 generations)
- 🕐 Click history items to restore into workspace

### User Experience
- 📱 Fully responsive design (mobile, tablet, desktop)
- ♿ Accessibility-focused with ARIA labels and keyboard navigation
- 🎯 Clear error messages and loading states
- 🌐 Modern, clean UI with Tailwind CSS
- ⚠️ Friendly error handling with user guidance

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **React Testing Library** - Component testing

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM with SQLite
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **Multer** - File upload handling
- **Jest + Supertest** - API testing

### DevOps & Tools
- **pnpm** - Fast, disk-efficient package manager
- **ESLint + Prettier** - Code quality and formatting
- **GitHub Actions** - CI/CD pipeline
- **Playwright** - End-to-end testing

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MacDavicK/Modelia_Task.git
cd Modelia_Task
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
pnpm install
```

**Note:** If you encounter issues with native dependencies (like `bcrypt`), you may need to run:
```bash
pnpm rebuild bcrypt --filter backend
```

### 3. Set Up Environment Variables

Create `.env` files for both frontend and backend:

**Backend** (`/backend/.env`):

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT (IMPORTANT: Use a strong secret in production, minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**Frontend** (`/frontend/.env`):

```env
VITE_API_URL=http://localhost:3001/api
```

**Quick Setup:**
```bash
# Copy example env files (if they exist) or create manually
# Backend
cd backend
cp .env.example .env  # Edit with your values
cd ..

# Frontend
cd frontend
cp .env.example .env  # Edit with your values
cd ..
```

### 4. Initialize Database

```bash
# Generate Prisma client and run migrations
cd backend
pnpm prisma generate
pnpm prisma migrate dev --name init
cd ..
```

**Verify Database Setup:**
```bash
# Open Prisma Studio to view database
cd backend
pnpm prisma studio
# Opens at http://localhost:5555
```

### 5. Verify Installation

```bash
# Check that all dependencies are installed
pnpm --filter backend list
pnpm --filter frontend list

# Verify TypeScript compilation
pnpm type-check
```

---

## 🏃 Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
pnpm dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### Production Build

```bash
# Build both frontend and backend
pnpm build

# Start production server
pnpm start
```

---

## 🧪 Testing

### Prerequisites for Testing

Before running tests, ensure:
1. Environment variables are set (especially `JWT_SECRET` for backend tests)
2. Database is initialized (`pnpm prisma migrate dev`)
3. No servers are running on ports 3001 (backend) or 5173 (frontend)

### Run All Tests

```bash
# Run all tests (backend + frontend) with coverage
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests for specific workspace
pnpm --filter backend test
pnpm --filter frontend test
```

### Backend Tests

```bash
cd backend

# Run all backend tests
pnpm test

# Run specific test file
pnpm test tests/auth.test.ts
pnpm test tests/generation.test.ts

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

**Test Files:**
- `backend/tests/auth.test.ts` - Authentication endpoint tests
- `backend/tests/generation.test.ts` - Generation endpoint tests

**Test Coverage:**
- ✅ Authentication endpoints (signup, login, protected routes)
- ✅ Generation endpoints (create, list, error simulation)
- ✅ Input validation (Zod schemas)
- ✅ Error handling (custom errors, status codes)
- ✅ JWT token verification
- ✅ File upload validation (type, size)
- ✅ Database operations (Prisma)

**View Coverage Report:**
```bash
cd backend
pnpm test:coverage
# Open: backend/coverage/lcov-report/index.html in browser
```

### Frontend Tests

```bash
cd frontend

# Run all frontend tests
pnpm test

# Run tests in UI mode (interactive)
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

**Test Files:**
- `frontend/tests/GenerationForm.test.tsx` - Generation form component tests

**Test Coverage:**
- ✅ Form rendering and validation
- ✅ Image upload and preview
- ✅ Generation flow (loading → success → history update)
- ✅ Error and retry handling
- ✅ Abort functionality
- ✅ User interactions (click, input, file selection)

**View Coverage Report:**
```bash
cd frontend
pnpm test:coverage
# Open: frontend/coverage/lcov-report/index.html in browser
```

### End-to-End Tests

E2E tests use Playwright to test the full user journey across the entire application.

**First Time Setup:**
```bash
# Install Playwright browsers (required once)
pnpm exec playwright install
```

**Run E2E Tests:**
```bash
# Run E2E tests (starts both frontend and backend automatically)
pnpm test:e2e

# Run E2E tests with UI (interactive mode)
pnpm test:e2e:ui

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific E2E test
pnpm exec playwright test tests/e2e.spec.ts
```

**E2E Test Coverage:**
- ✅ Full user journey: Signup → Login → Upload → Generate → View History → Restore
- ✅ Error handling (retry on "Model overloaded" errors)
- ✅ Form validation
- ✅ Authentication flow
- ✅ File upload functionality

**E2E Test File:**
- `tests/e2e.spec.ts` - Complete user flow tests

**Note:** E2E tests automatically start both frontend and backend servers. Ensure ports 3001 and 5173 are available.

### Coverage Reports

After running tests, coverage reports are generated in:
- **Backend**: `backend/coverage/lcov-report/index.html`
- **Frontend**: `frontend/coverage/lcov-report/index.html`

Open these HTML files in your browser to view detailed coverage reports with line-by-line coverage information.

**Coverage Goals:**
- Target: > 80% code coverage
- Critical paths: 100% coverage (auth, generation endpoints)
- Components: > 70% coverage

### Troubleshooting Tests

**Backend Tests:**
- If tests fail with "JWT_SECRET not found", ensure `.env` file exists in `backend/` directory
- If port conflicts occur, ensure no server is running on port 3001
- If database errors occur, run `pnpm prisma migrate reset` to reset the test database

**Frontend Tests:**
- If tests fail with module resolution errors, ensure all dependencies are installed: `pnpm install`
- If Vitest fails to start, check `frontend/vite.config.ts` configuration

**E2E Tests:**
- If Playwright fails to start browsers, run `pnpm exec playwright install` again
- If servers fail to start, check that ports 3001 and 5173 are not in use
- Ensure environment variables are set correctly for both frontend and backend

---

## 📁 Project Structure

```
modelia-assignment/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD pipeline
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Express middleware (auth, validation)
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helper functions
│   │   ├── validators/            # Zod schemas
│   │   └── server.ts              # Express app entry point
│   ├── tests/                     # Backend tests
│   ├── uploads/                   # Uploaded images (gitignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios configuration
│   │   ├── components/            # React components
│   │   ├── context/               # React context (Auth)
│   │   ├── hooks/                 # Custom hooks
│   │   ├── pages/                 # Page components
│   │   ├── types/                 # TypeScript types
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Entry point
│   ├── tests/                     # Frontend tests
│   └── package.json
├── tests/
│   └── e2e.spec.ts                # Playwright E2E tests
├── OPENAPI.yaml                   # API specification
├── EVAL.md                        # Feature checklist
├── AI_USAGE.md                    # AI tool usage documentation
└── README.md                      # This file
```

---

## 📖 API Documentation

**📘 Full API Documentation:** [OpenAPI 3.0 Specification](./OPENAPI.yaml)

The OpenAPI specification includes:
- Complete endpoint documentation with request/response schemas
- Authentication requirements
- Error response examples
- Request/response examples
- Validation rules and constraints

You can view the API documentation using:
- **Swagger UI**: Import `OPENAPI.yaml` into [Swagger Editor](https://editor.swagger.io/)
- **Postman**: Import `OPENAPI.yaml` to generate a Postman collection
- **VS Code**: Use the "OpenAPI (Swagger) Editor" extension

### Quick Reference

#### Authentication

**Signup**

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Generations

**Create Generation**

```http
POST /api/generations
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
prompt: "A stylish outfit"
style: "Artistic"
```

**Get User Generations**

```http
GET /api/generations?limit=5
Authorization: Bearer <token>
```

### Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `409` - Conflict (duplicate email)
- `503` - Service Unavailable (model overloaded)

---

## 🔧 Environment Variables

### Backend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment | `development` | No |
| `DATABASE_URL` | Prisma database connection | `file:./dev.db` | Yes |
| `JWT_SECRET` | Secret for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) | No |
| `UPLOAD_DIR` | Upload directory path | `./uploads` | No |

### Frontend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` | Yes |

---

## 👨‍💻 Development Workflow

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

### Database Management

```bash
# View database in Prisma Studio
cd backend
pnpm prisma studio

# Create new migration
pnpm prisma migrate dev --name description

# Reset database
pnpm prisma migrate reset
```

### Git Workflow

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push branch: `git push origin feat/your-feature`
4. Create Pull Request on GitHub
5. Merge after review

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `style:` - Formatting changes

---

## 🐛 Known Issues & TODOs

### Current Limitations
- SQLite database (not production-ready for scale)
- Images stored on local filesystem (should use cloud storage)
- No image optimization or resizing before upload
- Basic error logging (should integrate proper logging service)

### Future Enhancements
- [ ] Add dark mode toggle
- [ ] Implement image resizing (max 1920px width)
- [ ] Add pagination for generation history
- [ ] Deploy to cloud (Vercel + Railway/Render)
- [ ] Add more comprehensive E2E tests
- [ ] Implement rate limiting on API
- [ ] Add email verification for signup
- [ ] Support more image formats (WEBP, GIF)
- [ ] Add animations with Framer Motion

---

## 📄 License

This project is part of the Modelia Full Stack Engineer assignment.

---

## 👤 Author

**Your Name**
- GitHub: [@MacDavicK](https://github.com/MacDavicK)
- LinkedIn: [Kavish Jaiswal](https://www.linkedin.com/in/kavish-jaiswal/)
- Email: mac.davic18@gmail.com

---

## 🙏 Acknowledgments

- Assignment provided by [Modelia](https://modelia.ai)
- Built with guidance from Cursor AI for rapid development
- Icons and assets from [Lucide Icons](https://lucide.dev)

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Known Issues](#-known-issues--todos) section
2. Review the [API Documentation](#-api-documentation)
3. Open an issue on GitHub
4. Contact: mac.davic18@gmail.com

---

**⭐ If you found this project helpful, please consider giving it a star on GitHub!**

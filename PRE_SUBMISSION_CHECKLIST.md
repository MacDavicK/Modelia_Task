# Pre-Submission Checklist

Use this checklist to verify every aspect of your project before submission.

## 📦 Project Setup

### Dependencies
- [ ] All dependencies installed (`pnpm install`)
- [ ] No missing peer dependencies
- [ ] No deprecated packages (check with `pnpm outdated`)
- [ ] Lock file (`pnpm-lock.yaml`) is committed

### Environment
- [ ] `backend/.env` exists with all required variables
- [ ] `frontend/.env` exists (or is optional)
- [ ] `.env.example` files exist (if applicable)
- [ ] No secrets committed to git
- [ ] `.gitignore` properly configured

### Node.js & Tools
- [ ] Node.js >= 18.0.0 installed
- [ ] pnpm >= 8.0.0 installed
- [ ] Git configured and repository initialized
- [ ] Remote origin set correctly

---

## 🏗️ Build & Compilation

### TypeScript
- [ ] `pnpm type-check` passes (0 errors)
- [ ] All TypeScript files compile
- [ ] No `any` types (except where necessary)
- [ ] Strict mode enabled in tsconfig.json

### Build Process
- [ ] `pnpm build` succeeds
- [ ] Backend builds to `backend/dist/`
- [ ] Frontend builds to `frontend/dist/`
- [ ] No build warnings (review if any)

### Linting
- [ ] `pnpm lint` passes (0 errors)
- [ ] ESLint configs are `.cjs` format
- [ ] All ESLint warnings are acceptable
- [ ] Prettier formatting applied

---

## 🧪 Testing

### Backend Tests
- [ ] All backend tests pass (`pnpm --filter backend test`)
- [ ] Test coverage > 80% (if required)
- [ ] Auth tests pass
- [ ] Generation tests pass
- [ ] No flaky tests

### Frontend Tests
- [ ] All frontend tests pass (`pnpm --filter frontend test`)
- [ ] Component tests pass
- [ ] No console errors in tests

### E2E Tests
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Full user flow works
- [ ] Screenshots captured on failure

### Test Quality
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests clean up after themselves
- [ ] Tests use proper mocks
- [ ] Test descriptions are clear

---

## 🗄️ Database

### Prisma Setup
- [ ] `prisma/schema.prisma` is correct
- [ ] Migrations exist and are committed
- [ ] `prisma generate` works
- [ ] `prisma migrate deploy` works
- [ ] Database can be reset cleanly

### Data Integrity
- [ ] Foreign key constraints work
- [ ] Cascade deletes work correctly
- [ ] Unique constraints enforced
- [ ] No orphaned records

---

## 🔐 Security

### Authentication
- [ ] Passwords are hashed (bcrypt)
- [ ] JWT tokens are properly signed
- [ ] Tokens expire correctly
- [ ] Protected routes require authentication
- [ ] No password in responses

### Input Validation
- [ ] All inputs validated (Zod schemas)
- [ ] File uploads validated (type, size)
- [ ] SQL injection prevented (Prisma)
- [ ] XSS protection in place

### Environment
- [ ] No hardcoded secrets
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] CORS properly configured
- [ ] Helmet security headers enabled

---

## 📚 Documentation

### README.md
- [ ] Project description clear
- [ ] Installation instructions complete
- [ ] Setup steps work
- [ ] Environment variables documented
- [ ] API documentation link included
- [ ] Testing instructions included
- [ ] Troubleshooting section (if needed)

### API Documentation
- [ ] `OPENAPI.yaml` exists and is valid
- [ ] All endpoints documented
- [ ] Request/response schemas defined
- [ ] Examples provided
- [ ] Error responses documented

### Other Documentation
- [ ] `EVAL.md` checklist complete
- [ ] `AI_USAGE.md` filled out
- [ ] Code comments where needed
- [ ] JSDoc comments for complex functions

---

## 🎨 Frontend

### Functionality
- [ ] Signup works
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect correctly
- [ ] Image upload works (drag & drop)
- [ ] Image preview works
- [ ] Generation form validates
- [ ] Generation request works
- [ ] Loading states display
- [ ] Error handling works
- [ ] Retry logic works
- [ ] History displays correctly
- [ ] History restore works
- [ ] Abort functionality works

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Loading indicators present
- [ ] Error messages clear
- [ ] Success feedback provided
- [ ] No console errors
- [ ] No broken images
- [ ] All links work

### Performance
- [ ] Fast initial load
- [ ] Smooth navigation
- [ ] No memory leaks
- [ ] Images optimized
- [ ] Bundle size reasonable

---

## 🔧 Backend

### API Endpoints
- [ ] `GET /health` works
- [ ] `POST /api/auth/signup` works
- [ ] `POST /api/auth/login` works
- [ ] `POST /api/generations` works (protected)
- [ ] `GET /api/generations` works (protected)
- [ ] All endpoints return correct status codes
- [ ] Error responses are consistent

### Middleware
- [ ] CORS configured correctly
- [ ] Helmet security headers
- [ ] Morgan logging works
- [ ] Error handling middleware works
- [ ] Authentication middleware works
- [ ] Validation middleware works
- [ ] File upload middleware works

### Services
- [ ] Auth service works
- [ ] Generation service works
- [ ] Error handling in services
- [ ] Database operations use transactions where needed

---

## 🚀 CI/CD

### GitHub Actions
- [ ] `.github/workflows/ci.yml` exists
- [ ] CI runs on push and PR
- [ ] All CI checks pass
- [ ] Tests run in CI
- [ ] Linting runs in CI
- [ ] Type checking runs in CI
- [ ] Coverage reports uploaded

### Workflow Quality
- [ ] Uses correct Node.js versions
- [ ] Uses pnpm correctly
- [ ] Environment variables set in CI
- [ ] Artifacts uploaded correctly

---

## 🗂️ Code Quality

### Structure
- [ ] Code is organized logically
- [ ] No circular dependencies
- [ ] Separation of concerns
- [ ] DRY principle followed
- [ ] Functions are focused and small

### Best Practices
- [ ] Error handling consistent
- [ ] Async/await used correctly
- [ ] No console.log in production code
- [ ] Comments explain "why" not "what"
- [ ] Variable names are descriptive
- [ ] Functions are pure where possible

### Git
- [ ] Meaningful commit messages
- [ ] No large files in git
- [ ] `.gitignore` is complete
- [ ] No sensitive data committed
- [ ] Branch structure is clean

---

## 🌐 Browser Compatibility

- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari (if applicable)
- [ ] Responsive on mobile
- [ ] Touch interactions work

---

## 📊 Performance

### Backend
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] File uploads efficient

### Frontend
- [ ] Bundle size reasonable
- [ ] Images optimized
- [ ] Lazy loading where appropriate
- [ ] No unnecessary re-renders

---

## 🧹 Cleanup

### Files
- [ ] No temporary files committed
- [ ] No test files in production
- [ ] No .env files committed
- [ ] Upload files not in git
- [ ] No node_modules committed

### Code
- [ ] No commented-out code
- [ ] No TODO comments (or documented)
- [ ] No debug code
- [ ] No unused imports
- [ ] No unused variables

---

## ✅ Final Verification

### Automated Checks
- [ ] Run `./verify.sh` - all checks pass
- [ ] All tests pass
- [ ] All linting passes
- [ ] All type checks pass
- [ ] Build succeeds

### Manual Checks
- [ ] Fresh clone test passes
- [ ] All features work manually
- [ ] No console errors
- [ ] Documentation is accurate

### Submission
- [ ] Repository is public (or access granted)
- [ ] Main branch is up to date
- [ ] All PRs merged (if applicable)
- [ ] README has submission info
- [ ] Contact information in README

---

## 🎯 Quick Verification Commands

Run these commands to quickly verify everything:

```bash
# Full verification
./verify.sh

# Individual checks
pnpm lint
pnpm type-check
pnpm build
pnpm test

# Fresh clone test (in separate directory)
cd /tmp
rm -rf test-clone
git clone <your-repo-url> test-clone
cd test-clone
pnpm install
# Follow setup instructions
pnpm build
pnpm test
```

---

## 📝 Notes

- Check each item systematically
- Don't skip any items
- Fix issues as you find them
- Re-verify after fixes
- Document any known limitations

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

Mark items as you complete them!


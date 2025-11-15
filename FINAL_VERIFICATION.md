# Final Verification Guide

This guide provides step-by-step instructions for final verification before submission.

## 🎯 Critical: Fresh Clone Testing

**This is the most important verification step!** It ensures your project works for reviewers.

### Step 1: Create a Fresh Clone

```bash
# Navigate to a temporary directory
cd /tmp
rm -rf modelia-test-clone

# Clone your repository
git clone https://github.com/MacDavicK/Modelia_Task.git modelia-test-clone
cd modelia-test-clone

# Checkout the main branch
git checkout main
```

### Step 2: Fresh Installation

```bash
# Install dependencies
pnpm install

# Verify Node.js version
node --version  # Should be >= 18.0.0

# Verify pnpm version
pnpm --version  # Should be >= 8.0.0
```

### Step 3: Environment Setup

```bash
# Backend environment
cd backend
cp .env.example .env  # If .env.example exists, otherwise create manually
# Edit .env with:
# - JWT_SECRET (min 32 characters)
# - DATABASE_URL
# - PORT=3001
# - Other required variables

# Frontend environment
cd ../frontend
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### Step 4: Database Setup

```bash
cd ../backend

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Verify database
pnpm prisma studio  # Should open without errors (optional)
```

### Step 5: Build and Test

```bash
# From project root
cd /tmp/modelia-test-clone

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Build the project
pnpm build

# Run all tests
pnpm test

# Run E2E tests (optional, requires both servers running)
pnpm test:e2e
```

### Step 6: Manual Server Start

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

**Expected Results:**
- Backend starts on http://localhost:3001
- Frontend starts on http://localhost:5173
- Health check: http://localhost:3001/health returns 200
- No errors in console

---

## 🧪 Manual Feature Testing

### Authentication Flow

1. **Signup**
   - Navigate to http://localhost:5173/signup
   - Enter email and password
   - Should redirect to /studio after successful signup
   - Check browser console for errors

2. **Login**
   - Navigate to http://localhost:5173/login
   - Enter credentials
   - Should redirect to /studio
   - Token should be stored in localStorage

3. **Protected Routes**
   - Try accessing http://localhost:5173/studio without logging in
   - Should redirect to /login
   - After login, should access /studio successfully

4. **Logout**
   - Click logout button
   - Should clear token and redirect to /login

### Image Generation Flow

1. **Upload Image**
   - Go to /studio
   - Drag and drop an image (JPEG/PNG, < 10MB)
   - Should show preview
   - Try invalid file type - should show error

2. **Generate**
   - Enter prompt (10-500 characters)
   - Select style (Realistic, Artistic, Minimalist, Vintage)
   - Click Generate
   - Should show loading state
   - Should display result or error message

3. **Error Handling**
   - If you get "Model overloaded" error, retry button should appear
   - Should retry up to 3 times with exponential backoff

4. **History**
   - After generating, check history section
   - Should show last 5 generations
   - Click on history item - should restore to form

5. **Abort**
   - Start generation
   - Click Abort button
   - Request should be cancelled

---

## 🔒 Security Verification

### Backend Security

1. **Password Hashing**
   - Check database - passwords should be hashed (not plain text)
   - Use Prisma Studio: `cd backend && pnpm prisma studio`

2. **JWT Tokens**
   - Check token in localStorage
   - Decode at jwt.io (don't share real tokens!)
   - Should contain userId and expiration

3. **Protected Routes**
   - Try accessing `/api/generations` without token
   - Should return 401

4. **Input Validation**
   - Try invalid email format - should return 400
   - Try short password - should return 400
   - Try invalid file type - should return 400

5. **CORS**
   - Check browser Network tab
   - CORS headers should be present
   - Only allowed origins should work

### Frontend Security

1. **Token Storage**
   - Check localStorage - token should be stored
   - Check that password is NOT stored

2. **XSS Protection**
   - Try entering `<script>alert('xss')</script>` in prompt
   - Should be sanitized/escaped

3. **File Validation**
   - Try uploading large file (> 10MB) - should be rejected
   - Try uploading non-image - should be rejected

---

## ⚡ Performance Checks

### Backend Performance

1. **Response Times**
   - Health check: < 50ms
   - Signup/Login: < 200ms
   - Generation: 1-2 seconds (simulated delay)

2. **Database Queries**
   - Check Prisma logs for N+1 queries
   - Use `prisma.$on('query')` to monitor

3. **File Upload**
   - Test with various file sizes
   - Should handle up to 10MB efficiently

### Frontend Performance

1. **Bundle Size**
   ```bash
   cd frontend
   pnpm build
   # Check dist/ folder size
   # Should be reasonable (< 5MB for production build)
   ```

2. **Load Time**
   - Open DevTools Network tab
   - First load should be < 3 seconds
   - Subsequent navigation should be instant (SPA)

3. **Memory Leaks**
   - Use Chrome DevTools Memory profiler
   - Navigate around app for 5 minutes
   - Memory should not continuously grow

---

## 🌐 Browser Testing

Test in multiple browsers:

1. **Chrome/Edge** (Chromium)
   - Full functionality
   - DevTools for debugging

2. **Firefox**
   - Verify all features work
   - Check console for errors

3. **Safari** (if on Mac)
   - Verify compatibility
   - Check for Safari-specific issues

4. **Mobile Browsers** (optional)
   - Test responsive design
   - Touch interactions

---

## 📋 Pre-Submission Checklist

Before final submission, verify:

- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Fresh clone test passes (see above)
- [ ] All features work manually
- [ ] No console errors in browser
- [ ] README.md is complete and accurate
- [ ] OPENAPI.yaml is up to date
- [ ] EVAL.md checklist is complete
- [ ] AI_USAGE.md is filled out
- [ ] .gitignore excludes sensitive files
- [ ] No upload files in git history
- [ ] CI/CD pipeline passes
- [ ] All commits have meaningful messages
- [ ] Code is properly formatted (Prettier)
- [ ] No hardcoded secrets or API keys

---

## 🐛 Common Issues and Fixes

### Issue: Tests fail in CI but pass locally

**Fix:**
- Check environment variables in CI
- Verify database setup in CI
- Check Node.js version matches

### Issue: Build fails

**Fix:**
- Check TypeScript errors: `pnpm type-check`
- Verify all imports are correct
- Check for missing dependencies

### Issue: Fresh clone fails

**Fix:**
- Verify all dependencies are in package.json
- Check that .env.example exists
- Ensure migrations are committed

### Issue: CORS errors

**Fix:**
- Check ALLOWED_ORIGINS in backend/.env
- Verify CORS middleware configuration
- Check browser console for specific error

---

## ✅ Final Sign-Off

Once all checks pass:

1. **Commit any final fixes**
   ```bash
   git add .
   git commit -m "chore: final pre-submission fixes"
   git push origin main
   ```

2. **Verify CI passes**
   - Check GitHub Actions
   - All checks should be green ✓

3. **Create release tag** (optional)
   ```bash
   git tag -a v1.0.0 -m "Initial submission"
   git push origin v1.0.0
   ```

4. **Document any known issues**
   - Add to README.md if needed
   - Note in EVAL.md if features are incomplete

---

## 🎉 You're Ready!

If all checks pass, your project is ready for submission!

Good luck! 🚀


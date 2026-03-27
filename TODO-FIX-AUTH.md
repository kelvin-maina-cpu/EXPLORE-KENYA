# Fix Authentication & M-Pesa Errors

✅ **Plan approved** - User confirmed to proceed

## Steps:

### 1. [x] Create this TODO.md

### 2. [x] Update Backend/services/mpesaService.js

- Add axios timeout/retry for getAuthToken
- Better error logging
- Fallback handling

### 3. [x] Update Backend/controllers/authController.js

- Sanitize/validate inputs before User.create
- Parse Mongoose validation errors
- Log invalid data

### 4. [x] Update Frontend/app/(auth)/register.jsx

- Client-side email validation
- Better error display

### 5. [x] Test fixes

**Run these to verify:**

```
cd Backend && npm start
# Test register (use Postman/curl):
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"password\":\"123456\"}'
# Test with invalid email: {\"email\":\"invalid\"} → should get validation msg

# Frontend: expo start --clear, test register form
# M-Pesa booking: requires auth + attraction, check console for retry logs
```

### 6. [ ] User actions

- `ping sandbox.safaricom.co.ke` (if fails: proxy/firewall → use MPESA_ENDPOINT=https://api.safaricom.co.ke in Backend/.env)
- Verify Backend/.env has MPESA_CONSUMER_KEY etc.
- For local callback: `npx ngrok http 5000` → update MPESA_CALLBACK_URL

- `ping sandbox.safaricom.co.ke`
- Verify MPESA\_\* .env vars
- Consider ngrok for callbacks

**Status**: Starting edits...

**Notes**:

- M-Pesa sandbox DNS often blocked (proxy/firewall)
- Use production endpoint if creds available
- Email validation: backend + frontend double-check

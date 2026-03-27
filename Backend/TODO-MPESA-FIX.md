# MPESA Bug Fix Progress ✓

## Completed:

- [x] 1. Replaced Backend/services/mpesaService.js with fixed code:
     | Fix | Before | After |
     |-----|--------|-------|
     | Timestamp | `replace(/[:.]/g, '')` → "2024-10-02T12..." | `replace(/[-T:.Z]/g,'').slice(0,14)` → "2024100212..." |
     | ENDPOINT | Potential space in .env | `.trim()` + clean example |
     | Amount | raw float | `Math.round(parseFloat())` integer |
     | Phone | no norm | `normalizePhone()` → 254XXXXXXXXX |
     | Logs/Retry | basic | Full debug + validation |
- [x] 2. Created Backend/.env.example clean template (MPESA_ENV=sandbox added)

## Testing:

- [ ] 3. `cd Backend && npm start` (restart server)
- [ ] 4. Run curl test → check console: "Timestamp: ..." (14 digits), no 400

**Test command:**

```
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "attractionId": "test-attraction",
    "package": "Standard",
    "date": "2024-10-02",
    "participants": 1,
    "paymentMethod": "mpesa",
    "totalAmount": 100,
    "phoneNumber": "254712345678"
  }'
```

**Expected:** M-Pesa prompt on phone, logs show valid payload. For callbacks: `npx ngrok http 5000` → update .env.

Task complete once tested! 🚀

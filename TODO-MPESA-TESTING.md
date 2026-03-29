# M-Pesa Sandbox Testing TODO

## Current Step: [1/7] ✅ Check/Install Dependencies

**Completed:**

- [x] 1. Check node-cron (Backend)

**Todo:**

- [ ] 2. Install deps if missing: `cd Backend && npm i node-cron`
- [ ] 3. Start server: `cd Backend && npm start`
- [ ] 4. Setup ngrok: `npx ngrok http 5000` → copy HTTPS URL
- [ ] 5. Update Backend/.env: `MPESA_CALLBACK_URL=https://xxx.ngrok-free.app/api/mpesa`
- [ ] 6. Restart server
- [ ] 7. Test register C2B: `curl POST /api/mpesa/register-c2b`
- [ ] 8. Test STK: `curl POST /api/mpesa/stk-push {...}`
- [ ] 9. Add debug route to mpesaRoutes.js
- [ ] 10. Run full test script, monitor callbacks/DB/poller
- [ ] 11. Verify Transactions/Bookings updated

**Commands ready to copy-paste.**

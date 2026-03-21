# Backend Debug & Fix Progress

Current working dir: Backend/

## Approved Plan Steps:

- [ ] 1. Backend/package.json: Add axios
- [ ] 2. server.js: Async DB connect before listen
- [ ] 3. config/db.js: Add retry logic, remove process.exit
- [ ] 4. controllers/bookingController.js: Fix stkPush args + use real phone
- [ ] 5. services/mpesaService.js: Dynamic callback URL
- [ ] 6. routes/mpesaRoutes.js: Fix booking lookup with CheckoutRequestID
- [ ] 7. models/Booking.js: Add mpesaCheckoutId field
- [ ] 8. Create Backend/.env.example
- [ ] 9. Install deps: cd Backend && npm install
- [ ] 10. Test server: cd Backend && npm run dev
- [ ] 11. Test booking API

**Next:** Execute step-by-step.

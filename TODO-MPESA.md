# Explore Kenya - M-Pesa Booking Integration (Real API Ready)

Status: User approved real payment integration (M-Pesa/STK Push).

## Backend M-Pesa Service

- [ ] 1. Backend/services/mpesaService.js: STK Push, OAuth token, callback validation
- [ ] 2. Backend/controllers/bookingController.js: createBooking → M-Pesa push → pending status
- [ ] 3. Add M-Pesa callback route /api/mpesa/callback (validate, update Booking status 'paid')

## Frontend Booking Flow

- [ ] 4. Frontend/src/screens/BookingScreen.tsx (attractionId prop, form: date/participants/total)
- [ ] 5. Frontend/src/screens/HomeScreen.tsx: Add 'Book Now' → navigate('Booking', {attraction})
- [ ] 6. App.tsx: Add BookingScreen to Stack

## Security & Config

- [ ] 7. Update .env.example: M-PESA\_ keys (sandbox → production switch)
- [ ] 8. Ngrok for callback URL (local dev: ngrok http 5000)

## Test Flow

1. Frontend book → Backend create + STK push → Phone M-Pesa prompt
2. User pays → Callback → status 'paid', email receipt

**Next:** Implement step-by-step.
Progress: 5/8 ( + HomeScreen Book button, App navigator, axios deps)

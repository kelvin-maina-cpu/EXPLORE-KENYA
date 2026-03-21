# MULTI-LANGUAGE + COUNTRY SELECTOR PLAN

## Overview

Expand to 5 languages (English/en, Kiswahili/sw, Chinese Simplified/zh-CN, Spanish/es, French/fr, German/de). Country selector in profile auto-sets language.

## Steps (0/8)

1. [ ] Update LocalizationContext.jsx: Add zh-CN, es, fr, de translations (~100 keys each from en)
2. [ ] Update Frontend/app/(tabs)/profile.jsx: Expand language chips to 6 options, add country selector (dropdown/search ~20 countries mapped to langs)
3. [ ] Add country->language mapping (e.g. Kenya:'sw', China:'zh-CN', Mexico:'es')
4. [ ] Add t() to LandingShowcase.jsx hardcoded strings, update FEATURE_CARDS to t()
5. [ ] Add useLocale/t() to other major files (attractions.jsx, bookings.jsx, live.jsx, attraction/[id].jsx)
6. [ ] Backend: Add user.preferences.country/language to User model/controller if needed
7. [ ] Test: Profile language/country toggle, app-wide Swahili/Spanish/etc switching
8. [ ] Mark complete

**Country-Lang Mapping Examples:**

- Kenya: 'sw'
- Tanzania: 'sw'
- China: 'zh-CN'
- Spain: 'es'
- Mexico: 'es'
- France: 'fr'
- Germany: 'de'
- USA/UK: 'en'

Proceed step-by-step.

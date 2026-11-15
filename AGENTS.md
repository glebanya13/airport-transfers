## Architecture rules
- Prices are computed by the pure engine in `src/lib/pricing.ts` + `src/lib/quote.ts`; the server recomputes on booking, never trust client totals.
- Public pages live under `/$lang` (en/es/ru); all copy goes through `src/lib/i18n.ts`.
- Bookings are never readable by anon; customer access goes through server functions that match code + email.
- Staff access uses `user_roles` + `is_staff()`; the first signed-up user becomes admin automatically.

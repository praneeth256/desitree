# Fix Contact Form and View Counter Issues

## Issues
1. Contact/DMCA form fails with "Failed to send message" - `submitContactForm` doesn't call `ensureAuth()` before writing to Firestore, violating the `request.auth != null` rule.
2. View counter appears to increase on Player but reverts on Home - `incrementVideoViews` silently swallows all errors, so Player optimistically updates UI even when Firestore write fails. Home uses stale one-time `getDocs` data.

## Plan & Progress

- [x] Fix `api.js`: Add `ensureAuth()` to `submitContactForm`, make `incrementVideoViews` propagate errors
- [x] Fix `Player.jsx`: Only optimistically update views on success, add sessionStorage deduplication
- [x] Fix `Home.jsx`: Switch to Firestore `onSnapshot` real-time listener for live view counts
- [x] Test and verify (build passes successfully)


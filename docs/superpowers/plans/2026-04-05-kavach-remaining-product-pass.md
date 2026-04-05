# Kavach Remaining Product Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the major gaps left after the intelligent worker/admin pass by adding durable records, OTP-style auth flows, notifications, claim timelines, admin fraud actions, live disruption adapters, and mobile/web parity for those flows.

**Architecture:** Extend the existing Express + shared-contract core instead of replacing it. Add new persisted operational records to the store layer, expose them through additive APIs, then layer worker/admin web and Flutter flows on top with provider adapters for OTP, notifications, payouts, and disruption feeds that remain mock-safe when credentials are absent.

**Tech Stack:** React 18, TypeScript, Vite, Express 5, SQLite / Firestore, Flutter, Provider, SharedPreferences, mock-safe provider adapters

---

### Task 1: Durable backend records

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\store.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\firestore-store.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\types.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\packages\shared\src\types.ts`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\server\auth.integration.test.ts`

- [ ] Add persistent record types for OTP challenges, notifications, claim timeline events, payout records, fraud reviews, and feature flags.
- [ ] Extend SQLite schema and Firestore collections for those records without breaking existing users/sessions/settings.
- [ ] Add store methods for create/list/update operations used by worker and admin APIs.
- [ ] Add server tests that prove records persist and round-trip through the store-backed APIs.

### Task 2: OTP and auth adapters

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\app.ts`
- Create: `C:\Users\sseja\OneDrive\Desktop\kavach\server\providers\otp.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\packages\shared\src\contracts.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\packages\shared\src\types.ts`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\server\auth.integration.test.ts`

- [ ] Add OTP request and verify endpoints that issue short-lived challenges for signup/login.
- [ ] Implement a mock-safe OTP provider that can later swap to SMS/WhatsApp providers via env vars.
- [ ] Keep the current phone login available only as a controlled demo/dev fallback.
- [ ] Add tests for OTP request, invalid code, valid code, expiry, and session creation.

### Task 3: Notifications, claim timeline, and payout persistence

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\app.ts`
- Create: `C:\Users\sseja\OneDrive\Desktop\kavach\server\providers\notifications.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\intelligence.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\packages\shared\src\types.ts`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\server\auth.integration.test.ts`

- [ ] Persist every simulated payout and support escalation as records instead of in-memory only.
- [ ] Build worker notification and claim timeline payloads from persisted events.
- [ ] Add receipt/share metadata and support ticket status to those timelines.
- [ ] Add adapter-backed notification emission hooks for in-app, email, and WhatsApp-like channels with mock-safe defaults.

### Task 4: Live disruption adapters and admin actions

**Files:**
- Create: `C:\Users\sseja\OneDrive\Desktop\kavach\server\providers\signals.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\intelligence.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\server\app.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\packages\shared\src\types.ts`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\server\auth.integration.test.ts`

- [ ] Add weather and AQI provider adapters that use public live endpoints when available and deterministic fallback snapshots otherwise.
- [ ] Keep traffic and civic disruption on provider adapters with persisted mock feeds unless keys are already configured.
- [ ] Add admin fraud review actions: approve, reject, escalate, resolve.
- [ ] Add admin payout ops views and feature flag records for staged rollout.

### Task 5: Web worker flows

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\utils\api.ts`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\context\AuthContext.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\context\AppDataContext.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\LoginPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\DashboardPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\ClaimsPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\AlertsPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\PolicyPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\ProfilePage.tsx`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\web\*.test.tsx`

- [ ] Replace worker login with OTP request/verify UX.
- [ ] Add worker notifications inbox and claim timeline surfaces.
- [ ] Add premium-explanation details, support ticket status, receipt/share actions, and feature-flag-aware worker UI.
- [ ] Add tests covering OTP UX, inbox/timeline rendering, and new action wiring.

### Task 6: Web admin and landing

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\AnalyticsPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\pages\LandingPage.tsx`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\src\components\Navbar.tsx`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\tests\web\*.test.tsx`

- [ ] Add admin fraud review actions and payout-ops sections.
- [ ] Add zone forecast board and simple cohort filter controls.
- [ ] Add landing-page trust proof, payout examples, and FAQ/education content.
- [ ] Add tests for admin actions and landing trust/FAQ rendering.

### Task 7: Flutter worker parity

**Files:**
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\services\kavach_api_client.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\providers\app_provider.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\models\app_data.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\login_screen.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\dashboard_screen.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\claims_screen.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\alerts_screen.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\profile_screen.dart`
- Modify: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\lib\screens\main_layout.dart`
- Test: `C:\Users\sseja\OneDrive\Desktop\kavach\flutter_kavach\test\**\*.dart`

- [ ] Add OTP-style login UX and session restore using the new backend contract.
- [ ] Add notifications/timeline/support-ticket UI in worker flows.
- [ ] Cache last-known worker payload locally for offline fallback instead of fake success states.
- [ ] Add receipt sharing hooks and tests for parsing/provider behavior.

### Task 8: Verification and release

**Files:**
- Modify as needed: repo verification files only

- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Run `flutter test`
- [ ] Run `flutter analyze`
- [ ] Run `flutter build apk --release`
- [ ] Replace `C:\Users\sseja\OneDrive\Desktop\kavach\public\downloads\kavach-android.apk` with the fresh release build
- [ ] Commit, push to `master`, wait for Vercel production, and verify live routes/APIs/APK

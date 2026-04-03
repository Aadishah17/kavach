# Kavach

## Inspiration

Gig delivery workers in India lose income to rain, flooding, pollution spikes, curfews, and civic disruptions, but most insurance products are too slow, too generic, or too complicated to help in the moment. Kavach was built as a calmer alternative: parametric income protection designed around how delivery workers actually earn, move, and get paid.

## What it does

Kavach is a full-stack parametric income insurance product demo for gig workers on platforms like Swiggy, Zomato, Blinkit, and Amazon Flex.

It currently includes:

- A public marketing website that explains the product, coverage triggers, pricing, and trust model
- A guided onboarding flow for worker signup and plan activation
- A protected worker dashboard with payouts, coverage status, alerts, and risk visibility
- A claims and payouts experience with trust-score verification signals
- An admin analytics view for premiums, claims, fraud signals, and financial health
- Policy, alerts, and profile flows for the web app
- A mobile app companion built with React Native and Expo
- A real backend with persistent users, sessions, and profile settings stored in SQLite

## How we built it

We built Kavach as a shared full-stack codebase with separate web, backend, and mobile surfaces.

- **Web:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Recharts
- **Backend:** Express 5, TypeScript, Zod validation, SQLite via Node's built-in `node:sqlite`
- **Mobile:** React Native, Expo, TypeScript
- **Shared contracts:** a dedicated `packages/shared` module that holds API and domain types used by the server, web app, and mobile app

The backend now handles:

- Demo login and worker signup
- Persistent session creation and revocation
- Role-based access for worker versus admin routes
- Profile settings storage and retrieval
- Shared bootstrap data for dashboard, claims, analytics, policy, alerts, and profile screens

On the frontend side, we used a unified Kavach design system built around **DM Serif Display**, **DM Sans**, **Space Mono**, and a tightly controlled navy, sky, gold, green, orange, and red palette to keep the product trustworthy and visually consistent across both web and mobile.

## Challenges we ran into

- Designing both a convincing public brand experience and a believable operational product in the same hackathon repo
- Keeping web and mobile data contracts aligned while the product surface kept expanding
- Replacing the early demo JSON persistence with a real database-backed session flow without breaking the existing app
- Making the admin analytics experience feel useful while still keeping the worker-facing flows simple
- Preserving visual polish across landing, dashboard, claims, onboarding, and mobile screens without drifting away from the brand rules

## Accomplishments that we're proud of

- Built a real multi-surface product instead of stopping at a landing page
- Added a working backend with persistent SQLite storage, session auth, and role gates
- Extracted shared API and domain types into one package so web, backend, and mobile stay aligned
- Delivered both a browser experience and a mobile app from the same product system
- Shaped the product story around a real underserved user group and a practical insurance mechanism

## What we learned

- Parametric insurance becomes much easier to understand when the product focuses on triggers, speed, and payout certainty instead of policy jargon
- Shared contracts matter early once web, backend, and mobile start moving in parallel
- Even hackathon apps feel much more credible when auth, persistence, and role-based behavior are actually wired end to end
- Strong design constraints make it easier to scale from storytelling pages into operational product UX

## What's next for Kavach

- Integrate live weather, AQI, mobility, and civic disruption feeds instead of static demo data
- Replace local/demo-only identity with production-grade authentication and secure deployment configuration
- Add real payout orchestration through UPI-compatible settlement rails
- Move from SQLite demo persistence to managed production infrastructure for pilots
- Add multilingual support, worker language preferences, and city-specific rollout logic
- Expand the mobile app with deeper navigation, notifications, and offline-ready worker flows

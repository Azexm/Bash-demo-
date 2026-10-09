# Bash — Live Events & Clubs (Next.js)

Next.js 14 (App Router) port of the "Bash" ticket-booking frontend that was originally a Create React App build.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET
npm run dev                  # http://localhost:3000
```

## Roles and panels

Every account has one role. Each role lands on its own page after sign-in.

| Role | Lands on | What it can do |
| --- | --- | --- |
| `user` | `/` and `/tickets` | Sees clubs in the detected city, books tickets, sees ticket status |
| `club_admin` | `/club` | Creates and publishes events (flyer, genre tags, booking type, ticket categories with quotas, homepage placement). Reviews the booking queue (approve, reject, cancel, transfer, resend ticket). Creates gate accounts. Reads the scan log. |
| `gate` | `/gate` | Scans ticket codes at the door. Each scan is logged as admitted, already used, declined or invalid. |
| `developer` | `/dev` | Everything: all clubs (capacity, quota allocation, bookings, revenue, staff), all users (change roles), all bookings, payment gateways. |

Demo accounts, created on first request (disable with `DEMO_USER=off`):

| Email | Password | Role |
| --- | --- | --- |
| `test@bash.in` | `test1234` | user |
| `club@bash.in` | `club1234` | club_admin (Ballrs, Pune) |
| `gate@bash.in` | `gate1234` | gate (Ballrs, Pune) |
| `dev@bash.in` | `dev12345` | developer |

Change these passwords before going live.

## Booking flow

- **Non-exclusive**: pay, and the ticket is approved straight away and emailed.
- **Guestlist**: free. The guest uploads an ID photo. The booking waits in the club's Pending queue until the club approves it, and only then is a ticket issued.
- **Exclusive**: pay, and the booking waits in Pending for club review. If the club rejects it, a refund is needed (the refund itself is not automated).

Statuses: `awaiting_payment` → `pending` → `approved` / `rejected` / `cancelled`. Every decision except transfer deletes the guest's ID photo and records `photo deleted at`. The club can see that confirmation in the drawer.

Quotas: each ticket category has a quota. The quotas for all published events on one date at one club must fit inside the venue capacity. The check runs on save and on publish, and the server enforces it.

## Location

On every page load the browser asks for location once. The GPS fix is mapped to the nearest city we run clubs in, and that city is shown under the Bash logo. If location is refused, the last city the user chose is used, and Pune is the default.

## Database (Neon Postgres)

Users, user-created events, bookings and login-throttle data live in Neon. Seed events stay in `src/data/seedEvents.js`.
Tables are created automatically on the first request; `scripts/schema.sql` (or `npm run db:setup`) does the same by hand.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add the Neon integration (Vercel > Storage > Neon, or Marketplace). It injects `DATABASE_URL` for you.
3. Add `AUTH_SECRET` (`openssl rand -hex 32`) under Project Settings > Environment Variables.
4. Optional: add `RESEND_API_KEY` and `EMAIL_FROM` for ticket emails.
5. Deploy. Demo logins are listed under "Roles and panels" (set `DEMO_USER=off` to disable them).

## Not yet real

- **Payments** are simulated. The gateway chosen in the Developer panel is recorded on each booking, but no money moves. Wire the SDK into `src/app/api/bookings/pay/route.js`.
- **Gate camera scanning**: tickets now show a QR (generated in `src/lib/qr.js`, no extra package) that encodes the `BASH-XXXXXXXX` code. The gate page accepts a typed code or a handheld/keyboard-style scanner; it has no built-in camera scanner yet.
- **Refunds** for rejected exclusive bookings are not automated.

## Routes

| URL | File |
| --- | --- |
| `/` | `src/app/page.jsx` → `src/views/HomePage.jsx` |
| `/club` | Club Panel (club_admin) |
| `/gate` | Gate scanner (gate, club_admin) |
| `/dev` | Developer Panel (developer) |
| `/events/[id]` | `src/app/events/[id]/page.jsx` |
| `/book/[id]?tier=VIP` | `src/app/book/[id]/page.jsx` |
| `/tickets` | `src/app/tickets/page.jsx` |
| `/login`, `/register` | `src/app/login`, `src/app/register` |

## What changed from the CRA version

- `react-router-dom` replaced with `next/link` and `next/navigation` (small `useNav` and `NavLink` helpers keep the old call sites unchanged).
- `REACT_APP_BACKEND_URL` replaced by a `/api` rewrite to `BACKEND_URL`.
- Components using hooks or browser APIs are marked `"use client"`.
- `index.css` and `App.css` merged into `src/app/globals.css`; Tailwind config is the default (the original config wasn't in the export).

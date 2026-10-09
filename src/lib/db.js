// Neon Postgres connection (server only).
// Uses Neon's serverless driver, which talks to Postgres over HTTPS, so it works
// on Vercel serverless/edge functions with no connection pooling headaches.
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { promisify } from "util";
import { seedClubs } from "@/data/seedClubs";
import { newBashId } from "@/lib/bashId";

const scrypt = promisify(crypto.scrypt);

let _sql = null;
export function getSql() {
    if (_sql) return _sql;
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            "DATABASE_URL is not set. Add your Neon connection string to .env.local (and to Vercel env vars).",
        );
    }
    // Next.js 14 caches server-side fetch() calls, and the Neon HTTP driver uses fetch,
    // so identical queries could return stale results. Always bypass that cache.
    _sql = neon(url, { fetchOptions: { cache: "no-store" } });
    return _sql;
}

/** Tagged-template query helper: await sql`select * from users where id = ${id}` */
export const sql = (strings, ...values) => getSql()(strings, ...values);

// Run a plain SQL string. Newer driver versions (1.x) use sql.query(); 0.x calls sql(string) directly.
const run = (q, text) => (typeof q.query === "function" ? q.query(text) : q(text));

/* ---------- schema (idempotent; also available as scripts/schema.sql) ---------- */
const STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS users (
        id            text PRIMARY KEY,
        name          text NOT NULL,
        email         text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now()
    )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS club_id text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bash_id text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_bash_id_key ON users (bash_id)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_top text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_side text`,
    `CREATE TABLE IF NOT EXISTS events (
        id         text PRIMARY KEY,
        data       jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS clubs (
        id         text PRIMARY KEY,
        data       jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
        id             text PRIMARY KEY,
        user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id       text NOT NULL,
        tier           text NOT NULL,
        quantity       integer NOT NULL,
        amount         integer NOT NULL,
        attendee_name  text NOT NULL,
        attendee_email text NOT NULL,
        attendee_phone text NOT NULL,
        id_type        text NOT NULL,
        id_last4       text NOT NULL,
        event_title    text,
        event_venue    text,
        event_city     text,
        event_date     text,
        event_time     text,
        event_image    text,
        status         text NOT NULL DEFAULT 'pending',
        ticket_code    text UNIQUE,
        payment_method text,
        paid_at        timestamptz,
        created_at     timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id, created_at DESC)`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_id text`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'non_exclusive'`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_gateway text`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_reason text`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_by text`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transferred_from text`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS used_at timestamptz`,
    `CREATE INDEX IF NOT EXISTS bookings_club_idx ON bookings (club_id, created_at DESC)`,
    // Flyers and other public images (served by /api/assets/[id])
    `CREATE TABLE IF NOT EXISTS assets (
        id         text PRIMARY KEY,
        mime       text NOT NULL,
        data       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    // Guest ID photos. Never served to users; club staff only. Blanked + deleted_at set on decision.
    `CREATE TABLE IF NOT EXISTS id_photos (
        booking_id text PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
        data       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS scan_logs (
        id           text PRIMARY KEY,
        booking_id   text,
        ticket_code  text,
        event_id     text,
        club_id      text,
        gate_user_id text,
        gate_name    text,
        result       text NOT NULL,
        reason       text,
        scanned_at   timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS scan_logs_club_idx ON scan_logs (club_id, scanned_at DESC)`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS attendee_name text`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS attendee_phone text`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS event_title text`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS tier text`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS quantity integer`,
    `ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS decided_at timestamptz`,
    `CREATE TABLE IF NOT EXISTS email_logs (
        id         text PRIMARY KEY,
        booking_id text,
        to_email   text,
        subject    text,
        status     text NOT NULL,
        error      text,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS payment_gateways (
        id         text PRIMARY KEY,
        name       text NOT NULL,
        enabled    boolean NOT NULL DEFAULT false,
        mode       text NOT NULL DEFAULT 'test',
        key_id     text,
        updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS login_attempts (
        email      text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS login_attempts_idx ON login_attempts (email, created_at)`,
    `CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
    )`,
];

const GATEWAY_SEEDS = [
    ["razorpay", "Razorpay", true],
    ["stripe", "Stripe", false],
    ["payu", "PayU", false],
    ["cashfree", "Cashfree", false],
];

// Demo accounts, one per role. Disable all of them with DEMO_USER=off.
const demoAccounts = () => {
    const puneClub = seedClubs.find((c) => c.city_slug === "pune")?.id ?? null;
    return [
        { name: "Test User", email: "test@bash.in", password: "test1234", role: "user", club_id: null },
        { name: "Ballrs Club Admin", email: "club@bash.in", password: "club1234", role: "club_admin", club_id: puneClub },
        { name: "Ballrs Gate", email: "gate@bash.in", password: "gate1234", role: "gate", club_id: puneClub },
        { name: "Bash Developer", email: "dev@bash.in", password: "dev12345", role: "developer", club_id: null },
    ];
};

async function migrateOnce(q, name, fn) {
    const done = await q`SELECT 1 FROM schema_migrations WHERE name = ${name}`;
    if (done.length) return;
    await fn();
    await q`INSERT INTO schema_migrations (name) VALUES (${name}) ON CONFLICT DO NOTHING`;
}

// Gives every user without a Bash ID one (existing users, demo accounts).
async function backfillBashIds(q) {
    const missing = await q`SELECT id FROM users WHERE bash_id IS NULL`;
    for (const row of missing) {
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                await q`UPDATE users SET bash_id = ${newBashId()} WHERE id = ${row.id} AND bash_id IS NULL`;
                break;
            } catch (e) {
                if (e?.code !== "23505") throw e; // collision: try another ID
            }
        }
    }
}

let ready = null;

/**
 * Creates tables on first use (once per server instance) and seeds demo data.
 * Every store function awaits this, so no manual migration step is required.
 */
export function ensureReady() {
    if (!ready) {
        ready = (async () => {
            const q = getSql();
            for (const stmt of STATEMENTS) {
                try {
                    await run(q, stmt);
                } catch (e) {
                    // two cold starts racing on CREATE TABLE IF NOT EXISTS: retry once
                    await run(q, stmt);
                }
            }

            // One-time rename of the old booking statuses: confirmed -> approved, pending -> awaiting_payment.
            await migrateOnce(q, "booking-status-v2", async () => {
                await q`UPDATE bookings SET status = 'approved' WHERE status = 'confirmed'`;
                await q`UPDATE bookings SET status = 'awaiting_payment' WHERE status = 'pending'`;
            });

            for (const [id, name, enabled] of GATEWAY_SEEDS) {
                await q`INSERT INTO payment_gateways (id, name, enabled, mode)
                        VALUES (${id}, ${name}, ${enabled}, 'test') ON CONFLICT (id) DO NOTHING`;
            }

            if (process.env.DEMO_USER !== "off") {
                for (const acc of demoAccounts()) {
                    const existing = await q`SELECT 1 FROM users WHERE email = ${acc.email}`;
                    if (existing.length) continue;
                    const salt = crypto.randomBytes(16).toString("hex");
                    const hash = (await scrypt(acc.password, salt, 64)).toString("hex");
                    await q`INSERT INTO users (id, name, email, password_hash, role, club_id)
                            VALUES (${crypto.randomBytes(12).toString("hex")}, ${acc.name}, ${acc.email},
                                    ${salt + ":" + hash}, ${acc.role}, ${acc.club_id})
                            ON CONFLICT (email) DO NOTHING`;
                }
            }
            await backfillBashIds(q);
        })().catch((e) => {
            ready = null; // let the next request try again
            throw e;
        });
    }
    return ready;
}

export const STATEMENTS_SQL = STATEMENTS.map((s) => s + ";").join("\n\n");

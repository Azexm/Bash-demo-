-- Schema for Bash. Optional: the app creates these tables automatically on first request.
-- Run in the Neon SQL editor, or with: npm run db:setup
--
-- The one-time booking status rename (confirmed -> approved, pending -> awaiting_payment)
-- is NOT in this file. The app runs it once, and it must never run twice.
CREATE TABLE IF NOT EXISTS users (
        id            text PRIMARY KEY,
        name          text NOT NULL,
        email         text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now()
    );

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

ALTER TABLE users ADD COLUMN IF NOT EXISTS club_id text;

CREATE TABLE IF NOT EXISTS events (
        id         text PRIMARY KEY,
        data       jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS clubs (
        id         text PRIMARY KEY,
        data       jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS bookings (
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
    );

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id, created_at DESC);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_id text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'non_exclusive';

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_gateway text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_reason text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_by text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transferred_from text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS used_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_club_idx ON bookings (club_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assets (
        id         text PRIMARY KEY,
        mime       text NOT NULL,
        data       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS id_photos (
        booking_id text PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
        data       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
    );

CREATE TABLE IF NOT EXISTS scan_logs (
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
    );

CREATE INDEX IF NOT EXISTS scan_logs_club_idx ON scan_logs (club_id, scanned_at DESC);

CREATE TABLE IF NOT EXISTS email_logs (
        id         text PRIMARY KEY,
        booking_id text,
        to_email   text,
        subject    text,
        status     text NOT NULL,
        error      text,
        created_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS payment_gateways (
        id         text PRIMARY KEY,
        name       text NOT NULL,
        enabled    boolean NOT NULL DEFAULT false,
        mode       text NOT NULL DEFAULT 'test',
        key_id     text,
        updated_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS login_attempts (
        email      text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS login_attempts_idx ON login_attempts (email, created_at);

CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
    );
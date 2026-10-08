// Server-only auth: users in Neon (table: users), scrypt password hashes, signed tokens.
import crypto from "crypto";
import { promisify } from "util";
import { sql, ensureReady } from "@/lib/db";

const scrypt = promisify(crypto.scrypt);
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ---------- secret ---------- */
// Set AUTH_SECRET in Vercel (e.g. `openssl rand -hex 32`). Serverless has no persistent
// disk, so there is no file fallback; local dev uses a fixed insecure secret.
function getSecret() {
    if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
        throw new Error("AUTH_SECRET is not set. Add it to your Vercel environment variables.");
    }
    return "dev-only-insecure-secret";
}

/* ---------- passwords ---------- */
export async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = (await scrypt(password, salt, 64)).toString("hex");
    return `${salt}:${hash}`;
}

export async function verifyPassword(password, stored) {
    const [salt, hash] = String(stored).split(":");
    if (!salt || !hash) return false;
    const attempt = await scrypt(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
}

/* ---------- tokens ---------- */
const b64 = (buf) => Buffer.from(buf).toString("base64url");

export async function signToken(userId) {
    const body = b64(JSON.stringify({ sub: userId, exp: Date.now() + TOKEN_TTL_MS }));
    const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
    return `${body}.${sig}`;
}

async function verifyToken(token) {
    const [body, sig] = String(token).split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
        return payload.exp > Date.now() ? payload : null;
    } catch {
        return null;
    }
}

/* ---------- users ---------- */
export const publicUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    club_id: u.club_id || null,
});

export async function findUserByEmail(email) {
    await ensureReady();
    const rows = await sql`SELECT * FROM users WHERE email = ${String(email).trim().toLowerCase()}`;
    return rows[0] || null;
}

export async function createUser({ name, email, password, role = "user", club_id = null }) {
    await ensureReady();
    const clean = String(email).trim().toLowerCase();
    const rows = await sql`
        INSERT INTO users (id, name, email, password_hash, role, club_id)
        VALUES (${crypto.randomBytes(12).toString("hex")}, ${String(name).trim()}, ${clean},
                ${await hashPassword(password)}, ${role}, ${club_id})
        ON CONFLICT (email) DO NOTHING
        RETURNING *`;
    return rows[0] || null; // null = already registered
}

/** Reads "Authorization: Bearer <token>" and returns the user, or null. */
export async function getUserFromRequest(req) {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    await ensureReady();
    const rows = await sql`SELECT * FROM users WHERE id = ${payload.sub}`;
    return rows[0] || null;
}

/* ---------- login throttle (stored in Neon so it works across serverless instances) ---------- */
// 5 failures / 10 min per email
export async function isThrottled(email) {
    await ensureReady();
    const rows = await sql`
        SELECT count(*)::int AS n FROM login_attempts
         WHERE email = ${email} AND created_at > now() - interval '10 minutes'`;
    return rows[0].n >= 5;
}
export async function recordFailure(email) {
    await ensureReady();
    await sql`INSERT INTO login_attempts (email) VALUES (${email})`;
}
export async function clearFailures(email) {
    await ensureReady();
    await sql`DELETE FROM login_attempts WHERE email = ${email}`;
}

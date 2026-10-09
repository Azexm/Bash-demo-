// Server-only profile store: name, email, Bash ID, masked ID number, Instagram, two photos.
// Only the LAST 4 digits of an ID number are ever stored (in bookings), so the full
// Aadhaar number is never shown or kept.
import crypto from "crypto";
import { sql, ensureReady } from "@/lib/db";
import { BookingError } from "@/lib/bookingStore";

const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_BYTES = 2 * 1024 * 1024;
const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;
const iso = (v) => (v ? new Date(v).toISOString() : null);

const maskId = (type, last4) => (type === "Aadhaar" ? `XXXX XXXX ${last4}` : `${type} •••• ${last4}`);

/** Accepts "@name", "name", or a full instagram.com link. Returns the bare username, or null. */
export function normalizeInstagram(raw) {
    let v = String(raw ?? "").trim();
    if (!v) return null;
    v = v
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
        .replace(/[?#].*$/, "")
        .replace(/\/.*$/, "")
        .replace(/^@/, "");
    if (!HANDLE_RE.test(v)) {
        throw new BookingError("Enter a valid Instagram username, for example @yourname", 422);
    }
    return v;
}

export async function getProfile(userId) {
    await ensureReady();
    const u = (
        await sql`SELECT name, email, bash_id, instagram, photo_top, photo_side, created_at
                    FROM users WHERE id = ${userId}`
    )[0];
    if (!u) return null;
    const latest = (
        await sql`SELECT id_type, id_last4 FROM bookings
                   WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`
    )[0];
    return {
        name: u.name,
        email: u.email,
        bash_id: u.bash_id,
        instagram: u.instagram,
        photo_top: u.photo_top,
        photo_side: u.photo_side,
        id_type: latest?.id_type ?? null,
        id_masked: latest ? maskId(latest.id_type, latest.id_last4) : null,
        member_since: iso(u.created_at),
    };
}

export async function updateInstagram(userId, raw) {
    await ensureReady();
    const handle = normalizeInstagram(raw);
    await sql`UPDATE users SET instagram = ${handle} WHERE id = ${userId}`;
    return getProfile(userId);
}

/** slot: "top" | "side". Replaces the old photo and deletes its stored image. */
export async function setProfilePhoto(userId, slot, dataUrl) {
    if (slot !== "top" && slot !== "side") throw new BookingError("Unknown photo slot", 422);
    const m = IMAGE_RE.exec(String(dataUrl || ""));
    if (!m) throw new BookingError("Photo must be a JPG, PNG or WebP image", 422);
    if (Buffer.byteLength(m[2], "base64") > MAX_BYTES) throw new BookingError("Photo must be under 2 MB", 422);

    await ensureReady();
    const assetId = crypto.randomBytes(12).toString("hex");
    await sql`INSERT INTO assets (id, mime, data) VALUES (${assetId}, ${m[1]}, ${m[2]})`;
    const url = `/api/assets/${assetId}`;

    const cur = (await sql`SELECT photo_top, photo_side FROM users WHERE id = ${userId}`)[0];
    if (slot === "top") {
        await sql`UPDATE users SET photo_top = ${url} WHERE id = ${userId}`;
    } else {
        await sql`UPDATE users SET photo_side = ${url} WHERE id = ${userId}`;
    }
    const old = slot === "top" ? cur?.photo_top : cur?.photo_side;
    if (old) {
        const oldId = old.replace("/api/assets/", "");
        await sql`DELETE FROM assets WHERE id = ${oldId}`;
    }
    return getProfile(userId);
}

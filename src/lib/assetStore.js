// Server-only store for public images (event flyers). Served by /api/assets/[id].
import crypto from "crypto";
import { sql, ensureReady } from "@/lib/db";

const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_BYTES = 2 * 1024 * 1024;

export async function saveFlyer(dataUrl) {
    const m = IMAGE_RE.exec(String(dataUrl || ""));
    if (!m) return { error: "Upload a JPG, PNG or WebP image" };
    if (Buffer.byteLength(m[2], "base64") > MAX_BYTES) return { error: "Flyer must be under 2 MB" };
    await ensureReady();
    const id = crypto.randomBytes(12).toString("hex");
    await sql`INSERT INTO assets (id, mime, data) VALUES (${id}, ${m[1]}, ${m[2]})`;
    return { id, url: `/api/assets/${id}` };
}

export async function getAsset(id) {
    await ensureReady();
    const rows = await sql`SELECT mime, data FROM assets WHERE id = ${id}`;
    return rows[0] || null;
}

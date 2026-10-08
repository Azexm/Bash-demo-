// Server-only payment gateway settings (table: payment_gateways).
// Secrets (API secret keys) are never stored here; only the public key id and on/off/mode.
// The checkout is still a simulation: wire the chosen gateway's SDK into /api/bookings/pay.
import { sql, ensureReady } from "@/lib/db";

export async function listGateways() {
    await ensureReady();
    return sql`SELECT id, name, enabled, mode, key_id, updated_at FROM payment_gateways ORDER BY name`;
}

export async function activeGateway() {
    await ensureReady();
    const rows = await sql`SELECT id, name FROM payment_gateways WHERE enabled = true ORDER BY name LIMIT 1`;
    return rows[0] || null;
}

export async function updateGateway(id, patch) {
    await ensureReady();
    const cur = await sql`SELECT * FROM payment_gateways WHERE id = ${id}`;
    if (!cur.length) return null;
    const c = cur[0];
    const enabled = typeof patch.enabled === "boolean" ? patch.enabled : c.enabled;
    const mode = ["test", "live"].includes(patch.mode) ? patch.mode : c.mode;
    const keyId = patch.key_id !== undefined ? String(patch.key_id).trim().slice(0, 80) || null : c.key_id;
    const rows = await sql`
        UPDATE payment_gateways SET enabled = ${enabled}, mode = ${mode}, key_id = ${keyId}, updated_at = now()
         WHERE id = ${id} RETURNING id, name, enabled, mode, key_id, updated_at`;
    return rows[0];
}

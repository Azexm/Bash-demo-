// Server-only club store. Seed clubs come from src/data/seedClubs.js; clubs created or
// edited in the developer panel are stored in Neon (table: clubs, jsonb data).
import crypto from "crypto";
import { seedClubs } from "@/data/seedClubs";
import { sql, ensureReady } from "@/lib/db";

async function readDbClubs() {
    try {
        await ensureReady();
        return await sql`SELECT id, data FROM clubs`;
    } catch (e) {
        console.error("clubStore: could not read clubs from Neon:", e.message);
        return [];
    }
}

export async function listClubs({ city, includeInactive = false } = {}) {
    const map = new Map(seedClubs.map((c) => [c.id, c]));
    for (const r of await readDbClubs()) {
        map.set(r.id, { ...(map.get(r.id) || {}), ...r.data, id: r.id });
    }
    let clubs = [...map.values()];
    if (!includeInactive) clubs = clubs.filter((c) => c.is_active !== false);
    if (city && city !== "all") clubs = clubs.filter((c) => c.city_slug === city);
    return clubs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClub(id, { includeInactive = true } = {}) {
    if (!id) return null;
    const all = await listClubs({ includeInactive });
    return all.find((c) => c.id === id) || null;
}

export async function createClub(data) {
    await ensureReady();
    const id = `club-${crypto.randomBytes(8).toString("hex")}`;
    await sql`INSERT INTO clubs (id, data) VALUES (${id}, ${JSON.stringify(data)}::jsonb)`;
    return { ...data, id };
}

export async function updateClub(id, patch) {
    const current = await getClub(id);
    if (!current) return null;
    const { id: _ignored, ...next } = { ...current, ...patch };
    await ensureReady();
    // upsert: editing a seed club stores an override row with the same id
    await sql`INSERT INTO clubs (id, data) VALUES (${id}, ${JSON.stringify(next)}::jsonb)
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
    return { ...next, id };
}

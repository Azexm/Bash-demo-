// Server-only event store.
// Seed events live in src/data/seedEvents.js (static, shipped with the build).
// Events created by club admins are stored in Neon (table: events, jsonb data).
import crypto from "crypto";
import { seedEvents } from "@/data/seedEvents";
import { clubIdFor } from "@/data/seedClubs";
import { sql, ensureReady } from "@/lib/db";
import { soldCounts } from "@/lib/bookingStore";

const iso = (v) => new Date(v).toISOString();

function fromSeed(e) {
    return {
        status: "published",
        booking_type: "non_exclusive",
        featured: false,
        homepage_placement: "none",
        ...e,
        genre_slugs: [e.genre_slug],
        club_id: clubIdFor(e.venue, e.city),
        seeded: true,
    };
}

function fromDb(r) {
    return {
        status: "published",
        booking_type: "non_exclusive",
        featured: false,
        homepage_placement: "none",
        ...r.data,
        genre_slugs: r.data.genre_slugs || [r.data.genre_slug].filter(Boolean),
        id: r.id,
        created_at: iso(r.created_at),
        seeded: false,
    };
}

async function readCreated() {
    try {
        await ensureReady();
        const rows = await sql`SELECT id, data, created_at FROM events ORDER BY created_at DESC`;
        return rows.map(fromDb);
    } catch (e) {
        // bad/missing DATABASE_URL: still show the seed events
        console.error("eventStore: could not read created events from Neon:", e.message);
        return [];
    }
}

/** Adds `remaining` to every tier that has a quota (null = no quota). */
async function attachRemaining(events) {
    if (!events.some((e) => e.tiers?.some((t) => t.quota))) {
        return events.map((e) => ({ ...e, tiers: e.tiers?.map((t) => ({ ...t, remaining: null })) }));
    }
    const sold = await soldCounts();
    return events.map((e) => ({
        ...e,
        tiers: e.tiers?.map((t) => ({
            ...t,
            remaining: t.quota ? Math.max(0, t.quota - (sold.get(`${e.id}::${t.name}`) || 0)) : null,
        })),
    }));
}

/** Public listing: published events only, unless includeDrafts (club/developer views). */
export async function listEvents({ city, genre, q, club_id, includeDrafts = false } = {}) {
    const created = await readCreated();
    let events = [...created, ...seedEvents.map(fromSeed)];

    if (!includeDrafts) events = events.filter((e) => e.status === "published");
    if (club_id) events = events.filter((e) => e.club_id === club_id);
    if (city && city !== "all") events = events.filter((e) => e.city_slug === city);
    if (genre && genre !== "all") events = events.filter((e) => e.genre_slugs.includes(genre));
    if (q) {
        const needle = q.toLowerCase();
        events = events.filter((e) =>
            [e.title, e.artist, e.venue, e.city, e.genre]
                .join(" ")
                .toLowerCase()
                .includes(needle),
        );
    }
    // featured and hero placements first; the sort is stable so newest stays first otherwise
    events.sort((a, b) => {
        const rank = (e) => (e.homepage_placement === "hero" ? 2 : e.featured ? 1 : 0);
        return rank(b) - rank(a);
    });
    return attachRemaining(events);
}

export async function getEvent(id, { includeDrafts = false } = {}) {
    const seeded = seedEvents.find((e) => e.id === id);
    let event = seeded ? fromSeed(seeded) : null;
    if (!event) {
        await ensureReady();
        const rows = await sql`SELECT id, data, created_at FROM events WHERE id = ${id}`;
        if (!rows.length) return null;
        event = fromDb(rows[0]);
    }
    if (!includeDrafts && event.status !== "published") return null;
    const [withSeats] = await attachRemaining([event]);
    return withSeats;
}

export async function createEvent(data) {
    await ensureReady();
    const id = crypto.randomBytes(12).toString("hex");
    const rows = await sql`
        INSERT INTO events (id, data) VALUES (${id}, ${JSON.stringify(data)}::jsonb)
        RETURNING created_at`;
    return { ...data, id, created_at: iso(rows[0].created_at) };
}

export async function updateEvent(id, data) {
    await ensureReady();
    const rows = await sql`
        UPDATE events SET data = ${JSON.stringify(data)}::jsonb WHERE id = ${id}
        RETURNING created_at`;
    if (!rows.length) return null;
    return { ...data, id, created_at: iso(rows[0].created_at) };
}

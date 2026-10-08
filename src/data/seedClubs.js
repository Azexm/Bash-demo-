// Clubs derived from the venues in seedEvents.js. Nothing here is real club data beyond
// the venue names already in the seed events. Capacity is a placeholder (500): change it
// in the Developer panel (or let the club admin's staff update it) for real venues.
import { seedEvents } from "@/data/seedEvents";
import { slugify } from "@/lib/eventSchema";

// Seed events point at a club by venue + city, so the ID is deterministic.
export const clubIdFor = (venue, city) => `seed-${slugify(`${venue} ${city}`)}`;

const byId = new Map();
for (const e of seedEvents) {
    const id = clubIdFor(e.venue, e.city);
    if (!byId.has(id)) {
        byId.set(id, {
            id,
            name: e.venue,
            city: e.city,
            city_slug: e.city_slug,
            address: e.location?.address || `${e.venue}, ${e.city}`,
            capacity: 500,
            is_active: true,
            seeded: true,
        });
    }
}

export const seedClubs = [...byId.values()];

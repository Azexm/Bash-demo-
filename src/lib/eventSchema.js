// Shared (client + server) event constants and validation.

export const GENRES = [
    { slug: "pop", name: "Pop" },
    { slug: "rock", name: "Rock" },
    { slug: "edm", name: "EDM" },
    { slug: "hiphop", name: "Hip Hop" },
    { slug: "techno", name: "Techno" },
    { slug: "house", name: "House" },
    { slug: "bollywood", name: "Bollywood" },
    { slug: "classical", name: "Classical" },
];

// non_exclusive: open sale, ticket issued as soon as payment succeeds.
// guestlist:     free request, the club approves or rejects it before a ticket is issued.
// exclusive:     paid request, the club reviews it after payment; reject = refund.
export const BOOKING_TYPES = [
    { slug: "non_exclusive", name: "Non-exclusive (open booking)" },
    { slug: "guestlist", name: "Guestlist" },
    { slug: "exclusive", name: "Exclusive" },
];

export const HOMEPAGE_PLACEMENTS = [
    { slug: "none", name: "Not on homepage" },
    { slug: "carousel", name: "Homepage carousel" },
    { slug: "hero", name: "Homepage hero" },
];

export const LINEUP_ROLES = [
    "Headliner",
    "Support",
    "Opening act",
    "Special guest",
];

export const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

const str = (v, max) => String(v ?? "").trim().slice(0, max);
const isUrl = (v) => /^https?:\/\/\S+$/i.test(v);
const isImageRef = (v) => isUrl(v) || /^\/api\/assets\/[a-f0-9]+$/i.test(v);
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "2026-03-17" (from <input type=date>) -> "17 March 2026" (format used everywhere else)
export function toDisplayDate(v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
    if (!m) return "";
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

// "19:00" (from <input type=time>) -> "7:00 PM"
export function toDisplayTime(v) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || ""));
    if (!m || Number(m[1]) > 23) return "";
    const h = Number(m[1]);
    return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

export const sumQuota = (tiers = []) =>
    tiers.reduce((s, t) => s + (Number(t.quota) || 0), 0);

/**
 * Venue quota check. Quotas across all published events on the same date at the same
 * club must fit inside the venue capacity. Returns an error string, or null when it fits.
 */
export function checkVenueQuota(tiers, capacity, otherSameDayEvents = []) {
    const mine = sumQuota(tiers);
    const others = otherSameDayEvents.reduce((s, e) => s + sumQuota(e.tiers), 0);
    if (mine > capacity) {
        return `Ticket quotas add up to ${mine}, which is more than the venue capacity of ${capacity}.`;
    }
    if (mine + others > capacity) {
        return `Quotas for this date would total ${mine + others}, but the venue holds ${capacity}. ${others} are already allocated to other events on this date.`;
    }
    return null;
}

/**
 * Validates + cleans a club event payload. `club` supplies city, venue name and address.
 * Returns { event } (without id/created_at) or { errors: string[] }.
 */
export function normalizeClubEvent(raw = {}, club) {
    const errors = [];

    const title = str(raw.title, 120);
    const artist = str(raw.artist, 120);
    const subtitle = str(raw.subtitle, 160);
    const description = str(raw.description, 2000);
    const image = str(raw.image, 1000);
    const date = toDisplayDate(raw.date);
    const time = toDisplayTime(raw.time);
    const status = raw.status === "published" ? "published" : "draft";
    const bookingType = BOOKING_TYPES.find((b) => b.slug === raw.booking_type)?.slug;
    const placement = HOMEPAGE_PLACEMENTS.find((p) => p.slug === raw.homepage_placement)?.slug || "none";

    const genres = [];
    for (const g of list(raw.genres, 4)) {
        const found = GENRES.find((x) => x.slug === g);
        if (found && !genres.includes(found)) genres.push(found);
    }

    if (!title) errors.push("Title is required");
    if (!artist) errors.push("Artist or host is required");
    if (genres.length === 0) errors.push("Pick at least one genre tag");
    if (!date) errors.push("Date is required");
    if (!time) errors.push("Start time is required");
    if (!bookingType) errors.push("Choose a booking type");
    if (description.length < 10) errors.push("Description must be at least 10 characters");
    if (image && !isImageRef(image)) errors.push("Flyer must be an uploaded image or an http(s) URL");
    if (status === "published" && !image) errors.push("Upload a flyer before publishing");

    const tiers = [];
    const seen = new Set();
    for (const t of list(raw.tiers, 8)) {
        const name = str(t?.name, 40);
        // a blank field must fail validation, not turn into 0 (which would mean "free")
        const blank = (v) => v === "" || v === null || v === undefined;
        const price = blank(t?.price) ? NaN : Math.round(Number(t.price));
        const quota = blank(t?.quota) ? NaN : Math.round(Number(t.quota));
        if (!name && !t?.price && !t?.quota) continue;
        if (!name) {
            errors.push("Every ticket category needs a name");
            continue;
        }
        if (!Number.isFinite(price) || price < 0) {
            errors.push(`Category "${name}" needs a price (0 for free)`);
            continue;
        }
        if (!Number.isFinite(quota) || quota < 1) {
            errors.push(`Category "${name}" needs a quota of at least 1`);
            continue;
        }
        if (seen.has(name.toLowerCase())) {
            errors.push(`Category name "${name}" is used twice`);
            continue;
        }
        seen.add(name.toLowerCase());
        tiers.push({
            name,
            price,
            quota,
            note: str(t.note, 60),
            perks: list(t.perks, 8).map((p) => str(p, 80)).filter(Boolean),
        });
    }
    if (tiers.length === 0) errors.push("Add at least one ticket category");

    if (errors.length) return { errors };

    const first = genres[0];
    return {
        event: {
            title,
            artist,
            subtitle,
            genre: first.name,
            genre_slug: first.slug,
            genre_slugs: genres.map((g) => g.slug),
            city: club.city,
            city_slug: club.city_slug,
            venue: club.name,
            club_id: club.id,
            club_name: club.name,
            date,
            time,
            image,
            hero_image: image,
            description,
            status,
            booking_type: bookingType,
            featured: Boolean(raw.featured),
            homepage_placement: placement,
            tiers,
            lineup: [],
            gallery: image ? [image] : [],
            reviews: [],
            faqs: [],
            location: {
                address: club.address || `${club.name}, ${club.city}`,
                getting_there: str(raw.getting_there, 500),
                parking: str(raw.parking, 300),
            },
            info: {
                age_limit: str(raw.age_limit, 60),
                doors_open: str(raw.doors_open, 30),
                duration: str(raw.duration, 40),
            },
        },
    };
}

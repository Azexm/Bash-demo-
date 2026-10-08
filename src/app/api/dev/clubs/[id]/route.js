import { requireRole } from "@/lib/roles";
import { updateClub } from "@/lib/clubStore";
import { CITIES } from "@/lib/geo";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Developer: edit any club (name, address, capacity, city, active on/off).
export const PATCH = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const patch = {};
    if (b.name !== undefined) patch.name = String(b.name).trim().slice(0, 120);
    if (b.address !== undefined) patch.address = String(b.address).trim().slice(0, 240);
    if (typeof b.is_active === "boolean") patch.is_active = b.is_active;
    if (b.capacity !== undefined) {
        const capacity = Math.round(Number(b.capacity));
        if (!Number.isFinite(capacity) || capacity < 10 || capacity > 100000) {
            return fail("Venue capacity must be between 10 and 100,000");
        }
        patch.capacity = capacity;
    }
    if (b.city_slug !== undefined) {
        const city = CITIES.find((c) => c.slug === b.city_slug);
        if (!city) return fail("Pick a city we operate in");
        patch.city = city.name;
        patch.city_slug = city.slug;
    }
    const club = await updateClub(params.id, patch);
    if (!club) return fail("Club not found", 404);
    return ok(club);
});

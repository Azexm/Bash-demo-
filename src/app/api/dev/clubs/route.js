import { requireRole } from "@/lib/roles";
import { createClub } from "@/lib/clubStore";
import { clubsDetail } from "@/lib/devStore";
import { CITIES } from "@/lib/geo";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    return ok(await clubsDetail());
});

export const POST = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim().slice(0, 120);
    const city = CITIES.find((c) => c.slug === b.city_slug);
    const capacity = Math.round(Number(b.capacity));
    if (!name) return fail("Club name is required");
    if (!city) return fail("Pick a city we operate in");
    if (!Number.isFinite(capacity) || capacity < 10 || capacity > 100000) {
        return fail("Venue capacity must be between 10 and 100,000");
    }
    const club = await createClub({
        name,
        city: city.name,
        city_slug: city.slug,
        address: String(b.address ?? "").trim().slice(0, 240) || `${name}, ${city.name}`,
        capacity,
        is_active: true,
    });
    return ok(club, 201);
});

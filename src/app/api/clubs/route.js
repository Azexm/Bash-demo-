import { listClubs } from "@/lib/clubStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Public: clubs in a city, e.g. /api/clubs?city=pune
export const GET = route(async (req) => {
    const city = new URL(req.url).searchParams.get("city") || undefined;
    return ok(await listClubs({ city }));
});

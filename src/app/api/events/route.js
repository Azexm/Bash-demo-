import { listEvents } from "@/lib/eventStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Public listing: published events only. Events are created in /api/club/events.
export const GET = route(async (req) => {
    const sp = new URL(req.url).searchParams;
    const events = await listEvents({
        city: sp.get("city") || undefined,
        genre: sp.get("genre") || undefined,
        q: sp.get("q") || undefined,
        club_id: sp.get("club_id") || undefined,
    });
    return ok(events);
});

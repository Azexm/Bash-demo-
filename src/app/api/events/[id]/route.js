import { getEvent } from "@/lib/eventStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, { params }) => {
    const event = await getEvent(params.id);
    if (!event) return fail("Event not found", 404);
    return ok(event);
});

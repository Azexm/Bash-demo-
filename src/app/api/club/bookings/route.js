import { requireRole } from "@/lib/roles";
import { listBookingsForClub } from "@/lib/bookingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Club admin: the full booking queue for their club (filter on the client).
export const GET = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    return ok(await listBookingsForClub(user.club_id));
});

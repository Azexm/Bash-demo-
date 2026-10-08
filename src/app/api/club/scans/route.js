import { requireRole } from "@/lib/roles";
import { listScans } from "@/lib/bookingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Scan log for the club: who scanned, when, and whether entry was approved or declined.
export const GET = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin", "gate"]);
    if (error) return error;
    return ok(await listScans(user.club_id));
});

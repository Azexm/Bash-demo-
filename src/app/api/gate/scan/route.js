import { requireRole } from "@/lib/roles";
import { scanTicket } from "@/lib/bookingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Gate: scan a ticket code. Body: { code }. Always returns 200 with a result,
// so a declined scan is a normal answer, not an error.
export const POST = route(async (req) => {
    const { user, error } = await requireRole(req, ["gate", "club_admin"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const result = await scanTicket({
        code: b.code,
        clubId: user.club_id,
        gate: { id: user.id, name: user.name },
    });
    return ok(result);
});

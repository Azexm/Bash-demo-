import { requireRole } from "@/lib/roles";
import { lookupTicket } from "@/lib/bookingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Gate step 1: read a QR/typed code. Returns the guest details. Nothing is admitted yet.
export const POST = route(async (req) => {
    const { user, error } = await requireRole(req, ["gate", "club_admin"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    return ok(
        await lookupTicket({
            code: b.code,
            clubId: user.club_id,
            gate: { id: user.id, name: user.name },
        }),
    );
});
